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
    // onSave agora espera a tarefa completa retornada pela API
    onSave: (newTask: Task) => void; 
    contextType?: 'support' | 'development' | 'commercial';
}

// Mova initialFormState para fora do componente para evitar recriação em cada renderização
const initialFormState: Omit<Task, 'id' | 'dth_inclusao' | 'sit_tarefa'> & {
    id_criado_por: number | null; // ID do contato que criou a tarefa
    nom_criado_por: string; // Nome do contato que criou a tarefa
    recursos: Recurso[]; // Garante que seja Recurso[]
} = {
    id_criado_por: null, 
    nom_criado_por: '', 
    titulo_tarefa: '',
    ind_prioridade: 2, // Default to 'Média'
    ind_sit_tarefa: 'AB',
    ind_vinculo: 'N',
    id_vinculo: undefined,
    // --- Valores padrão para campos obrigatórios ---
    id_unid_negoc: 0,
    nom_unid_negoc: '',
    id_unid_oper: 0,
    nom_unid_oper: '',
    qtd_pontos: 0,
    dth_prev_entrega: '', // Será preenchido com a data atual no useEffect
    recursos: [],
    comentarios: [], // Não usado no POST, mas parte da interface Task
    dth_encerramento: undefined,
    tipo_chamado: [], // Agora é um array vazio
    satisfaction_rating: undefined,
    dth_exclusao: undefined,
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
    const [isSaving, setIsSaving] = useState(false); // Novo estado para controlar o status de salvamento
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
            setIsSaving(false); // Reseta o estado de salvamento
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

        if (name === 'dth_prev_entrega') {
            // Para inputs de data, o valor é YYYY-MM-DD.
            setFormData(prev => ({
                ...prev,
                [name]: value, // O backend espera YYYY-MM-DD para dth_prev_entrega
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return; // Previne envio duplo

       /* // Validação básica
        if (!formData.titulo_tarefa || !formData.id_criado_por || !formData.id_unid_negoc || !formData.id_unid_oper) {
            alert('Por favor, preencha todos os campos obrigatórios (Título, Solicitante, Unidade de Negócio, Unidade Operacional).');
            return;
        }*/

        setIsSaving(true);

        try {
            const payload = {
                titulo_tarefa: formData.titulo_tarefa,
                id_criado_por: formData.id_criado_por,
                id_unid_negoc: formData.id_unid_negoc,
                id_unid_oper: formData.id_unid_oper,
                ind_prioridade: formData.ind_prioridade,
                dth_prev_entrega: formData.dth_prev_entrega || null, // YYYY-MM-DD ou null
                recursos: Array.isArray(formData.recursos) ? formData.recursos.map(r => ({ id_recurso: r.id_recurso })) : [],
                tipo_chamado: formData.tipo_chamado,
                ind_vinculo: formData.id_vinculo ? 'S' : 'N',
                id_vinculo: formData.id_vinculo || null,
            };

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const createdTask: Task = await response.json();
                onSave(createdTask); // Notifica o pai com a tarefa completa retornada pela API
                onClose(); // Fecha o modal em caso de sucesso
            } else {
                const errorData = await response.text();
                console.error('Erro ao criar tarefa:', errorData);
                alert(`Erro ao criar tarefa: ${errorData}`);
            }
        } catch (error) {
            console.error('Erro de rede ao criar tarefa:', error);
            alert('Erro de rede ao criar tarefa.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleContactSelect = (contact: Contact) => {
        setFormData(prev => ({
            ...prev,
            id_criado_por: contact.id, // Correção: usa contact.id em vez de contact.id_contato
            nom_criado_por: contact.nome, // Define o nome para exibição
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
                                    value={formData.nom_criado_por} // Exibe o nome
                                    onChange={handleChange}
                                    required
                                    readOnly // Deve ser somente leitura, selecionado via modal
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
                        {/* Adicionado o campo de Unidade de Negócio aqui, pois estava faltando ou duplicado */}
                        <div className="form-group">
                            <label htmlFor="nom_unid_negoc">Unidade de Negócio</label>
                            <input
                                type="text"
                                id="nom_unid_negoc"
                                name="nom_unid_negoc"
                                value={formData.nom_unid_negoc}
                                onChange={handleChange}
                                
                            />
                        </div>
                        {/* O input para id_unid_negoc (o ID numérico) não precisa ser visível,
                            ele é preenchido via handleContactSelect.
                            Se precisar de um input para id_unid_negoc, ele deve ser do tipo number
                            e ter o name="id_unid_negoc" e value={formData.id_unid_negoc}.
                            Por enquanto, assumimos que nom_unid_negoc é apenas para exibição.
                        */}
                    </div>

                    <div className="form-row">
                        {/* Este form-row foi movido para evitar duplicação e organizar melhor */}
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
                        <button type="submit" className="save-btn" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : labels.saveBtn}
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
                            resourceIds={Array.isArray(formData.recursos) ? formData.recursos.map(r => r.id_recurso) : []}
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default AddTaskModal;