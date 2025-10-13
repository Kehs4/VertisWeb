import React, { useState, useEffect } from 'react';
import './AddTaskModal.css';
import { Task } from '../../pages/Suporte/Tarefas/TarefasPage'; // Reutilizando a tipagem
import CloseIcon from '@mui/icons-material/Close';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newTask: Omit<Task, 'id' | 'dth_inclusao'>) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave }) => {
    const initialFormState = {
        titulo_tarefa: '',
        criado_por: '',
        nom_unid_oper: '',
        ind_prioridade: 2, // Default to 'Média'
        ind_sit_tarefa: 'AB',
        sit_tarefa: 'Aberto',
        // --- Valores padrão para campos obrigatórios ---
        id_unid_negoc: 0,
        nom_unid_negoc: 'N/A',
        id_unid_oper: 0,
        qtd_pontos: 0,
        dth_prev_entrega: '',
        recursos: [{ 
            id_recurso: 0, 
            nom_recurso: '',  
        }],
        comentarios: [{
            id_recurso: 0,
            nom_recurso: '',
            comentario: '',
            dth_inclusao: new Date().toISOString().split('T')[0], // Data atual
        }],
        contatos: [{
            id_contato: 0,
            nom_recurso: '',
        }],
        dth_encerramento: '',
        dth_inclusao: new Date().toISOString().split('T')[0], // Data atual
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        // Reset form when modal is opened
        if (isOpen) {
            setFormData(initialFormState);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'nom_recurso') {
            // Lógica especial para atualizar o nome do analista dentro do array
            setFormData(prev => ({
                ...prev,
                recursos: [{ ...prev.recursos[0], nom_recurso: value }]
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

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Adicionar Novo Chamado</h2>
                    <button onClick={onClose} className="close-button">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="titulo_tarefa">Descrição do Chamado</label>
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
                            <input
                                type="text"
                                id="criado_por"
                                name="criado_por"
                                value={formData.criado_por}
                                onChange={handleChange}
                                required
                            />
                        </div>
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
                        <div className="form-group">
                            <label htmlFor="id_unid_negoc">Unidade de Negócio</label>
                            <input
                                type="text"
                                id="id_unid_negoc"
                                name="id_unid_negoc"
                                value={formData.id_unid_negoc}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor='nom_recurso'>Analista</label>
                            <input
                                type="text"
                                id="nom_recurso"
                                name="nom_recurso"
                                value={formData.recursos[0]?.nom_recurso || ''}
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
                            Salvar Chamado
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;