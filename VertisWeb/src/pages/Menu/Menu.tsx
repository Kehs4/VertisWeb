import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
import Icon from '@mui/material/Icon';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

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
        icon: <DashboardIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>,
        label: 'Dashboard',
        path: '/dashboard'
    },
    {
        icon: <GroupIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>,
        id: 'arquivo-parceiro-negocio',
        label: 'Parceiro de Negócio',
        items: [
            { id: 'arquivo-parceiro-negocio-tutor', icon: <PersonSearchIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Tutor', path: '/parceiros/tutor' },
            { id: 'arquivo-parceiro-negocio-clinica', icon: <EmergencyIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Clínica', path: '/parceiros/clinica' },
            { id: 'arquivo-parceiro-negocio-veterinario', icon: <MedicalServicesIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Veterinário', path: '/parceiros/veterinario' },
            { id: 'arquivo-parceiro-negocio-fornecedor', icon: <ContentPasteSearchIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Fornecedor', path: '/parceiros/fornecedor' }
        ]
    },
    {
        icon: <BusinessIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>,
        id: 'arquivo-unidade-negocio',
        label: 'Unidade de Negócio',
        items: [
            { id: 'arquivo-unidade-negocio-operacionais', icon: <AddBusinessIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Unidades Operacionais', path: '/unidades-operacionais' }
        ]
    },
    { id: 'arquivo-exames', icon: <BiotechIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Exames', path: '#' },
    { id: 'arquivo-animal', icon: <PetsIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Animal', path: '#' },
    {
        icon: <HandymanIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>,
        id: 'operacional',
        label: 'Operacional',
        items: [
            { id: 'operacional-ordem-servico', icon: <FormatListBulletedAddIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Ordem de Serviço', path: '/ordem-de-servico' },
            { id: 'operacional-agendas', icon: <TodayIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Agendas', path: '#' },
            { id: 'operacional-admissoes', icon: <HealingIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Admissões', path: '#' },
            { id: 'operacional-mapa-trabalho', icon: <Diversity2Icon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Mapa de Trabalho', path: '#' },
        ],
    },
    {
        icon: <MonetizationOnIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>,
        id: 'financeiro',
        label: 'Financeiro',
        items: [
            { id: 'financeiro-caixa', icon: <AssuredWorkloadIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Caixa', path: '#' },
            { id: 'financeiro-faturamentos', icon: <RequestQuoteIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Faturamentos', path: '#' },
            { id: 'financeiro-contas', icon: <CurrencyExchangeIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Contas a Pagar e Receber', path: '#' },
            { id: 'financeiro-orcamentos', icon: <ReceiptLongIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Orçamentos', path: '#' },
        ],
    },
    {
        icon: <AssessmentIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>,
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
    { id: 'pesquisa', icon: <SearchIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Pesquisa', path: '#' },
    { id: 'suprimentos', icon: <InventoryIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Suprimentos', path: '#' },
    { id: 'interface', icon: <TerminalIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Interface', path: '#' },
    { id: 'crm', icon: <SupportAgentIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'CRM', path: '#' },
    { id: 'ajuda', icon: <HelpIcon style={{width: '20px', height: '20px'}} className='menu-icon'/>, label: 'Ajuda', path: '#' },
];

interface MenuProps {
    isOpen: boolean;
    onClose: () => void;
}

function Menu({ isOpen, onClose }: MenuProps) {
    // State to manage which main menu item is open (for submenus)
    const [openMainMenuId, setOpenMainMenuId] = useState<string | null>(null);
    // State to manage which submenu item is open (for sub-submenus)
    const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);

    return (
        <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <nav className={`sidebar-container ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="sidebar-header">
                    <Link to={'/dashboard'} className='sidebar-logo-link' onClick={onClose}>
                        <img src="/public/logo-white.png" alt="Vertis Logo" className="sidebar-logo" />
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
            </nav>
        </div>
    )
}

export default Menu;