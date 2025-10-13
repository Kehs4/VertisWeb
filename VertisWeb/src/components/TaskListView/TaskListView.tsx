import React, { useState } from 'react';
import './TaskListView.css';
import FlagIcon from '@mui/icons-material/Flag';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert'; 
import AddTaskModal from '../TaskModal/AddTaskModal';
import EditTaskModal from '../TaskModal/EditTaskModal';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';

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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

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
        <main className="task-list-container">
            <div className="task-list-header">
                <h1 className="task-list-title">{title}</h1>
                <button className="add-task-button" onClick={() => setIsAddModalOpen(true)}>Adicionar Chamado</button>
            </div>
            <div className="task-table-wrapper">
                <table className="task-table">
                    <thead>
                        <tr>
                            <th>Prioridade</th>
                            <th>Status</th>
                            <th>Chamado</th>
                            <th>Solicitante</th>
                            <th>Unidade</th>
                            <th>Analista</th>
                            <th>Criação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.id} className={`task-row status-${task.ind_sit_tarefa.toLowerCase()}`}>
                                <td className="cell-priority">
                                    <FlagIcon style={{ color: priorityConfig[task.ind_prioridade]?.color || '#ccc' }} />
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
                <MenuItem onClick={handleEditOptionClick}>Editar</MenuItem>
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