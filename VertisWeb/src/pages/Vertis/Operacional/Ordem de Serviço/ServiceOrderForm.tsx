import React, { useState } from 'react';
import '../../../Vertis/Arquivo/Parceiro de Negocio/PartnerForm.css'; // Reutilizando o mesmo estilo
import './ServiceOrderForm.css'; // Estilos específicos para esta página
import SearchModal, { SearchConfig, SearchResult } from '../../../../components/SearchModal';
import EditItemModal from '../../../../components/EditItemModal';

// Ícones
import { AddCircleOutline, Edit, Delete, Search as SearchIcon, Add as AddIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';

// Tipagem para os produtos/serviços da ordem
export interface OrderItem {
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

// New type for Service Order search results, extending SearchResult
// This allows the SearchModal to return a more complete object for OS
interface ServiceOrderSearchResult extends SearchResult {
    animalName: string;
    tutorName: string;
    clinicName: string;
    veterinarianName: string;
    status: string;
    creationDate: string; // YYYY-MM-DD format for easier comparison
    productSummary: string; // e.g., "Consulta de Rotina, Vacina V8"
    fullOrderItems: OrderItem[]; // To populate the form
    // Fields from formData that are populated by selecting an OS
    breed: string; species: string; animalGender: string; animalDob: string; isNeutered: string; weight: string;
    providerUnit: string; type: string; onCredit: string; origin: string;
}

// --- DADOS E CONFIGURAÇÕES PARA OS MODAIS DE PESQUISA ---

// Mock Data para Animal
const mockAnimals: SearchResult[] = [
    { id: 1, name: 'Rex', document: '12345', breed: 'Labrador', species: 'Canina', tutorName: 'João Silva', gender: 'Macho', dob: '2018-05-10', isNeutered: 'Sim', weight: '30kg' },
    { id: 2, name: 'Miau', document: '67890', breed: 'Siamês', species: 'Felina', tutorName: 'Maria Oliveira', gender: 'Fêmea', dob: '2020-01-15', isNeutered: 'Não', weight: '4kg' },
    { id: 3, name: 'Bob', document: '11223', breed: 'Poodle', species: 'Canina', tutorName: 'João Silva', gender: 'Macho', dob: '2019-03-22', isNeutered: 'Sim', weight: '10kg' },
];
const animalSearchConfig: SearchConfig = {
    title: 'Pesquisar Animal',
    searchOptions: [
        { value: 'name', label: 'Nome do Animal' },
        { value: 'document', label: 'Código' },
        { value: 'tutorName', label: 'Nome do Tutor' },
        { value: 'breed', label: 'Raça' },
        { value: 'species', label: 'Espécie' },
    ],
    resultHeaders: [
        { key: 'id', label: 'Cód.' },
        { key: 'name', label: 'Animal' },
        { key: 'tutorName', label: 'Tutor' },
        { key: 'breed', label: 'Raça' },
        { key: 'species', label: 'Espécie' },
    ],
    mockData: mockAnimals,
};

// Mock Data para Tutor
const mockTutors: SearchResult[] = [
    { id: 101, name: 'João Silva', document: '111.222.333-44', phone: '11987654321', email: 'joao@email.com' },
    { id: 102, name: 'Maria Oliveira', document: '555.666.777-88', phone: '11912345678', email: 'maria@email.com' },
    { id: 103, name: 'Carlos Souza', document: '999.888.777-66', phone: '11955554444', email: 'carlos@email.com' },
];
const tutorSearchConfig: SearchConfig = {
    title: 'Pesquisar Tutor',
    searchOptions: [
        { value: 'name', label: 'Nome' },
        { value: 'document', label: 'CPF' },
        { value: 'phone', label: 'Telefone' },
        { value: 'email', label: 'E-mail' },
    ],
    resultHeaders: [
        { key: 'id', label: 'Cód.' },
        { key: 'name', label: 'Nome' },
        { key: 'document', label: 'CPF' },
        { key: 'phone', label: 'Telefone' },
    ],
    mockData: mockTutors,
};

// Mock Data para Clínica
const mockClinics: SearchResult[] = [
    { id: 201, name: 'Clínica Vet Amigo', document: '11.222.333/0001-44', corporateName: 'Vet Amigo Ltda', email: 'contato@vetamigo.com', phone: '1133332222' },
    { id: 202, name: 'Pet Saúde', document: '44.555.666/0001-77', corporateName: 'Pet Saúde S.A.', email: 'info@petsaude.com', phone: '1144445555' },
];
const clinicSearchConfig: SearchConfig = {
    title: 'Pesquisar Clínica',
    searchOptions: [
        { value: 'name', label: 'Nome Fantasia' },
        { value: 'corporateName', label: 'Razão Social' },
        { value: 'document', label: 'CNPJ' },
        { value: 'email', label: 'E-mail' },
        { value: 'phone', label: 'Telefone' },
    ],
    resultHeaders: [
        { key: 'id', label: 'Cód.' },
        { key: 'name', label: 'Nome Fantasia' },
        { key: 'corporateName', label: 'Razão Social' },
        { key: 'document', label: 'CNPJ' },
    ],
    mockData: mockClinics,
};

// Mock Data para Veterinário
const mockVeterinarians: SearchResult[] = [
    { id: 301, name: 'Dr. Ana Costa', document: 'CRMV-SP 12345', phone: '11977776666', email: 'ana.costa@vet.com' },
    { id: 302, name: 'Dr. Pedro Santos', document: 'CRMV-RJ 67890', phone: '21988887777', email: 'pedro.santos@vet.com' },
];
const veterinarianSearchConfig: SearchConfig = {
    title: 'Pesquisar Veterinário',
    searchOptions: [
        { value: 'name', label: 'Nome' },
        { value: 'document', label: 'CRMV' },
        { value: 'phone', label: 'Telefone' },
        { value: 'email', label: 'E-mail' },
    ],
    resultHeaders: [
        { key: 'id', label: 'Cód.' },
        { key: 'name', label: 'Nome' },
        { key: 'document', label: 'CRMV' },
        { key: 'phone', label: 'Telefone' },
    ],
    mockData: mockVeterinarians,
};

// Mock Data para Unidade Operacional (reutilizando do OperationalUnitForm ou criando novos)
const mockOperationalUnits: SearchResult[] = [
    { id: 401, name: 'Vertis Matriz', document: '11.222.333/0001-44', corporateName: 'Vertis Tecnologia Ltda', email: 'matriz@vertis.com', phone: '11999998888' },
    { id: 402, name: 'Vertis Filial SP', document: '11.222.333/0002-55', corporateName: 'Vertis Tecnologia Filial SP', email: 'sp@vertis.com', phone: '11777776666' },
];
const operationalUnitSearchConfig: SearchConfig = {
    title: 'Pesquisar Unidade Prestadora',
    searchOptions: [
        { value: 'name', label: 'Nome Fantasia' },
        { value: 'corporateName', label: 'Razão Social' },
        { value: 'document', label: 'CNPJ' },
        { value: 'email', label: 'E-mail' },
        { value: 'phone', label: 'Telefone' },
    ],
    resultHeaders: [
        { key: 'id', label: 'Cód.' },
        { key: 'name', label: 'Nome Fantasia' },
        { key: 'document', label: 'CNPJ' },
    ],
    mockData: mockOperationalUnits,
};

// Mock Data para Produtos/Serviços
const mockProductsServices: SearchResult[] = [
    { id: 501, name: 'Consulta de Rotina', document: 'SERV001', shortName: 'CONSULTA', price: 150.00, unit: 'UN' },
    { id: 502, name: 'Vacina V8', document: 'PROD002', shortName: 'VACINA V8', price: 80.00, unit: 'DOSE' },
    { id: 503, name: 'Exame de Sangue Completo', document: 'EXAM003', shortName: 'HEMOGRAMA', price: 120.00, unit: 'EXAME' },
];
const productSearchConfig: SearchConfig = {
    title: 'Pesquisar Produto/Serviço',
    searchOptions: [
        { value: 'name', label: 'Nome do Produto/Serviço' },
        { value: 'document', label: 'Código do Produto' },
        { value: 'shortName', label: 'Nome Reduzido' },
    ],
    resultHeaders: [
        { key: 'id', label: 'Cód.' },
        { key: 'name', label: 'Nome' },
        { key: 'shortName', label: 'Nome Reduzido' },
        { key: 'price', label: 'Preço' },
    ],
    mockData: mockProductsServices,
};
// --- FIM DADOS E CONFIGURAÇÕES ---

function ServiceOrderForm() {
    // Mock Data para Ordens de Serviço
    const mockServiceOrders: ServiceOrderSearchResult[] = [
        { id: 'OS-001', name: 'OS-001 - Rex (João Silva)', document: '', animalName: 'Rex', tutorName: 'João Silva', clinicName: 'Clínica Vet Amigo', veterinarianName: 'Dr. Ana Costa', status: 'Aberta', creationDate: '2024-07-20', productSummary: 'Consulta de Rotina, Vacina V8', fullOrderItems: [ { id: 1, status: 'Pendente', service: 'Consulta de Rotina', quantity: 1, unit: 'UN', price: 150.00, discount: 0, applicationValue: 150.00, deliveryDate: '2024-07-20' }, { id: 2, status: 'Pendente', service: 'Vacina V8', quantity: 1, unit: 'DOSE', price: 80.00, discount: 0, applicationValue: 80.00, deliveryDate: '2024-07-20' }, ], breed: 'Labrador', species: 'Canina', animalGender: 'Macho', animalDob: '2018-05-10', isNeutered: 'Sim', weight: '30kg', providerUnit: 'Vertis Matriz', type: 'Serviço', onCredit: 'Não', origin: 'Balcão', },
        { id: 'OS-002', name: 'OS-002 - Miau (Maria Oliveira)', document: '', animalName: 'Miau', tutorName: 'Maria Oliveira', clinicName: 'Pet Saúde', veterinarianName: 'Dr. Pedro Santos', status: 'Finalizada', creationDate: '2024-07-15', productSummary: 'Exame de Sangue Completo', fullOrderItems: [ { id: 3, status: 'Concluído', service: 'Exame de Sangue Completo', quantity: 1, unit: 'EXAME', price: 120.00, discount: 0, applicationValue: 120.00, deliveryDate: '2024-07-15' }, ], breed: 'Siamês', species: 'Felina', animalGender: 'Fêmea', animalDob: '2020-01-15', isNeutered: 'Não', weight: '4kg', providerUnit: 'Vertis Filial SP', type: 'Serviço', onCredit: 'Sim', origin: 'Telefone', },
    ];

    const serviceOrderSearchConfig: SearchConfig = {
        title: 'Pesquisar Ordem de Serviço',
        searchOptions: [ { value: 'id', label: 'Código da O.S' }, { value: 'animalName', label: 'Animal' }, { value: 'tutorName', label: 'Tutor' }, { value: 'clinicName', label: 'Clínica' }, { value: 'veterinarianName', label: 'Veterinário' }, { value: 'status', label: 'Situação' }, { value: 'productSummary', label: 'Produto/Serviço' }, { value: 'creationDate', label: 'Data de Criação' }, ],
        resultHeaders: [ { key: 'id', label: 'Cód. O.S' }, { key: 'animalName', label: 'Animal' }, { key: 'tutorName', label: 'Tutor' }, { key: 'status', label: 'Situação' }, { key: 'creationDate', label: 'Data Criação' }, ],
        mockData: mockServiceOrders,
    };
    // Controla o modo do formulário: 'view', 'new', 'edit'
    const [formMode, setFormMode] = useState<'view' | 'new' | 'edit'>('view');
    // Guarda o ID da OS carregada para habilitar/desabilitar botões
    const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null);

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

    // Estados para o modal de pesquisa
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [currentSearchConfig, setCurrentSearchConfig] = useState<SearchConfig | null>(null);
    const [targetField, setTargetField] = useState<string>(''); // Para saber qual campo do form atualizar
    
    // Estados para o modal de edição de item
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

    // Função para resetar o formulário para o estado inicial
    const resetFormToInitialState = () => {
        setFormMode('view');
        setLoadedOrderId(null);
        setFormData({
            code: '', priceTable: '', animal: '', breed: '', tutor: '', clinic: '', veterinarian: '',
            providerUnit: '', type: 'Serviço', onCredit: 'Não', origin: '', animalGender: '',
            animalDob: '', species: '', isNeutered: 'Não', weight: '',
        });
        setOrderItems([]);
    };

    // Determina se os campos devem estar desabilitados
    const isReadOnly = formMode === 'view';
    // Determina se o bloco de itens deve ser visível
    const showItemsBlock = formMode === 'new' || formMode === 'edit' || (formMode === 'view' && loadedOrderId !== null);

    // Determina se os botões de ação detalhados (Alterar, Excluir, gerenciar itens) devem ser visíveis
    const showDetailedActions = formMode === 'new' || formMode === 'edit' || loadedOrderId !== null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    // Lógica para o botão INCLUIR
    const handleNewClick = () => {
        setFormMode('new');
        setLoadedOrderId(null); // Limpa qualquer OS carregada
        setFormData({ code: '', priceTable: '', animal: '', breed: '', tutor: '', clinic: '', veterinarian: '', providerUnit: '', type: 'Serviço', onCredit: 'Não', origin: '', animalGender: '', animalDob: '', species: '', isNeutered: 'Não', weight: '' });
        setOrderItems([]);
    };

    // Lógica para o botão ALTERAR
    const handleEditClick = () => {
        if (loadedOrderId) {
            setFormMode('edit');
        }
    };

    const handleSearchClick = () => {
        // Abre o modal de pesquisa de Ordens de Serviço
        handleOpenSearchModal(serviceOrderSearchConfig, 'serviceOrder');
    };

    // Lógica para o botão EXCLUIR
    const handleDeleteClick = () => {
        if (window.confirm(`Deseja realmente excluir a Ordem de Serviço #${loadedOrderId}?`)) {
            console.log(`Excluindo OS #${loadedOrderId}...`);
            alert(`OS #${loadedOrderId} excluída!`);
            resetFormToInitialState();
        }
    };

    // Lógica para o botão CANCELAR
    const handleCancelClick = () => {
        // Confirmação opcional para evitar perda de dados não salvos
        if (window.confirm('Deseja realmente cancelar? Todas as alterações não salvas serão perdidas.')) {
            resetFormToInitialState();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Dados da Ordem de Serviço:', { ...formData, items: orderItems });
        alert('Ordem de Serviço criada com sucesso! (Verifique o console)');
        setFormMode('view'); // Bloqueia o formulário após salvar
    };

    // Funções para o modal de pesquisa
    const handleOpenSearchModal = (config: SearchConfig, field: string) => {
        setCurrentSearchConfig(config);
        setTargetField(field);
        setIsSearchModalOpen(true);
    };

    const handleSelectResult = (item: SearchResult) => {
        if (targetField === 'animal') {
            setFormData(prev => ({
                ...prev,
                animal: item.name,
                breed: item.breed || '',
                species: item.species || '',
                animalGender: item.gender || '',
                animalDob: item.dob || '',
                isNeutered: item.isNeutered || 'Não',
                weight: item.weight || '',
                tutor: item.tutorName || prev.tutor, // Se a busca de animal também retornar o tutor
            }));
        } else if (targetField === 'tutor') {
            setFormData(prev => ({ ...prev, tutor: item.name }));
        } else if (targetField === 'clinic') {
            setFormData(prev => ({ ...prev, clinic: item.name }));
        } else if (targetField === 'veterinarian') {
            setFormData(prev => ({ ...prev, veterinarian: item.name }));
        } else if (targetField === 'providerUnit') {
            setFormData(prev => ({ ...prev, providerUnit: item.name }));
        } else if (targetField === 'orderItem') {
            // Adiciona um novo item à lista de itens da ordem
            const newItem: OrderItem = {
                id: Date.now(), // ID temporário
                status: 'Pendente', // Status inicial
                service: item.name,
                quantity: 1, // Quantidade padrão
                unit: item.unit || 'UN', // Unidade padrão
                price: item.price || 0,
                discount: 0,
                applicationValue: item.price || 0,
                deliveryDate: new Date().toISOString().split('T')[0], // Data atual
            };
            setOrderItems(prevItems => [...prevItems, newItem]);
        } else if (targetField === 'serviceOrder') {
            const selectedOrder = item as ServiceOrderSearchResult; // Cast to specific type
            setFormData({
                code: selectedOrder.id.toString(),
                priceTable: '', // Assuming priceTable is not directly from OS search result
                animal: selectedOrder.animalName,
                breed: selectedOrder.breed,
                tutor: selectedOrder.tutorName,
                clinic: selectedOrder.clinicName,
                veterinarian: selectedOrder.veterinarianName,
                providerUnit: selectedOrder.providerUnit,
                type: selectedOrder.type,
                onCredit: selectedOrder.onCredit,
                origin: selectedOrder.origin,
                animalGender: selectedOrder.animalGender,
                animalDob: selectedOrder.animalDob,
                species: selectedOrder.species,
                isNeutered: selectedOrder.isNeutered,
                weight: selectedOrder.weight,
            });
            setOrderItems(selectedOrder.fullOrderItems);
            setLoadedOrderId(selectedOrder.id.toString());
        }
        // Fechar o modal após a seleção
        setIsSearchModalOpen(false);
        setCurrentSearchConfig(null);
        setTargetField('');
    };

    const handleAddItem = () => {
        // Abre o modal de pesquisa de produtos/serviços para adicionar um item
        handleOpenSearchModal(productSearchConfig, 'orderItem');
    };

    const handleEditItem = (itemId: number) => {
        if (isReadOnly) return;
        // Lógica para alterar o item. Pode abrir um modal de edição.
        const itemToEdit = orderItems.find(item => item.id === itemId);
        console.log("Editando item:", itemToEdit);
        if (itemToEdit) {
            setEditingItem(itemToEdit);
            setIsEditModalOpen(true);
        }
    };

    const handleSaveItem = (updatedItem: OrderItem) => {
        setOrderItems(prevItems =>
            prevItems.map(item =>
                item.id === updatedItem.id ? updatedItem : item
            )
        );
        // Fechar o modal e limpar o estado de edição
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    const handleDeleteItem = (itemId: number) => {
        // Impede a exclusão se o formulário estiver bloqueado
        if (isReadOnly) return;
        if (window.confirm('Tem certeza que deseja excluir este item da ordem de serviço?')) {
            setOrderItems(prevItems => prevItems.filter(item => item.id !== itemId));
        }
    };

    return (
        <div className="partner-form-container">
            {isSearchModalOpen && currentSearchConfig && (
                <SearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelect={handleSelectResult}
                    config={currentSearchConfig}
                />
            )}
            {isEditModalOpen && editingItem && (
                <EditItemModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveItem}
                    item={editingItem}
                />
            )}
            <form onSubmit={handleSubmit} className="partner-form">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="partner-form-title" style={{ display: 'flex', alignItems: 'center', gap: '10px'}}>Ordem de Serviço <span style={{ marginTop: '5px', color: 'rgba(255, 72, 0, 0.77)', fontSize: '14px', fontWeight: 'bold' }}>{loadedOrderId ? `#${loadedOrderId}` : ''}</span></h1>

                    <div className="form-actions-main">

                        <button type="button" className="action-button submit" onClick={handleNewClick}><AddIcon fontSize="small" />Nova Ordem de Serviço</button>
                        <button type="button" className="action-button search" onClick={handleSearchClick}><SearchIcon fontSize="small" />Pesquisar</button>
                        {showDetailedActions && (
                            <>
                                <button type="button" className="action-button update" onClick={handleEditClick} disabled={!loadedOrderId || formMode !== 'view'}><Edit fontSize="small" />Alterar</button>
                                <button type="button" className="action-button delete" onClick={handleDeleteClick} disabled={!loadedOrderId}><Delete fontSize="small" />Excluir</button>
                            </>
                        )}
                    </div>
                </div>

                {/* --- SELEÇÃO DE PARCEIROS --- */}
                <div className="form-section">
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Animal</label>
                            <div className="input-with-search">
                                <input value={formData.animal} readOnly={isReadOnly} placeholder="Selecione um animal..." />
                                <button type="button" className="search-modal-button" onClick={() => handleOpenSearchModal(animalSearchConfig, 'animal')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Tutor</label>
                            <div className="input-with-search">
                                <input value={formData.tutor} readOnly={isReadOnly} placeholder="Selecione um tutor..." />
                                <button type="button" className="search-modal-button" onClick={() => handleOpenSearchModal(tutorSearchConfig, 'tutor')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
                            </div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Clínica</label>
                            <div className="input-with-search">
                                <input value={formData.clinic} readOnly={isReadOnly} placeholder="Selecione uma clínica..." />
                                <button type="button" className="search-modal-button" onClick={() => handleOpenSearchModal(clinicSearchConfig, 'clinic')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Veterinário</label>
                            <div className="input-with-search">
                                <input value={formData.veterinarian} readOnly={isReadOnly} placeholder="Selecione um veterinário..." />
                                <button type="button" className="search-modal-button" onClick={() => handleOpenSearchModal(veterinarianSearchConfig, 'veterinarian')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
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
                                <input name="providerUnit" value={formData.providerUnit} readOnly={isReadOnly} placeholder="Selecione uma unidade..." />
                                <button type="button" className="search-modal-button" onClick={() => handleOpenSearchModal(operationalUnitSearchConfig, 'providerUnit')} disabled={isReadOnly}><SearchIcon fontSize="small" /></button>
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
                                <input value={formData.species} readOnly={isReadOnly} placeholder="Selecione uma espécie..." />
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
                            {showDetailedActions && (
                                <div className="item-actions">
                                    <button type="button" className="item-button add" onClick={handleAddItem} disabled={isReadOnly}><AddCircleOutline fontSize="small" /> Incluir</button>
                                </div>
                            )}
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
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.status}</td>
                                            <td>{item.service}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit}</td>
                                            <td>{item.price}</td>
                                            <td>{item.discount}</td>
                                            <td>{item.applicationValue}</td>
                                            <td>{new Date(item.deliveryDate).toLocaleDateString('pt-BR')}</td>
                                            <td className="action-cell">
                                                <button type="button" className="edit-item-button" onClick={() => handleEditItem(item.id)} disabled={isReadOnly} title="Editar item"><Edit fontSize="small" /></button>
                                                <button type="button" className="delete-item-button" onClick={() => handleDeleteItem(item.id)} disabled={isReadOnly} title="Excluir item"><Delete fontSize="small" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {orderItems.length === 0 && (
                                        <tr>
                                            <td colSpan={9} style={{ textAlign: 'center' }}>Nenhum item adicionado.</td>
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
                        <button type="button" className="action-button cancel" onClick={handleCancelClick}><CloseIcon fontSize="small" />Cancelar</button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default ServiceOrderForm;
