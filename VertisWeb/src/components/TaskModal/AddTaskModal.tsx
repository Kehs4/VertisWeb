import React, { useState, useEffect, lazy, Suspense } from 'react';
import './AddTaskModal.css';
import { Task } from '../../pages/Admin/Suporte/Tarefas/TarefasPage'; // Reutilizando a tipagem
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { Contact } from '../ContactSearchModal/ContactSearchModal.tsx';
const ContactSearchModal = lazy(() => import('../ContactSearchModal/ContactSearchModal.tsx'));

interface AddTaskModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (newTask: Task) => void;
    contextType?: 'support' | 'development' | 'commercial';
}

// Mova initialFormState para fora do componente para evitar recriação em cada renderização
const initialFormState: Task = {
    id: 0, // ID será substituído na criação
    titulo_tarefa: '',
    criado_por: '',
    nom_unid_oper: '',
    ind_prioridade: 2, // Default to 'Média'
    ind_sit_tarefa: 'AB',
    sit_tarefa: 'Aberto',
    // --- Valores padrão para campos obrigatórios ---
    id_unid_negoc: 0,
    nom_unid_negoc: '',
    id_unid_oper: 0,
    qtd_pontos: 0,
    dth_prev_entrega: '',
    recursos: [],
    comentarios: [],
    dth_encerramento: '',
    dth_inclusao: '', // Será definido na criação
    satisfaction_rating: undefined,
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({ title, isOpen, onClose, onSave, contextType = 'support' }) => {
    const labels = {
        taskDescription: contextType === 'development' ? 'Descrição da Tarefa' : 'Descrição do Chamado',
        analyst: contextType === 'development' ? 'Desenvolvedor' : 'Analista',
        saveBtn: contextType === 'development' ? 'Salvar Tarefa' : 'Salvar Chamado',
    };


    const [formData, setFormData] = useState(initialFormState);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    useEffect(() => {
        // Reset form when modal is opened
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
            setFormData({
                ...initialFormState,
                dth_prev_entrega: today, // Preenche a previsão de entrega com a data atual
            });
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'nom_recurso') {
            // Lógica especial para atualizar o nome do analista dentro do array
            setFormData(prev => ({
                ...prev,
                recursos: Array.isArray(prev.recursos) && prev.recursos.length > 0
                    ? [{ ...prev.recursos[0], nom_recurso: value }]
                    : [{ id_recurso: 0, nom_recurso: value }]
            }));
        } else {
            // Lógica padrão para os outros campos
            setFormData(prev => ({
                ...prev,
                [name]: name === 'ind_prioridade' ? parseInt(value, 10) : value,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleContactSelect = (contact: Contact) => {
        setFormData(prev => ({
            ...prev,
            criado_por: contact.nome,
            nom_unid_oper: contact.nom_unid_oper,
            id_unid_oper: contact.id_unid_oper,
            nom_unid_negoc: contact.nom_unid_negoc,
            id_unid_negoc: contact.id_unid_negoc,
        }));
        setIsContactModalOpen(false);
    };

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
                    <div className="form-group">
                        <label htmlFor="titulo_tarefa">{labels.taskDescription}</label>
                        <textarea
                            id="titulo_tarefa"
                            name="titulo_tarefa"
                            value={formData.titulo_tarefa}
                            onChange={handleChange}
                            style={{resize : 'none'}}
                            required
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="criado_por">Usuário Solicitante</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    id="criado_por"
                                    name="criado_por"
                                    value={formData.criado_por}
                                    onChange={handleChange}
                                    required
                                />
                                <button type="button" className="icon-button" onClick={() => setIsContactModalOpen(true)} title="Pesquisar Contato">
                                    <SearchIcon />
                                </button>
                            </div>
                        </div>
                        {contextType === 'support' && (
                            <div className="form-group">
                                <label htmlFor="nom_unid_oper">Nome Unidade Operacional</label>
                                <input
                                    type="text"
                                    id="nom_unid_oper"
                                    name="nom_unid_oper"
                                    value={formData.nom_unid_oper}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}
                    </div>

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

                    <div className="form-row">
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
                        {contextType === 'support' && (
                            <div className="form-group">
                                <label htmlFor="id_unid_negoc">Unidade de Negócio</label>
                                <input
                                    type="text"
                                    id="id_unid_negoc"
                                    name="id_unid_negoc"
                                    value={formData.nom_unid_negoc}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor='nom_recurso'>{labels.analyst}</label>
                            <input
                                type="text"
                                id="nom_recurso"
                                name="nom_recurso"
                                value={Array.isArray(formData.recursos) && formData.recursos[0] ? formData.recursos[0].nom_recurso : ''}
                                onChange={handleChange}
                                required
                            />
                        </div>

                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="save-btn">
                            {labels.saveBtn}
                        </button>
                    </div>
                </form>
                <Suspense fallback={<div>Carregando...</div>}>
                    {isContactModalOpen && (
                        <ContactSearchModal
                            isOpen={isContactModalOpen}
                            onClose={() => setIsContactModalOpen(false)}
                            onSelect={handleContactSelect} />
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default AddTaskModal;