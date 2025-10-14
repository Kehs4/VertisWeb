import React, { useState, useEffect, KeyboardEvent } from 'react';
import './EditTaskModal.css';
import { Task, Comentario } from '../../pages/Suporte/Tarefas/TarefasPage'; // Reutilizando a tipagem
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhoneIcon from '@mui/icons-material/Phone';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
    task: Task | null;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onSave, task }) => {
    const [formData, setFormData] = useState<Task | null>(null);
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false); // Novo estado para controlar o modo de edição

    // Estados para adicionar novo contato
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');

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
        // Carrega os dados da tarefa no formulário quando o modal é aberto
        if (task) {
            setFormData({ ...task });
        }
        setIsEditing(false); // Reseta para o modo de visualização sempre que o modal/task muda
    }, [task, isOpen]);

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
                recursos: [{ ...formData.recursos[0], nom_recurso: value }]
            });
        } else {
            setFormData({
                ...formData,
                [name]: name === 'ind_prioridade' || name === 'qtd_pontos' ? parseInt(value, 10) : value,
            });
        }
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
            comentarios: [...(formData.comentarios || []), comment],
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

    const handleAddContact = () => {
        if (!formData || !newContactName.trim()) return;

        const newContact = {
            id_contato: Date.now(), // ID temporário
            nom_recurso: newContactName,
            telefone: newContactPhone,
        };

        setFormData({
            ...formData,
            contatos: [...(formData.contatos || []), newContact],
        });

        // Limpa os campos e esconde o formulário
        setNewContactName('');
        setNewContactPhone('');
        setShowAddContact(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            onSave(formData);
        }
    };

    const handleCancelEdit = () => {
        // Restaura os dados originais da tarefa e volta para o modo de visualização
        if (task) {
            setFormData({ ...task });
        }
        setIsEditing(false);
    };
    if (!isOpen || !formData) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Chamado #{task?.id} - {task?.criado_por} / {task?.nom_unid_oper} / {task?.dth_inclusao}</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-columns">
                        {/* Coluna da Esquerda: Formulário de Edição */}
                        <div className="form-column-main">
                            <div className="form-group">
                                <label htmlFor="titulo_tarefa">Descrição do Chamado</label>
                                <textarea id="titulo_tarefa" name="titulo_tarefa" value={formData.titulo_tarefa} onChange={handleChange} required rows={3} readOnly={!isEditing} style={{resize : 'none'}} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="criado_por">Usuário Solicitante</label>
                                    <input type="text" id="criado_por" name="criado_por" value={formData.criado_por} onChange={handleChange} required readOnly={!isEditing} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="nom_unid_oper">Unidade Operacional</label>
                                    <input type="text" id="nom_unid_oper" name="nom_unid_oper" value={formData.nom_unid_oper} onChange={handleChange} required readOnly={!isEditing} />
                                </div>
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
                                    <label htmlFor='nom_recurso'>Analista</label>
                                    <input type="text" id="nom_recurso" name="nom_recurso" value={formData.recursos[0]?.nom_recurso || ''} onChange={handleChange} required readOnly={!isEditing} />
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
                                    <label htmlFor="qtd_pontos">Pontos</label>
                                    <input type="number" id="qtd_pontos" name="qtd_pontos" value={formData.qtd_pontos} onChange={handleChange} min="0" readOnly={!isEditing} />
                                </div>
                            </div>

                            {/* Seção de Contatos movida para a coluna principal */}
                            <div className="form-section">
                                <div className="section-header">
                                    <h4>Contatos</h4>
                                    {isEditing && (
                                        <button type="button" className="add-icon-btn" onClick={() => setShowAddContact(!showAddContact)} title="Adicionar Contato">
                                            <AddCircleOutlineIcon />
                                        </button>
                                    )}
                                </div>
                                <div className="contacts-list">
                                    {showAddContact && isEditing && (
                                        <div className="add-contact-form">
                                            <div className="contact-input-group">
                                                <PersonAddIcon />
                                                <input type="text" placeholder="Nome do contato" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} />
                                            </div>
                                            <div className="contact-input-group">
                                                <PhoneIcon />
                                                <input type="text" placeholder="Telefone" value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} />
                                            </div>
                                            <button type="button" className="save-contact-btn" onClick={handleAddContact}>Salvar</button>
                                        </div>
                                    )}
                                    {formData.contatos && formData.contatos.length > 0 ? (
                                        formData.contatos.map((contact) => (
                                            <div key={contact.id_contato} className="contact-item">
                                                <span className="contact-name">{contact.nom_recurso}</span>
                                                <span className="contact-phone">{contact.telefone}</span>
                                            </div>
                                        ))
                                    ) : (
                                        !showAddContact && <p className="no-comments">Nenhum contato associado.</p>
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
                                {formData.comentarios && formData.comentarios.length > 0 ? (
                                    formData.comentarios.map((comment, index) => (
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
                        <button type="submit" className="save-btn" hidden={!isEditing}>Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTaskModal;