import React, { useState } from 'react';
import SearchModal, { SearchConfig, SearchResult } from '../../../../components/SearchModal';
import '../Parceiro de Negocio/PartnerForm.css'; // Reutilizando o mesmo estilo

// Importando ícones
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ArticleIcon from '@mui/icons-material/Article';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BusinessIcon from '@mui/icons-material/Business';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import LanguageIcon from '@mui/icons-material/Language';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import SignpostIcon from '@mui/icons-material/Signpost';
import NumbersIcon from '@mui/icons-material/Numbers';
import AddHomeIcon from '@mui/icons-material/AddHome';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PublicIcon from '@mui/icons-material/Public';
import PhoneIcon from '@mui/icons-material/Phone';

// --- DADOS E CONFIGURAÇÃO PARA O MODAL DE PESQUISA (Exemplo) ---
const mockOperationalUnits: SearchResult[] = [
    { id: 101, name: 'Vertis Matriz', document: '11.222.333/0001-44', corporateName: 'Vertis Tecnologia Ltda', email: 'matriz@vertis.com', phone: '11999998888' },
    { id: 102, name: 'Vertis Filial SP', document: '11.222.333/0002-55', corporateName: 'Vertis Tecnologia Filial SP', email: 'sp@vertis.com', phone: '11777776666' },
    { id: 103, name: 'Clínica Vet ABC', document: '44.555.666/0001-77', corporateName: 'Clínica Veterinária ABC Ltda', email: 'contato@vetabc.com', phone: '1144332211' },
];

const operationalUnitSearchConfig: SearchConfig = {
    title: 'Pesquisar Unidade Operacional',
    searchOptions: [
        { value: 'name', label: 'Nome Fantasia' },
        { value: 'corporateName', label: 'Razão Social' },
        { value: 'document', label: 'CNPJ' },
        { value: 'email', label: 'E-mail' },
        { value: 'phone', label: 'Telefone' },
    ],
    resultHeaders: [
        { key: 'id', label: 'Código' },
        { key: 'name', label: 'Nome Fantasia' },
        { key: 'corporateName', label: 'Razão Social' },
        { key: 'document', label: 'CNPJ' },
    ],
    mockData: mockOperationalUnits,
};
// --- FIM DADOS E CONFIGURAÇÃO ---


function OperationalUnitForm() {
    const [formData, setFormData] = useState({
        code: '',
        mapaRegistry: '',
        cnpj: '',
        stateRegistry: '',
        businessUnit: '',
        municipalRegistry: '',
        operationalUnit: '',
        corporateName: '',
        shortName: '',
        crmv: '',
        type: 'Clínica',
        status: 'Ativo',
        interfaceFilePath: '',
        isMasterUnit: false,
        usePriceTableFrom: '',
        billingUnit: 'Unidade Master',
        homepage: '',
        email: '',
        startTime: '',
        endTime: '',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        phones: [
            { number: '', type: 'Cel' }, { number: '', type: 'Cel' },
            { number: '', type: 'Cel' }, { number: '', type: 'Cel' }
        ],
    });

    // Estado para controlar o modal
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePhoneChange = (index, field, value) => {
        const newPhones = [...formData.phones];
        newPhones[index][field] = value;
        setFormData(prevState => ({ ...prevState, phones: newPhones }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Dados da Unidade Operacional:', formData);
        alert(`Unidade Operacional cadastrada com sucesso! (Verifique o console para ver os dados)`);
    };

    const handleOpenSearchModal = () => {
        setIsSearchModalOpen(true);
    };

    const handleSelectUnit = (unit: SearchResult) => {
        console.log('Unidade Selecionada:', unit);
        // Preenche o formulário com os dados da unidade selecionada
        setFormData({
            ...formData, // Mantém outros dados que não vêm da busca
            code: unit.id.toString(),
            cnpj: unit.document || '',
            operationalUnit: unit.name,
            corporateName: unit.corporateName || '',
            shortName: unit.name,
            email: unit.email || '',
            // Adicione outros campos conforme necessário
        });
    };

    return (
        <div className="partner-form-container">
            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onSelect={handleSelectUnit}
                config={operationalUnitSearchConfig}
            />
            <h1 className="partner-form-title">Unidades Operacionais</h1>
            <form onSubmit={handleSubmit} className="partner-form">
                <div className="form-actions">
                    <button type="submit" className="action-button submit">Cadastrar</button>
                    <button type="button" className="action-button update" onClick={() => alert('Função "Alterar" a ser implementada.')}>Alterar</button>
                    <button type="button" className="action-button search" onClick={handleOpenSearchModal}>Pesquisar</button>
                    <button type="button" className="action-button delete" onClick={() => alert('Função "Excluir" a ser implementada.')}>Excluir</button>
                </div>

                <div className="form-section">
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}><label>Código</label><div className="input-with-icon"><QrCode2Icon /><input name="code" value={formData.code} onChange={handleChange} /></div></div>
                        <div className="form-group" style={{ flex: 1 }}><label>N° Registro MAPA</label><div className="input-with-icon"><ArticleIcon /><input name="mapaRegistry" value={formData.mapaRegistry} onChange={handleChange} /></div></div>
                        <div className="form-group" style={{ flex: 1 }}><label>CNPJ</label><div className="input-with-icon"><BadgeIcon /><input name="cnpj" value={formData.cnpj} onChange={handleChange} /></div></div>
                        <div className="form-group" style={{ flex: 1 }}><label>Estadual</label><div className="input-with-icon"><BadgeIcon /><input name="stateRegistry" value={formData.stateRegistry} onChange={handleChange} /></div></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}><label>Unidade de Negócio</label><div className="input-with-icon"><BusinessCenterIcon /><input name="businessUnit" value={formData.businessUnit} onChange={handleChange} /></div></div>
                        <div className="form-group" style={{ flex: 1 }}><label>Municipal</label><div className="input-with-icon"><BadgeIcon /><input name="municipalRegistry" value={formData.municipalRegistry} onChange={handleChange} /></div></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}><label>Unidade Operacional</label><div className="input-with-icon"><ApartmentIcon /><input name="operationalUnit" value={formData.operationalUnit} onChange={handleChange} /></div></div>
                        <div className="form-group" style={{ flex: 2 }}><label>Razão Social</label><div className="input-with-icon"><BusinessIcon /><input name="corporateName" value={formData.corporateName} onChange={handleChange} /></div></div>
                        <div className="form-group" style={{ flex: 1 }}><label>Nome Reduzido</label><div className="input-with-icon"><TextFieldsIcon /><input name="shortName" value={formData.shortName} onChange={handleChange} /></div></div>
                        <div className="form-group" style={{ flex: 1 }}><label>CRMV</label><div className="input-with-icon"><BadgeIcon /><input name="crmv" value={formData.crmv} onChange={handleChange} /></div></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>Tipo</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option>Clínica</option><option>Laboratório</option><option>PetShop</option><option>Centro Médico</option>
                                <option>Ambulatório</option><option>Hospital</option><option>Operadora</option>
                                <option>Prestador de Serviço</option><option>Remoções</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Situação</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option>Ativo</option><option>Inativo</option><option>Suspenso</option><option>Bloqueado</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}><label>Path arquivo interface</label><div className="input-with-icon"><FolderOpenIcon /><input name="interfaceFilePath" value={formData.interfaceFilePath} onChange={handleChange} /></div></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" name="isMasterUnit" checked={formData.isMasterUnit} onChange={handleChange} id="isMasterUnit" style={{ width: 'auto' }} />
                            <label htmlFor="isMasterUnit" style={{ marginBottom: 0 }}>Unidade master</label>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}><label>Utilizar a tabela de preços de</label><div className="input-with-icon"><PriceCheckIcon /><input name="usePriceTableFrom" value={formData.usePriceTableFrom} onChange={handleChange} /></div></div>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Faturamento e Internet</h2>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Faturamento de Convênio</label>
                            <select name="billingUnit" value={formData.billingUnit} onChange={handleChange}><option>Unidade Master</option></select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}><label>Home page</label><div className="input-with-icon"><LanguageIcon /><input name="homepage" value={formData.homepage} onChange={handleChange} /></div></div>
                        <div className="form-group" style={{ flex: 1 }}><label>E-mail</label><div className="input-with-icon"><EmailIcon /><input type="email" name="email" value={formData.email} onChange={handleChange} /></div></div>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Horário de Funcionamento</h2>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}><label>Início</label><div className="input-with-icon"><AccessTimeIcon /><input type="time" name="startTime" value={formData.startTime} onChange={handleChange} /></div></div>
                        <div className="form-group" style={{ flex: 1 }}><label>Término</label><div className="input-with-icon"><AccessTimeIcon /><input type="time" name="endTime" value={formData.endTime} onChange={handleChange} /></div></div>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Endereço</h2>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>CEP</label>
                            <div className="input-with-icon"><MarkunreadMailboxIcon /><input name="zipCode" value={formData.zipCode} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 3 }}>
                            <label>Logradouro</label>
                            <div className="input-with-icon"><SignpostIcon /><input name="street" value={formData.street} onChange={handleChange} /></div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Número</label>
                            <div className="input-with-icon"><NumbersIcon /><input name="number" value={formData.number} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Complemento</label>
                            <div className="input-with-icon"><AddHomeIcon /><input name="complement" value={formData.complement} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Bairro</label>
                            <div className="input-with-icon"><LocationCityIcon /><input name="neighborhood" value={formData.neighborhood} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Cidade</label>
                            <div className="input-with-icon"><LocationCityIcon /><input name="city" value={formData.city} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group" style={{ flex: 0.5 }}>
                            <label>Estado</label>
                            <div className="input-with-icon"><PublicIcon /><input name="state" value={formData.state} onChange={handleChange} /></div>
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
                                    <option value="Tel">Telefone</option><option value="Cel">Celular</option><option value="Whatsapp">Whatsapp</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </form>
        </div>
    );
}

export default OperationalUnitForm;