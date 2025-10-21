import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Task } from '../../pages/Admin/Suporte/Tarefas/TarefasPage';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import './LinkedTasksModal.css';

const EditTaskModal = lazy(() => import('../TaskModal/EditTaskModal'));

interface LinkedTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    vinculoId: number;
}

const statusConfig: { [key: string]: { backgroundColor: string, color?: string } } = {
    'AG': { backgroundColor: 'rgb(177, 167, 140)' },       // Aguardando
    'AB': { backgroundColor: 'rgb(149, 161, 159)' },       // Aberto
    'ER': { backgroundColor: 'rgb(53, 146, 158)' },       // Em resolução
    'AT': { backgroundColor: 'rgb(247, 208, 38)' },       // Em atraso
    'CA': { backgroundColor: 'rgb(255, 205, 205)', color: 'rgb(153, 48, 48)' }, // Cancelado
    'FN': { backgroundColor: '#2ecc71' },       // Finalizado
    
};

const LinkedTasksModal: React.FC<LinkedTasksModalProps> = ({ isOpen, onClose, vinculoId }) => {
    const [parentTask, setParentTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);


    useEffect(() => {
        if (isOpen && vinculoId) {
            const fetchParentTask = async () => {
                setIsLoading(true);
                try {
                    // Busca diretamente os detalhes da tarefa "pai" usando o vinculoId
                    const response = await fetch(`/api/task/${vinculoId}`);
                    if (response.ok) {
                        const taskData: Task = await response.json();
                        setParentTask(taskData);
                    } else {
                        console.error("Falha ao buscar a tarefa pai.");
                        setParentTask(null);
                    }
                } catch (error) {
                    console.error("Erro de rede:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchParentTask();
        }
    }, [isOpen, vinculoId]);

    const handleOpenDetails = () => {
        if (parentTask) {
            setIsDetailsModalOpen(true);
        }
    };

    const handleSaveParentTask = async (updatedTask: Task) => {
        // Esta função é chamada quando a tarefa pai é salva no EditTaskModal.
        // Ela faz a chamada PUT para a API e depois fecha o modal de detalhes.
        try {
            const response = await fetch(`/api/tasks/${updatedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTask),
            });
            if (response.ok) {
                const returnedTask = await response.json();
                setParentTask(returnedTask); // Atualiza os dados da tarefa pai no modal atual
                setIsDetailsModalOpen(false); // Fecha o modal de detalhes
            } else {
                alert('Falha ao salvar a tarefa pai.');
            }
        } catch (error) {
            console.error('Erro ao salvar tarefa pai:', error);
        }
    };
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content linked-tasks-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tarefa Pai Vinculada ID: {vinculoId}</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>
                <div className="modal-body">
                    {isLoading ? (
                        <p>Carregando tarefa vinculada...</p>
                    ) : parentTask ? (
                        <ul className="linked-tasks-list">
                            <li className="linked-task-item">
                                <span className="task-id">#{parentTask.id}</span>
                                <span className="task-title">{parentTask.titulo_tarefa}</span>
                                <span className="task-status" style={statusConfig[parentTask.ind_sit_tarefa] || {}}>{parentTask.ind_sit_tarefa}</span>
                                <button className="search-button" onClick={handleOpenDetails} title="Ver detalhes da tarefa pai">
                                    <SearchIcon/>
                                </button>
                            </li>
                        </ul>
                    ) : (
                        <p>Não foi possível carregar a tarefa pai.</p>
                    )}
                </div>
                <Suspense fallback={<div>Carregando detalhes...</div>}>
                    {isDetailsModalOpen && (
                        <EditTaskModal
                            isOpen={isDetailsModalOpen}
                            onClose={() => setIsDetailsModalOpen(false)}
                            task={parentTask}
                            onSave={handleSaveParentTask}
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default LinkedTasksModal;