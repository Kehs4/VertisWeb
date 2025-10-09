import React, { useEffect } from 'react';
import './Dashboard.css';
import Menu from '../Menu/Menu.tsx';

// Ícones do Material-UI
import {
    Event as EventIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Receipt as ReceiptIcon,
    Pets as PetsIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    People as PeopleIcon,
    Summarize as SummarizeIcon,
    Summarize
} from '@mui/icons-material';

// --- DADOS DE EXEMPLO (MOCK DATA) ---
// Você deverá substituir isso por chamadas à sua API
const mockData = {
    schedules: [
        { animal: 'Rex', datetime: '2024-07-26 14:00', user: 'ana.silva' },
        { animal: 'Misty', datetime: '2024-07-26 15:30', user: 'carlos.santos' },
        { animal: 'Buddy', datetime: '2024-07-26 16:45', user: 'maria.oliveira' },
        { animal: 'Bella', datetime: '2024-07-26 17:15', user: 'pedro.rodrigues' },
    ],
    lastServiceOrders: [
        { id: 'OS-7891', animal: 'Thor', tutor: 'Maria Souza', clinic: 'Clínica Vet ABC' },
        { id: 'OS-7890', animal: 'Luna', tutor: 'João Pereira', clinic: 'PetCare Central' },
        { id: 'OS-7889', animal: 'Max', tutor: 'Ana Santos', clinic: 'Animacão Pet' },
        { id: 'OS-7888', animal: 'Minnie', tutor: 'Edson Marques', clinic: 'Animais Clínica Veterinária' },
    ],
    patientsThisMonth: {
        count: 941,
        comparison: -4.7, // Porcentagem em relação ao mês passado
    },
    invoices: {
        issued: 80,
        toIssue: 25,
    },
    hospitalized: 14,
    examsInProgress: 35,
    activeUsers: 16,
    laudos: 72,
};
// --- FIM DOS DADOS DE EXEMPLO ---

function Dashboard() {
    useEffect(() => {
        document.title = "Vertis | Dashboard";
    }, []);

    return (
        <>
            <Menu />
            <main className="dashboard-container">
                <h1 className="dashboard-title">Painel de Controle - Clínica GPI</h1>

                <div className="dashboard-grid">
                    {/* Agendas para hoje */}
                    <div className="widget-card large-widget">
                        <div className="widget-header">
                            <EventIcon />
                            <h3>Próximos Agendamentos</h3>
                        </div>
                        <div className="widget-content list-content">
                            {mockData.schedules.map((item, index) => (
                                <div key={index} className="list-item">
                                    <span><strong>Animal:</strong> {item.animal}</span>
                                    <span><strong>Horário:</strong> {new Date(item.datetime).toLocaleTimeString('pt-BR')}</span>
                                    <span><strong>Agendado por:</strong> {item.user}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Últimas Ordens de Serviço */}
                    <div className="widget-card large-widget">
                        <div className="widget-header">
                            <AssignmentIcon />
                            <h3>Últimas Ordens de Serviço</h3>
                        </div>
                        <div className="widget-content list-content">
                            {mockData.lastServiceOrders.map((os, index) => (
                                <div key={index} className="list-item">
                                    <span><strong>O.S:</strong> {os.id}</span>
                                    <span><strong>Animal:</strong> {os.animal}</span>
                                    <span><strong>Tutor:</strong> {os.tutor}</span>
                                    <span><strong>Clínica:</strong> {os.clinic}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pacientes atendidos no mês */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <PetsIcon />
                            <h3>Pacientes Atendidos (Mês)</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.patientsThisMonth.count}</p>
                            <div className={`comparison ${mockData.patientsThisMonth.comparison >= 0 ? 'positive' : 'negative'}`}>
                                {mockData.patientsThisMonth.comparison >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                <span>{Math.abs(mockData.patientsThisMonth.comparison)}% vs. mês anterior</span>
                            </div>
                        </div>
                    </div>

                    {/* Faturas de Convênio */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <ReceiptIcon />
                            <h3>Faturas de Convênio</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.invoices.toIssue}</p>
                            <span className="sub-metric">a emitir de {mockData.invoices.issued + mockData.invoices.toIssue}</span>
                        </div>
                    </div>

                    {/* Animais Internados */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <PetsIcon />
                            <h3>Animais Internados</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.hospitalized}</p>
                            <span className="sub-metric">em internação</span>
                        </div>
                    </div>

                    {/* Exames em Execução */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <ScienceIcon />
                            <h3>Exames em Execução</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.examsInProgress}</p>
                            <span className="sub-metric">em execução</span>
                        </div>
                    </div>

                    

                    {/* Usuários Ativos */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <PeopleIcon />
                            <h3>Usuários Ativos</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.activeUsers}</p>
                            <span className="sub-metric">ativos agora na unidade</span>
                        </div>
                    </div>

                    {/* Laudos emitidos */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <Summarize />
                            <h3>Laudos Emitidos</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.laudos}</p>
                            <span className="sub-metric">laudos emitidos hoje na unidade</span>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default Dashboard;