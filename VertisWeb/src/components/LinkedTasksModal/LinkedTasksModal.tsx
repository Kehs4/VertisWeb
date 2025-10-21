import React, { useState, useEffect, lazy, Suspense, useContext } from 'react';
import { Task } from '../../pages/Admin/Suporte/Tarefas/TarefasPage';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import './LinkedTasksModal.css';
import { AlertContext } from '../MainLayout';

const EditTaskModal = lazy(() => import('../TaskModal/EditTaskModal'));
const ConfirmationModal = lazy(() => import('../ConfirmationModal/ConfirmationModal'));

interface LinkedTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    childTaskId: number; // ID da tarefa filha que estamos editando
    parentTaskId: number; // ID da tarefa pai que está sendo visualizada
}

const statusConfig: { [key: string]: { backgroundColor: string, color?: string } } = {
    'AG': { backgroundColor: 'rgb(177, 167, 140)' },       // Aguardando
    'AB': { backgroundColor: 'rgb(149, 161, 159)' },       // Aberto
    'ER': { backgroundColor: 'rgb(53, 146, 158)' },       // Em resolução
    'AT': { backgroundColor: 'rgb(247, 208, 38)' },       // Em atraso
    'CA': { backgroundColor: 'rgb(255, 205, 205)', color: 'rgb(153, 48, 48)' }, // Cancelado
    'FN': { backgroundColor: '#2ecc71' },       // Finalizado
    
};

const LinkedTasksModal: React.FC<LinkedTasksModalProps> = ({ isOpen, onClose, childTaskId, parentTaskId }) => {
    const showAlert = useContext(AlertContext);
    const [parentTask, setParentTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isConfirmUnlinkOpen, setIsConfirmUnlinkOpen] = useState(false);


    useEffect(() => {
        if (isOpen && parentTaskId) {
            const fetchParentTask = async () => {
                setIsLoading(true);
                try {
                    // Busca diretamente os detalhes da tarefa "pai" usando o parentTaskId
                    const response = await fetch(`/api/task/${parentTaskId}`);
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
    }, [isOpen, parentTaskId]);

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
                showAlert({ message: 'Falha ao salvar a tarefa pai.', type: 'error' });
            }
        } catch (error) {
            console.error('Erro ao salvar tarefa pai:', error);
            showAlert({ message: 'Erro de rede ao salvar tarefa pai.', type: 'error' });
        }
    };

    const confirmUnlinkParent = async () => {
        if (!childTaskId) return;
        setIsConfirmUnlinkOpen(false); // Fecha o modal de confirmação

        try {
            const response = await fetch(`/api/tasks/${childTaskId}/unlink-parent`, {
                method: 'PATCH',
            });

            if (response.ok) {
                showAlert({ message: 'Vínculo removido com sucesso.', type: 'success' });
                onClose(); // Fecha o modal principal para forçar a atualização da tela anterior
            } else {
                const errorText = await response.text();
                showAlert({ message: `Falha ao remover o vínculo: ${errorText}`, type: 'error' });
            }
        } catch (error) {
            console.error('Erro de rede ao remover vínculo:', error);
            showAlert({ message: 'Erro de rede ao remover o vínculo.', type: 'error' });
        }
    };
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content linked-tasks-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tarefa Pai Vinculada ID: {parentTaskId}</h2>
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
                                <button className="delete-link-button" onClick={() => setIsConfirmUnlinkOpen(true)} title="Remover vínculo com a tarefa pai">
                                    <DeleteIcon />
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
                <Suspense>
                    {isConfirmUnlinkOpen && (
                        <ConfirmationModal
                            isOpen={isConfirmUnlinkOpen}
                            onClose={() => setIsConfirmUnlinkOpen(false)}
                            onConfirm={confirmUnlinkParent}
                            title="Confirmar Desvinculação"
                            message={`Tem certeza que deseja remover o vínculo com a tarefa pai #${parentTask?.id}?`} />
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default LinkedTasksModal;