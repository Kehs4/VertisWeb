import React, { useState, useEffect, KeyboardEvent, useMemo, lazy, Suspense } from 'react';
import './EditTaskModal.css';
import { Task, Comentario, Recurso } from '../../pages/Admin/Suporte/Tarefas/TarefasPage'; // Reutilizando a tipagem
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LinkIcon from '@mui/icons-material/Link';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import { flags, flagsMap, FlagConfig } from '../TaskListView/taskFlags';
import { IconButton } from '@mui/material';

const ResourceSearchModal = lazy(() => import('../ResourceSearchModal/ResourceSearchModal'));
const LinkedTasksModal = lazy(() => import('../LinkedTasksModal/LinkedTasksModal'));
const TaskSearchModal = lazy(() => import('../LinkedTasksModal/TaskSearchModal.tsx'));

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
    task: Task | null;
    // onSave agora espera a tarefa completa retornada pela API
    contextType?: 'support' | 'development' | 'commercial';
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onSave, task, contextType = 'support' }) => {
    const [formData, setFormData] = useState<Task | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const labels = {
        task: contextType === 'development' ? 'Tarefa' : 'Chamado',
        taskDescription: contextType === 'development' ? 'Descrição da Tarefa' : 'Descrição do Chamado',
        analyst: contextType === 'development' ? 'Desenvolvedor' : 'Analista',
        saveBtn: contextType === 'development' ? 'Salvar Tarefa' : 'Salvar Alterações',
    };


    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false); // Novo estado para controlar o modo de edição
    const [isAddingFlags, setIsAddingFlags] = useState(false); // Estado para mostrar/esconder flags disponíveis
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isLinkedTasksModalOpen, setIsLinkedTasksModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Novo estado para controlar o status de salvamento
    const [isTaskSearchModalOpen, setIsTaskSearchModalOpen] = useState(false);

    // Mapeamento de status para ser usado no select e na lógica
    const statusOptions: { [key: string]: string } = {
        'AB': 'Aberto',
        'ER': 'Em resolução',
        'AG': 'Aguardando',
        'AT': 'Em atraso',
        'FN': 'Finalizado',
        'CA': 'Cancelado',
    };

    useEffect(() => {
        // Quando o modal abrir, define o estado do formulário com os dados da tarefa recebida.
        // Também reseta os outros estados do modal.
        if (isOpen && task?.id) {
            const fetchTaskDetails = async () => {
                setIsFetchingDetails(true);
                try {
                    const response = await fetch(`/api/task/${task.id}`);
                    if (response.ok) {
                        const detailedTask = await response.json();
                        setFormData(detailedTask);
                    } else {
                        console.error("Falha ao buscar detalhes da tarefa:", response.statusText);
                        // Em caso de erro, carrega os dados básicos para não quebrar o modal
                        setFormData(task);
                    }
                } catch (error) {
                    console.error("Erro de rede ao buscar detalhes da tarefa:", error);
                    setFormData(task);
                } finally {
                    setIsFetchingDetails(false);
                }
            };

            fetchTaskDetails();
        }

        setIsEditing(false); // Reseta para o modo de visualização sempre que o modal/task muda
        setIsAddingFlags(false); // Esconde a lista de flags disponíveis
        setIsResourceModalOpen(false);
        setIsLinkedTasksModalOpen(false);
        setIsTaskSearchModalOpen(false);
        setIsSaving(false); // Reseta o estado de salvamento
    }, [isOpen, task?.id]); // Depende do ID da tarefa para evitar re-execuções desnecessárias

    // Função auxiliar para formatar a data para o input datetime-local.
    // É necessária para converter o formato ISO (com fuso horário) para o formato local esperado pelo input.
    const formatToDateTimeLocal = (isoString: string | undefined) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            // Ajusta para o fuso horário local e formata para 'YYYY-MM-DDTHH:mm'
            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
            return localDate.toISOString().slice(0, 16);
        } catch (e) {
            return '';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!formData) return;
        const { name, value } = e.target;

        if (name === 'ind_sit_tarefa') {
            const newStatus = value;
            const wasFinished = formData.ind_sit_tarefa === 'FN';
            const isNowFinished = newStatus === 'FN';

            setFormData({
                ...formData,
                ind_sit_tarefa: newStatus,
                sit_tarefa: statusOptions[newStatus] || formData.sit_tarefa,
                // Define a data de encerramento se o status for 'Finalizado', ou limpa se for revertido
                dth_encerramento: isNowFinished ? new Date().toISOString() : (wasFinished ? '' : formData.dth_encerramento),
            });
        } else if (name === 'dth_encerramento') {
            // Converte o valor do input 'datetime-local' de volta para o formato ISO string
            setFormData({
                ...formData,
                dth_encerramento: value ? new Date(value).toISOString() : '',
            });
        } else

        if (name === 'nom_recurso') {
            setFormData({
                ...formData,
                recursos: Array.isArray(formData.recursos) && formData.recursos.length > 0
                    ? [{ ...formData.recursos[0], nom_recurso: value }]
                    : [{ id_recurso: 0, nom_recurso: value }]
            });
        } else {
            setFormData({
                ...formData,
                [name]: ['ind_prioridade', 'qtd_pontos', 'tarefa_avaliacao'].includes(name)
                    ? parseInt(value, 10) || 0 // Converte para número, com fallback para 0
                    : value,
            });
        }
    };

    const handleFlagClick = (flagId: string) => {
        if (!isEditing || !formData) return; // Permite clicar apenas em modo de edição
        setFormData(prev => {
            if (!prev) return null;
            const currentFlags = prev.tipo_chamado || [];
            const newFlags = currentFlags.includes(flagId)
                ? currentFlags.filter(f => f !== flagId) // Deseleciona
                : [...currentFlags, flagId]; // Seleciona
            return { ...prev, tipo_chamado: newFlags };
        });
    };

    const handleResourceConfirm = (newResources: Recurso[]) => {
        if (!isEditing || !formData) return;
        setFormData(prev => {
            if (!prev) return null;
            return { ...prev, recursos: newResources };
        });
    };

    const handleTaskLinkSelect = (taskId: number) => {
        if (!isEditing || !formData) return;
        setFormData(prev => prev ? { ...prev, id_tarefa_pai: taskId } : null);
        setIsTaskSearchModalOpen(false);
    };

    const handleAddComment = async () => {
        if (!formData || !newComment.trim()) return;

        // TODO: Substituir '10' pelo ID real do usuário logado
        const payload = {
            id_incluido_por: 10, 
            comentario: newComment,
        };

        try {
            const response = await fetch(`/api/tasks/${formData.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Após adicionar o comentário com sucesso, busca novamente os detalhes completos da tarefa
                // para garantir que a lista de comentários seja atualizada.
                const taskDetailsResponse = await fetch(`/api/task/${formData.id}`);
                if (taskDetailsResponse.ok) {
                    const updatedTask = await taskDetailsResponse.json();
                    // Atualiza o estado local do modal para exibir o novo comentário imediatamente
                    setFormData(updatedTask);
                } else {
                    // Se a busca falhar, pelo menos o comentário não será perdido na próxima atualização
                    console.error("Falha ao buscar detalhes da tarefa após adicionar comentário.");
                }
            } else {
                alert('Falha ao adicionar comentário.');
            }
        } catch (error) {
            console.error('Erro de rede ao adicionar comentário:', error);
        }
        setNewComment(''); // Limpa o campo de comentário
    };

    const handleCommentKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Envia o comentário ao pressionar Enter (sem Shift)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Impede a quebra de linha padrão
            handleAddComment();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData || !task || isSaving) return;

        // Agora, em vez de fazer o fetch aqui, apenas chamamos a função onSave
        // que foi passada pelo componente pai (TaskListView), que por sua vez
        // chama a função updateTask do hook useTasks.
        // A lógica de salvamento e API fica centralizada no hook.
        onSave(formData);
        // O fechamento do modal e o controle de 'isSaving' serão gerenciados
        // pela função que recebe o onSave.
    };

    const handleCancelEdit = () => {
        // Restaura os dados originais da tarefa e volta para o modo de visualização
        if (task) {
            setFormData({ ...task });
        }
        setIsEditing(false);
        setIsSaving(false); // Reseta o estado de salvamento
    };

    // Memoiza as listas de flags para otimização
    const selectedFlagIds = formData?.tipo_chamado || [];
    const availableFlags = useMemo(() => flags.filter(flag => !selectedFlagIds.includes(flag.id)), [selectedFlagIds]);
    const selectedFlags = useMemo(() => selectedFlagIds.map(id => flagsMap.get(id)).filter(Boolean) as FlagConfig[], [selectedFlagIds]);

    const vinculoPlaceholder = useMemo(() => {
        if (formData?.id_tarefa_pai === null) {
            return 'Nenhuma tarefa pai vinculada a esta.';
        }
        else {
        // A contagem inclui a própria tarefa, então ajustamos se necessário.
        return `Tarefa ID ${formData?.id_tarefa_pai} está vinculada como antecessora a execução desta.`;
        };
    }, [formData?.id_tarefa_pai]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
                {isFetchingDetails ? (
                    <div className="modal-loading-state">
                        <div className="loading-spinner-modal"></div>
                        <p>Carregando detalhes...</p>
                    </div>
                ) : formData ? (
                <>
                <div className="modal-header">
                    <div className="modal-title-group">
                        <h2>Detalhes da Tarefa #{task?.id}</h2>
                        {formData.id_tarefa_pai !== null && (
                            <IconButton onClick={() => setIsLinkedTasksModalOpen(true)} title={`Ver tarefas com vínculo: ${formData.id_tarefa_pai}`} className="link-icon-button"><LinkIcon /></IconButton>
                        )}
                    </div>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-columns">
                        {/* Coluna da Esquerda: Formulário de Edição */}
                        <div className="form-column-main">
                            <div className="form-group">
                                <label htmlFor="titulo_tarefa">{labels.taskDescription}</label>
                                <textarea id="titulo_tarefa" name="titulo_tarefa" value={formData.titulo_tarefa} onChange={handleChange} required rows={6} readOnly={!isEditing} style={{resize : 'none'}} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="criado_por">Usuário Solicitante</label>
                                    <input type="text" id="nom_criado_por" name="nom_criado_por" value={formData.nom_criado_por} onChange={handleChange} required readOnly /> {/* Sempre readOnly */}
                                </div>
                                {contextType === 'support' && (
                                    <>
                                        <div className='form-group'>
                                            <label htmlFor="nom_unid_negoc">Unidade de Negócio</label>
                                            <input type="text" id="nom_unid_negoc" name="nom_unid_negoc" value={formData.nom_unid_negoc} onChange={handleChange} required readOnly /> {/* Sempre readOnly */}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="nom_unid_oper">Unidade Operacional</label>
                                            <input type="text" id="nom_unid_oper" name="nom_unid_oper" value={formData.nom_unid_oper} onChange={handleChange} required readOnly /> {/* Sempre readOnly */}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="ind_prioridade">Prioridade</label>
                                    <select id="ind_prioridade" name="ind_prioridade" value={formData.ind_prioridade} onChange={handleChange} disabled={!isEditing}>
                                        <option value={1}>Baixa</option>
                                        <option value={2}>Média</option>
                                        <option value={3}>Alta</option>
                                        <option value={4}>Urgente</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="ind_sit_tarefa">Status</label>
                                    <select id="ind_sit_tarefa" name="ind_sit_tarefa" value={formData.ind_sit_tarefa} onChange={handleChange} disabled={!isEditing}>
                                        {Object.entries(statusOptions).map(([code, label]) => (
                                            <option key={code} value={code}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor='nom_recurso'>{labels.analyst}</label>
                                    <div className="resource-pills-container">
                                        {Array.isArray(formData.recursos) && formData.recursos.map(resource => (
                                            <div key={resource.id_recurso} className="resource-pill">
                                                {resource.nom_recurso}
                                                {isEditing && <button type="button" onClick={() => {
                                                    handleResourceConfirm((Array.isArray(formData.recursos) ? formData.recursos : []).filter(r => r.id_recurso !== resource.id_recurso))
                                                }}>&times;</button>}
                                            </div>
                                        ))}
                                        {isEditing &&
                                            <button type="button" className="add-resource-btn" onClick={() => setIsResourceModalOpen(true)}>
                                                <AddCircleOutlineIcon />
                                            </button>
                                        }
                                    </div>
                                </div>
                            </div>
                             <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="dth_prev_entrega">Previsão de Entrega</label>
                                    <input type="date" id="dth_prev_entrega" name="dth_prev_entrega" value={formData.dth_prev_entrega?.split('T')[0] || ''} onChange={handleChange} readOnly={!isEditing} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="dth_encerramento">Data de Encerramento</label>
                                    <input 
                                        type="datetime-local" 
                                        id="dth_encerramento" 
                                        name="dth_encerramento"
                                        value={formatToDateTimeLocal(formData.dth_encerramento)}
                                        onChange={handleChange}
                                        readOnly={!isEditing} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="tarefa_avaliacao">Avaliação</label>
                                    <div className="satisfaction-input-group">
                                        <StarIcon />
                                        <input
                                            type="number" id="tarefa_avaliacao" name="tarefa_avaliacao"
                                            value={formData.tarefa_avaliacao || ''} onChange={handleChange}
                                            min="0" max="10"
                                            readOnly={!isEditing || formData.ind_sit_tarefa !== 'FN'}
                                            placeholder="0-10" />
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
                                            onChange={handleChange}
                                            placeholder={vinculoPlaceholder}
                                            readOnly={!isEditing}
                                        />
                                        {isEditing && <button type="button" className="icon-button" onClick={() => setIsTaskSearchModalOpen(true)} title="Pesquisar Tarefa para Vincular">
                                            <SearchIcon />
                                        </button>}
                                    </div>
                                </div>

                            <div className="form-group">
                                <label htmlFor="tipo_chamado">Flags</label>
                                <div className={`flag-section-container ${!isEditing ? 'disabled' : ''}`}>
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

                                        {isEditing && (
                                            <button type="button" className="add-flag-button" onClick={() => setIsAddingFlags(!isAddingFlags)} title="Adicionar Flag">
                                                <AddCircleOutlineIcon />
                                            </button>
                                        )}
                                    </div>

                                    {/* Flags Disponíveis (condicional) */}
                                    {isEditing && isAddingFlags && (
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
                        </div>

                        {/* Coluna da Direita: Comentários */}
                        <div className="form-column-comments">
                            {/* Seção de Comentários */}
                            <div className="section-header">
                                <h4>Comentários</h4>
                            </div>
                            <div className="comments-list">
                                {Array.isArray(formData.comentarios) && formData.comentarios.length > 0 ? (
                                    (formData.comentarios as Comentario[]).map((comment, index) => (
                                        <div key={index} className="comment-item">
                                            <p className="comment-text">{comment.comentario}</p>
                                            <div className="comment-footer">
                                                <span className="comment-author">{comment.nom_recurso}</span>
                                                <span className="comment-date">{new Date(comment.dth_inclusao).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-comments">Nenhum comentário ainda.</p>
                                )}
                            </div>
                            <div className="add-comment-section">
                                <textarea
                                    placeholder="Adicionar um comentário..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={handleCommentKeyDown}
                                    rows={2}
                                />
                                <button type="button" onClick={handleAddComment} title="Adicionar comentário">
                                    <SendIcon />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        {/* O botão de fechar/cancelar principal fica sempre visível */}
                        <button type="button" className="cancel-btn" onClick={isEditing ? handleCancelEdit : onClose}>
                            {isEditing ? 'Cancelar' : 'Fechar'}
                        </button>

                        {/* Botões de Ação Condicionais */}
                        <button type="button" className="edit-btn" onClick={() => setIsEditing(true)} hidden={isEditing}>Editar</button> 
                        <button type="submit" className="save-btn" hidden={!isEditing} disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
                <Suspense fallback={<div>Carregando...</div>}>
                    {isResourceModalOpen && (
                        <ResourceSearchModal
                            isOpen={isResourceModalOpen}
                            onClose={() => setIsResourceModalOpen(false)}
                            onConfirm={handleResourceConfirm}
                            initialSelectedResources={Array.isArray(formData?.recursos) ? formData.recursos : []}
                        />
                    )}
                    {isLinkedTasksModalOpen && formData.id_tarefa_pai && (
                        <LinkedTasksModal
                            isOpen={isLinkedTasksModalOpen}
                            onClose={() => setIsLinkedTasksModalOpen(false)}
                            vinculoId={formData.id_tarefa_pai}
                        />
                    )}
                    {isTaskSearchModalOpen && (
                        <TaskSearchModal
                            isOpen={isTaskSearchModalOpen}
                            onClose={() => setIsTaskSearchModalOpen(false)}
                            onSelectTask={handleTaskLinkSelect}
                            resourceIds={Array.isArray(formData?.recursos) ? formData.recursos.map(r => r.id_recurso) : []}
                        />
                    )}
                </Suspense>
                </>
                ) : null}
            </div>
        </div>
    );
};

export default EditTaskModal;