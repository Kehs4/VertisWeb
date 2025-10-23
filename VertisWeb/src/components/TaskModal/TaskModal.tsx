import React, { useState, useEffect, KeyboardEvent, useMemo, lazy, Suspense, useContext } from 'react';
import './TaskModal.css';
import { Task, Comentario, Recurso } from '../../pages/Admin/Suporte/Tarefas/TarefasPage.tsx'; // Reutilizando a tipagem
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LinkIcon from '@mui/icons-material/Link';
import StarIcon from '@mui/icons-material/Star';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import { flags, flagsMap, FlagConfig } from '../TaskListView/taskFlags.ts';
import { IconButton } from '@mui/material';
import { AlertContext } from '../MainLayout.tsx';

const ResourceSearchModal = lazy(() => import('../ResourceSearchModal/ResourceSearchModal.tsx'));
const LinkedTasksModal = lazy(() => import('../LinkedTasksModal/LinkedTasksModal.tsx'));
const TaskSearchModal = lazy(() => import('../LinkedTasksModal/TaskSearchModal.tsx'));
const CommentModal = lazy(() => import('../CommentModal/CommentModal.tsx'));
const HistoryModal = lazy(() => import('../HistoryModal/HistoryModal.tsx'));


interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
    task: Task | null;
    // onSave agora espera a tarefa completa retornada pela API
    contextType?: 'support' | 'development' | 'commercial';
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, contextType = 'support' }) => {
    const showAlert = useContext(AlertContext);
    const [formData, setFormData] = useState<Task | null>(null);
    const [fetchedTaskDetails, setFetchedTaskDetails] = useState<Task | null>(null); // Novo estado para guardar os detalhes completos
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const labels = {
        task: contextType === 'development' ? 'Tarefa' : 'Chamado',
        taskDescription: contextType === 'development' ? 'Descrição da Tarefa' : 'Descrição do Chamado',
        analyst: contextType === 'development' ? 'Desenvolvedor' : 'Analista',
        saveBtn: contextType === 'development' ? 'Salvar Tarefa' : 'Salvar Alterações',
    };


    const [newComment, setNewComment] = useState('');
    const [currentCommentText, setCurrentCommentText] = useState(''); // Estado para o texto do modal
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Novo estado para controlar o modo de edição
    const [isAddingFlags, setIsAddingFlags] = useState(false); // Estado para mostrar/esconder flags disponíveis
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isLinkedTasksModalOpen, setIsLinkedTasksModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Novo estado para controlar o status de salvamento
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; comment: Comentario } | null>(null);
    const [editingComment, setEditingComment] = useState<Comentario | null>(null);
    const [isTaskSearchModalOpen, setIsTaskSearchModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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
        // Efeito para buscar os detalhes da tarefa sempre que o ID da tarefa mudar.
        // A busca só acontece se o modal estiver aberto, um ID de tarefa for fornecido,
        // E o formData ainda não estiver populado com os detalhes desta tarefa específica.
        if (isOpen && task?.id && (!formData || formData.id !== task.id)) {
            const fetchTaskDetails = async (taskId: number) => {
                setIsFetchingDetails(true);
                try {
                    const response = await fetch(`/api/task/${taskId}`);
                    if (response.ok) {
                        const detailedTask = await response.json();
                        setFormData(detailedTask); // Popula o formulário
                        setFetchedTaskDetails(detailedTask); // Guarda a versão completa
                    } else {
                        console.error("Falha ao buscar detalhes da tarefa:", response.statusText);
                        // Em caso de erro, carrega os dados básicos para não quebrar o modal
                        setFormData(task);
                        setFetchedTaskDetails(task);
                    }
                } catch (error) {
                    console.error("Erro de rede ao buscar detalhes da tarefa:", error);
                    setFormData(task);
                    setFetchedTaskDetails(task);
                } finally {
                    setIsFetchingDetails(false);
                }
            };

            fetchTaskDetails(task.id);
        } // Depende de isOpen, task.id e formData.id para controlar a busca de forma precisa.
    }, [isOpen, task?.id, formData?.id, task]);

    // Efeito para fechar o menu de contexto ao clicar em qualquer lugar da tela.
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu(null);
        };

        // Adiciona o listener quando o menu de contexto é aberto.
        if (contextMenu) {
            document.addEventListener('click', handleClickOutside);
        }

        // Função de limpeza para remover o listener quando o componente for desmontado
        // ou quando o menu for fechado, evitando vazamentos de memória.
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu]); // Este efeito depende do estado do menu de contexto.

    useEffect(() => {
        // Efeito para resetar os estados internos sempre que o modal é aberto.
        // Isso não refaz a busca de dados, apenas limpa a UI.
        if (isOpen) {
            setIsEditing(false);
            setIsAddingFlags(false);
            setIsResourceModalOpen(false);
            setIsLinkedTasksModalOpen(false);
            setIsTaskSearchModalOpen(false);
            setIsSaving(false);
            setContextMenu(null); // Fecha o menu de contexto
            setEditingComment(null); // Limpa o comentário em edição
            setIsCommentModalOpen(false);
            setIsHistoryModalOpen(false);
            setCurrentCommentText('');
        }
    }, [isOpen]); // Depende apenas do estado de abertura do modal.

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

    const openCommentModal = () => {
        setCurrentCommentText(newComment); // Transfere o texto do campo rápido para o modal
        setEditingComment(null); // Garante que estamos adicionando, não editando
        setIsCommentModalOpen(true);
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

    const handleTaskLinkSelect = async (parentTaskId: number) => {
        if (!formData?.id) return;

        setIsSaving(true); // Mostra um feedback de que algo está acontecendo
        try {
            const response = await fetch(`/api/tasks/${formData.id}/link-parent`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_tarefa_pai: parentTaskId }),
            });

            if (response.ok) {
                const updatedLink = await response.json();
                // Atualiza o estado local com o novo ID da tarefa pai
                setFormData(prev => prev ? { ...prev, id_tarefa_pai: updatedLink.id_tarefa_pai } : null);
                showAlert({ message: 'Tarefa vinculada com sucesso!', type: 'success' });
            } else {
                const errorText = await response.text();
                showAlert({ message: `Falha ao vincular tarefa: ${errorText}`, type: 'error' });
            }
        } catch (error) {
            console.error('Erro de rede ao vincular tarefa:', error);
            showAlert({ message: 'Erro de rede ao vincular tarefa.', type: 'error' });
        } finally {
            setIsSaving(false);
            setIsTaskSearchModalOpen(false); // Fecha o modal de busca
        }
    };

    const handleOpenTaskSearchModal = () => {
        if (formData?.id_tarefa_pai) {
            showAlert({ message: 'Você deve desvincular a tarefa pai atual antes de vincular uma nova.', type: 'info' });
        } else {
            setIsTaskSearchModalOpen(true);
        }
    };

    const handleUnlink = () => {
        // Atualiza o estado para remover o vínculo e fecha o modal de tarefas vinculadas
        setFormData(prev => prev ? { ...prev, id_tarefa_pai: undefined } : null);
        setIsLinkedTasksModalOpen(false);
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
                showAlert({ message: 'Falha ao adicionar comentário.', type: 'error' });
            }
        } catch (error) {
            console.error('Erro de rede ao adicionar comentário:', error);
            showAlert({ message: 'Erro de rede ao adicionar comentário.', type: 'error' });
        }
        setNewComment(''); // Limpa o campo de comentário
    };

    /**
     * Salva um novo comentário vindo do CommentModal.
     * @param commentText O texto do comentário a ser salvo.
     */
    const handleSaveFromCommentModal = async (commentText: string) => {
        if (!formData || !commentText.trim()) return;

        const payload = {
            id_incluido_por: 10, // TODO: Substituir pelo ID do usuário logado
            comentario: commentText,
        };

        try {
            const response = await fetch(`/api/tasks/${formData.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const newCommentData = await response.json();
                // Atualiza o estado local de forma otimizada, sem refazer a busca completa da tarefa
                setFormData(prev => prev ? { ...prev, comentarios: [...((prev.comentarios || []) as Comentario[]), newCommentData] } : null);
            } else {
                showAlert({ message: 'Falha ao adicionar comentário.', type: 'error' });
            }
        } catch (error) {
            console.error('Erro de rede ao adicionar comentário:', error);
            showAlert({ message: 'Erro de rede ao adicionar comentário.', type: 'error' });
        }
    };

    /**
     * Salva as alterações de um comentário existente.
     * @param updatedCommentText O novo texto do comentário.
     */
    const handleUpdateComment = async (updatedCommentText: string) => {
        if (!editingComment || !updatedCommentText.trim()) return;

        try {
            const response = await fetch(`/api/comments/${editingComment.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comentario: updatedCommentText }),
            });

            if (response.ok) {
                const updatedComment = await response.json();
                // Atualiza o comentário na lista de comentários do estado
                setFormData(prev => {
                    if (!prev) return null;
                    const updatedComments = (prev.comentarios as Comentario[]).map(c =>
                        c.id === updatedComment.id ? updatedComment : c
                    );
                    return { ...prev, comentarios: updatedComments };
                });
                showAlert({ message: 'Comentário atualizado com sucesso!', type: 'success' });
            } else {
                showAlert({ message: 'Falha ao atualizar o comentário.', type: 'error' });
            }
        } catch (error) {
            console.error('Erro de rede ao atualizar comentário:', error);
            showAlert({ message: 'Erro de rede ao atualizar comentário.', type: 'error' });
        }
        setEditingComment(null); // Limpa o estado de edição
    };

    const handleCommentKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Envia o comentário ao pressionar Enter (sem Shift)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Impede a quebra de linha padrão
            handleAddComment();
        }
    };

    /**
     * Abre o menu de contexto ao clicar com o botão direito em um comentário.
     */
    const handleContextMenu = (event: React.MouseEvent, comment: Comentario) => {
        event.preventDefault();
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            comment: comment,
        });
    };

    const handleEditCommentClick = () => {
        if (contextMenu) {
            setEditingComment(contextMenu.comment);
            setCurrentCommentText(contextMenu.comment.comentario);
            setIsCommentModalOpen(true);
        }
        setContextMenu(null);
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
        if (fetchedTaskDetails) {
            setFormData({ ...fetchedTaskDetails }); // Usa os detalhes completos que foram buscados
        }
        setIsEditing(false);
        setIsSaving(false); // Reseta o estado de salvamento
    };

    // Memoiza as listas de flags para otimização
    const selectedFlagIds = formData?.tipo_chamado || [];
    const availableFlags = useMemo(() => flags.filter(flag => !selectedFlagIds.includes(flag.id)), [selectedFlagIds]);
    const selectedFlags = useMemo(() => selectedFlagIds.map(id => flagsMap.get(id)).filter(Boolean) as FlagConfig[], [selectedFlagIds]);

    const vinculoPlaceholder = useMemo(() => {
        // Verifica se o id_tarefa_pai é nulo ou indefinido
        if (!formData?.id_tarefa_pai) {
            return 'Nenhuma tarefa pai vinculada a esta.';
        } 
        return `Tarefa ID ${formData.id_tarefa_pai} está vinculada como antecessora a execução desta.`;
    }, [formData?.id_tarefa_pai]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="modal-content edit-modal" 
                onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}
            >
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
                        {/* Mostra o ícone de vínculo apenas se id_tarefa_pai for um valor válido (não nulo ou indefinido) */}
                        {formData.id_tarefa_pai && (
                            <IconButton onClick={() => setIsLinkedTasksModalOpen(true)} title={`Ver tarefas com vínculo: ${formData.id_tarefa_pai}`} className="link-icon-button"><LinkIcon /></IconButton>
                        )}
                        {/* Botão para abrir o histórico */}
                        <IconButton onClick={() => setIsHistoryModalOpen(true)} title="Ver histórico da tarefa" className="history-icon-button"><HistoryIcon /></IconButton>

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
                                            readOnly
                                            disabled
                                        />
                                         <button type="button" className="icon-button" onClick={handleOpenTaskSearchModal} title="Pesquisar Tarefa para Vincular">
                                            <SearchIcon />
                                        </button>
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
                                        <div
                                            key={comment.id || index}
                                            className="comment-item"
                                            onContextMenu={(e) => handleContextMenu(e, comment)}
                                        >
                                            {/* Usa dangerouslySetInnerHTML para renderizar o HTML do comentário */}
                                            <div className="comment-text" dangerouslySetInnerHTML={{ __html: comment.comentario }} />
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
                            <div className='box-comment-modal'>
                                {/* Este botão agora abre o modal sofisticado */}
                                <button
                                    type='button'
                                    className="add-comment-detailed-btn"
                                    onClick={openCommentModal}
                                    title="Adicionar comentário detalhado"><AddCircleOutlineIcon /> Comentário Detalhado</button>
                            </div>
                            <div className="add-comment-section">
                                <textarea
                                    placeholder="Adicione um comentário..."
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
                    {isLinkedTasksModalOpen && formData.id_tarefa_pai && task?.id && (
                        <LinkedTasksModal
                            isOpen={isLinkedTasksModalOpen}
                            onClose={() => setIsLinkedTasksModalOpen(false)}
                            childTaskId={task.id}
                            parentTaskId={formData.id_tarefa_pai}
                            onUnlink={handleUnlink}
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
                    {isCommentModalOpen && (
                        <CommentModal
                            isOpen={isCommentModalOpen}
                            onClose={() => setIsCommentModalOpen(false)}
                            initialComment={editingComment ? editingComment.comentario : currentCommentText}
                            onSave={editingComment ? handleUpdateComment : handleSaveFromCommentModal}
                            title={editingComment ? 'Editar Comentário' : 'Adicionar Comentário'}
                        />
                    )}
                    {isHistoryModalOpen && task?.id && (
                        <HistoryModal
                            isOpen={isHistoryModalOpen}
                            onClose={() => setIsHistoryModalOpen(false)}
                            taskId={task.id}
                        />
                    )}
                </Suspense>
                {/* Renderiza o menu de contexto quando o estado `contextMenu` não for nulo */}
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onEdit={handleEditCommentClick}
                        onRemove={() => {
                            console.log('Excluir clicado para o comentário:', contextMenu.comment.id);
                            setContextMenu(null); // Fecha o menu por enquanto
                        }}
                    />
                )}
                </>
                ) : null}
            </div>
        </div>
    );
};

const ContextMenu: React.FC<{ x: number; y: number; onEdit: () => void; onRemove: () => void; }> = ({ x, y, onEdit, onRemove }) => {
    return (
        <div className="context-menu" style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()}>
            <div className="context-menu-item" onClick={onEdit}>Visualizar</div>
            <div className="context-menu-item remove" onClick={onRemove}>Excluir</div>
        </div>
    );
};

export default TaskModal;