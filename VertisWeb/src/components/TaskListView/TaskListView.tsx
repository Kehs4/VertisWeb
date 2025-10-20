import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useTheme } from '../ThemeContext'; // Importando o hook do tema
import './TaskListView.css';
import { useTaskExporter } from '../../hooks/useTaskExporter'; // Importa o novo hook
import { Task, Recurso } from '../../pages/Admin/Suporte/Tarefas/TarefasPage'; // Importa a tipagem correta
import { flagsMap } from './taskFlags'; // Importa o mapa de configurações das flags
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
import FilterListIcon from '@mui/icons-material/FilterList';

// Componentes do Material-UI para o novo filtro
import { TextField, List, ListItemIcon, Checkbox, ListItemText, ListSubheader, Button } from '@mui/material';

// Ícones para os cards de análise
import AllInboxIcon from '@mui/icons-material/AllInbox';
import CodeIcon from '@mui/icons-material/Code';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import StarRateIcon from '@mui/icons-material/StarRate';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

interface TaskListViewProps {
    title: string;
    tasks: Task[];
    isLoading: boolean;
    onUpdateTask: (updatedTask: Task) => void;
    updateTaskStatus: (taskId: number, newStatus: string) => void;
    onDeleteTask: (taskId: number) => void;
    onAddTask: (newTask: Task) => void;
    startDate: string | null; // Recebe a data inicial do pai
    endDate: string; // Recebe a data final do pai
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
    'AG': { backgroundColor: 'rgb(177, 167, 140)' },       // Aguardando
    'AB': { backgroundColor: 'rgb(149, 161, 159)' },       // Aberto
    'ER': { backgroundColor: 'rgb(53, 146, 158)' },       // Em resolução
    'AT': { backgroundColor: 'rgb(247, 208, 38)' },       // Em atraso
    'CA': { backgroundColor: 'rgb(255, 205, 205)', color: 'rgb(153, 48, 48)' }, // Cancelado
    'FN': { backgroundColor: '#2ecc71' },       // Finalizado
    
};

const statusOptions: { [key: string]: string } = {
    'AG': 'Aguardando',
    'AB': 'Aberto',
    'ER': 'Em resolução',
    'AT': 'Em atraso',
    'CA': 'Cancelado',
    'FN': 'Finalizado',
};



