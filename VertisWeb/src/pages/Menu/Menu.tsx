import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../home/Home.css'
import './Menu.css'

// Tipagem para os itens do menu para garantir a consistência dos dados
interface MenuItem {
    label: string;
    path?: string;
    items?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        label: 'Arquivo',
        items: [
            {
                label: 'Parceiro de Negócio',
                items: [
                    { label: 'Tutor', path: '/parceiros/tutor' },
                    { label: 'Clínica', path: '/parceiros/clinica' },
                    { label: 'Veterinário', path: '/parceiros/veterinario' },
                    { label: 'Fornecedor', path: '/parceiros/fornecedor' }
                ]
            },
            {
                label: 'Unidade de Negócio', path: '#',
                items: [
                    { label: 'Unidades Operacionais', path: '/unidades-operacionais' }
                ]
            },
            { label: 'Exames', path: '#' },
            { label: 'Animal', path: '#' },
        ],
    },
    {
        label: 'Operacional',
        items: [
            { label: 'Ordem de Serviço', path: '/ordem-de-servico' },
            { label: 'Agendas', path: '#' },
            { label: 'Admissões', path: '#' },
            { label: 'Mapa de Trabalho', path: '#' },
        ],
    },
    {
        label: 'Financeiro',
        items: [
            { label: 'Caixa', path: '#' },
            { label: 'Faturamentos', path: '#' },
            { label: 'Contas a Pagar e Receber', path: '#' },
            { label: 'Orçamentos', path: '#' },
        ],
    },
    {
        label: 'Relatórios',
        items: [
            { label: 'Analise de Desempenho', path: '#' },
            { label: 'Cadastros por Parceiro', path: '#' },
            { label: 'Estatísticos', path: '#' },
            { label: 'Prontuários', path: '#' },
        ],
    },
    // Adicione outros menus conforme necessário
];

function Menu() {
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
    const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const submenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        document.title = "Vertis | Dashboard"
    }, []);

    return (
        <>
            <div className='header-vertis'>
                <Link to={'/dashboard'}>
                    <img src="/public/logo-white.png" alt="" width={60} height={40} />
                </Link>
                <div className='header-menu'>
                    <nav className='header-nav'>
                        {menuItems.map((item, idx) => (
                            <div
                                key={item.label}
                                className='menu-item'
                                onMouseEnter={() => {
                                    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
                                    setActiveMenu(idx);
                                }}
                                onMouseLeave={() => {
                                    menuTimeoutRef.current = setTimeout(() => { 
                                        setActiveMenu(null);
                                        setActiveSubmenu(null);
                                    }, 300);
                                }}
                                style={{ position: 'relative', display: 'inline-block' }}
                            >
                                <a href="#">{item.label}</a>
                                {/* Submenu */}
                                {activeMenu === idx && (
                                    <div className='vertical-submenu'>
                                        {item.items && item.items.map((subItem, subIdx) => (
                                            subItem.items ? (
                                                // If the item has a submenu, render it as a DIV
                                                <div
                                                    key={subItem.label}
                                                    className='submenu-item has-submenu'
                                                    onMouseEnter={() => {
                                                        if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
                                                        setActiveSubmenu(subIdx);
                                                    }}
                                                    onMouseLeave={() => {
                                                        submenuTimeoutRef.current = setTimeout(() => {
                                                            setActiveSubmenu(null);
                                                        }, 300);
                                                    }}
                                                >
                                                    <span>{subItem.label}</span>
                                                    {activeSubmenu === subIdx && (
                                                        <div className='vertical-subsubmenu'>
                                                            {subItem.items.map(option => (
                                                                <Link to={option.path || '#'} key={option.label} className="subsubmenu-item">
                                                                    {option.label}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                // If it doesn't have a submenu, render it as a normal LINK
                                                <Link key={subItem.label} to={subItem.path || '#'} className='submenu-item'>
                                                    {subItem.label}
                                                </Link>
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <a href="#">Pesquisa</a>
                        <a href="#">Suprimentos</a>
                        <a href="#">Interface</a>
                        <a href="#">CRM</a>
                        <a href="#">Ajuda</a>
                    </nav>
                </div>

                <div>
                </div>
            </div>

        </>
    )
}

export default Menu;