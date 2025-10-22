import React, { useState, useEffect } from 'react';
import { Task } from '../../pages/Admin/Suporte/Tarefas/TarefasPage';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import './TaskSearchModal.css';

interface TaskSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTask: (taskId: number) => void;
    resourceIds: number[];
}

const statusConfig: { [key: string]: { backgroundColor: string, color?: string } } = {
    'AG': { backgroundColor: 'rgb(177, 167, 140)' },       // Aguardando
    'AB': { backgroundColor: 'rgb(149, 161, 159)' },       // Aberto
    'ER': { backgroundColor: 'rgb(53, 146, 158)' },       // Em resolução
    'AT': { backgroundColor: 'rgb(247, 208, 38)' },       // Em atraso
    'CA': { backgroundColor: 'rgb(255, 205, 205)', color: 'rgb(153, 48, 48)' }, // Cancelado
    'FN': { backgroundColor: '#2ecc71' },       // Finalizado
    
};

const TaskSearchModal: React.FC<TaskSearchModalProps> = ({ isOpen, onClose, onSelectTask, resourceIds }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchTasks = async () => {
                setIsLoading(true);
                try {
                    // Constrói a URL da API dinamicamente com os parâmetros de busca
                    const params = new URLSearchParams();
                    if (resourceIds.length > 0) {
                        params.append('resource_ids', resourceIds.join(','));
                    }
                    if (searchTerm) {
                        params.append('search_term', searchTerm);
                    }

                    // Chama o novo endpoint específico para busca de tarefas para vinculação
                    const response = await fetch(`/api/tasks/search-for-linking?${params.toString()}`);

                    if (response.ok) {
                        let allTasks: Task[] = await response.json();
                        setTasks(allTasks);
                    }
                } catch (error) {
                    console.error("Erro ao buscar tarefas:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTasks();
        }
    }, [isOpen, searchTerm, resourceIds]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content task-search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Vincular Tarefa</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>
                <div className="task-search-filters">
                    <div className="search-input-wrapper">
                        <SearchIcon className="search-icon" />
                        <input
                            type="text"
                            placeholder="Pesquisar por ID ou Título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="filter-search-input"
                            style={{ color: 'black', backgroundColor: 'white'}}
                        />
                    </div>
                </div>
                <div className="modal-body">
                    {isLoading ? (
                        <p>Carregando...</p>
                    ) : (
                        <ul className="task-search-list">
                            {tasks.map(task => (
                                <li key={task.id} className="task-search-item" onClick={() => onSelectTask(task.id)}>
                                    <span className="task-id">#{task.id}</span>
                                    <span className="task-title">{task.titulo_tarefa}</span>
                                    <span className="task-status" style={statusConfig[task.ind_sit_tarefa] || {}}>{task.ind_sit_tarefa}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskSearchModal;