import React, { useState, useEffect } from 'react';
import { Task } from '../../pages/Admin/Suporte/Tarefas/TarefasPage';
import CloseIcon from '@mui/icons-material/Close';
import './LinkedTasksModal.css';

interface LinkedTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    vinculoId: number;
}

const LinkedTasksModal: React.FC<LinkedTasksModalProps> = ({ isOpen, onClose, vinculoId }) => {
    const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && vinculoId) {
            const fetchLinkedTasks = async () => {
                setIsLoading(true);
                try {
                    // Assumindo que temos um endpoint para buscar tarefas por vínculo
                    // Se não tiver, teríamos que buscar todas e filtrar no frontend.
                    // Para garantir que todas as tarefas vinculadas sejam encontradas, passamos filtros de data vazios.
                    const response = await fetch(`/api/tasks?dat_inicial=&dat_final=`);
                    if (response.ok) {
                        const allTasks: Task[] = await response.json();
                        const filtered = allTasks.filter(task => task.id_vinculo === vinculoId);
                        setLinkedTasks(filtered);
                    } else {
                        console.error("Falha ao buscar tarefas vinculadas.");
                    }
                } catch (error) {
                    console.error("Erro de rede:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchLinkedTasks();
        }
    }, [isOpen, vinculoId]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content linked-tasks-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tarefas Vinculadas (Vínculo: {vinculoId})</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>
                <div className="modal-body">
                    {isLoading ? (
                        <p>Carregando tarefas vinculadas...</p>
                    ) : linkedTasks.length > 0 ? (
                        <ul className="linked-tasks-list">
                            {linkedTasks.map(task => (
                                <li key={task.id} className="linked-task-item">
                                    <span className="task-id">#{task.id}</span>
                                    <span className="task-title">{task.titulo_tarefa}</span>
                                    <span className="task-status">{task.sit_tarefa}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Nenhuma outra tarefa encontrada com este vínculo.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LinkedTasksModal;