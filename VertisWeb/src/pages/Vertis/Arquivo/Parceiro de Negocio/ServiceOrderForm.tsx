import React, { useState } from 'react';
import '../../../Vertis/Arquivo/Parceiro de Negocio/PartnerForm.css'; // Reutilizando o mesmo estilo
import '../../../Vertis/Operacional/Ordem de Serviço/ServiceOrderForm.css'; // Estilos específicos para esta página

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
    const showItemsBlock = formMode === 'new' || (formMode === 'edit' || (formMode === 'view' && loadedOrderId !== null));

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
        // Limpar formData e orderItems se necessário
        setFormData({
            priceTable: '', animal: '', breed: '', tutor: '', clinic: '', veterinarian: '',
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
        alert('Abriria o modal de pesquisa...');
        // Simulando que uma OS foi encontrada e selecionada
        const foundId = 12345;
        setLoadedOrderId(foundId);
        setFormData({ ...formData, providerUnit: `Unidade da OS ${foundId}` }); // Popula o form
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
            setFormData({ priceTable: '', animal: '', breed: '', tutor: '', clinic: '', veterinarian: '', providerUnit: '', type: 'Serviço', onCredit: 'Não', origin: '', animalGender: '', animalDob: '', species: '', isNeutered: 'Não', weight: '' });
            setOrderItems([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Dados da Ordem de Serviço:', { ...formData, items: orderItems });
        alert('Ordem de Serviço criada com sucesso! (Verifique o console)');
    };

    return (
        <div className="partner-form-container">
            <h1 className="partner-form-title">Ordem de Serviço</h1>
            <form onSubmit={handleSubmit} className="partner-form">
                <div className="form-actions-main">
                    <button type="button" className="action-button submit" onClick={handleNewClick}><AddIcon fontSize="small" />Incluir</button>
                    <button type="button" className="action-button update" onClick={handleEditClick} disabled={!loadedOrderId || formMode !== 'view'}><Edit fontSize="small" />Alterar</button>
                    <button type="button" className="action-button search" onClick={handleSearchClick}><SearchIcon fontSize="small" />Pesquisar</button>
                    <button type="button" className="action-button delete" onClick={handleDeleteClick} disabled={!loadedOrderId}><Delete fontSize="small" />Excluir</button>
                </div>

                {/* --- SELEÇÃO DE PARCEIROS (Botão lateral) --- */}
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

```

### 2. Crie o Arquivo CSS Separado

Este é o arquivo de estilo específico para a tela de Ordem de Serviço, como você corretamente observou.

**Crie o arquivo `c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\pages\Operacional\Ordem de Serviço\ServiceOrderForm.css`:**

```diff
--- /dev/null
+++ b/c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\pages\Operacional\Ordem de Serviço\ServiceOrderForm.css
@@ -0,0 +1,84 @@
.items-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.item-actions {
    display: flex;
    gap: 10px;
}

.item-button {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 0.85rem;
    transition: opacity 0.3s;
}

.item-button:hover {
    opacity: 0.85;
}

.item-button.add { background-color: #2ecc71; }
.item-button.edit { background-color: #3498db; }
.item-button.delete { background-color: #e74c3c; }

.items-table-container {
    overflow-x: auto;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.items-table th, .items-table td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
}

.items-table th {
    background-color: #f2f2f2;
    color: #333;
    font-weight: 600;
}

.items-table tbody tr:nth-child(even) {
    background-color: #f9f9f9;
}

.items-table tbody tr:hover {
    background-color: #f1f1f1;
}

.form-footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #777;
}

/* Ajustes para campos de seleção que serão preenchidos automaticamente */
.partner-form input[readOnly] {
    background-color: #f0f0f0;
    cursor: not-allowed;
    color: #555;
}

```

### 3. Crie a Página Principal (`ServiceOrderPage.tsx`)

Esta página irá renderizar o menu e o formulário que acabamos de criar.

**Crie o arquivo `c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\pages\Operacional\Ordem de Serviço\ServiceOrderPage.tsx`:**

```diff
--- /dev/null
+++ b/c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\pages\Operacional\Ordem de Serviço\ServiceOrderPage.tsx
@@ -0,0 +1,19 @@
import React, { useEffect } from 'react';
import Menu from '../../../Menu/Menu.tsx';
import ServiceOrderForm from './ServiceOrderForm.tsx';

function ServiceOrderPage() {

    useEffect(() => {
        document.title = "Vertis | Ordem de Serviço";
    }, []);

    return (
        <>
            <Menu />
            <ServiceOrderForm />
        </>
    );
}

export default ServiceOrderPage;

```

### 4. Atualize as Rotas e o Menu

Por fim, vamos conectar a nova página ao sistema de navegação.

**Arquivo: `c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\routes.tsx`**

```diff
--- a/c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\routes.tsx
+++ b/c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\routes.tsx
@@ -7,12 +7,14 @@
 import Dashboard from './pages/Dashboard/Dashboard.tsx';
 import PartnerPage from './pages/Vertis/Arquivo/Parceiro de Negocio/PartnerPage.tsx';
 import OperationalUnitPage from './pages/Vertis/Arquivo/Unidades Operacionais/OperationalUnitPage.tsx';
+import ServiceOrderPage from './pages/Operacional/Ordem de Serviço/ServiceOrderPage.tsx';
 
 function AppRoutes() {
 
   return (
     <Routes>
       <Route index element={<Home />} />
+      <Route path="/ordem-de-servico" element={<ServiceOrderPage />} />
       <Route path="/unidades-operacionais" element={<OperationalUnitPage />} />
       <Route path="/parceiros/:partnerType" element={<PartnerPage />} />
       <Route path="/login" element={<Login />} />

```

**Arquivo: `c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\pages\Menu\Menu.tsx`**

```diff
--- a/c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\pages\Menu\Menu.tsx
+++ b/c:\Users\Admin\Documents\VertisWeb\VertisWeb\src\pages\Menu\Menu.tsx
@@ -55,7 +55,7 @@
     {
         label: 'Operacional',
         items: [
-            { label: 'Ordem de Serviço', path: '#' },
+            { label: 'Ordem de Serviço', path: '/ordem-de-servico' },
             { label: 'Agendas', path: '#' },
             { label: 'Admissões', path: '#' },
             { label: 'Mapa de Trabalho', path: '#' },

```

Agora sim! Com todos os arquivos devidamente separados, a nova tela de Ordem de Serviço está pronta e integrada ao seu projeto.

<!--
[PROMPT_SUGGESTION]Como posso implementar a funcionalidade do botão "Selecionar Parceiros" para abrir um modal?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Adicione a funcionalidade de "Incluir" item na tabela da Ordem de Serviço.[/PROMPT_SUGGESTION]
-->