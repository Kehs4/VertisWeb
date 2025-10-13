import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Menu.css'
import { ChevronRight as ChevronRightIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import BiotechIcon from '@mui/icons-material/Biotech';
import PetsIcon from '@mui/icons-material/Pets';
import HandymanIcon from '@mui/icons-material/Handyman';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import TerminalIcon from '@mui/icons-material/Terminal';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import HelpIcon from '@mui/icons-material/Help';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EmergencyIcon from '@mui/icons-material/Emergency';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import FormatListBulletedAddIcon from '@mui/icons-material/FormatListBulletedAdd';
import TodayIcon from '@mui/icons-material/Today';
import HealingIcon from '@mui/icons-material/Healing';
import Diversity2Icon from '@mui/icons-material/Diversity2';
import AssuredWorkloadIcon from '@mui/icons-material/AssuredWorkload';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InsightsIcon from '@mui/icons-material/Insights';

// Tipagem para os itens do menu para garantir a consistência dos dados
interface MenuItem {
    id: string; // Unique ID for each menu item
    icon?: React.ReactNode; // Icon for the menu item
    label: string;
    path?: string;
    items?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        id: 'dashboard',
        icon: <DashboardIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />,
        label: 'Dashboard',
        path: '/dashboard'
    },
    {
        icon: <GroupIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />,
        id: 'arquivo-parceiro-negocio',
        label: 'Parceiro de Negócio',
        items: [
            { id: 'arquivo-parceiro-negocio-tutor', icon: <PersonSearchIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Tutor', path: '/parceiros/tutor' },
            { id: 'arquivo-parceiro-negocio-clinica', icon: <EmergencyIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Clínica', path: '/parceiros/clinica' },
            { id: 'arquivo-parceiro-negocio-veterinario', icon: <MedicalServicesIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Veterinário', path: '/parceiros/veterinario' },
            { id: 'arquivo-parceiro-negocio-fornecedor', icon: <ContentPasteSearchIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Fornecedor', path: '/parceiros/fornecedor' }
        ]
    },
    {
        icon: <BusinessIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />,
        id: 'arquivo-unidade-negocio',
        label: 'Unidade de Negócio',
        items: [
            { id: 'arquivo-unidade-negocio-operacionais', icon: <AddBusinessIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Unidades Operacionais', path: '/unidades-operacionais' }
        ]
    },
    { id: 'arquivo-exames', icon: <BiotechIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Exames', path: '#' },
    { id: 'arquivo-animal', icon: <PetsIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Animal', path: '#' },
    {
        icon: <HandymanIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />,
        id: 'operacional',
        label: 'Operacional',
        items: [
            { id: 'operacional-ordem-servico', icon: <FormatListBulletedAddIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Ordem de Serviço', path: '/ordem-de-servico' },
            { id: 'operacional-agendas', icon: <TodayIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Agendas', path: '#' },
            { id: 'operacional-admissoes', icon: <HealingIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Admissões', path: '#' },
            { id: 'operacional-mapa-trabalho', icon: <Diversity2Icon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Mapa de Trabalho', path: '#' },
        ],
    },
    {
        icon: <MonetizationOnIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />,
        id: 'financeiro',
        label: 'Financeiro',
        items: [
            { id: 'financeiro-caixa', icon: <AssuredWorkloadIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Caixa', path: '#' },
            { id: 'financeiro-faturamentos', icon: <RequestQuoteIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Faturamentos', path: '#' },
            { id: 'financeiro-contas', icon: <CurrencyExchangeIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Contas a Pagar e Receber', path: '#' },
            { id: 'financeiro-orcamentos', icon: <ReceiptLongIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Orçamentos', path: '#' },
        ],
    },
    {
        icon: <AssessmentIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />,
        id: 'relatorios',
        label: 'Relatórios',
        items: [
            { id: 'relatorios-analise', label: 'Analise de Desempenho', path: '#' },
            { id: 'relatorios-cadastros', label: 'Cadastros por Parceiro', path: '#' },
            { id: 'relatorios-estatisticos', label: 'Estatísticos', path: '#' },
            { id: 'relatorios-prontuarios', label: 'Prontuários', path: '#' },
        ],
    },
    // Adicione outros menus conforme necessário
    { id: 'pesquisa', icon: <SearchIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Pesquisa', path: '#' },
    { id: 'suprimentos', icon: <InventoryIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Suprimentos', path: '#' },
    { id: 'interface', icon: <TerminalIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Interface', path: '#' },
    { id: 'crm', icon: <SupportAgentIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'CRM', path: '#' },
    { id: 'ajuda', icon: <HelpIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Ajuda', path: '#' },
    { id: 'suporte', icon: <InsightsIcon style={{ width: '20px', height: '20px' }} className='menu-icon' />, label: 'Dash Suporte', path: '/dashsuporte' }
];

interface MenuProps {
    isOpen: boolean;
    onClose: () => void;
}

function Menu({ isOpen, onClose }: MenuProps) {
    // State to manage which main menu item is open (for submenus)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [openMainMenuId, setOpenMainMenuId] = useState<string | null>(null);
    // State to manage which submenu item is open (for sub-submenus)
    const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
    const navigate = useNavigate();

    // Pega o nome do usuário do localStorage para exibição dinâmica
    const userName = localStorage.getItem('userName') || 'Usuário';

    const handleLogout = async () => {
        // Chama o endpoint de logout para limpar o cookie HttpOnly
        await fetch('/api/logout', { method: 'POST' });
        // Limpa o sinal de autenticação do frontend
        localStorage.removeItem('isAuthenticated');
        // Redireciona para a página de login
        localStorage.removeItem('userName');
        navigate('/login');
    };

    return (
        <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <nav className={`sidebar-container ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="sidebar-header">
                    <Link to={'/dashboard'} className='sidebar-logo-link' onClick={onClose}>
                        <img src="logo-white.png" alt="Vertis Logo" className="sidebar-logo" />
                    </Link>
                </div>
                <ul className='sidebar-menu'>
                    {menuItems.map((item) => (
                        <li key={item.id} className='sidebar-menu-item'>
                            {item.items ? (
                                <div
                                    className={`menu-toggle-button ${openMainMenuId === item.id ? 'active' : ''}`}
                                    onClick={() => setOpenMainMenuId(openMainMenuId === item.id ? null : item.id)}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {openMainMenuId === item.id ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                </div>
                            ) : (
                                <Link to={item.path || '#'} className='menu-link' onClick={onClose}>
                                    {item.icon}
                                    {item.label}
                                </Link>
                            )}

                            {/* Submenu */}
                            {item.items && (
                                <ul className={`sidebar-submenu ${openMainMenuId === item.id ? 'open' : ''}`}>
                                    {item.items.map((subItem) => (
                                        <li key={subItem.id} className='sidebar-submenu-item'>
                                            {subItem.items ? (
                                                <div
                                                    className={`submenu-toggle-button ${openSubmenuId === subItem.id ? 'active' : ''}`}
                                                    onClick={() => setOpenSubmenuId(openSubmenuId === subItem.id ? null : subItem.id)}
                                                >
                                                    {subItem.icon}
                                                    {subItem.label}
                                                    {openSubmenuId === subItem.id ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                                </div>
                                            ) : (
                                                <Link to={subItem.path || '#'} className='submenu-link' onClick={onClose}>
                                                    {subItem.icon}
                                                    {subItem.label}
                                                </Link>
                                            )}
                                            {/* Sub-submenu */}
                                            {subItem.items && (
                                                <ul className={`sidebar-subsubmenu ${openSubmenuId === subItem.id ? 'open' : ''}`}>
                                                    {subItem.items.map(option => (
                                                        <li key={option.id} className="sidebar-subsubmenu-item">
                                                            <Link to={option.path || '#'} className="subsubmenu-link" onClick={onClose}>
                                                                {option.label}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>)}
                        </li>
                    ))}

                </ul>
                <div className='user-logged-container'>
                    <div className='user-logged'>
                        <div className='user-image'>
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=ff5100&color=fff`}
                                alt="Foto de perfil"
                                className="user-avatar"
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid rgb(107, 107, 107)'
                                }}
                            />
                        </div>

                        <h3 className='user-name'>{userName}</h3>

                        <div className='user-logged-options' style={{ position: 'relative' }}>
                            <div className='user-logged-option'>
                                <button
                                    className="settings-button"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        borderRadius: '100px',
                                        alignItems: 'center',
                                    }}
                                    title="Configurações"
                                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.007 7.007 0 0 0-1.63-.94l-.36-2.53A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.5.42l-.36 2.53a7.007 7.007 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22l-1.92 3.32a.5.5 0 0 0 .12.64l2.03 1.58c-.04.3-.06.61-.06.94s.02.64.06.94L2.87 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.14.23.44.31.68.22l2.39-.96c.5.35 1.04.65 1.63.94l.36 2.53c.04.25.25.42.5.42h4c.25 0 .46-.17.5-.42l.36-2.53c.59-.29 1.14-.59 1.63-.94l2.39.96c.24.1.54.01.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
                                    </svg>
                                </button>
                            </div>
                            {isSettingsOpen && (
                                <div className="settings-panel">
                                    <button onClick={handleLogout} className="logout-button">
                                        Sair
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>


                </div>
            </nav>
        </div>
    )
}

export default Menu;