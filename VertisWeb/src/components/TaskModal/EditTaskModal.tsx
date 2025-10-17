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
    const [linkedTasksCount, setLinkedTasksCount] = useState(0);
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
        if (isOpen && task) {
            setFormData(task);
        }
        setIsEditing(false); // Reseta para o modo de visualização sempre que o modal/task muda
        setIsAddingFlags(false); // Esconde a lista de flags disponíveis
        setIsResourceModalOpen(false);
        setIsLinkedTasksModalOpen(false);
        setIsTaskSearchModalOpen(false);
        setIsSaving(false); // Reseta o estado de salvamento
    }, [isOpen, task]);

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
        setFormData(prev => prev ? { ...prev, ind_vinculo: 'S', id_vinculo: taskId } : null);
        setIsTaskSearchModalOpen(false);
    };

    const handleAddComment = () => {
        if (!formData || !newComment.trim()) return;

        const comment: Comentario = {
            id_recurso: 99, // ID do usuário logado (exemplo)
            nom_recurso: localStorage.getItem('userName') || 'Usuário', // Nome do usuário logado
            comentario: newComment,
            dth_inclusao: new Date().toISOString(),
        };

        setFormData({
            ...formData,
            // Garante que `comentarios` seja sempre um array antes de adicionar o novo comentário
            comentarios: [...(Array.isArray(formData.comentarios) ? formData.comentarios : []), comment],
        });
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
        if (formData?.ind_vinculo !== 'S' || !formData.id_vinculo) {
            return "Nenhuma tarefa vinculada.";
        }
        // A contagem inclui a própria tarefa, então ajustamos se necessário.
        return `Existe ${linkedTasksCount} tarefa(s) vinculada(s) a esta.`;
    }, [formData?.ind_vinculo, formData?.id_vinculo, linkedTasksCount]);

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
                        {formData.ind_vinculo === 'S' && formData.id_vinculo && (
                            <IconButton onClick={() => setIsLinkedTasksModalOpen(true)} title={`Ver tarefas com vínculo: ${formData.id_vinculo}`} className="link-icon-button"><LinkIcon /></IconButton>
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
                                        type="text" id="dth_encerramento" name="dth_encerramento"
                                        value={formData.dth_encerramento ? new Date(formData.dth_encerramento).toLocaleString('pt-BR') : ''}
                                        readOnly style={{ cursor: 'default', backgroundColor: '#f1f3f5' }} />
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
                                <label htmlFor="ind_vinculo">Vínculo</label>
                                <div className="input-with-button">
                                    <input
                                        type="text"
                                        id="ind_vinculo"
                                        name="id_vinculo"
                                        value={formData.id_vinculo || ''}
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
                    {isLinkedTasksModalOpen && formData.id_vinculo && (
                        <LinkedTasksModal
                            isOpen={isLinkedTasksModalOpen}
                            onClose={() => setIsLinkedTasksModalOpen(false)}
                            vinculoId={formData.id_vinculo}
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