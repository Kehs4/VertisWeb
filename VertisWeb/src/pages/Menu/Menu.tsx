import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Menu.css'
import { ChevronRight as ChevronRightIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

// Tipagem para os itens do menu para garantir a consistência dos dados
interface MenuItem {
    id: string; // Unique ID for each menu item
    label: string;
    path?: string;
    items?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard'
    },
    {
        id: 'arquivo-parceiro-negocio',
        label: 'Parceiro de Negócio',
        items: [
            { id: 'arquivo-parceiro-negocio-tutor', label: 'Tutor', path: '/parceiros/tutor' },
            { id: 'arquivo-parceiro-negocio-clinica', label: 'Clínica', path: '/parceiros/clinica' },
            { id: 'arquivo-parceiro-negocio-veterinario', label: 'Veterinário', path: '/parceiros/veterinario' },
            { id: 'arquivo-parceiro-negocio-fornecedor', label: 'Fornecedor', path: '/parceiros/fornecedor' }
        ]
    },
    {
        id: 'arquivo-unidade-negocio',
        label: 'Unidade de Negócio',
        items: [
            { id: 'arquivo-unidade-negocio-operacionais', label: 'Unidades Operacionais', path: '/unidades-operacionais' }
        ]
    },
    { id: 'arquivo-exames', label: 'Exames', path: '#' },
    { id: 'arquivo-animal', label: 'Animal', path: '#' },
    {
        id: 'operacional',
        label: 'Operacional',
        items: [
            { id: 'operacional-ordem-servico', label: 'Ordem de Serviço', path: '/ordem-de-servico' },
            { id: 'operacional-agendas', label: 'Agendas', path: '#' },
            { id: 'operacional-admissoes', label: 'Admissões', path: '#' },
            { id: 'operacional-mapa-trabalho', label: 'Mapa de Trabalho', path: '#' },
        ],
    },
    {
        id: 'financeiro',
        label: 'Financeiro',
        items: [
            { id: 'financeiro-caixa', label: 'Caixa', path: '#' },
            { id: 'financeiro-faturamentos', label: 'Faturamentos', path: '#' },
            { id: 'financeiro-contas', label: 'Contas a Pagar e Receber', path: '#' },
            { id: 'financeiro-orcamentos', label: 'Orçamentos', path: '#' },
        ],
    },
    {
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
    { id: 'pesquisa', label: 'Pesquisa', path: '#' },
    { id: 'suprimentos', label: 'Suprimentos', path: '#' },
    { id: 'interface', label: 'Interface', path: '#' },
    { id: 'crm', label: 'CRM', path: '#' },
    { id: 'ajuda', label: 'Ajuda', path: '#' },
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
                                    {item.label}
                                    {openMainMenuId === item.id ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                </div>
                            ) : (
                                <Link to={item.path || '#'} className='menu-link' onClick={onClose}>
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
                                                {subItem.label}
                                                {openSubmenuId === subItem.id ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                            </div>
                                        ) : (
                                            <Link to={subItem.path || '#'} className='submenu-link' onClick={onClose}>
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