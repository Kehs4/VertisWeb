import React, { useState, useMemo } from 'react';
import { useTheme } from '../ThemeContext'; // Importando o hook do tema
import './TaskListView.css';
import FlagIcon from '@mui/icons-material/Flag';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert'; 
import AddTaskModal from '../TaskModal/AddTaskModal';
import EditTaskModal from '../TaskModal/EditTaskModal';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TuneIcon from '@mui/icons-material/Tune';

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
    recursos: Recurso[];
    comentarios?: Comentario[];
    contatos?: Contato[];
    dth_prev_entrega?: string;
    dth_encerramento?: string;
    dth_inclusao: string;
    dth_exclusao?: string;
}

interface TaskListViewProps {
    title: string;
    tasks: Task[];
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: number) => void;
    onAddTask: (newTask: Task) => void;
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

const TaskListView: React.FC<TaskListViewProps> = ({ title, tasks, onAddTask, onUpdateTask, onDeleteTask }) => {
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

    const handleSaveTask = (newTaskData: Omit<Task, 'id' | 'dth_inclusao'>) => {
        const newTask: Task = {
            ...newTaskData,
            id: Date.now(), // Gerando um ID simples para o exemplo
            dth_inclusao: new Date().toISOString().split('T')[0], // Data atual
        };
        onAddTask(newTask);
        setIsAddModalOpen(false); // Fecha o modal após salvar
    };

    // Memoiza as tarefas ordenadas para evitar recálculos desnecessários
    const sortedTasks = useMemo(() => {
        let sortableItems = [...tasks];
        if (sortConfig.key !== null) {
            const sortKey = sortConfig.key; // Captura a chave de ordenação em uma constante

            sortableItems.sort((a, b) => {
                // Função auxiliar para extrair o valor de forma segura
                const getValue = (task: Task, key: keyof Task) => {
                    if (key === 'recursos') {
                        // Ordena pelo nome do primeiro recurso, se existir
                        return task.recursos && task.recursos.length > 0 ? task.recursos[0].nom_recurso : '';
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
    }, [tasks, sortConfig]);

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
                <button className="add-task-button" onClick={() => setIsAddModalOpen(true)}>Adicionar Chamado</button>
                    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="theme-toggle-button">
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </button>
                </div>
            </div>
            <div className="task-table-wrapper">
                <table className="task-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('ind_prioridade')} className={getSortClassName('ind_prioridade')}><div className="th-content"><AnnouncementIcon /> Prioridade</div></th>
                            <th onClick={() => requestSort('ind_sit_tarefa')} className={getSortClassName('ind_sit_tarefa')}><div className="th-content"><HistoryIcon/> Status</div></th>
                            <th onClick={() => requestSort('titulo_tarefa')} className={getSortClassName('titulo_tarefa')}><div className="th-content"><ArticleIcon /> Chamado</div></th>
                            <th onClick={() => requestSort('criado_por')} className={getSortClassName('criado_por')}><div className="th-content"><PersonIcon /> Solicitante</div></th>
                            <th onClick={() => requestSort('nom_unid_oper')} className={getSortClassName('nom_unid_oper')}><div className="th-content"><ApartmentIcon /> Unidade</div></th>
                            <th onClick={() => requestSort('recursos')} className={getSortClassName('recursos')}><div className="th-content"><PersonPinIcon /> Analista</div></th>
                            <th onClick={() => requestSort('dth_inclusao')} className={getSortClassName('dth_inclusao')}><div className="th-content"><CalendarTodayIcon /> Criação</div></th>
                            <th><div className="th-content"><TuneIcon /> Ações</div></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTasks.map(task => (
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
                                <td>{task.nom_unid_oper}</td>
                                <td>{task.recursos.map(r => r.nom_recurso).join(', ') || 'N/A'}</td>
                                <td>{new Date(task.dth_inclusao).toLocaleDateString()}</td>
                                <td className="cell-actions">
                                    <IconButton
                                        aria-label="mais opções"
                                        className="action-button"
                                        onClick={(e) => handleMenuOpen(e, task)}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
                <MenuItem onClick={handleEditOptionClick}>Detalhes</MenuItem>
                <MenuItem onClick={handleDeleteOptionClick} sx={{ color: 'error.main' }}>Remover</MenuItem>
            </Menu>
            <AddTaskModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveTask}
            />
            <EditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                task={selectedTask}
                onSave={handleUpdateTask}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message={`Você tem certeza que deseja remover o chamado #${selectedTask?.id}? Esta ação não pode ser desfeita.`}
            />
        </main>
    );
};

export default TaskListView;