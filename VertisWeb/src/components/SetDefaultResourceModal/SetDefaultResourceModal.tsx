import React, { useState, useEffect } from 'react';
import { Recurso } from '../../pages/Admin/Suporte/Tarefas/TarefasPage';
import CloseIcon from '@mui/icons-material/Close';
import './SetDefaultResourceModal.css';

interface SetDefaultResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    resources: Recurso[];
    onSave: (selectedResourceId: number) => void;
}

const SetDefaultResourceModal: React.FC<SetDefaultResourceModalProps> = ({ isOpen, onClose, resources, onSave }) => {
    // Encontra o recurso que já é o padrão, se houver
    const currentDefault = resources.find(r => r.ind_responsavel === 'S');
    const [selectedId, setSelectedId] = useState<number | null>(currentDefault?.id_recurso || null);

    useEffect(() => {
        // Atualiza o estado se o modal for reaberto com dados diferentes
        const newDefault = resources.find(r => r.ind_responsavel === 'S');
        setSelectedId(newDefault?.id_recurso || null);
    }, [resources, isOpen]);

    const handleSave = () => {
        if (selectedId) {
            onSave(selectedId);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content default-resource-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Definir Recurso Responsável</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>
                <div className="modal-body">
                    <p>Selecione qual recurso será o principal responsável por esta tarefa.</p>
                    <div className="resource-selection-list">
                        {resources.map(resource => (
                            <label key={resource.id_recurso} className="resource-radio-label">
                                <input
                                    type="radio"
                                    name="default-resource"
                                    value={resource.id_recurso}
                                    checked={selectedId === resource.id_recurso}
                                    onChange={() => setSelectedId(resource.id_recurso)}
                                />
                                <span className="resource-name">{resource.nom_recurso}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
                    <button type="button" className="save-btn" onClick={handleSave} disabled={!selectedId}>
                        Salvar Responsável
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetDefaultResourceModal;