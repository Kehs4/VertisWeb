import * as React from 'react';
import { useState, useEffect } from 'react';
import './Dashboard.css';
import Menu from '../Menu/Menu.tsx';
import { LineChart, PieChart } from '@mui/x-charts';

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
    Brightness4 as Brightness4Icon, // Ícone para modo escuro
    Brightness7 as Brightness7Icon, // Ícone para modo claro
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
    monthPatientData: {
        month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        // Contagem de pacientes para cada mês
        counts: [137, 221, 194, 133, 182, 195, 222, 164, 199, 260, 153, 235],
    },
    patientsThisMonth: {
        count: 449,
        comparison: 2.1, // Porcentagem em relação ao mês passado
    },
    invoices: {
        issued: 80,
        toIssue: 25,
    },
    hospitalized: 14,
    examsInProgress: 35,
    activeUsers: 16,
    laudos: {
        emitidos: 72,
        fila: 18,
    },
    
};
// --- FIM DOS DADOS DE EXEMPLO ---

// Define as cores do gráfico para cada tema
const chartThemeColors = {
    dark: {
        line: 'rgb(183, 0, 255)',
        gradientStart: 'rgba(224, 68, 255, 0.8)',
        gradientEnd: 'rgba(0, 119, 255, 0)',
        axisLabel: 'rgba(255, 255, 255, 0.26)',
        axisLine: 'rgba(255, 255, 255, 0.26)',
        axisTick: 'rgba(255, 255, 255, 0.12)',
        marker: 'rgba(100, 66, 179, 0.36)',
    },
    light: {
        line: 'rgb(183, 0, 255)',
        gradientStart: 'rgba(224, 68, 255, 0.8)',
        gradientEnd: 'rgba(0, 119, 255, 0)',
        axisLabel: 'rgba(0, 0, 0, 0.5)',
        axisLine: 'rgba(0, 0, 0, 0.2)',
        axisTick: 'rgba(0, 0, 0, 0.1)',
        marker: 'rgba(0, 119, 255, 0.2)',
    }
};

