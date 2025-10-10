import React, { useState } from 'react';
import './PartnerForm.css';
import SearchModal, { SearchConfig, SearchResult } from '../../../../components/SearchModal';

// Importando os ícones do Material-UI
import PersonIcon from '@mui/icons-material/Person';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BadgeIcon from '@mui/icons-material/Badge';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import SignpostIcon from '@mui/icons-material/Signpost';
import NumbersIcon from '@mui/icons-material/Numbers';
import AddHomeIcon from '@mui/icons-material/AddHome';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PublicIcon from '@mui/icons-material/Public';
import LanguageIcon from '@mui/icons-material/Language';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function PartnerForm({ title, labels, partnerType }) {
    const [formData, setFormData] = useState({
        // Dados Gerais
        code: '',
        lgpdConsent: 'A',
        gender: '',
        status: 'Ativo', // Default status
        name: '',
        nomeFantasia: '',
        document: '',
        priceTable: '',
        isMonthlyPayer: 'Não',
        paymentDay: '',
        // Endereço
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        // Internet
        site: '',
        email1: '',
        email2: '',
        internetPassword: '',
        relationshipType: '',
        // Telefones
        phones: [
            { number: '', type: 'Cel' },
            { number: '', type: 'Cel' },
            { number: '', type: 'Cel' },
            { number: '', type: 'Cel' }
        ]
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handlePhoneChange = (index, field, value) => {
        const newPhones = [...formData.phones];
        newPhones[index][field] = value;
        setFormData(prevState => ({ ...prevState, phones: newPhones }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Dados do formulário:', formData);
        alert(`${title} cadastrado com sucesso! (Verifique o console para ver os dados)`);
        // Aqui você pode adicionar a lógica para enviar os dados para o backend
    };

     // Estado para controlar o modal
     const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    const handleOpenSearchModal = () => {
        setIsSearchModalOpen(true);
    };

    const handleSelectPartner = (partner: SearchResult) => {
        console.log('Parceiro Selecionado:', partner);
        // Preenche o formulário com os dados do parceiro selecionado.
        setFormData({
            ...formData,
            code: partner.id.toString(),
            document: partner.document,
            name: partner.name,
            email1: partner.email || '',
            phones: [
                { number: partner.phone || '', type: 'Cel' },
                ...formData.phones.slice(1)
            ],
            // Adicione outros campos conforme necessário
        });
    };

    // --- DADOS E CONFIGURAÇÃO PARA O MODAL DE PESQUISA (Exemplo) ---
const mockPartners: SearchResult[] = [
    { id: 101, name: 'JOAO DA SILVA', document: '341.459.725-70',  email: 'matriz@vertis.com', phone: '11999998888' },
    { id: 102, name: 'MARIA EDUARDA OLIVEIRA', document: '111.222.333-44',  email: 'sp@vertis.com', phone: '11777776666' },
    { id: 103, name: 'ANA CAROLINE FIGUEIREDO', document: '222.333.444-55',  email: 'contato@vetabc.com', phone: '1144332211' },
];

    const PartnerSearchConfig: SearchConfig = {
        title: `Pesquisar ${title}`,
        searchOptions: [
            { value: 'name', label: 'Nome' },
            { value: 'document', label: 'CPF' },
            { value: 'email', label: 'E-mail' },
            { value: 'phone', label: 'Telefone' },
        ],
        resultHeaders: [
            { key: 'id', label: 'Código' },
            { key: 'name', label: 'Nome' },
            { key: 'document', label: 'CNPJ' },
            { key: 'email', label: 'E-mail' },
            { key: 'phone', label: 'Telefone' },
        ],
        mockData: mockPartners,
    };
    // --- FIM DADOS E CONFIGURAÇÃO ---


    return (
        <div className="partner-form-container">
            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onSelect={handleSelectPartner}
                config={PartnerSearchConfig}
            />

            <form onSubmit={handleSubmit} className="partner-form">
                {/* --- DADOS GERAIS --- */}
                <div className="form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', marginBottom: '10px', paddingBottom: '25px' }}>
                        <h1 className="partner-form-title">{title}</h1>

                        <div className="form-actions">
                            <button type="submit" className="action-button submit"><AddIcon fontSize="small" />Cadastrar</button>
                            <button type="button" className="action-button update" onClick={() => alert('Função "Alterar" a ser implementada.')}><EditIcon fontSize="small" />Alterar</button>
                            <button type="button" className="action-button search" onClick={handleOpenSearchModal}><SearchIcon fontSize="small" />Pesquisar</button>
                            <button type="button" className="action-button delete" onClick={() => alert('Função "Excluir" a ser implementada.')}><DeleteIcon fontSize="small" />Excluir</button>
                        </div>
                    </div>

                    <div className="form-row" style={{marginTop: '25px'}}>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="code">Código</label>
                            <div className="input-with-icon">
                                <QrCode2Icon />
                                <input type="text" id="code" name="code" value={formData.code} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-group" style={{ flex: 0.5 }}>
                            <label htmlFor="lgpdConsent" className="lgpd-label">LGPD</label>
                            <select id="lgpdConsent" name="lgpdConsent" value={formData.lgpdConsent} onChange={handleChange}>
                                <option value="N">Não aceitou</option>
                                <option value="S">Aceitou a política</option>
                                <option value="A">Ainda não respondeu</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="document">{labels.documentLabel}</label>
                            <div className="input-with-icon">
                                <BadgeIcon />
                                <input type="text" id="document" name="document" value={formData.document} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label htmlFor="name">{labels.nameLabel}</label>
                            <div className="input-with-icon">
                                <PersonIcon />
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="status">Situação</label>
                            <select id="status" name="status" value={formData.status} onChange={handleChange}>
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                                <option value="Bloqueado">Bloqueado</option>
                                <option value="Suspenso">Suspenso</option>
                            </select>
                        </div>

                    </div>
                    <div className="form-row">
                    </div>

                    {(partnerType === 'tutor' || partnerType === 'veterinario') && (
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor="priceTable">Tabela de Preço</label>
                                <div className="input-with-icon">
                                    <PriceCheckIcon />
                                    <input type="text" id="priceTable" name="priceTable" value={formData.priceTable} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 0.4 }}>
                                <label>Mensalista</label>
                                <div className="form-group">
                                    <select name="isMonthlyPayer" id="isMonthlyPayer" value={formData.isMonthlyPayer} onChange={handleChange}>
                                        <option value="Sim">Sim</option>
                                        <option value="Não">Não</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 0.5 }}>
                                <label htmlFor="paymentDay">Dia de Pagamento</label>
                                <div className="input-with-icon">
                                    <CalendarTodayIcon />
                                    <input type="number" id="paymentDay" name="paymentDay" value={formData.paymentDay} onChange={handleChange} min="1" max="31" />
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor="gender">Sexo</label>
                                <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                                    <option value="">Selecione...</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Outro">Outro</option>
                                    <option value="NaoInformado">Não Informado</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {(partnerType === 'clinica' || partnerType === 'fornecedor') && (

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label htmlFor="nomeFantasia">Nome Fantasia</label>
                                <div className="input-with-icon">
                                    <StorefrontIcon />
                                    <input type="text" id="nomeFantasia" name="nomeFantasia" value={formData.nomeFantasia} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor="priceTable">Tabela de Preço</label>
                                <div className="input-with-icon">
                                    <PriceCheckIcon />
                                    <input type="text" id="priceTable" name="priceTable" value={formData.priceTable} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 0.4 }}>
                                <label>Mensalista</label>
                                <div className="form-group">
                                    <select name="isMonthlyPayer" id="isMonthlyPayer" value={formData.isMonthlyPayer} onChange={handleChange}>
                                        <option value="Sim">Sim</option>
                                        <option value="Não">Não</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 0.5 }}>
                                <label htmlFor="paymentDay">Dia de Pagamento</label>
                                <div className="input-with-icon">
                                    <CalendarTodayIcon />
                                    <input type="number" id="paymentDay" name="paymentDay" value={formData.paymentDay} onChange={handleChange} min="1" max="31" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- ENDEREÇO --- */}
                <div className="form-section">
                    <h2 className="form-section-title">Endereço</h2>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="zipCode">CEP</label>
                            <div className="input-with-icon"><MarkunreadMailboxIcon /><input type="text" id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 3 }}>
                            <label htmlFor="street">Logradouro</label>
                            <div className="input-with-icon"><SignpostIcon /><input type="text" id="street" name="street" value={formData.street} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="number">Número</label>
                            <div className="input-with-icon"><NumbersIcon /><input type="text" id="number" name="number" value={formData.number} onChange={handleChange} /></div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="complement">Complemento</label>
                            <div className="input-with-icon"><AddHomeIcon /><input type="text" id="complement" name="complement" value={formData.complement} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="neighborhood">Bairro</label>
                            <div className="input-with-icon"><LocationCityIcon /><input type="text" id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="city">Cidade</label>
                            <div className="input-with-icon"><LocationCityIcon /><input type="text" id="city" name="city" value={formData.city} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 0.5 }}>
                            <label htmlFor="state">Estado</label>
                            <div className="input-with-icon"><PublicIcon /><input type="text" id="state" name="state" value={formData.state} onChange={handleChange} /></div>
                        </div>
                    </div>
                </div>

                {/* --- ENDEREÇOS NA INTERNET --- */}
                <div className="form-section">
                    <h2 className="form-section-title">Endereços na Internet</h2>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label htmlFor="site">Site</label>
                            <div className="input-with-icon">
                                <LanguageIcon />
                                <input type="url" id="site" name="site" value={formData.site} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="relationshipType">Relacionamento</label>
                            <select id="relationshipType" name="relationshipType" value={formData.relationshipType} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                <option value="Internet">Internet</option>
                                <option value="Email">Email</option>
                                <option value="Internet/Email">Internet/Email</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="email1">E-mail 1</label>
                            <div className="input-with-icon"><EmailIcon /><input type="email" id="email1" name="email1" value={formData.email1} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="email2">E-mail 2</label>
                            <div className="input-with-icon"><EmailIcon /><input type="email" id="email2" name="email2" value={formData.email2} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="internetPassword">Senha Acesso Internet</label>
                            <div className="input-with-icon">
                                <LockIcon />
                                <input type="password" id="internetPassword" name="internetPassword" value={formData.internetPassword} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TELEFONES --- */}
                <div className="form-section">
                    <h2 className="form-section-title">Telefones</h2>
                    {formData.phones.map((phone, index) => (
                        <div className="form-row" key={index}>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label htmlFor={`phone_number_${index}`}>Telefone {index + 1}</label>
                                <div className="input-with-icon">
                                    <PhoneIcon />
                                    <input type="tel" id={`phone_number_${index}`} name="number" value={phone.number} onChange={(e) => handlePhoneChange(index, 'number', e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor={`phone_type_${index}`}>Identificação</label>
                                <select id={`phone_type_${index}`} name="type" value={phone.type} onChange={(e) => handlePhoneChange(index, 'type', e.target.value)}>
                                    <option value="Tel">Telefone</option>
                                    <option value="Cel">Celular</option>
                                    <option value="Whatsapp">Whatsapp</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

            </form>
        </div>
    );
}

export default PartnerForm;