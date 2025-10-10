import React, { useState, useEffect } from 'react';
import { OrderItem } from '../pages/Vertis/Operacional/Ordem de Serviço/ServiceOrderForm';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
import './EditItemModal.css';

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: OrderItem) => void;
    item: OrderItem;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const [editedItem, setEditedItem] = useState<OrderItem>(item);

    useEffect(() => {
        // Recalcula o valor de aplicação sempre que o preço ou desconto mudar
        const price = Number(editedItem.price) || 0;
        const discount = Number(editedItem.discount) || 0;
        const applicationValue = price - discount;
        setEditedItem(prev => ({ ...prev, applicationValue }));
    }, [editedItem.price, editedItem.discount]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedItem(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave(editedItem);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="edit-modal-container">
                <div className="modal-header">
                    <h2>Editar Item da Ordem de Serviço</h2>
                    <button onClick={onClose} className="modal-close-button">
                        <CloseIcon />
                    </button>
                </div>
                <div className="modal-body">
                    <form className="edit-item-form">
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Situação</label>
                                <input value={editedItem.status} readOnly />
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>Serviço/Produto</label>
                                <input value={editedItem.service} readOnly />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Quantidade</label>
                                <input type="number" name="quantity" value={editedItem.quantity} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Unidade</label>
                                <input name="unit" value={editedItem.unit} onChange={handleChange} />
                            </div>
                             <div className="form-group">
                                <label>Data Entrega</label>
                                <input type="date" name="deliveryDate" value={editedItem.deliveryDate} onChange={handleChange} />
                            </div>
                        </div>
                         <div className="form-row">
                            <div className="form-group">
                                <label>Valor R$</label>
                                <input type="number" name="price" value={editedItem.price} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Desconto R$</label>
                                <input type="number" name="discount" value={editedItem.discount} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Vlr. Aplicação</label>
                                <input value={editedItem.applicationValue} readOnly />
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="action-button cancel">Cancelar</button>
                    <button onClick={handleSave} className="action-button submit">
                        <SaveIcon fontSize="small" /> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditItemModal;

































































































































































































































