function Dashboard() {
    const [theme, setTheme] = useState<'dark' | 'light'>('light'); // 'dark' ou 'light'
    const currentChartColors = chartThemeColors[theme];

    useEffect(() => {
        document.title = "Vertis | Dashboard";
    }, []);

    return (
        <>
            <Menu />
            <main className={`dashboard-container ${theme}-mode`}>
                <div className="dashboard-header-toolbar">
                    <h1 className="dashboard-title">Dashboard</h1>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="theme-toggle-button">
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </button>
                </div>

                <div className="dashboard-grid">
                    {/* Agendas para hoje */}
                    <div className="widget-card large-widget">
                        <div className="widget-header">
                            <EventIcon style={{color: 'rgb(0, 140, 255)'}}/>
                            <h3 style={{fontSize: '1.4rem'}}>Próximos Agendamentos</h3>
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
                            <AssignmentIcon style={{color: 'rgb(189, 189, 189)'}}/>
                            <h3 style={{fontSize: '1.4rem'}}>Últimas Ordens de Serviço</h3>
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
                            <PetsIcon style={{color: 'rgb(183, 0, 255)'}}/>
                            <h3>Pacientes Atendidos (Mês)</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.patientsThisMonth.count}</p>
                            <div className={`comparison ${mockData.patientsThisMonth.comparison >= 0 ? 'positive' : 'negative'}`}>
                                {mockData.patientsThisMonth.comparison >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                <span>{Math.abs(mockData.patientsThisMonth.comparison)}% vs. Mês anterior</span>
                            </div>
                        </div>

                        <LineChart
                            xAxis={[{ 
                                data: mockData.monthPatientData.month,
                                scaleType: 'point',
                                tickLabelStyle: { fill: currentChartColors.axisLabel, fontSize: 10, fontWeight: 300},
                            }]}
                            yAxis={[{
                                tickLabelStyle: { fill: currentChartColors.axisLabel, fontSize: 10, fontWeight: 300},
                            }]}
                            series={[
                                {
                                    data: mockData.monthPatientData.counts,
                                    color: currentChartColors.line,
                                    type: 'line',
                                    area: true,
                                    curve: 'linear'
                                },
                            ]}
                            margin={{ left: 10, right: 30}}
                            
                            sx={{
                                '& .MuiLineElement-root': {
                                  strokeDasharray: '10 2',
                                  strokeWidth: 1,
                                  
                                  stroke: currentChartColors.line, // Garante a cor da linha
                                },
                                '& .MuiAreaElement-root': {
                                  fill: "url('#myGradient')",
                                },
                                // Força a cor da linha do eixo para garantir a prioridade
                                '.MuiChartsAxis-line': {
                                  stroke: `${currentChartColors.axisLine} !important`,
                                },
                                '.MuiChartsAxis-tick': {
                                    stroke: `${currentChartColors.axisTick} !important`,
                                    
                                },

                                // Estilo dos círculos (marcadores) na linha
                                '.MuiMarkElement-root': {
                                    fill: currentChartColors.marker,
                                    strokeWidth: 0,
                                },
                                
                              }}
                            height={150}
                            width={380}
                        >
                            <defs>
                                <linearGradient id="myGradient" gradientTransform="rotate(90)">
                                    <stop offset="5%" stopColor={currentChartColors.gradientStart} />
                                    <stop offset="95%" stopColor={currentChartColors.gradientEnd} />
                                </linearGradient>
                            </defs>
                        </LineChart>

                    </div>

                    {/* Laudos emitidos */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <SummarizeIcon style={{color: 'rgb(253, 79, 117)'}}/>
                            <h3>Laudos Emitidos</h3>
                        </div>
                        <div className="widget-content" style={{display: 'flex', alignItems: 'center'}}>
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '10px'}}>
                            <p className="main-metric">{mockData.laudos.emitidos}</p>
                            <span className="sub-metric" style={{fontSize: '0.7rem'}}>Laudos emitidos hoje</span>
                            </div>
                            <PieChart
                                series={[
                                    {
                                        data: [
                                            { id: 0, value: mockData.laudos.emitidos, label: 'Emitidos', color: 'rgb(52, 148, 65)'},
                                            { id: 1, value: mockData.laudos.fila, label: 'Na fila', color: 'rgb(202, 190, 130)' },
                                        ],
                                    },
                                ]}
                                
                                width={80}
                                height={80}
                            />
                        </div>
                    </div>

                    {/* Faturas de Convênio */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <ReceiptIcon style={{color: 'rgb(49, 167, 13)'}}/>
                            <h3>Faturas de Convênio</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.invoices.toIssue}</p>
                            <span className="sub-metric">Pendente de {mockData.invoices.issued + mockData.invoices.toIssue}</span>
                        </div>
                    </div>

                    {/* Animais Internados */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <PetsIcon style={{color: 'rgb(255, 94, 0)'}}/>
                            <h3>Animais Internados</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.hospitalized}</p>
                            <span className="sub-metric">Em internação</span>
                        </div>
                    </div>

                    

                    {/* Exames em Execução */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <ScienceIcon style={{color: 'rgb(255, 187, 0)'}}/>
                            <h3>Exames em Execução</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.examsInProgress}</p>
                            <span className="sub-metric">Em execução</span>
                        </div>
                    </div>





                    {/* Usuários Ativos */}
                    <div className="widget-card">
                        <div className="widget-header">
                            <PeopleIcon style={{color: 'rgb(255, 230, 0)'}}/>
                            <h3>Usuários Ativos</h3>
                        </div>
                        <div className="widget-content">
                            <p className="main-metric">{mockData.activeUsers}</p>
                            <span className="sub-metric">Ativos agora </span>
                        </div>
                    </div>

                    
                </div>
            </main>
        </>
    );
}

export default Dashboard;