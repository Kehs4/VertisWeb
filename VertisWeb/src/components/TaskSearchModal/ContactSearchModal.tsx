import React, { useState, useEffect, useMemo, useContext, lazy, Suspense } from 'react';
import './ContactSearchModal.css';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import IconButton from '@mui/material/IconButton';
import { AlertContext } from '../MainLayout';

const ConfirmationModal = lazy(() => import('../ConfirmationModal/ConfirmationModal'));

export interface Contact {
    cod_unid_oper: number;
    cod_usuario: number;
    email1: string;
    fkid_unid_negoc: number;
    fkid_unid_operacional: number;
    ind_sit_parc: string;
    nom_login: string;
    nom_parceiro: string;
    num_cnpj_cpf: string;
    num_telefone1: string;
    // Campos que podem não vir da API, mas são úteis para edição
    nom_unid_negoc?: string;
    nom_unid_oper?: string;
}

interface ContactSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (contact: Contact) => void;
    id_unid_oper?: number | null; // Novo parâmetro opcional
    id_unid_negoc?: number | null; // Novo parâmetro opcional
}

const ContactSearchModal: React.FC<ContactSearchModalProps> = ({ isOpen, onClose, onSelect, id_unid_oper, id_unid_negoc }) => {
    const showAlert = useContext(AlertContext);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null); // Para adicionar ou editar

    const [contactToDelete, setContactToDelete] = useState<number | null>(null);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // Efeito para aplicar o "debounce" no termo de busca.
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms de atraso

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const fetchContacts = async () => {
        setIsLoading(true);
        try {
            // O endpoint agora é um proxy no seu servidor que chama a API externa
            const response = await fetch(`/api/consulta_contatos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom_contato: debouncedSearchTerm,
                    cod_unid_negoc: id_unid_negoc,
                    cod_unid_oper: id_unid_oper
                })
            });

            if (response.ok) {
                const data = await response.json();
                // A API de consulta de contatos retorna o array diretamente.
                setContacts(Array.isArray(data) ? data : []);
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
    }, [isOpen, debouncedSearchTerm, id_unid_oper, id_unid_negoc]);

    const handleSelectContact = (contact: Contact) => {
        onSelect(contact);
        onClose();
    };

    const confirmDeleteContact = async () => {
        if (!contactToDelete) return;
        try {
            const response = await fetch(`/api/contacts/${contactToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                showAlert({ message: 'Contato excluído com sucesso.', type: 'success' });
                fetchContacts(); // Recarrega a lista
            } else {
                const errorText = await response.text();
                showAlert({ message: `Falha ao excluir o contato: ${errorText}`, type: 'error' });
            }
        } catch (error) {
            console.error("Erro de rede ao excluir contato:", error);
            showAlert({ message: 'Erro de rede ao excluir o contato.', type: 'error' });
        }
        setContactToDelete(null); // Fecha o modal de confirmação
    };

    /*
    const handleSaveContact = async () => {
        if (!editingContact || !editingContact.nom_parceiro) {
            showAlert({ message: 'O nome do contato é obrigatório.', type: 'warning' });
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
                const errorText = await response.text();
                showAlert({ message: `Falha ao salvar o contato: ${errorText}`, type: 'error' });
            }
        } catch (error) {
            console.error("Erro de rede ao salvar contato:", error);
            showAlert({ message: 'Erro de rede ao salvar o contato.', type: 'error' });
        }
    };
    */

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingContact) return;
        const { name, value } = e.target;
        setEditingContact(prev => ({ ...prev, [name]: value }));
    };

    const startAddNewContact = () => {
        setEditingContact({
            nom_parceiro: '',
            fkid_unid_negoc: id_unid_negoc || 0,
            nom_unid_negoc: '',
            fkid_unid_operacional: id_unid_oper || 0,
            nom_unid_oper: '',
            num_telefone1: '',
            email1: '',
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
                        <h4>{editingContact.cod_usuario ? 'Editar Contato' : 'Adicionar Novo Contato'}</h4>
                        <div className="form-grid">
                            <input name="nom_parceiro" value={editingContact.nom_parceiro || ''} onChange={handleEditChange} placeholder="Nome*" required />
                            <input name="num_telefone1" value={editingContact.num_telefone1 || ''} onChange={handleEditChange} placeholder="Telefone" />
                            <input name="email1" value={editingContact.email1 || ''} onChange={handleEditChange} placeholder="Email" />
                            <input name="nom_unid_negoc" value={editingContact.nom_unid_negoc || ''} onChange={handleEditChange} placeholder="Unidade de Negócio" />
                            <input name="nom_unid_oper" value={editingContact.nom_unid_oper || ''} onChange={handleEditChange} placeholder="Unidade Operacional" />
                            {/* Campos de ID ficam ocultos, mas são necessários */}
                            <input type="hidden" name="fkid_unid_negoc" value={editingContact.fkid_unid_negoc || 0} />
                            <input type="hidden" name="fkid_unid_operacional" value={editingContact.fkid_unid_operacional || 0} />
                        </div>
                        <div className="edit-form-actions">
                            <button onClick={() => setEditingContact(null)} className="cancel-btn"><CancelIcon style={{color: 'gray'}} /> Cancelar</button>
                            <button className="btn-primary"><SaveIcon /> Salvar</button>
                        </div>
                    </div>
                )}

                <div className="contact-table-wrapper">
                    <table className="contact-table">
                        <thead>
                            <tr>
                                <th>Contato</th>
                                <th>Login</th>
                                <th>CNPJ/CPF</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="table-loading-state">Carregando...</td></tr>
                            ) : contacts.length > 0 ? (
                                contacts.map(contact => (
                                    <tr key={contact.cod_usuario} onDoubleClick={() => handleSelectContact(contact)}>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.nom_parceiro}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.nom_login}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.num_cnpj_cpf}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.num_telefone1}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectContact(contact)}>{contact.email1}</td>
                                        <td className="cell-actions">
                                            <IconButton size="small" onClick={() => setEditingContact(contact)} title="Editar">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => setContactToDelete(contact.cod_usuario)} title="Excluir">
                                                <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="table-loading-state">Nenhum contato encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Suspense>
                    {contactToDelete !== null && (
                        <ConfirmationModal
                            isOpen={contactToDelete !== null}
                            onClose={() => setContactToDelete(null)}
                            onConfirm={confirmDeleteContact}
                            title="Confirmar Exclusão"
                            message={`Tem certeza que deseja excluir o contato? Esta ação não pode ser desfeita.`} />
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default ContactSearchModal;
