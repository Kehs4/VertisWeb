import React, { useState } from 'react';
import '../../../Vertis/Arquivo/Parceiro de Negocio/PartnerForm.css'; // Reutilizando o mesmo estilo
import './ServiceOrderForm.css'; // Estilos específicos para esta página

// Ícones
import { AddCircleOutline, Edit, Delete, Search as SearchIcon, Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';

// Tipagem para os produtos/serviços da ordem
interface OrderItem {
    id: number;
    status: string;
    service: string;
    quantity: number;
    unit: string;
    price: number;
    discount: number;
    applicationValue: number;
    deliveryDate: string;
}

function ServiceOrderForm() {
    // Controla o modo do formulário: 'view', 'new', 'edit'
    const [formMode, setFormMode] = useState<'view' | 'new' | 'edit'>('view');
    // Guarda o ID da OS carregada para habilitar/desabilitar botões
    const [loadedOrderId, setLoadedOrderId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        priceTable: '',
        animal: '',
        breed: '',
        tutor: '',
        clinic: '',
        veterinarian: '',
        providerUnit: '',
        type: 'Serviço',
        onCredit: 'Não',
        origin: '',
        animalGender: '',
        animalDob: '',
        species: '',
        isNeutered: 'Não',
        weight: '',
    });

    // Estado para os itens da ordem de serviço
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

    // Determina se os campos devem estar desabilitados
    const isReadOnly = formMode === 'view';
    // Determina se o bloco de itens deve ser visível
    const showItemsBlock = formMode === 'new' || formMode === 'edit' || (formMode === 'view' && loadedOrderId !== null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleAddItem = () => {
        const newItem: OrderItem = {
            id: Date.now(), // ID simples para o exemplo
            status: 'Pendente',
            service: 'Consulta de Rotina', // Exemplo
            quantity: 1,
            unit: 'UN',
            price: 150.00,
            discount: 0,
            applicationValue: 0,
            deliveryDate: new Date().toISOString().split('T')[0],
        };
        setOrderItems(prevItems => [...prevItems, newItem]);
    };

    // Lógica para o botão INCLUIR
    const handleNewClick = () => {
        setFormMode('new');
        setLoadedOrderId(null); // Limpa qualquer OS carregada
        // Limpar formData e orderItems
        setFormData({
            code: '', priceTable: '', animal: '', breed: '', tutor: '', clinic: '', veterinarian: '',
            providerUnit: '', type: 'Serviço', onCredit: 'Não', origin: '', animalGender: '',
            animalDob: '', species: '', isNeutered: 'Não', weight: '',
        });
        setOrderItems([]);
    };

    // Lógica para o botão ALTERAR
    const handleEditClick = () => {
        if (loadedOrderId) {
            setFormMode('edit');
        }
    };

    // Lógica para o botão PESQUISAR (simulação)
    const handleSearchClick = () => {
        // Lógica para abrir o modal de pesquisa viria aqui
        alert('Abriria o modal de pesquisa de Ordens de Serviço...');
        // Simulando que uma OS foi encontrada e selecionada
        const foundId = 12345;
        setLoadedOrderId(foundId);
        setFormData({
            ...formData,
            code: foundId.toString(),
            priceTable: 'PARTICULAR',
            providerUnit: `CLÍNICA GPI`,
            animal: 'Rex',
            tutor: 'João Silva',
            clinic: 'Animais Clínica Veterinária',
            veterinarian: 'MARIO ALVES ANTONIO DA SILVA',
            breed: 'SRD',
            type: 'Serviço',
            onCredit: 'Não',
            species: 'CANINA',
            animalGender: 'Macho',
            weight: '14,5',
        }); // Popula o form
        setOrderItems([{ id: 1, status: 'Concluído', service: 'Exame de Sangue', quantity: 1, unit: 'UN', price: 80, discount: 0, applicationValue: 0, deliveryDate: '2023-10-10' }]);
        setFormMode('view'); // Volta para o modo de visualização após a pesquisa
    };

    // Lógica para o botão EXCLUIR
    const handleDeleteClick = () => {
        if (window.confirm(`Deseja realmente excluir a Ordem de Serviço #${loadedOrderId}?`)) {
            console.log(`Excluindo OS #${loadedOrderId}...`);
            alert(`OS #${loadedOrderId} excluída!`);
            // Resetar a tela
            setLoadedOrderId(null);
            setFormData({ code: '', priceTable: '', animal: '', breed: '', tutor: '', clinic: '', veterinarian: '', providerUnit: '', type: 'Serviço', onCredit: 'Não', origin: '', animalGender: '', animalDob: '', species: '', isNeutered: 'Não', weight: '' });
            setOrderItems([]);
            setFormMode('view');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Dados da Ordem de Serviço:', { ...formData, items: orderItems });
        alert('Ordem de Serviço criada com sucesso! (Verifique o console)');
        setFormMode('view'); // Bloqueia o formulário após salvar
    };

    return (
        <div className="partner-form-container">
            <form onSubmit={handleSubmit} className="partner-form">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="partner-form-title">Ordem de Serviço - #1</h1>

                    <div className="form-actions-main">

                        <button type="button" className="action-button submit" onClick={handleNewClick}><AddIcon fontSize="small" />Nova Ordem de Serviço</button>
                        <button type="button" className="action-button update" onClick={handleEditClick} disabled={!loadedOrderId || formMode !== 'view'}><Edit fontSize="small" />Alterar</button>
                        <button type="button" className="action-button search" onClick={handleSearchClick}><SearchIcon fontSize="small" />Pesquisar</button>
                        <button type="button" className="action-button delete" onClick={handleDeleteClick} disabled={!loadedOrderId}><Delete fontSize="small" />Excluir</button>
                    </div>
                </div>

                {/* --- SELEÇÃO DE PARCEIROS --- */}
                <div className="form-section">
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Animal</label>
                            <div className="input-with-search">
                                <input value={formData.animal} readOnly placeholder="Selecione um animal..." />
                                <button type="button" className="search-modal-button" onClick={() => alert('Abrir modal de pesquisa de Animal...')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Tutor</label>
                            <div className="input-with-search">
                                <input value={formData.tutor} readOnly placeholder="Selecione um tutor..." />
                                <button type="button" className="search-modal-button" onClick={() => alert('Abrir modal de pesquisa de Tutor...')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
                            </div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Clínica</label>
                            <div className="input-with-search">
                                <input value={formData.clinic} readOnly placeholder="Selecione uma clínica..." />
                                <button type="button" className="search-modal-button" onClick={() => alert('Abrir modal de pesquisa de Clínica...')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Veterinário</label>
                            <div className="input-with-search">
                                <input value={formData.veterinarian} readOnly placeholder="Selecione um veterinário..." />
                                <button type="button" className="search-modal-button" onClick={() => alert('Abrir modal de pesquisa de Veterinário...')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- DADOS DA ORDEM --- */}
                <div className="form-section">
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 0.5 }}><label>Código</label><input name="code" value={formData.code} onChange={handleChange} readOnly={isReadOnly} /></div>
                        <div className="form-group" style={{ flex: 1.5 }}>
                            <label>Unidade Prestadora</label>
                            <div className="input-with-search">
                                <input name="providerUnit" value={formData.providerUnit} onChange={handleChange} readOnly={isReadOnly} placeholder="Selecione uma unidade..." />
                                <button type="button" className="search-modal-button" onClick={() => alert('Abrir modal de pesquisa de Unidade...')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Tipo</label>
                            <select name="type" value={formData.type} onChange={handleChange} disabled={isReadOnly}><option>Serviço</option><option>Produto</option></select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Fiado</label>
                            <select name="onCredit" value={formData.onCredit} onChange={handleChange} disabled={isReadOnly}><option>Não</option><option>Sim</option></select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}><label>Origem</label><input name="origin" value={formData.origin} onChange={handleChange} readOnly={isReadOnly} /></div>
                    </div>
                </div>

                {/* --- DADOS DO ANIMAL (preenchidos via seleção) --- */}
                <div className="form-section">
                    <h2 className="form-section-title">Dados do Animal</h2>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}><label>Sexo</label><input value={formData.animalGender} readOnly /></div>
                        <div className="form-group" style={{ flex: 1 }}><label>Data de Nasc.</label><input value={formData.animalDob} readOnly type="date" /></div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Espécie</label>
                            <div className="input-with-search">
                                <input value={formData.species} readOnly placeholder="Selecione uma espécie..." />
                                <button type="button" className="search-modal-button" onClick={() => alert('Abrir modal de pesquisa de Espécie...')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}><label>Castrado</label><input value={formData.isNeutered} readOnly /></div>
                        <div className="form-group" style={{ flex: 1 }}><label>Peso</label><input value={formData.weight} readOnly /></div>
                    </div>
                </div>

                {/* --- ITENS DA ORDEM DE SERVIÇO --- */}
                {showItemsBlock && (
                    <div className="form-section">
                        <div className="items-header">
                            <h2 className="form-section-title">Itens da Ordem</h2>
                            <div className="item-actions">
                                <button type="button" className="item-button add" onClick={handleAddItem} disabled={isReadOnly}><AddCircleOutline fontSize="small" /> Incluir</button>
                                <button type="button" className="item-button edit" disabled={isReadOnly}><Edit fontSize="small" /> Alterar</button>
                                <button type="button" className="item-button delete" disabled={isReadOnly}><Delete fontSize="small" /> Excluir</button>
                            </div>
                        </div>

                        <div className="items-table-container">
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Situação</th>
                                        <th>Serviço/Produto</th>
                                        <th>Qtd.</th>
                                        <th>Und.</th>
                                        <th>Valor R$</th>
                                        <th>Desconto R$</th>
                                        <th>Vlr. Aplicação</th>
                                        <th>Data Entrega</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.status}</td>
                                            <td>{item.service}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit}</td>
                                            <td>{item.price.toFixed(2)}</td>
                                            <td>{item.discount.toFixed(2)}</td>
                                            <td>{item.applicationValue.toFixed(2)}</td>
                                            <td>{new Date(item.deliveryDate).toLocaleDateString('pt-BR')}</td>
                                        </tr>
                                    ))}
                                    {orderItems.length === 0 && (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center' }}>Nenhum item adicionado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- FOOTER E BOTÕES PRINCIPAIS --- */}
                <div className="form-footer">
                    <span>Criado por: usuário_logado</span>
                    <span>Modificado por: -</span>
                </div>
                {!isReadOnly && (
                    <div className="form-actions">
                        <button type="submit" className="action-button submit"><SaveIcon fontSize="small" />Salvar Ordem</button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default ServiceOrderForm;
