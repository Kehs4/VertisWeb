import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import './AddTaskModal.css';
import { Recurso, Task } from '../../pages/Admin/Suporte/Tarefas/TarefasPage'; // Reutilizando a tipagem
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { Contact } from '../ContactSearchModal/ContactSearchModal.tsx';
import { flags, flagsMap, FlagConfig } from '../TaskListView/taskFlags.ts';
const ContactSearchModal = lazy(() => import('../ContactSearchModal/ContactSearchModal.tsx'));
const ResourceSearchModal = lazy(() => import('../ResourceSearchModal/ResourceSearchModal.tsx'));
const TaskSearchModal = lazy(() => import('../LinkedTasksModal/TaskSearchModal.tsx'));

interface AddTaskModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (newTask: Task) => void;
    contextType?: 'support' | 'development' | 'commercial';
}

// Mova initialFormState para fora do componente para evitar recriação em cada renderização
const initialFormState: Task = {
    id: 0, // ID será substituído na criação
    titulo_tarefa: '',
    criado_por: '',
    nom_unid_oper: '',
    ind_prioridade: 2, // Default to 'Média'
    ind_sit_tarefa: 'AB',
    sit_tarefa: 'Aberto',
    ind_vinculo: 'N',
    id_vinculo: undefined,
    // --- Valores padrão para campos obrigatórios ---
    id_unid_negoc: 0,
    nom_unid_negoc: '',
    id_unid_oper: 0,
    qtd_pontos: 0,
    dth_prev_entrega: '',
    recursos: [],
    comentarios: [],
    dth_encerramento: '',
    tipo_chamado: [], // Agora é um array vazio
    dth_inclusao: '', // Será definido na criação
    satisfaction_rating: undefined,
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({ title, isOpen, onClose, onSave, contextType = 'support' }) => {
    const labels = {
        taskDescription: contextType === 'development' ? 'Descrição da Tarefa' : 'Descrição do Chamado',
        analyst: contextType === 'development' ? 'Desenvolvedor' : 'Analista',
        saveBtn: contextType === 'development' ? 'Salvar Tarefa' : 'Salvar Chamado',
    };


    const [formData, setFormData] = useState(initialFormState);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isAddingFlags, setIsAddingFlags] = useState(false); // Estado para mostrar/esconder flags disponíveis
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isTaskSearchModalOpen, setIsTaskSearchModalOpen] = useState(false);
    const [linkedTasksCount, setLinkedTasksCount] = useState(0);

    useEffect(() => {
        // Reset form when modal is opened
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
            setFormData({
                ...initialFormState,
                dth_prev_entrega: today, // Preenche a previsão de entrega com a data atual
            });
            setIsAddingFlags(false); // Garante que a lista de flags esteja fechada
            setIsResourceModalOpen(false);
            setIsTaskSearchModalOpen(false);
            setLinkedTasksCount(0);
        }
    }, [isOpen]);

    // Efeito para buscar a contagem de tarefas vinculadas quando o ID do vínculo muda
    useEffect(() => {
        if (formData.ind_vinculo && formData.ind_vinculo !== 'N') {
            const fetchLinkedTasksCount = async () => {
                try {
                    const response = await fetch(`/api/tasks`);
                    if (response.ok) {
                        const allTasks: Task[] = await response.json();
                        const count = allTasks.filter(t => t.ind_vinculo === formData.ind_vinculo).length;
                        setLinkedTasksCount(count);
                    }
                } catch (error) {
                    console.error("Erro ao contar tarefas vinculadas:", error);
                }
            };
            fetchLinkedTasksCount();
        } else {
            setLinkedTasksCount(0);
        }
    }, [formData.ind_vinculo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'nom_recurso') {
            // Lógica especial para atualizar o nome do analista dentro do array
            setFormData(prev => ({
                ...prev,
                recursos: Array.isArray(prev.recursos) && prev.recursos.length > 0
                    ? [{ ...prev.recursos[0], nom_recurso: value }]
                    : [{ id_recurso: 0, nom_recurso: value }]
            }));
        } else {
            // Lógica padrão para os outros campos
            setFormData(prev => ({
                ...prev,
                [name]: name === 'ind_prioridade' ? parseInt(value, 10) : value,
            }));
        }
    };

    const handleFlagClick = (flagId: string) => {
        setFormData(prev => {
            const currentFlags = prev.tipo_chamado || [];
            const newFlags = currentFlags.includes(flagId)
                ? currentFlags.filter(f => f !== flagId) // Deseleciona
                : [...currentFlags, flagId]; // Seleciona
            return {
                ...prev,
                tipo_chamado: newFlags,
            };
        });
    };

    const handleResourceConfirm = (newResources: Recurso[]) => {
        setFormData(prev => {
            return { ...prev, recursos: newResources };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleContactSelect = (contact: Contact) => {
        setFormData(prev => ({
            ...prev,
            criado_por: contact.nome,
            nom_unid_oper: contact.nom_unid_oper,
            id_unid_oper: contact.id_unid_oper,
            nom_unid_negoc: contact.nom_unid_negoc,
            id_unid_negoc: contact.id_unid_negoc,
        }));
        setIsContactModalOpen(false);
    };

    const handleTaskLinkSelect = (taskId: number) => {
        setFormData(prev => ({ ...prev, ind_vinculo: 'S', id_vinculo: taskId }));
        setIsTaskSearchModalOpen(false);
    };

    // Memoiza as listas de flags para otimização
    const selectedFlagIds = formData.tipo_chamado || [];
    const availableFlags = useMemo(() => flags.filter(flag => !selectedFlagIds.includes(flag.id)), [selectedFlagIds]);
    const selectedFlags = useMemo(() => selectedFlagIds.map(id => flagsMap.get(id)).filter(Boolean) as FlagConfig[], [selectedFlagIds]);

    const vinculoPlaceholder = useMemo(() => {
        if (formData.ind_vinculo !== 'S' || !formData.id_vinculo) {
            return "Nenhuma tarefa vinculada.";
        }
        return `Existe ${linkedTasksCount} tarefa(s) vinculada(s) a esta.`;
    }, [formData.ind_vinculo, formData.id_vinculo, linkedTasksCount]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-button">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="titulo_tarefa">{labels.taskDescription}</label>
                        <textarea
                            id="titulo_tarefa"
                            name="titulo_tarefa"
                            value={formData.titulo_tarefa}
                            onChange={handleChange}
                            style={{resize : 'none'}}
                            required
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="criado_por">Usuário Solicitante</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    id="criado_por"
                                    name="criado_por"
                                    value={formData.criado_por}
                                    onChange={handleChange}
                                    required
                                />
                                <button type="button" className="icon-button" onClick={() => setIsContactModalOpen(true)} title="Pesquisar Contato">
                                    <SearchIcon />
                                </button>
                            </div>
                        </div>
                        {contextType === 'support' && (
                            <div className="form-group">
                                <label htmlFor="nom_unid_oper">Nome Unidade Operacional</label>
                                <input
                                    type="text"
                                    id="nom_unid_oper"
                                    name="nom_unid_oper"
                                    value={formData.nom_unid_oper}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="ind_prioridade">Prioridade</label>
                        <select
                            id="ind_prioridade"
                            name="ind_prioridade"
                            value={formData.ind_prioridade}
                            onChange={handleChange}
                        >
                            <option value={1}>Baixa</option>
                            <option value={2}>Média</option>
                            <option value={3}>Alta</option>
                            <option value={4}>Urgente</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="dth_prev_entrega">Previsão de Entrega</label>
                            <input
                                type="date"
                                id="dth_prev_entrega"
                                name="dth_prev_entrega"
                                value={formData.dth_prev_entrega}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        {contextType === 'support' && (
                            <div className="form-group">
                                <label htmlFor="id_unid_negoc">Unidade de Negócio</label>
                                <input
                                    type="text"
                                    id="id_unid_negoc"
                                    name="id_unid_negoc"
                                    value={formData.nom_unid_negoc}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor='nom_recurso'>{labels.analyst}</label>
                            <div className="resource-pills-container">
                                {Array.isArray(formData.recursos) && formData.recursos.map(resource => (
                                    <div key={resource.id_recurso} className="resource-pill">
                                        {resource.nom_recurso}
                                        <button type="button" onClick={() => {
                                            handleResourceConfirm( (Array.isArray(formData.recursos) ? formData.recursos : []).filter(r => r.id_recurso !== resource.id_recurso) )
                                        }}>&times;</button>
                                    </div>
                                ))}
                                <button type="button" className="add-resource-btn" onClick={() => setIsResourceModalOpen(true)}>
                                    <AddCircleOutlineIcon />
                                </button>
                            </div>
                        </div>

                    </div>

                    <div className="form-group">
                        <label htmlFor="ind_vinculo">Vínculo</label>
                        <div className="input-with-button">
                            <input
                                type="text"
                                id="ind_vinculo"
                                name="id_vinculo" // O campo de texto controla o id_vinculo
                                value={formData.id_vinculo || ''}
                                onChange={handleChange}
                                placeholder={vinculoPlaceholder}
                            />
                            <button type="button" className="icon-button" onClick={() => setIsTaskSearchModalOpen(true)} title="Pesquisar Tarefa para Vincular">
                                <SearchIcon />
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="tipo_chamado">Flags</label>
                        <div className="flag-section-container">
                            {/* Flags Selecionadas */}
                            <div className="selected-flags-container">
                                {selectedFlags.length > 0 ? selectedFlags.map(flag => (
                                    <div
                                        key={flag.id}
                                        style={{ backgroundColor: flag.background, color: flag.color }}
                                        className="flag-item"
                                        onClick={() => handleFlagClick(flag.id)}
                                    >
                                        {flag.label}
                                    </div>
                                )) : <span className="no-flags-text">Nenhuma flag selecionada.</span>}

                                <button type="button" className="add-flag-button" onClick={() => setIsAddingFlags(!isAddingFlags)} title="Adicionar Flag">
                                    <AddCircleOutlineIcon />
                                </button>
                            </div>

                            {/* Flags Disponíveis (condicional) */}
                            {isAddingFlags && (
                                <div className="available-flags-container">
                                    {availableFlags.map(flag => (
                                        <div
                                            key={flag.id}
                                            style={{ backgroundColor: flag.background, color: flag.color }}
                                            className="flag-item available"
                                            onClick={() => handleFlagClick(flag.id)}
                                        >
                                            {flag.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="save-btn">
                            {labels.saveBtn}
                        </button>
                    </div>
                </form>
                <Suspense fallback={<div>Carregando...</div>}>
                    {isContactModalOpen && (
                        <ContactSearchModal
                            isOpen={isContactModalOpen}
                            onClose={() => setIsContactModalOpen(false)}
                            onSelect={handleContactSelect} />
                    )}
                    {isResourceModalOpen && (
                        <ResourceSearchModal
                            isOpen={isResourceModalOpen}
                            onClose={() => setIsResourceModalOpen(false)}
                            onConfirm={handleResourceConfirm}
                            initialSelectedResources={Array.isArray(formData.recursos) ? formData.recursos : []}
                        />
                    )}
                    {isTaskSearchModalOpen && (
                        <TaskSearchModal
                            isOpen={isTaskSearchModalOpen}
                            onClose={() => setIsTaskSearchModalOpen(false)}
                            onSelectTask={handleTaskLinkSelect}
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default AddTaskModal;