import React, { useEffect } from 'react'
import { Link } from 'react-router-dom';
import './Home.css'

const mainFunctionalities = [
    {
        title: 'Cuidado Completo',
        content: ['Sistema completo para gestão de clínicas, hospitais e laboratórios veterinários.']
    },
    {
        title: 'Organização',
        content: ['Exames realizados e histórico de prontuários sempre à mão para você.']
    },
    {
        title: 'Gestão',
        content: ['Dados seguros e organizados para melhor uma boa gestão e um ótimo atendimento.']
    },
    {
        title: 'Agendamentos',
        content: ['Agendamentos por período, procedimentos agendados, agenda do profissional e muito mais!']
    }
];

const modules = [
    {
        title: 'Parceiros de Negócio',
        content: ['Tutores', 'Clínicas', 'Veterinários', 'Fornecedores']
    },
    {
        title: 'Módulos',
        content: ['Ordem de Serviço', 'Agendas', 'Admissões', 'Mapa de Trabalho']
    },
    {
        title: 'Financeiro',
        content: ['Caixa', 'Faturamentos', 'Contas a Pagar e Receber', 'Orçamentos']
    },
    {
        title: 'Relatórios',
        content: ['Analise de Desempenho', 'Cadastros por Parceiro', 'Estatísticos', 'Prontuários']
    }
];

function Home() {

    useEffect(() => {
        document.title = "Vertis | Home"
    }, []);

    return (
        <>
            <div className='header-vertis'>
                <img src="/public/logo-white.png" alt="Logo Vertis" width={60} height={40} />

                <div className='header-menu'>
                    <nav className='header-nav'>

                    </nav>
                </div>

                <div>
                    <Link to='/login'>
                        <button className='header-login-button'>Entrar</button>
                    </Link>
                </div>
            </div>

            <main className='section-dashboard'>
                <div className='dashboard-box'>
                    <div className='dashboard-box-content'>
                        <div className='dashboard-welcome-message'>
                            <h1>O Vertis está de cara nova!</h1>
                            <p>Explore as novidades e aproveite a experiência aprimorada.</p>
                        </div>

                        <h2 className='dashboard-cards-title'>Principais Funcionalidades</h2>
                        <div className='dashboard-cards'>
                            {mainFunctionalities.map(card => (
                                <div className='dashboard-card' key={card.title}>
                                    <h3 className='dashboard-card-title'>{card.title}</h3>
                                    <div className='dashboard-card-content'>
                                        {card.content.map(item => <p key={item}>{item}</p>)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='dashboard-cards'>
                            {modules.map(card => (
                                <div className='dashboard-card' key={card.title}>
                                    <h3 className='dashboard-card-title'>{card.title}</h3>
                                    <div className='dashboard-card-content'>
                                        {card.content.map(item => <p key={item}>{item}</p>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className='section-analytics'>
                <div>

                </div>
            </footer>
        </>
    )
}

export default Home;