import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';

// Ícones para a barra de ferramentas do editor
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import TitleIcon from '@mui/icons-material/Title';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';

import './CommentModal.css';

// Componente para a barra de ferramentas do editor
const MenuBar: React.FC<{ editor: Editor | null; forceUpdate: number }> = ({ editor }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="editor-toolbar">
            {/* Botões de formatação de texto */}
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Negrito" >
                <FormatBoldIcon style={{ color: editor.isActive('bold') ? 'rgb(255, 102, 0)' : '#888' }} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Itálico" >
                <FormatItalicIcon style={{ color: editor.isActive('italic') ? 'rgb(255, 102, 0)' : '#888' }} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Tachado">
                <FormatStrikethroughIcon style={{ color: editor.isActive('strike') ? 'rgb(255, 102, 0)' : '#888' }} />
            </button>
            <div className="divider"></div>
            {/* Botões de formatação de parágrafo */}
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Título" >
                <TitleIcon style={{ color: editor.isActive('heading', { level: 2 }) ? 'rgb(255, 102, 0)' : '#888' }} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Lista com marcadores" >
                <FormatListBulletedIcon style={{ color: editor.isActive('bulletList') ? 'rgb(255, 102, 0)' : '#888' }} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Lista numerada" >
                <FormatListNumberedIcon style={{ color: editor.isActive('orderedList') ? 'rgb(255, 102, 0)' : '#888' }} />
            </button>
            <div className="divider"></div>
            {/* Botões de alinhamento */}
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="Alinhar à Esquerda" >
                <FormatAlignLeftIcon style={{ color: editor.isActive({ textAlign: 'left' }) ? 'rgb(255, 102, 0)' : '#888' }} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} title="Centralizar" >
                <FormatAlignCenterIcon style={{ color: editor.isActive({ textAlign: 'center' }) ? 'rgb(255, 102, 0)' : '#888' }} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} title="Alinhar à Direita" >
                <FormatAlignRightIcon style={{ color: editor.isActive({ textAlign: 'right' }) ? 'rgb(255, 102, 0)' : '#888' }} />
            </button>
            <div className="divider"></div>
            {/* Botão de cor com input */}
            <button type="button" onClick={() => (document.querySelector('input[type="color"]') as HTMLInputElement)?.click()} title="Cor do Texto">
                <FormatColorTextIcon style={{ color: editor.getAttributes('textStyle').color || 'rgb(216, 216, 216)' }} />
                <input type="color" onChange={event => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color || '#000000'} style={{ display: 'none' }} />
            </button>
        </div>
    );
};

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialComment: string;
    onSave: (commentText: string) => void;
    title: string;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, initialComment, onSave, title }) => {
    const [forceUpdate, setForceUpdate] = useState(0);
    const editor = useEditor({
        extensions: [
            StarterKit,
            // Extensão para alinhamento de texto
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            // Extensões para cor do texto
            TextStyle,
            Color,
        ],
        content: initialComment, // Define o conteúdo inicial do editor
        editorProps: {
            attributes: {
                class: 'tiptap-editor-content', // Classe para estilização do campo de texto
            },
        },
        // Este é o gatilho: a cada atualização do editor, forçamos um re-render
        onUpdate: () => {
            setForceUpdate(prev => prev + 1);
        },
    });

    useEffect(() => {
        // Garante que o conteúdo do editor seja atualizado se o modal for reaberto com um novo comentário
        editor?.commands.setContent(initialComment);
    }, [initialComment, editor]);

    const handleSave = () => {
        // Salva o conteúdo como HTML para preservar a formatação
        onSave(editor?.getHTML() || '');
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
                    <MenuBar editor={editor} forceUpdate={forceUpdate} />
                    <EditorContent editor={editor} />
                </div>
                <div className="modal-footer">
                    <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
                    <button type="button" className="save-btn" onClick={handleSave}><SendIcon /> Enviar Comentário</button>
                </div>
            </div>
        </div>
    );
};

export default CommentModal;