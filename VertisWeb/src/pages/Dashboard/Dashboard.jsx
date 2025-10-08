import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import '../home/Home.css'
import './Dashboard.css'

const menuItems = [
    {
        label: 'Arquivo',
        submenu: [
            {
                label: 'Parceiro de Negócio',
                subsubmenu: [
                    'Tutor',
                    'Clínica',
                    'Veterinário',
                    'Fornecedor'
                ]
            },
            { label: 'Unidades Operacionais' },
            { label: 'Exames' },
            { label: 'Animal' },
        ],
    },
    {
        label: 'Operacional',
        submenu: [
            { label: 'Ordem de Serviço' },
            { label: 'Agendas' },
            { label: 'Admissões' },
            { label: 'Mapa de Trabalho' },
        ],
    },
    {
        label: 'Financeiro',
        submenu: [
            { label: 'Caixa' },
            { label: 'Faturamentos' },
            { label: 'Contas a Pagar e Receber' },
            { label: 'Orçamentos' },
        ],
    },
    {
        label: 'Relatórios',
        submenu: [
            { label: 'Analise de Desempenho' },
            { label: 'Cadastros por Parceiro' },
            { label: 'Estatísticos' },
            { label: 'Prontuários' },
        ],
    },
    // Adicione outros menus conforme necessário
];

function Dashboard() {
    const [activeMenu, setActiveMenu] = useState(null);
    const [activeSubmenu, setActiveSubmenu] = useState(null);

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
                                onMouseEnter={() => setActiveMenu(idx)}
                                onMouseLeave={() => { setActiveMenu(null); setActiveSubmenu(null); }}
                                style={{ position: 'relative', display: 'inline-block' }}
                            >
                                <a href="#">{item.label}</a>
                                {activeMenu === idx && (
                                    <div className='vertical-submenu'>
                                        {item.submenu.map((sub, subIdx) => (
                                            <div
                                                key={sub.label}
                                                className='submenu-item'
                                                onMouseEnter={() => setActiveSubmenu(subIdx)}
                                                onMouseLeave={() => setActiveSubmenu(null)}
                                                style={{ position: 'relative' }}
                                            >
                                                <a href="#">{sub.label}</a>
                                                {sub.subsubmenu && activeSubmenu === subIdx && (
                                                    <div className='vertical-subsubmenu'>
                                                        {sub.subsubmenu.map(subsub => (
                                                            <a href="#" key={subsub}>{subsub}</a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
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
                    <Link to='/login'>
                        <button className='header-login-button'>Entrar</button>
                    </Link>
                </div>
            </div>

            <section className='section-dashboard'>
                <div className='dashboard-box'>
                    <div className='dashboard-box-content'>
                        
                    </div>
                </div>
            </section>

            <section className='section-analytics'>
                <div className='analytics-box'>
                    <div className='analytics-box-content'>
                        <h2>Estatísticas</h2>
                        <p>Gráficos e dados relevantes serão exibidos aqui.</p>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Dashboard;