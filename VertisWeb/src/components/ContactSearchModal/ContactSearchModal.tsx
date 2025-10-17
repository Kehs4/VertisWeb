import React, { useState, useEffect, useMemo } from 'react';
import './ContactSearchModal.css';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import IconButton from '@mui/material/IconButton';

export interface Contact {
    id: number;
    nome: string;
    id_unid_negoc: number;
    nom_unid_negoc: string;
    id_unid_oper: number;
    nom_unid_oper: string;
    telefone: string;
    email?: string;
    inf_adicional?: string;
}

interface ContactSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (contact: Contact) => void;
}

const ContactSearchModal: React.FC<ContactSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null); // Para adicionar ou editar

    const fetchContacts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/contacts?search=${searchTerm}`);
            if (response.ok) {
                const data = await response.json();
                setContacts(data);
            } else {
                console.error("Falha ao buscar contatos.");
            }
        } catch (error) {
            console.error("Erro de rede ao buscar contatos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchContacts();
        }
    }, [isOpen, searchTerm]);

    const handleSelectContact = (contact: Contact) => {
        onSelect(contact);
        onClose();
    };

    const handleDeleteContact = async (contactId: number) => {
        if (window.confirm('Tem certeza que deseja excluir este contato?')) {
            try {
                const response = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
                if (response.ok) {
                    fetchContacts(); // Recarrega a lista
                } else {
                    alert('Falha ao excluir o contato.');
                }
            } catch (error) {
                console.error("Erro de rede ao excluir contato:", error);
            }
        }
    };

    const handleSaveContact = async () => {
        if (!editingContact || !editingContact.nome) {
            alert('O nome do contato é obrigatório.');
            return;
        }

        const method = editingContact.id ? 'PUT' : 'POST';
        const url = editingContact.id ? `/api/contacts/${editingContact.id}` : '/api/contacts';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingContact),
            });

            if (response.ok || response.status === 201) {
                setEditingContact(null); // Fecha o formulário de edição
                fetchContacts(); // Recarrega a lista
            } else {
                alert('Falha ao salvar o contato.');
            }
        } catch (error) {
            console.error("Erro de rede ao salvar contato:", error);
        }
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingContact) return;
        const { name, value } = e.target;
        setEditingContact(prev => ({ ...prev, [name]: value }));
    };

    const startAddNewContact = () => {
        setEditingContact({
            nome: '',
            id_unid_negoc: 0,
            nom_unid_negoc: '',
            id_unid_oper: 0,
            nom_unid_oper: '',
            telefone: ''
            // email e inf_adicional serão undefined por padrão
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content contact-search-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Pesquisar Contato</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>

                <div className="contact-modal-toolbar">
                    <div className="search-input-wrapper">
                        <SearchIcon className="search-icon" />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome, unidade, telefone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="filter-search-input"
                            style={{backgroundColor: 'white', color: 'black'}}
                        />
                    </div>
                    <button className="add-task-button" onClick={startAddNewContact}>
                        <AddIcon /> Adicionar Contato
                    </button>
                </div>

                {editingContact && (
                    <div className="contact-edit-form">
                        <h4>{editingContact.id ? 'Editar Contato' : 'Adicionar Novo Contato'}</h4>
                        <div className="form-grid">
                            <input name="nome" value={editingContact.nome || ''} onChange={handleEditChange} placeholder="Nome*" required />
                            <input name="inf_adicional" value={editingContact.inf_adicional || ''} onChange={handleEditChange} placeholder="Função/Info Adicional" />
                            <input name="telefone" value={editingContact.telefone || ''} onChange={handleEditChange} placeholder="Telefone" />
                            <input name="email" value={editingContact.email || ''} onChange={handleEditChange} placeholder="Email" />
                            <input name="nom_unid_negoc" value={editingContact.nom_unid_negoc || ''} onChange={handleEditChange} placeholder="Unidade de Negócio" />
                            <input name="nom_unid_oper" value={editingContact.nom_unid_oper || ''} onChange={handleEditChange} placeholder="Unidade Operacional" />
                            {/* Campos de ID ficam ocultos, mas são necessários */}
                            <input type="hidden" name="id_unid_negoc" value={editingContact.id_unid_negoc || 0} />
                            <input type="hidden" name="id_unid_oper" value={editingContact.id_unid_oper || 0} />
                        </div>
                        <div className="edit-form-actions">
                            <button onClick={() => setEditingContact(null)} className="cancel-btn"><CancelIcon style={{color: 'gray'}} /> Cancelar</button>
                            <button onClick={handleSaveContact} className="btn-primary"><SaveIcon /> Salvar</button>
                        </div>
                    </div>
                )}

                <div className="contact-table-wrapper">
                    <table className="contact-table">
                        <thead>
                            <tr>
                                <th>Contato</th>
                                <th>Função</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Unid. Negócio</th>
                                <th>Unid. Operacional</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="table-loading-state">Carregando...</td></tr>
                            ) : contacts.length > 0 ? (
                                contacts.map(contact => (
                                    <tr key={contact.id} onDoubleClick={() => handleSelectContact(contact)}>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.nome}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.inf_adicional}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.telefone}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.email}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.nom_unid_negoc}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.nom_unid_oper}</td>
                                        <td className="cell-actions">
                                            <IconButton size="small" onClick={() => setEditingContact(contact)} title="Editar">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteContact(contact.id)} title="Excluir">
                                                <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="table-loading-state">Nenhum contato encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ContactSearchModal;
