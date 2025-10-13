import React, { useState, useEffect } from 'react';
import './EditTaskModal.css';
import { Task, Comentario } from '../../pages/Suporte/Tarefas/TarefasPage'; // Reutilizando a tipagem
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
    task: Task | null;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onSave, task }) => {
    const [formData, setFormData] = useState<Task | null>(null);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        // Carrega os dados da tarefa no formulário quando o modal é aberto
        if (task) {
            setFormData({ ...task });
        }
    }, [task]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!formData) return;
        const { name, value } = e.target;

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            onSave(formData);
        }
    };

    if (!isOpen || !formData) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Editar Chamado #{task?.id}</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-columns">
                        {/* Coluna da Esquerda: Formulário de Edição */}
                        <div className="form-column-main">
                            <div className="form-group">
                                <label htmlFor="titulo_tarefa">Descrição do Chamado</label>
                                <textarea id="titulo_tarefa" name="titulo_tarefa" value={formData.titulo_tarefa} onChange={handleChange} required rows={3} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="criado_por">Usuário Solicitante</label>
                                    <input type="text" id="criado_por" name="criado_por" value={formData.criado_por} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="nom_unid_oper">Unidade Operacional</label>
                                    <input type="text" id="nom_unid_oper" name="nom_unid_oper" value={formData.nom_unid_oper} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="ind_prioridade">Prioridade</label>
                                    <select id="ind_prioridade" name="ind_prioridade" value={formData.ind_prioridade} onChange={handleChange}>
                                        <option value={1}>Baixa</option>
                                        <option value={2}>Média</option>
                                        <option value={3}>Alta</option>
                                        <option value={4}>Urgente</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor='nom_recurso'>Analista</label>
                                    <input type="text" id="nom_recurso" name="nom_recurso" value={formData.recursos[0]?.nom_recurso || ''} onChange={handleChange} required />
                                </div>
                            </div>
                             <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="dth_prev_entrega">Previsão de Entrega</label>
                                    <input type="date" id="dth_prev_entrega" name="dth_prev_entrega" value={formData.dth_prev_entrega?.split('T')[0] || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="qtd_pontos">Pontos</label>
                                    <input type="number" id="qtd_pontos" name="qtd_pontos" value={formData.qtd_pontos} onChange={handleChange} min="0" />
                                </div>
                            </div>
                        </div>

                        {/* Coluna da Direita: Comentários */}
                        <div className="form-column-comments">
                            <h4>Comentários</h4>
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
                                    rows={2}
                                />
                                <button type="button" onClick={handleAddComment} title="Adicionar comentário">
                                    <SendIcon />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="save-btn">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTaskModal;