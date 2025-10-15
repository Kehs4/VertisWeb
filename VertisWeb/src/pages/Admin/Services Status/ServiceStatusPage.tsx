import React, { useEffect } from 'react';
import './ServiceStatusPage.css';
import { useTheme } from '../../../components/ThemeContext';
import { LineChart, PieChart } from '@mui/x-charts';

// Ícones para os cards
import ApiIcon from '@mui/icons-material/Api';
import StorageIcon from '@mui/icons-material/Storage';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DnsIcon from '@mui/icons-material/Dns';

// --- Configuração dos Cards ---
// Você pode adicionar ou remover cards aqui para atualizar o dashboard
const serviceCardsConfig = [
    {
        id: 'api-login',
        title: 'API de Login',
        description: 'Erros nas últimas 24 horas.',
        icon: <ApiIcon />,
        chartType: 'line',
        chartData: {
            series: [{
                data: [2, 5, 3, 4, 1, 5, 2, 3, 4, 1, 2, 6, 2, 3],
                area: true,
                curve: 'linear',
                xAxisKey: 'hour',
            }],
            xAxis: [{ data: [1, 2, 3, 5, 8, 10, 12, 15, 16, 18, 20, 22, 23, 24], scaleType: 'point', id: 'hour' }],
        },
    },
    {
        id: 'db-performance',
        title: 'Performance do Banco de Dados',
        description: 'Latência média de queries (ms).',
        icon: <StorageIcon />,
        chartType: 'line',
        chartData: {
            series: [{
                data: [80, 95, 110, 85, 120, 90, 100, 105, 95, 130, 115, 100, 90, 88],
                area: true,
                curve: 'linear',
                xAxisKey: 'hour',
            }],
            xAxis: [{ data: [1, 2, 3, 5, 8, 10, 12, 15, 16, 18, 20, 22, 23, 24], scaleType: 'point', id: 'hour' }],
        },
    },
    {
        id: 'billing-service-errors',
        title: 'Serviço de Faturamento',
        description: 'Distribuição de tipos de erro.',
        icon: <ReceiptLongIcon />,
        chartType: 'pie',
        chartData: {
            series: [{
                data: [
                    { id: 0, value: 10, label: 'Timeout', color: '#e74c3c' },
                    { id: 1, value: 15, label: 'Dados Inválidos', color: '#f39c12' },
                    { id: 2, value: 5, label: 'Falha de Auth', color: '#9b59b6' },
                ],
                innerRadius: 30,
                outerRadius: 100,
                paddingAngle: 2,
                cornerRadius: 5,
            }],
        },
    },
    // Adicione um novo card aqui!
    // {
    //     id: 'new-service',
    //     title: 'Novo Serviço',
    //     description: 'Descrição do novo serviço.',
    //     icon: <DnsIcon />,
    //     chartType: 'pie', // ou 'line'
    //     chartData: { /* ... dados do gráfico ... */ }
    // }
];

const ServiceStatusPage: React.FC = () => {
    const { theme } = useTheme();

    useEffect(() => {
        document.title = "Vertis | Status dos Serviços";
    }, []);

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
            axisLine: 'rgba(58, 58, 58, 0.2)',
            axisTick: 'rgba(0, 0, 0, 0.1)',
            marker: 'rgba(0, 119, 255, 0.2)',
        }
    };

    const currentChartColors = chartThemeColors[theme];



    return (
        <main className="service-status-container">
            <div className="service-status-header">
                <h1 className="service-status-title">Status dos Serviços</h1>
                <p className="service-status-subtitle">Monitoramento em tempo real dos serviços internos da Vertis.</p>
            </div>

            <div className="service-status-grid">
                {serviceCardsConfig.map((card) => (
                    <div key={card.id} className="status-card">
                        <div className="status-card-header">
                            <div className="status-card-icon">{card.icon}</div>
                            <div className="status-card-title">
                                <h3>{card.title}</h3>
                                <p>{card.description}</p>
                            </div>
                        </div>
                        <div className="status-card-chart">
                            {card.chartType === 'line' && (
                                <LineChart
                                    {...card.chartData}
                                    height={200}
                                    grid={{ vertical: true, horizontal: true }}
                                    margin={{ top: 20, right: 20, bottom: 30, left: 30 }}
                                    sx={{
                                        // Aplica o preenchimento com gradiente na área do gráfico
                                        '& .MuiAreaElement-root': {
                                            fill: "url('#myGradient')",
                                        },
                                        // Estiliza a linha do gráfico
                                        '& .MuiLineElement-root': {
                                            stroke: currentChartColors.line,
                                            strokeWidth: 2,
                                        },
                                        // Estiliza os eixos e os textos
                                        '.MuiChartsAxis-line, .MuiChartsAxis-tick': {
                                            stroke: chartThemeColors[theme].axisLabel,
                                        },
                                        '.MuiChartsAxis-tickLabel': {
                                            fill: chartThemeColors[theme].axisLabel,
                                        },
                                    }}
                                >
                                    {/* A definição do gradiente é mantida aqui */}
                                    <defs>
                                        <linearGradient id="myGradient" gradientTransform="rotate(90)">
                                            <stop offset="5%" stopColor={currentChartColors.gradientStart} />
                                            <stop offset="95%" stopColor={currentChartColors.gradientEnd} />
                                        </linearGradient>
                                    </defs>
                                </LineChart>
                            )}
                            {card.chartType === 'pie' && (
                                <PieChart
                                    {...card.chartData}
                                    height={200}
                                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                    sx={{
                                        // Alvo: o texto dentro de cada item da legenda
                                        '.MuiChartsLegend-label text': {
                                            fill: theme === 'dark' ? '#fff' : '#000'
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default ServiceStatusPage;