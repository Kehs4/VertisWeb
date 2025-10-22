import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import './CommentModal.css';

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialComment: string;
    onSave: (commentText: string) => void;
    title: string;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, initialComment, onSave, title }) => {
    const [commentText, setCommentText] = useState(initialComment);

    useEffect(() => {
        setCommentText(initialComment);
    }, [initialComment]);

    const handleSave = () => {
        onSave(commentText);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content comment-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>
                <div className="modal-body">
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Digite seu comentário aqui..."
                        rows={15}
                        className="comment-textarea-large"
                    />
                </div>
                <div className="modal-footer">
                    <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
                    <button type="button" className="save-btn" onClick={handleSave}><SendIcon /> Salvar Comentário</button>
                </div>
            </div>
        </div>
    );
};

export default CommentModal;