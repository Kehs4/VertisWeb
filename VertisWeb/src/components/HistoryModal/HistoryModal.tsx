import React, { useState, useEffect, lazy, Suspense } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton } from '@mui/material';
import './HistoryModal.css';

const ConfirmationModal = lazy(() => import('../ConfirmationModal/ConfirmationModal'));

interface HistoryEvent {
    type: 'CRIAÇÃO' | 'COMENTÁRIO' | 'FINALIZAÇÃO';
    description: string;
    author: string;
    date: string;
}

interface ResourceHistory {
    id: number; // ID do registro de alocação
    id_recurso: number; // ID do recurso
    nom_recurso: string;
    dth_inclusao: string;
    dth_exclusao: string | null;
}

interface HistoryData {
    changes: HistoryEvent[];
    resources: ResourceHistory[];
}

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, taskId }) => {
    const [activeTab, setActiveTab] = useState<'resources' | 'changes'>('resources');
    const [historyData, setHistoryData] = useState<HistoryData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<ResourceHistory | null>(null);

    useEffect(() => {
        if (isOpen && taskId) {
            const fetchHistory = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`/api/tasks/${taskId}/history`);
                    if (response.ok) {
                        const data: HistoryData = await response.json();
                        setHistoryData(data);
                    } else {
                        console.error("Falha ao buscar histórico da tarefa.");
                    }
                } catch (error) {
                    console.error("Erro de rede ao buscar histórico:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen, taskId]);

    const confirmDeleteResourceAllocation = async () => {
        if (!resourceToDelete) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}/resources/${resourceToDelete.id_recurso}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove o item da lista local para atualizar a UI imediatamente
                setHistoryData(prev => {
                    if (!prev) return null;
                    return { ...prev, resources: prev.resources.filter(r => r.id !== resourceToDelete.id) };
                });
            } else {
                console.error("Falha ao excluir registro de alocação.");
            }
        } catch (error) {
            console.error("Erro de rede ao excluir registro:", error);
        } finally {
            setResourceToDelete(null); // Fecha o modal de confirmação
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Histórico da Tarefa #{taskId}</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>
                <div className="history-tabs">
                    <button
                        className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
                        onClick={() => setActiveTab('resources')}
                    >
                        Recursos Alocados
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'changes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('changes')}
                    >
                        Alterações
                    </button>
                </div>
                <div className="modal-body history-body">
                    {isLoading ? (
                        <p>Carregando histórico...</p>
                    ) : activeTab === 'resources' ? (
                        <div className="history-list">
                            {historyData?.resources.map((res, index) => (
                                <div key={res.id} className={`history-item resource-item ${res.dth_exclusao ? 'inactive' : 'active'}`}>
                                    <div className="resource-infos">
                                        <span className="history-author">{res.nom_recurso}</span>
                                        <IconButton size="small" className="delete-history-btn" onClick={() => setResourceToDelete(res)} title="Excluir este registro de alocação">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </div>
                                    <div className="history-details">
                                        <span>Alocado em: {new Date(res.dth_inclusao).toLocaleString()}</span>
                                        {res.dth_exclusao && (
                                            <span className="deallocated-date">Removido em: {new Date(res.dth_exclusao).toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="history-list">
                            {historyData?.changes.map((change, index) => (
                                <div key={index} className="history-item change-item">
                                    <div className="history-change-header">
                                        <span className={`history-type type-${change.type.toLowerCase()}`}>{change.type}</span>
                                        <span className="history-author">{change.author}</span>
                                        <span className="history-date">{new Date(change.date).toLocaleString()}</span>
                                    </div>
                                    <div className="history-description" dangerouslySetInnerHTML={{ __html: change.description }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Suspense>
                    {resourceToDelete && (
                        <ConfirmationModal
                            isOpen={!!resourceToDelete}
                            onClose={() => setResourceToDelete(null)}
                            onConfirm={confirmDeleteResourceAllocation}
                            title="Exclusão de Registro"
                            message={`Você tem certeza que deseja excluir permanentemente o registro de alocação do recurso "${resourceToDelete.nom_recurso}"? Esta ação não pode ser desfeita.`}
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default HistoryModal;