import React, { useState, useEffect, lazy, Suspense, useMemo, useContext } from 'react';
import './AddTaskModal.css';
import { Recurso, Task } from '../../pages/Admin/Suporte/Tarefas/TarefasPage'; // Reutilizando a tipagem
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Contact } from '../TaskSearchModal/ContactSearchModal.tsx';
import { AlertContext } from '../MainLayout.tsx';
import { flags, flagsMap, FlagConfig } from '../TaskListView/taskFlags.ts';
const ContactSearchModal = lazy(() => import('../TaskSearchModal/ContactSearchModal.tsx'));
const OperationalUnitSearchModal = lazy(() => import('../TaskSearchModal/OperationalUnitSearchModal.tsx'));
const ResourceSearchModal = lazy(() => import('../ResourceSearchModal/ResourceSearchModal'));
const TaskSearchModal = lazy(() => import('../LinkedTasksModal/TaskSearchModal'));

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
    id_tarefa_pai: undefined,
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
    tarefa_avaliacao: undefined,
    dth_exclusao: undefined,
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({ title, isOpen, onClose, onSave, contextType = 'support' }) => {
    const labels = {
        taskDescription: contextType === 'development' ? 'Descrição da Tarefa' : 'Descrição do Chamado',
        analyst: contextType === 'development' ? 'Desenvolvedor' : 'Analista',
        saveBtn: contextType === 'development' ? 'Salvar Tarefa' : 'Salvar Chamado',
    };

    const showAlert = useContext(AlertContext);

    const [formData, setFormData] = useState(initialFormState);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isAddingFlags, setIsAddingFlags] = useState(false); // Estado para mostrar/esconder flags disponíveis
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isTaskSearchModalOpen, setIsTaskSearchModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Novo estado para controlar o status de salvamento

    useEffect(() => {
        // Reset form when modal is opened
        if (isOpen) {
            const today = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
            setFormData({
                ...initialFormState,
                dth_prev_entrega: today, // Preenche a previsão de entrega com a data atual
            });
            setIsAddingFlags(false); // Garante que a lista de flags esteja fechada
            setIsResourceModalOpen(false);
            setIsUnitModalOpen(false);
            setIsTaskSearchModalOpen(false);
            setIsSaving(false); // Reseta o estado de salvamento
        }
    }, [isOpen]);


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

    const handleContactButtonClick = () => {
        console.log('handleContactButtonClick chamado, id_unid_oper:', formData.id_unid_oper);
        if (!formData.id_unid_oper || formData.id_unid_oper === 0) {
            showAlert({ message: 'Selecione uma Unidade Operacional antes de buscar o solicitante.', type: 'info' });
            return;
        }
        setIsContactModalOpen(true);
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

         // Validação básica
         if (!formData.titulo_tarefa || !formData.id_criado_por || !formData.id_unid_negoc || !formData.id_unid_oper) {
             showAlert({ message: 'Preencha os campos obrigatórios (Título, Solicitante e Unidade).', type: 'warning' });
             return;
         };

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
                id_tarefa_pai: formData.id_tarefa_pai || null,
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
                showAlert({ message: `Erro ao criar tarefa: ${errorData}`, type: 'error' });
            }
        } catch (error) {
            console.error('Erro de rede ao criar tarefa:', error);
            showAlert({ message: 'Erro de rede ao criar tarefa.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleContactSelect = (contact: Contact) => {
        setFormData(prev => ({
            ...prev,
            id_criado_por: contact.id as number,
            nom_criado_por: contact.nome,
            nom_unid_oper: contact.nom_unid_oper,
            id_unid_oper: contact.id_unid_oper,
            nom_unid_negoc: contact.nom_unid_negoc,
            id_unid_negoc: contact.id_unid_negoc,
        }));
        setIsContactModalOpen(false);
    };

    const handleUnitSelect = (unit: { id: number; nom_unid_oper: string; nom_unid_negoc: string; }) => {
        setFormData(prev => ({
            ...prev,
            id_unid_oper: unit.id,
            nom_unid_oper: unit.nom_unid_oper,
            // Opcional: Atualizar a unidade de negócio se vier junto
            nom_unid_negoc: unit.nom_unid_negoc || prev.nom_unid_negoc,
        }));
        setIsUnitModalOpen(false);
    };
    const handleTaskLinkSelect = (taskId: number) => {
        setFormData(prev => ({ ...prev, id_tarefa_pai: taskId }));
        setIsTaskSearchModalOpen(false);
    };

    // Memoiza as listas de flags para otimização
    const selectedFlagIds = formData.tipo_chamado || [];
    const availableFlags = useMemo(() => flags.filter(flag => !selectedFlagIds.includes(flag.id)), [selectedFlagIds]);
    const selectedFlags = useMemo(() => selectedFlagIds.map(id => flagsMap.get(id)).filter(Boolean) as FlagConfig[], [selectedFlagIds]);

    const vinculoPlaceholder = useMemo(() => {
        if (formData.id_tarefa_pai) {
            return `Vinculada à tarefa pai ID: ${formData.id_tarefa_pai}`;
        }
        return "Nenhuma tarefa pai vinculada.";
    }, [formData.id_tarefa_pai]);

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
                    <div className="form-row">
                        {contextType === 'support' && (
                            <div className="form-group">
                                <label htmlFor="nom_unid_oper">Unidade Operacional</label>
                                <div className="input-with-button">
                                <input
                                    type="text"
                                    id="nom_unid_oper"
                                    name="nom_unid_oper"
                                    value={formData.nom_unid_oper}
                                    onChange={handleChange}
                                    placeholder="Selecione uma unidade..."
                                    readOnly
                                />
                                <button type="button" className="icon-button" onClick={() => setIsUnitModalOpen(true)} title="Pesquisar Unidade Operacional">
                                    <SearchIcon />
                                </button>
                                </div>
                            </div>
                        )}

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
                                    readOnly
                                    disabled={!formData.id_unid_oper} // Desabilita se não houver unidade
                                />
                                <button type="button" className="icon-button" onClick={handleContactButtonClick} title="Pesquisar Contato">
                                    <SearchIcon />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="titulo_tarefa">{labels.taskDescription}</label>
                        <textarea
                            id="titulo_tarefa"
                            name="titulo_tarefa"
                            value={formData.titulo_tarefa}
                            onChange={handleChange}
                            style={{ resize: 'none' }}
                            required
                            rows={3}
                        />
                    </div>



                    <div className="form-row">
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
                        <div className="form-group">
                            <label htmlFor='nom_recurso'>{labels.analyst}</label>
                            <div className="resource-pills-container">
                                {Array.isArray(formData.recursos) && formData.recursos.map(resource => (
                                    <div key={resource.id_recurso} className="resource-pill">
                                        {resource.nom_recurso}
                                        <button type="button" onClick={() => {
                                            handleResourceConfirm((Array.isArray(formData.recursos) ? formData.recursos : []).filter(r => r.id_recurso !== resource.id_recurso))
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
                            <label htmlFor="id_tarefa_pai">Vínculo</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    id="id_tarefa_pai"
                                    name="id_tarefa_pai"
                                    value={formData.id_tarefa_pai || ''}
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
                            onSelect={handleContactSelect}
                            id_unid_oper={formData.id_unid_oper} />
                    )}
                    {isUnitModalOpen && (
                        <OperationalUnitSearchModal
                            isOpen={isUnitModalOpen}
                            onClose={() => setIsUnitModalOpen(false)}
                            onSelect={handleUnitSelect} />
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
