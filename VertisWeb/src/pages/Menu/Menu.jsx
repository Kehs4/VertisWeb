import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../home/Home.css'
import './Menu.css'

const menuItems = [
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
            { label: 'Unidade de Negócio', path: '#',
                items: [
                    {label: 'Unidades Operacionais', path: '/unidades-operacionais'}
                ]
             },
            { label: 'Exames', path: '#' },
            { label: 'Animal', path: '#' },
        ],
    },
    {
        label: 'Operacional',
        items: [
            { label: 'Ordem de Serviço', path: '#' },
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
    const [activeMenu, setActiveMenu] = useState(null);
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const menuTimeoutRef = useRef(null);
    const submenuTimeoutRef = useRef(null);

    useEffect(() => {
        document.title = "Vertis | Dashboard"
    }, []);

    return (
        <>
            <div className='header-vertis'>
                <img src="/public/logo-white.png" alt="" width={60} height={40} />

                <div className='header-menu'>
                    <nav className='header-nav'>
                        {menuItems.map((item, idx) => (
                            <div
                                key={item.label}
                                className='menu-item'
                                onMouseEnter={() => {
                                    clearTimeout(menuTimeoutRef.current);
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
                                        {item.items.map((subItem, subIdx) => (
                                            <Link
                                                key={subItem.label}
                                                to={subItem.path || '#'}
                                                className='submenu-item'
                                                onMouseEnter={() => setActiveSubmenu(subIdx)}
                                                onMouseLeave={() => {
                                                    submenuTimeoutRef.current = setTimeout(() => {
                                                        setActiveSubmenu(null);
                                                    }, 300); // 300ms de atraso
                                                }}
                                                // Impede o clique se houver um submenu, para priorizar o hover
                                                onClick={(e) => { if (subItem.items) e.preventDefault(); }}
                                            >
                                                {/* Clear submenu timeout if mouse re-enters */}
                                                {activeSubmenu === subIdx && clearTimeout(submenuTimeoutRef.current)}

                                                {subItem.label}

                                                {subItem.items && activeSubmenu === subIdx && (
                                                    <div className='vertical-subsubmenu'>
                                                        {subItem.items.map(option => (
                                                            <Link to={option.path} key={option.label} className="subsubmenu-item">
                                                                {option.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </Link>
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