const TaskListView: React.FC<TaskListViewProps> = ({ title, tasks, isLoading, onAddTask, onUpdateTask, onDeleteTask, updateTaskStatus, startDate, endDate, onDateChange, contextType }) => {
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

    // Estado para o menu de status
    const [statusMenuAnchorEl, setStatusMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isStatusMenuOpen = Boolean(statusMenuAnchorEl);

    // --- Estados para os Filtros ---
    const [searchTerm, setSearchTerm] = useState('');

    // --- Estados para o novo filtro de Recursos ---
    const [resourceFilterAnchorEl, setResourceFilterAnchorEl] = useState<null | HTMLElement>(null);
    const isResourceFilterOpen = Boolean(resourceFilterAnchorEl);
    const [resourceSearch, setResourceSearch] = useState('');
    const [selectedResources, setSelectedResources] = useState<string[]>([]);

    // --- Estados para o novo filtro de Solicitantes ---
    const [solicitanteFilterAnchorEl, setSolicitanteFilterAnchorEl] = useState<null | HTMLElement>(null);
    const isSolicitanteFilterOpen = Boolean(solicitanteFilterAnchorEl);
    const [solicitanteSearch, setSolicitanteSearch] = useState('');
    const [selectedSolicitantes, setSelectedSolicitantes] = useState<string[]>([]);

    // --- Estados para o filtro de Status ---
    const [statusFilterAnchorEl, setStatusFilterAnchorEl] = useState<null | HTMLElement>(null);
    const isStatusFilterOpen = Boolean(statusFilterAnchorEl);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    // --- Estados para o filtro de Unidade ---
    const [unitFilterAnchorEl, setUnitFilterAnchorEl] = useState<null | HTMLElement>(null);
    const isUnitFilterOpen = Boolean(unitFilterAnchorEl);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

    // --- Estados para Paginação ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15); // Valor padrão

    // --- Lógica para os Cards de Análise ---
    const analytics = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        const totalTasks = tasks.length;
        const openTasks = tasks.filter(t => t.ind_sit_tarefa === 'AB').length;
        const finishedTasks = tasks.filter(t => t.ind_sit_tarefa === 'FN').length;
        const resolvingTasks = tasks.filter(t => t.ind_sit_tarefa === 'ER').length;

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
            (task) => task.ind_sit_tarefa === 'FN' && typeof task.tarefa_avaliacao === 'number'
        );

        // Calcula a soma de todas as avaliações.
        const totalSatisfactionScore = ratedTasks.reduce((sum, task) => sum + task.tarefa_avaliacao!, 0);
        const avgSatisfaction = ratedTasks.length > 0 ? totalSatisfactionScore / ratedTasks.length : 0;

        return {
            totalTasks,
            openTasks,
            finishedTasks,
            resolvingTasks,
            createdToday,
            resolvedToday,
            successRateToday,
            avgResolutionTime: formatAvgTime(avgResolutionTimeMs),
            avgSatisfaction,
        };
    }, [tasks]);

    // Extrai a lista de todos os recursos únicos para o filtro
    const allResources = useMemo(() => {
        const resourceSet = new Set<string>();
        tasks.forEach(task => {
            if (Array.isArray(task.recursos)) {
                task.recursos.forEach(r => resourceSet.add(r.nom_recurso));
            }
        });
        return Array.from(resourceSet).sort();
    }, [tasks]);

    // Extrai a lista de todos os solicitantes únicos para o filtro
    const allSolicitantes = useMemo(() => {
        const solicitanteSet = new Set<string>();
        tasks.forEach(task => {
            if (task.nom_criado_por) {
                solicitanteSet.add(task.nom_criado_por);
            }
        });
        return Array.from(solicitanteSet).sort();
    }, [tasks]);

    // Extrai a lista de todas as unidades únicas para o filtro
    const allUnits = useMemo(() => {
        const unitSet = new Set<string>();
        tasks.forEach(task => {
            if (task.nom_unid_oper) {
                unitSet.add(task.nom_unid_oper);
            }
        });
        return Array.from(unitSet).sort();
    }, [tasks]);

    // Memoiza as tarefas ordenadas para evitar recálculos desnecessários
    const filteredAndSortedTasks = useMemo(() => {
        const filteredItems = tasks.filter(task => {
            // 1. Filtro de Data (ajustado para o formato YYYY-MM-DD HH:mm:ss)
            const taskDate = task.dth_inclusao.split('T')[0]; // Extrai apenas a parte da data (YYYY-MM-DD)
            if (startDate && taskDate < startDate) {
                return false;
            }
            if (endDate && taskDate > endDate) {
                return false;
            }

            // 2. Filtro de Texto
            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                // Constrói uma string única com todos os campos pesquisáveis para cada tarefa
                const searchIn = [
                    task.titulo_tarefa || '',
                    task.nom_criado_por || '',
                    // Inclui os nomes dos recursos na busca, se for um array
                    ...(Array.isArray(task.recursos) ? task.recursos.map(r => r.nom_recurso) : [])
                ].join(' ').toLowerCase();

                if (!searchIn.includes(lowerCaseSearchTerm)) {
                    return false;
                }
            }

            // 3. Filtro de Recurso
            if (selectedResources.length > 0) {
                if (!Array.isArray(task.recursos) || !task.recursos.some(r => selectedResources.includes(r.nom_recurso))) {
                    return false;
                }
            }

            // 4. Filtro de Solicitante
            if (selectedSolicitantes.length > 0) {
                if (!task.nom_criado_por || !selectedSolicitantes.includes(task.nom_criado_por)) {
                    return false;
                }
            }

            // 5. Filtro de Status
            if (selectedStatuses.length > 0) {
                if (!selectedStatuses.includes(task.ind_sit_tarefa)) {
                    return false;
                }
            }

            // 6. Filtro de Unidade
            if (selectedUnits.length > 0) {
                if (!task.nom_unid_oper || !selectedUnits.includes(task.nom_unid_oper)) {
                    return false;
                }
            }
            return true;
        });

        const sortableItems = [...filteredItems];
        if (sortConfig.key !== null) {
            const sortKey = sortConfig.key; // Captura a chave de ordenação em uma constante

            sortableItems.sort((a, b) => {
                // Função auxiliar para extrair o valor de forma segura
                const getValue = (task: Task, key: keyof Task) => {
                    if (key === 'recursos') {
                        // Ordena pelo nome do primeiro recurso, se existir
                        return Array.isArray(task.recursos) && task.recursos.length > 0 ? task.recursos[0].nom_recurso : '';
                    }
                    if (key === 'nom_criado_por') { // Alterado de 'criado_por'
                        return task.nom_criado_por || '';
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
    }, [tasks, sortConfig, searchTerm, startDate, endDate, selectedResources, selectedSolicitantes, selectedStatuses, selectedUnits]);

    // Efeito para resetar a página para 1 sempre que os filtros mudarem
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredAndSortedTasks.length, itemsPerPage]);

    // Lógica para obter as tarefas da página atual
    const paginatedTasks = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredAndSortedTasks.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredAndSortedTasks, currentPage, itemsPerPage]);

    // Lógica para os controles de paginação
    const totalPages = Math.ceil(filteredAndSortedTasks.length / itemsPerPage);
    const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handlePageClick = (page: number) => setCurrentPage(page);

    // Lógica para gerar os botões de paginação com elipses
    const getPaginationItems = () => {
        const pageNeighbours = 1; // Quantidade de vizinhos de cada lado da página atual
        const totalNumbers = (pageNeighbours * 2) + 3; // Total de números de página a serem mostrados
        const totalBlocks = totalNumbers + 2; // Total de blocos incluindo elipses

        if (totalPages > totalBlocks) {
            const startPage = Math.max(2, currentPage - pageNeighbours);
            const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
            let pages: (number | string)[] = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);

            const hasLeftSpill = startPage > 2;
            const hasRightSpill = (totalPages - endPage) > 1;

            if (hasLeftSpill && !hasRightSpill) {
                const extraPages = Array.from({ length: (totalNumbers - pages.length - 1) }, (_, i) => startPage - i - 1).reverse();
                pages = ["...", ...extraPages, ...pages];
            } else if (!hasLeftSpill && hasRightSpill) {
                const extraPages = Array.from({ length: (totalNumbers - pages.length - 1) }, (_, i) => endPage + i + 1);
                pages = [...pages, ...extraPages, "..."];
            } else if (hasLeftSpill && hasRightSpill) {
                pages = ["...", ...pages, "..."];
            }

            return [1, ...pages, totalPages];
        }
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    };


    // Utiliza o hook de exportação, agora que filteredAndSortedTasks já foi declarada.
    const { handleExport } = useTaskExporter(filteredAndSortedTasks, contextType);

    const handleSaveTask = (newTask: Task) => {
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

    // Funções para o menu de status
    const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
        setStatusMenuAnchorEl(event.currentTarget);
        setSelectedTask(task);
    };

    const handleStatusMenuClose = () => {
        setStatusMenuAnchorEl(null);
    };

    // Funções para o filtro de recursos
    const handleResourceFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation(); // Impede que o evento de ordenação seja disparado
        setResourceFilterAnchorEl(event.currentTarget);
    };

    const handleResourceFilterClose = () => {
        setResourceFilterAnchorEl(null);
        setResourceSearch(''); // Limpa a busca ao fechar
    };

    const handleResourceToggle = (resourceName: string) => {
        const currentIndex = selectedResources.indexOf(resourceName);
        const newSelected = [...selectedResources];
        currentIndex === -1 ? newSelected.push(resourceName) : newSelected.splice(currentIndex, 1);
        setSelectedResources(newSelected);
    };

    // Funções para o filtro de solicitantes
    const handleSolicitanteFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setSolicitanteFilterAnchorEl(event.currentTarget);
    };

    const handleSolicitanteFilterClose = () => {
        setSolicitanteFilterAnchorEl(null);
        setSolicitanteSearch('');
    };

    const handleSolicitanteToggle = (solicitanteName: string) => {
        const currentIndex = selectedSolicitantes.indexOf(solicitanteName);
        const newSelected = [...selectedSolicitantes];
        currentIndex === -1 ? newSelected.push(solicitanteName) : newSelected.splice(currentIndex, 1);
        setSelectedSolicitantes(newSelected);
    };

    // Funções para o filtro de status
    const handleStatusFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setStatusFilterAnchorEl(event.currentTarget);
    };
    const handleStatusFilterClose = () => setStatusFilterAnchorEl(null);
    const handleStatusToggle = (statusCode: string) => {
        const currentIndex = selectedStatuses.indexOf(statusCode);
        const newSelected = [...selectedStatuses];
        currentIndex === -1 ? newSelected.push(statusCode) : newSelected.splice(currentIndex, 1);
        setSelectedStatuses(newSelected);
    };

    // Funções para o filtro de unidade
    const handleUnitFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setUnitFilterAnchorEl(event.currentTarget);
    };
    const handleUnitFilterClose = () => setUnitFilterAnchorEl(null);
    const handleUnitToggle = (unitName: string) => {
        const currentIndex = selectedUnits.indexOf(unitName);
        const newSelected = [...selectedUnits];
        currentIndex === -1 ? newSelected.push(unitName) : newSelected.splice(currentIndex, 1);
        setSelectedUnits(newSelected);
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

    const handleStatusChange = (newStatusCode: string) => {
        if (selectedTask) {
            // Chama a nova função otimizada, passando apenas o ID e o novo status
            updateTaskStatus(selectedTask.id, newStatusCode);
        }
        handleStatusMenuClose();
    };

    const handleUpdateTask = (updatedTask: Task) => {
        // onUpdateTask agora é uma função async que faz a chamada à API.
        // Usamos .then() para fechar o modal apenas quando a operação for concluída.
        (onUpdateTask as (task: Task) => Promise<void>)(updatedTask).then(() => {
            setIsEditModalOpen(false);
        });
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
                        <div className="sub-metric-item"><HourglassEmptyIcon className="sub-icon waiting" /> Em Resolução: <strong>{analytics.resolvingTasks}</strong></div>
                        <div className="sub-metric-item"><CheckCircleOutlineIcon className="sub-icon finished" /> Finalizados: <strong>{analytics.finishedTasks}</strong></div>
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
                <div className="page-size-filter-group">
                    <label>Registros:</label>
                    <select
                        className="filter-select-input"
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                        <option value={60}>60</option>
                    </select>
                </div>
                <div className="date-filter-group">
                    <label>De:</label>
                    <input type="date" className="filter-date-input" value={startDate || ''} onChange={(e) => onDateChange(e.target.value, endDate)} />
                </div>
                <div className="date-filter-group">
                    <label>Até:</label>
                    <input type="date" className="filter-date-input" value={endDate || ''} onChange={(e) => onDateChange(startDate || '', e.target.value)} />
                </div>
                <button className="clear-filters-btn" onClick={() => {
                    // Limpa o termo de busca
                    setSearchTerm('');
                    // Limpa a data inicial para mostrar todos os registros antigos
                    // Mantém a data final para que o campo "Até" continue preenchido
                    onDateChange('', endDate);
                }}>
                    Limpar Filtros
                </button>
                <div className="pagination-controls">
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="pagination-arrow">
                        &lt;
                    </button>
                    <div className="pagination-numbers">
                        {getPaginationItems().map((item, index) => (
                            typeof item === 'number' ? (
                                <button
                                    key={index}
                                    onClick={() => handlePageClick(item)}
                                    className={`pagination-number ${currentPage === item ? 'active' : ''}`}
                                >
                                    {item}
                                </button>
                            ) : (
                                <span key={index} className="pagination-ellipsis">...</span>
                            )
                        ))}
                    </div>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className="pagination-arrow">
                        &gt;
                    </button>
                </div>
            </div>

            <div className="task-table-wrapper">
                <table className="task-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('ind_prioridade')} className={getSortClassName('ind_prioridade')}>
                                <div className="th-content"><AnnouncementIcon /> Prioridade</div>
                            </th>
                            <th onClick={() => requestSort('ind_sit_tarefa')} className={getSortClassName('ind_sit_tarefa')}>
                                <div className="th-content">
                                    <HistoryIcon /> Status
                                    <IconButton size="small" onClick={handleStatusFilterOpen} className="th-filter-button" title="Filtrar por status"><FilterListIcon fontSize="inherit" /></IconButton>
                                </div>
                            </th>
                            <th onClick={() => requestSort('titulo_tarefa')} className={getSortClassName('titulo_tarefa')}><div className="th-content"><ArticleIcon /> {labels.task}</div></th>
                            <th onClick={() => requestSort('nom_criado_por')} className={getSortClassName('nom_criado_por')}>
                                <div className="th-content">
                                    <PersonIcon /> Solicitante
                                    <IconButton size="small" onClick={handleSolicitanteFilterOpen} className="th-filter-button" title="Filtrar por solicitante"><FilterListIcon fontSize="inherit" /></IconButton>
                                </div>
                            </th>
                            {contextType === 'support' && (
                                <th onClick={() => requestSort('nom_unid_oper')} className={getSortClassName('nom_unid_oper')}>
                                    <div className="th-content">
                                        <ApartmentIcon /> Unidade
                                        <IconButton size="small" onClick={handleUnitFilterOpen} className="th-filter-button" title="Filtrar por unidade"><FilterListIcon fontSize="inherit" /></IconButton>
                                    </div>
                                </th>
                            )}
                            <th onClick={() => requestSort('recursos')} className={getSortClassName('recursos')}>
                                <div className="th-content">
                                    <PersonPinIcon /> {labels.analyst}
                                    <IconButton size="small" onClick={handleResourceFilterOpen} className="th-filter-button" title="Filtrar por recurso"><FilterListIcon fontSize="inherit" /></IconButton>
                                </div>
                            </th>
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
                        ) : paginatedTasks.length > 0 ? (
                            paginatedTasks.map(task => (
                                <tr key={task.id} className={`task-row status-${task.ind_sit_tarefa.toLowerCase()}`}>
                                    <td>
                                        <div className="priority-content">
                                            <FlagIcon style={{ color: priorityConfig[task.ind_prioridade]?.color || '#ccc', marginRight: '5px' }} />
                                            <span>{priorityConfig[task.ind_prioridade]?.label || 'N/D'}</span>
                                        </div>
                                    </td>
                                    <td className="cell-status">
                                        <span className="status-badge" style={statusConfig[task.ind_sit_tarefa] || {}} onClick={(e) => handleStatusMenuOpen(e, task)}>
                                            {statusOptions[task.ind_sit_tarefa] || task.sit_tarefa}
                                        </span>
                                    </td>
                                    <td className="cell-content">
                                        <p className="task-description" title={task.titulo_tarefa}>
                                            {task.titulo_tarefa.length > 80
                                                ? `${task.titulo_tarefa.substring(0, 70)}...`
                                                : task.titulo_tarefa
                                            }
                                        </p>
                                        {Array.isArray(task.tipo_chamado) && task.tipo_chamado.length > 0 && (
                                            <div className="task-flags">
                                                {task.tipo_chamado.map(flagId => {
                                                    const flagConfig = flagsMap.get(flagId) || flagsMap.get('default');
                                                    return (
                                                        <span key={flagId} className="flag-item" style={{ backgroundColor: flagConfig?.background, color: flagConfig?.color }}>
                                                            {flagConfig?.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </td>
                                <td>
                                    <div className="solicitante-info">
                                        <span>{task.nom_criado_por}</span>
                                        <span className="solicitante-unidade">{task.nom_unid_negoc}</span>
                                    </div>
                                </td>
                                    {contextType === 'support' && (
                                        <td>{task.nom_unid_oper}</td>
                                    )}
                                    <td>
                                        {Array.isArray(task.recursos) && task.recursos.length > 0 ? (
                                            <div className="resource-list-cell">
                                                <span>{task.recursos[0].nom_recurso}</span>
                                                {task.recursos.length > 1 && (
                                                    <span className="resource-count-badge">
                                                        +{task.recursos.length - 1}
                                                    </span>
                                                )}
                                                {/* Elemento que aparecerá no hover */}
                                                <div className="resource-hover-list">
                                                    {task.recursos.map(r => (
                                                        <div key={r.id_recurso} className="resource-hover-item">{r.nom_recurso}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <span>N/A</span>
                                        )}
                                    </td>
                                    <td>
                                        {new Date(task.dth_inclusao).toLocaleString('pt-BR')}
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
            <Menu anchorEl={statusMenuAnchorEl} open={isStatusMenuOpen} onClose={handleStatusMenuClose}>
                {Object.entries(statusOptions).map(([code, label]) => (
                    <MenuItem key={code} onClick={() => handleStatusChange(code)} selected={selectedTask?.ind_sit_tarefa === code}>
                        {/* Renderiza o badge de status diretamente no menu */}
                        <span className="status-badge" style={statusConfig[code] || {}}>{label}</span>
                    </MenuItem>
                ))}
            </Menu>
            <Menu
                anchorEl={statusFilterAnchorEl}
                open={isStatusFilterOpen}
                onClose={handleStatusFilterClose}
            >
                <ListSubheader>Filtrar por Status</ListSubheader>
                {Object.entries(statusOptions).map(([code, label]) => (
                    <MenuItem key={code} onClick={() => handleStatusToggle(code)}>
                        <ListItemIcon><Checkbox edge="start" checked={selectedStatuses.includes(code)} tabIndex={-1} disableRipple /></ListItemIcon>
                        <ListItemText primary={label} />
                    </MenuItem>
                ))}
                <div className="filter-menu-actions">
                    <Button size="small" onClick={() => setSelectedStatuses([])}>Limpar</Button>
                    <Button size="small" variant="contained" onClick={handleStatusFilterClose}>Aplicar</Button>
                </div>
            </Menu>
            <Menu
                anchorEl={unitFilterAnchorEl}
                open={isUnitFilterOpen}
                onClose={handleUnitFilterClose}
                slotProps={{ paper: { sx: { width: 300, maxHeight: 400 } } }}
            >
                <ListSubheader>Filtrar por Unidade</ListSubheader>
                {allUnits.map(unit => (
                    <MenuItem key={unit} onClick={() => handleUnitToggle(unit)}>
                        <ListItemIcon><Checkbox edge="start" checked={selectedUnits.includes(unit)} tabIndex={-1} disableRipple /></ListItemIcon>
                        <ListItemText primary={unit} />
                    </MenuItem>
                ))}
                <div className="filter-menu-actions">
                    <Button size="small" onClick={() => setSelectedUnits([])}>Limpar</Button>
                    <Button size="small" variant="contained" onClick={handleUnitFilterClose}>Aplicar</Button>
                </div>
            </Menu>
            <Menu
                anchorEl={resourceFilterAnchorEl}
                open={isResourceFilterOpen}
                onClose={handleResourceFilterClose}
                slotProps={{ paper: { sx: { width: 300, maxHeight: 400 } } }}
            >
                <ListSubheader>
                    <TextField
                        placeholder="Pesquisar recurso..."
                        value={resourceSearch}
                        onChange={(e) => setResourceSearch(e.target.value)}
                        variant="standard"
                        fullWidth
                        autoFocus
                        onKeyDown={(e) => e.stopPropagation()} // Impede que o menu capture eventos de teclado do input
                    />
                </ListSubheader>
                <List dense component="div" role="list" sx={{ overflow: 'auto' }}>
                    {allResources.filter(r => r.toLowerCase().includes(resourceSearch.toLowerCase())).map(resource => (
                        <MenuItem key={resource} onClick={() => handleResourceToggle(resource)}>
                            <ListItemIcon><Checkbox edge="start" checked={selectedResources.indexOf(resource) !== -1} tabIndex={-1} disableRipple /></ListItemIcon>
                            <ListItemText primary={resource} />
                        </MenuItem>
                    ))}
                </List>
                <div className="filter-menu-actions">
                    <Button size="small" onClick={() => setSelectedResources([])}>Limpar</Button>
                    <Button size="small" variant="contained" onClick={handleResourceFilterClose}>Aplicar</Button>
                </div>
            </Menu>
            <Menu
                anchorEl={solicitanteFilterAnchorEl}
                open={isSolicitanteFilterOpen}
                onClose={handleSolicitanteFilterClose}
                slotProps={{ paper: { sx: { width: 300, maxHeight: 400 } } }}
            >
                <ListSubheader>
                    <TextField
                        placeholder="Pesquisar solicitante..."
                        value={solicitanteSearch}
                        onChange={(e) => setSolicitanteSearch(e.target.value)}
                        variant="standard"
                        fullWidth
                        autoFocus
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </ListSubheader>
                <List dense component="div" role="list" sx={{ overflow: 'auto' }}>
                    {allSolicitantes.filter(s => s.toLowerCase().includes(solicitanteSearch.toLowerCase())).map(solicitante => (
                        <MenuItem key={solicitante} onClick={() => handleSolicitanteToggle(solicitante)}>
                            <ListItemIcon><Checkbox edge="start" checked={selectedSolicitantes.indexOf(solicitante) !== -1} tabIndex={-1} disableRipple /></ListItemIcon>
                            <ListItemText primary={solicitante} />
                        </MenuItem>
                    ))}
                </List>
                <div className="filter-menu-actions">
                    <Button size="small" onClick={() => setSelectedSolicitantes([])}>Limpar</Button>
                    <Button size="small" variant="contained" onClick={handleSolicitanteFilterClose}>Aplicar</Button>
                </div>
            </Menu>
            <Suspense>
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