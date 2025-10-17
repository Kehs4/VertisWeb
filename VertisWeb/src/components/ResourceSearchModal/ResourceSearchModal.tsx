import React, { useState, useEffect } from 'react';
import './ResourceSearchModal.css';
import { Recurso } from '../../pages/Admin/Suporte/Tarefas/TarefasPage';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { IconButton, TextField } from '@mui/material';

interface ResourceSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedResources: Recurso[]) => void;
    initialSelectedResources: Recurso[];
}

const ResourceSearchModal: React.FC<ResourceSearchModalProps> = ({ isOpen, onClose, onConfirm, initialSelectedResources }) => {
    const [resources, setResources] = useState<Recurso[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingResource, setEditingResource] = useState<Partial<Recurso> | null>(null);
    const [localSelection, setLocalSelection] = useState<Recurso[]>([]);

    const fetchResources = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/resources?search=${searchTerm}`);
            if (response.ok) setResources(await response.json());
        } catch (error) {
            console.error("Erro ao buscar recursos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchResources();
            setLocalSelection(initialSelectedResources);
        }
    }, [isOpen, searchTerm]);

    const handleSave = async () => {
        if (!editingResource || !editingResource.nom_recurso) {
            alert('O nome do recurso é obrigatório.');
            return;
        }
        const method = editingResource.id_recurso ? 'PUT' : 'POST';
        const url = editingResource.id_recurso ? `/api/resources/${editingResource.id_recurso}` : '/api/resources';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nom_recurso: editingResource.nom_recurso, recurso_funcao: editingResource.recurso_funcao }),
            });
            if (response.ok) {
                setEditingResource(null);
                fetchResources();
            } else {
                alert('Falha ao salvar recurso.');
            }
        } catch (error) {
            console.error("Erro de rede ao salvar recurso:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este recurso?')) {
            try {
                await fetch(`/api/resources/${id}`, { method: 'DELETE' });
                fetchResources();
            } catch (error) {
                console.error("Erro de rede ao excluir recurso:", error);
            }
        }
    };

    const handleToggleSelection = (resource: Recurso) => {
        setLocalSelection(prevSelection => {
            const isSelected = prevSelection.some(r => r.id_recurso === resource.id_recurso);
            if (isSelected) {
                return prevSelection.filter(r => r.id_recurso !== resource.id_recurso);
            } else {
                return [...prevSelection, resource];
            }
        });
    };

    const handleConfirmClick = () => {
        onConfirm(localSelection);
        onClose();
    };


    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content resource-search-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Gerenciar Recursos</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>

                <div className="resource-modal-toolbar">
                    <div className="search-input-wrapper">
                        <SearchIcon className="search-icon" />
                        <input
                            type="text"
                            placeholder="Pesquisar recurso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="filter-search-input"
                        />
                    </div>
                    <button className="add-resource-button" onClick={() => setEditingResource({ nom_recurso: '', recurso_funcao: '' })}>
                        <AddIcon /> Adicionar Recurso
                    </button>
                </div>

                {editingResource && (
                    <div className="resource-edit-form">
                        <TextField
                            label="Nome do Recurso"
                            value={editingResource.nom_recurso || ''}
                            onChange={(e) => setEditingResource(prev => ({ ...prev, nom_recurso: e.target.value }))}
                            variant="outlined"
                            size="small"
                            fullWidth
                            autoFocus
                        />
                        <TextField
                            label="Função"
                            value={editingResource.recurso_funcao || ''}
                            onChange={(e) => setEditingResource(prev => ({ ...prev, recurso_funcao: e.target.value }))}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />
                        <div className="edit-form-actions">
                            <button onClick={() => setEditingResource(null)} className="cancel-btn"><CancelIcon /> Cancelar</button>
                            <button onClick={handleSave} className="save-btn"><SaveIcon /> Salvar</button>
                        </div>
                    </div>
                )}

                <div className="resource-list-wrapper">
                    {isLoading ? <p>Carregando...</p> : (
                        <ul className="resource-list">
                            {resources.map(resource => (
                                <li
                                    key={resource.id_recurso}
                                    className={`resource-item ${localSelection.some(r => r.id_recurso === resource.id_recurso) ? 'selected' : ''}`}
                                    onClick={() => handleToggleSelection(resource)}
                                >
                                    <div className="resource-info">
                                        <span className="resource-name">
                                            {resource.nom_recurso}
                                        </span>
                                        <span className="resource-function">{resource.recurso_funcao}</span>
                                    </div>

                                    <div className="resource-actions">
                                        <IconButton size="small" onClick={() => setEditingResource(resource)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(resource.id_recurso)}>
                                            <DeleteIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="cancel-btn">Cancelar</button>
                    <button onClick={handleConfirmClick} className="save-btn">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

export default ResourceSearchModal;