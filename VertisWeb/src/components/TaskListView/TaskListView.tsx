import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useTheme } from '../ThemeContext'; // Importando o hook do tema
import './TaskListView.css';
import { useTaskExporter } from '../../hooks/useTaskExporter'; // Importa o novo hook
import { IconButton, Menu, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
const AddTaskModal = lazy(() => import('../TaskModal/AddTaskModal.tsx'));
const EditTaskModal = lazy(() => import('../TaskModal/EditTaskModal.tsx'));
const ConfirmationModal = lazy(() => import('../ConfirmationModal/ConfirmationModal.tsx'));

// Ícones para os cabeçalhos da tabela
import FlagIcon from '@mui/icons-material/Flag';
import MoreVertIcon from '@mui/icons-material/MoreVert'; 
import AnnouncementIcon from '@mui/icons-material/Announcement';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Ícones para os cards de análise
import AllInboxIcon from '@mui/icons-material/AllInbox';
import CodeIcon from '@mui/icons-material/Code';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import StarRateIcon from '@mui/icons-material/StarRate';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

// --- Tipagem dos Dados ---
// No futuro, esta tipagem pode ser movida para um arquivo central de tipos

interface Recurso {
    id_recurso: number;
    nom_recurso: string;
}

interface Comentario {
    id_recurso: number;
    nom_recurso: string;
    comentario: string;
    dth_inclusao: string;
}

interface Contato {
    id_contato: number;
    nom_recurso: string;
    telefone?: string;
}

interface Task {
    id: number;
    id_unid_negoc: number;
    nom_unid_negoc: string;
    id_unid_oper: number;
    nom_unid_oper: string;
    criado_por: string;
    ind_prioridade: number;
    ind_sit_tarefa: string;
    sit_tarefa: string;
    qtd_pontos: number;
    titulo_tarefa: string;
    recursos: Recurso[] | number;
    comentarios?: Comentario[] | number;
    contatos?: Contato[] | number;
    dth_prev_entrega?: string;
    dth_encerramento?: string;
    dth_inclusao: string;
    satisfaction_rating?: number;
    dth_exclusao?: string;
}

interface TaskListViewProps {
    title: string;
    tasks: Task[];
    isLoading: boolean;
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: number) => void;
    onAddTask: (newTask: Task) => void;
    onDateChange: (startDate: string, endDate: string) => void; // Prop para notificar mudança de data
    contextType?: 'support' | 'development' | 'commercial'; // Nova prop para definir o contexto
}



const priorityConfig: { [key: number]: { color: string, label: string } } = {
    1: { color: '#7dcea0', label: 'Baixa' },
    2: { color: '#f7dc6f', label: 'Média' },
    3: { color: '#f0b27a', label: 'Alta' },
    4: { color: '#e74c3c', label: 'Urgente' },
};

const statusConfig: { [key: string]: { backgroundColor: string, color?: string } } = {
    'AG': { backgroundColor: '#aeb6bf' },       // Aguardando
    'ER': { backgroundColor: '#5dade2' },       // Em resolução
    'AT': { backgroundColor: '#f39c12' },       // Em atraso
    'CA': { backgroundColor: '#2c3e50', color: '#bdc3c7' }, // Cancelado
    'FN': { backgroundColor: '#2ecc71' },       // Finalizado
    'AB': { backgroundColor: '#85c1e9' },       // Aberto
};

const TaskListView: React.FC<TaskListViewProps> = ({ title, tasks, isLoading, onAddTask, onUpdateTask, onDeleteTask, onDateChange, contextType }) => {
    // Define os textos e ícones com base no contexto
    const labels = {
        task: contextType === 'development' ? 'Tarefa' : 'Chamado', // Singular
        tasks: contextType === 'development' ? 'Tarefas' : 'Chamados', // Plural
        analyst: contextType === 'development' ? 'Desenvolvedor' : 'Analista', // Papel
        taskDescription: contextType === 'development' ? 'Descrição da Tarefa' : 'Descrição do Chamado',
        saveBtn: contextType === 'development' ? 'Salvar Tarefa' : 'Salvar Chamado',
        // Labels para os cards de análise
        clientInsights: contextType === 'development' ? 'Métricas de Entrega' : 'Insights dos Clientes',
        satisfaction: contextType === 'development' ? 'Qualidade do Código' : 'Satisfação Média',
        dailyCardIcon: contextType === 'development' ? <CodeIcon className="card-icon" /> : <SupportAgentIcon className="card-icon" />,
    };

    // Controle de Tema
    const { theme, setTheme } = useTheme();

    // Função para formatar a data para o input (YYYY-MM-DD)
    const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];

    // --- Estados para os Filtros ---
    const [searchTerm, setSearchTerm] = useState('');
    // Estados locais para os inputs de data
    // Inicializa com a data atual para garantir que o primeiro fetch seja correto
    const [localStartDate, setLocalStartDate] = useState(getFormattedDate(new Date()));
    const [localEndDate, setLocalEndDate] = useState(getFormattedDate(new Date()));

    // Efeito para notificar o componente pai quando as datas locais mudam
    React.useEffect(() => {
        if (onDateChange) {
            onDateChange(localStartDate, localEndDate);
        }
    }, [localStartDate, localEndDate, onDateChange]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Estado para controlar a ordenação da tabela
    const [sortConfig, setSortConfig] = useState<{ key: keyof Task | null; direction: 'ascending' | 'descending' }>({
        key: 'ind_prioridade', // Coluna de ordenação padrão
        direction: 'descending', // Direção padrão (Urgente primeiro)
    });

    const [selectedTask, setSelectedTask] = useState<Task | null>(null); // Para edição e exclusão
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(anchorEl);

    // Estado para o menu de exportação
    const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isExportMenuOpen = Boolean(exportMenuAnchorEl);

    // --- Lógica para os Cards de Análise ---
    const analytics = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        const totalTasks = tasks.length;
        const openTasks = tasks.filter(t => t.ind_sit_tarefa === 'AB').length;
        const finishedTasks = tasks.filter(t => t.ind_sit_tarefa === 'FN').length;
        const waitingTasks = tasks.filter(t => t.ind_sit_tarefa === 'AG').length;

        const createdToday = tasks.filter(t => t.dth_inclusao.startsWith(todayStr)).length;
        const resolvedToday = tasks.filter(t => t.dth_encerramento?.startsWith(todayStr)).length;
        const successRateToday = createdToday > 0 ? (resolvedToday / createdToday) * 100 : 0;

        const finishedWithDates = tasks.filter(t => t.ind_sit_tarefa === 'FN' && t.dth_encerramento && t.dth_inclusao);
        const totalResolutionTime = finishedWithDates.reduce((acc, task) => {
            const startTime = new Date(task.dth_inclusao).getTime();
            const endTime = new Date(task.dth_encerramento!).getTime();
            return acc + (endTime - startTime);
        }, 0);
        const avgResolutionTimeMs = finishedWithDates.length > 0 ? totalResolutionTime / finishedWithDates.length : 0;
        
        // Converte milissegundos para um formato legível
        const formatAvgTime = (ms: number) => {
            if (ms <= 0) return 'N/A';
            const days = Math.floor(ms / (1000 * 60 * 60 * 24));
            const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            if (days > 0) return `${days}d ${hours}h`;
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
        };

        // Filtra apenas as tarefas que foram finalizadas e possuem uma avaliação válida (número).
        const ratedTasks = tasks.filter(
            (task) => task.ind_sit_tarefa === 'FN' && typeof task.satisfaction_rating === 'number'
        );

        // Calcula a soma de todas as avaliações.
        const totalSatisfactionScore = ratedTasks.reduce((sum, task) => sum + task.satisfaction_rating!, 0);
        const avgSatisfaction = ratedTasks.length > 0 ? totalSatisfactionScore / ratedTasks.length : 0;

        return {
            totalTasks,
            openTasks,
            finishedTasks,
            waitingTasks,
            createdToday,
            resolvedToday,
            successRateToday,
            avgResolutionTime: formatAvgTime(avgResolutionTimeMs),
            avgSatisfaction,
        };
    }, [tasks]);

    // Memoiza as tarefas ordenadas para evitar recálculos desnecessários
    const filteredAndSortedTasks = useMemo(() => {
        let filteredItems = tasks.filter(task => {
            // 1. Filtro de Data
            const taskDate = task.dth_inclusao.split('T')[0];
            if (localStartDate && taskDate < localStartDate) {
                return false;
            }
            if (localEndDate && taskDate > localEndDate) {
                return false;
            }

            // 2. Filtro de Texto
            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                // Constrói uma string única com todos os campos pesquisáveis para cada tarefa
                const searchIn = [
                    task.titulo_tarefa || '',
                    task.criado_por || '',
                    // Inclui os nomes dos recursos na busca, se for um array
                    ...(Array.isArray(task.recursos) ? task.recursos.map(r => r.nom_recurso) : [])
                ].join(' ').toLowerCase();

                if (!searchIn.includes(lowerCaseSearchTerm)) {
                    return false;
                }
            }
            return true;
        });

        let sortableItems = [...filteredItems];
        if (sortConfig.key !== null) {
            const sortKey = sortConfig.key; // Captura a chave de ordenação em uma constante

            sortableItems.sort((a, b) => {
                // Função auxiliar para extrair o valor de forma segura
                const getValue = (task: Task, key: keyof Task) => {
                    if (key === 'recursos') {
                        // Ordena pelo nome do primeiro recurso, se existir
                        return Array.isArray(task.recursos) && task.recursos.length > 0 ? task.recursos[0].nom_recurso : '';
                    }
                    return task[key];
                };

                const aValue = getValue(a, sortKey);
                const bValue = getValue(b, sortKey);

                // Trata valores nulos ou indefinidos, colocando-os no final
                if (aValue == null) return 1;
                if (bValue == null) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [tasks, sortConfig, searchTerm, localStartDate, localEndDate]);

    // Utiliza o hook de exportação, agora que filteredAndSortedTasks já foi declarada.
    const { handleExport } = useTaskExporter(filteredAndSortedTasks, contextType);

    const handleSaveTask = (newTaskData: Omit<Task, 'id' | 'dth_inclusao'>) => {
        const newTask: Task = {
            ...newTaskData,
            id: Date.now(), // Gerando um ID simples para o exemplo
            dth_inclusao: new Date().toISOString().split('T')[0], // Data atual
        };
        onAddTask(newTask);
        setIsAddModalOpen(false); // Fecha o modal após salvar
    };

    // Função para solicitar a ordenação ao clicar no cabeçalho
    const requestSort = (key: keyof Task) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        // Se clicar na mesma coluna, inverte a direção
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Função para obter a classe CSS para o cabeçalho da coluna de ordenação
    const getSortClassName = (name: keyof Task) => {
        return sortConfig.key === name ? `sortable active ${sortConfig.direction}` : 'sortable';
    };

    // Funções para o menu de ações
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
        setAnchorEl(event.currentTarget);
        setSelectedTask(task);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Funções para o menu de exportação
    const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setExportMenuAnchorEl(event.currentTarget);
    };

    const handleExportMenuClose = () => {
        setExportMenuAnchorEl(null);
    };


    // Funções para as opções do menu
    const handleEditOptionClick = () => {
        setIsEditModalOpen(true);
        handleMenuClose();
    };

    const handleDeleteOptionClick = () => {
        setIsConfirmModalOpen(true);
        handleMenuClose();
    };

    const handleUpdateTask = (updatedTask: Task) => {
        onUpdateTask(updatedTask);
        setIsEditModalOpen(false);
    };

    const confirmDelete = () => {
        if (selectedTask) {
            onDeleteTask(selectedTask.id);
        }
        setIsConfirmModalOpen(false);
        setSelectedTask(null);
    };

    return (
        // Adiciona a classe do tema ao container principal
        <main className={`task-list-container ${theme}`}>
            <div className="task-list-header">
                <h1 className="task-list-title">{title}</h1>
                {/* Botão de adicionar e botão de trocar tema */}
                <div className="header-actions">
                    <button className="export-csv-button" onClick={handleExportMenuOpen}>
                        <FileDownloadIcon /> Exportar
                    </button>
                    <Menu anchorEl={exportMenuAnchorEl} open={isExportMenuOpen} onClose={handleExportMenuClose}>
                        <MenuItem onClick={() => { handleExport('csv'); handleExportMenuClose(); }}>
                            Exportar para CSV
                        </MenuItem>
                        <MenuItem onClick={() => { handleExport('pdf'); handleExportMenuClose(); }}>Exportar para PDF</MenuItem>
                    </Menu>
                <button className="add-task-button" onClick={() => setIsAddModalOpen(true)}> <AddIcon /> Adicionar {labels.task}</button>
                    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="theme-toggle-button">
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </button>
                </div>
            </div>

            

            {/* --- Seção de Cards de Análise --- */}
            <div className="analytics-cards-container">
                {/* Card 1: Total de Chamados */}
                <div className="analytics-card">
                    <div className="card-main-metric">
                        <AllInboxIcon className="card-icon" />
                        <div className="metric-value">{analytics.totalTasks}</div>
                        <div className="metric-label">Total de {labels.tasks}</div>
                    </div>
                    <div className="card-sub-metrics">
                        <div className="sub-metric-item"><RadioButtonUncheckedIcon className="sub-icon open" /> Abertos: <strong>{analytics.openTasks}</strong></div>
                        <div className="sub-metric-item"><CheckCircleOutlineIcon className="sub-icon finished" /> Finalizados: <strong>{analytics.finishedTasks}</strong></div>
                        <div className="sub-metric-item"><HourglassEmptyIcon className="sub-icon waiting" /> Aguardando: <strong>{analytics.waitingTasks}</strong></div>
                    </div>
                </div>

                {/* Card 2: Insights de Hoje */}
                <div className="analytics-card">
                    <div className="card-header">
                        {labels.dailyCardIcon}
                        <h3>{labels.tasks} <span style={{color: '#999999', fontSize: '0.8rem', fontWeight: '400'}}>(últimas 24hrs)</span></h3>
                    </div>
                    <div className="card-content-row">
                        <div className="metric-item">
                            <div className="metric-title">
                                <span className="status-dot yellow"></span>
                                <span>Solicitados</span>
                            </div>
                            <strong>{analytics.createdToday}</strong>
                        </div>
                        <div className="metric-item">
                            <div className="metric-title">
                                <span className="status-dot green"></span>
                                <span>Resolvidos</span>
                            </div>
                            <strong>{analytics.resolvedToday}</strong>
                        </div>
                        <div className="metric-item">
                            <div className="metric-title">
                                <CheckCircleOutlineIcon className="status-icon success" />
                                <span>Success Rate</span>
                            </div>
                            <strong>{analytics.successRateToday.toFixed(0)}%</strong>
                        </div>
                    </div>
                </div>

                {/* Card 3: Insights do Cliente */}
                <div className="analytics-card">
                    <div className="card-header">
                        <StarRateIcon className="card-icon" />
                        <h3>{labels.clientInsights}</h3>
                    </div>
                    <div className="card-content-row">
                        <div className="metric-item">
                            <span>Tempo Médio Resolução</span>
                            <strong>{analytics.avgResolutionTime}</strong>
                        </div>
                        <div className="metric-item"><span>{labels.satisfaction}</span><strong>{analytics.avgSatisfaction.toFixed(1)}/10</strong></div>
                    </div>
                </div>
            </div>

            {/* --- Seção de Filtros --- */}
            <div className="filter-container">
                <div className="search-input-wrapper">
                    <SearchIcon className="search-icon" />
                    <input
                        type="text"
                        placeholder={`Pesquisar em ${labels.tasks.toLowerCase()}...`}
                        className="filter-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="date-filter-group">
                    <label>De:</label>
                    <input type="date" className="filter-date-input" value={localStartDate} onChange={(e) => setLocalStartDate(e.target.value)} />
                </div>
                <div className="date-filter-group">
                    <label>Até:</label>
                    <input type="date" className="filter-date-input" value={localEndDate} onChange={(e) => setLocalEndDate(e.target.value)} />
                </div>
                <button className="clear-filters-btn" onClick={() => { setSearchTerm(''); setLocalStartDate(''); setLocalEndDate(''); }}>
                    Limpar Filtros
                </button>
            </div>

            <div className="task-table-wrapper">
                <table className="task-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('ind_prioridade')} className={getSortClassName('ind_prioridade')}><div className="th-content"><AnnouncementIcon /> Prioridade</div></th>
                            <th onClick={() => requestSort('ind_sit_tarefa')} className={getSortClassName('ind_sit_tarefa')}><div className="th-content"><HistoryIcon /> Status</div></th>
                            <th onClick={() => requestSort('titulo_tarefa')} className={getSortClassName('titulo_tarefa')}><div className="th-content"><ArticleIcon /> {labels.task}</div></th>
                            <th onClick={() => requestSort('criado_por')} className={getSortClassName('criado_por')}><div className="th-content"><PersonIcon /> Solicitante</div></th>
                            {contextType === 'support' && (
                                <th onClick={() => requestSort('nom_unid_oper')} className={getSortClassName('nom_unid_oper')}><div className="th-content"><ApartmentIcon /> Unidade</div></th>
                            )}
                            <th onClick={() => requestSort('recursos')} className={getSortClassName('recursos')}><div className="th-content"><PersonPinIcon /> {labels.analyst}</div></th>
                            <th onClick={() => requestSort('dth_inclusao')} className={getSortClassName('dth_inclusao')}><div className="th-content"><CalendarTodayIcon /> Criação</div></th>
                            <th><div className="th-content"><TuneIcon /> Ações</div></th> 
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={contextType === 'support' ? 8 : 7} className="table-loading-state">
                                    <div className="loading-spinner-table"></div>
                                    Carregando {labels.tasks.toLowerCase()}...
                                </td>
                            </tr>
                        ) : filteredAndSortedTasks.length > 0 ? (
                            filteredAndSortedTasks.map(task => (
                                <tr key={task.id} className={`task-row status-${task.ind_sit_tarefa.toLowerCase()}`}>
                                    <td className="cell-priority">
                                        <FlagIcon style={{ color: priorityConfig[task.ind_prioridade]?.color || '#ccc'}} />
                                        <span>{priorityConfig[task.ind_prioridade]?.label || 'N/D'}</span>
                                    </td>
                                    <td className="cell-status">
                                        <span className="status-badge" style={statusConfig[task.ind_sit_tarefa] || {}}>
                                            {task.sit_tarefa}
                                        </span>
                                    </td>
                                    <td className="cell-content">
                                        <p className="task-description">{task.titulo_tarefa}</p>
                                    </td>
                                    <td>{task.criado_por}</td>
                                    {contextType === 'support' && (
                                        <td>{task.nom_unid_oper}</td>
                                    )}
                                    <td>
                                        {Array.isArray(task.recursos) ? task.recursos.map(r => r.nom_recurso).join(', ') : task.recursos}
                                    </td>
                                    <td>
                                        {new Date(task.dth_inclusao.replace(/-/g, '\/')).toLocaleDateString()}
                                    </td>
                                    <td className="cell-actions">
                                        <IconButton aria-label="mais opções" className="action-button" onClick={(e) => handleMenuOpen(e, task)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={contextType === 'support' ? 8 : 7} className="table-loading-state">Nenhuma {labels.task.toLowerCase()} encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
                <MenuItem onClick={handleEditOptionClick}>Detalhes</MenuItem>
                <MenuItem onClick={handleDeleteOptionClick} sx={{ color: 'error.main' }}>Remover</MenuItem>
            </Menu>
            <Suspense fallback={<div>Carregando Modal...</div>}>
                {isAddModalOpen && <AddTaskModal
                    title={`Adicionar ${labels.task}`}
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleSaveTask}
                    contextType={contextType}
                />}
                {isEditModalOpen && <EditTaskModal
                    contextType={contextType}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    task={selectedTask}
                    onSave={handleUpdateTask}
                />}
                {isConfirmModalOpen && <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={confirmDelete}
                    title={`Confirmar Exclusão de ${labels.task}`}
                    message={`Você tem certeza que deseja remover a ${labels.task.toLowerCase()} #${selectedTask?.id}? Esta ação não pode ser desfeita.`}
                />}
            </Suspense>
        </main>
    );
};

export default TaskListView;