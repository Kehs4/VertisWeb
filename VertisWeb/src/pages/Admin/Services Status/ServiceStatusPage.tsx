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
    {
        id: 'publ-laudos-hora',
        title: 'Publicação de Laudos (Hora)',
        description: 'Publicações de laudos nas últimas 24 horas.',
        icon: <ApiIcon />,
        chartType: 'line',
        chartData: {
            series: [{
                data: [34, 25, 34, 64, 147, 192, 379, 692, 846, 1127, 1345, 842, 743, 920, 1260, 1576, 982, 723, 418, 215, 127, 75, 40, 27],
                area: true,
                curve: 'linear',
                xAxisKey: 'hour',
            }],
            xAxis: [{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], scaleType: 'point', id: 'hour' }],
        },
    },
    {
        id: 'svc-fat-hora',
        title: 'Serviço de Faturamento (Hora)',
        description: 'Serviços de faturamento nas últimas 24 horas.',
        icon: <ApiIcon />,
        chartType: 'line',
        chartData: {
            series: [{
                data: [7, 4, 8, 7, 15, 42, 79, 124, 258, 421, 512, 326, 278, 341, 412, 365, 437, 612, 543, 215, 128, 79, 45, 27],
                area: true,
                curve: 'linear',
                xAxisKey: 'hour',
            }],
            xAxis: [{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], scaleType: 'point', id: 'hour' }],
        },
    },
    {
        id: 'svc-preparo-hora',
        title: 'Serviço de Preparo (Hora)',
        description: 'Serviço de preparo via e-mail nas últimas 24 horas.',
        icon: <ApiIcon />,
        chartType: 'line',
        chartData: {
            series: [{
                data: [1, 0, 0, 5, 22, 45, 63, 82, 110, 126, 215, 326, 278, 341, 225, 278, 246, 312, 421, 273, 174, 118, 41, 6],
                area: true,
                curve: 'linear',
                xAxisKey: 'hour',
            }],
            xAxis: [{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], scaleType: 'point', id: 'hour' }],
        },
    },
    {
        id: 'publ-laudos-mes',
        title: 'Publicação de Laudos (Mês)',
        description: 'Serviço de publicação de laudos nos últimos 30 dias.',
        icon: <ApiIcon />,
        chartType: 'line',
        chartData: {
            series: [{
                data: [6512, 7353, 9412, 7583, 8421, 6893, 1462, 7492, 9834, 11046, 8214, 7803, 9781, 1632, 8439, 7284, 9679, 10284, 9844, 12413, 1518, 7982, 8853, 9751, 10789, 11812, 9879, 1410, 8215, 7849],
                area: true,
                curve: 'linear',
                xAxisKey: 'hour',
            }],
            xAxis: [{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], scaleType: 'point', id: 'hour' }],
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
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        document.title = "Vertis | Status dos Serviços";
    }, []);

    const chartThemeColors = {
        dark: {
            line: 'rgb(183, 0, 255)',
            gradientStart: 'rgba(183, 0, 255, 0.6)',
            gradientEnd: 'rgba(0, 119, 255, 0)',
            axis: 'rgba(255, 255, 255, 0.3)',
            legendText: '#fff',
            circlePointer: 'rgba(92, 89, 129, 0.34)',
            circleBorder: 'rgba(190, 188, 211, 0.66)'
        },
        light: {
            line: 'rgba(122, 38, 201, 0.49)',
            gradientStart: 'rgba(183, 0, 255, 0.6)',
            gradientEnd: 'rgba(0, 119, 255, 0)',
            axis: 'rgba(0, 0, 0, 0.3)',
            legendText: '#000',
            circlePointer: 'rgba(190, 188, 211, 0.66)',
            circleBorder: 'rgba(140, 132, 212, 0.85)'
        }
    };

    const currentChartColors = chartThemeColors[theme];

    return (
        <main className={`service-status-container ${theme}`}>
            <div className="service-status-header">
                <div className="service-status-title-group">
                    <h1 className="service-status-title">Status dos Serviços</h1>
                    <p className="service-status-subtitle">Monitoramento em tempo real dos serviços internos da Vertis.</p>
                </div>
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="theme-toggle-button">
                    {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                </button>
            </div>

            <div className="service-status-grid">
                {serviceCardsConfig.map((card) => (
                    <div key={card.id} className="status-card">
                        <div className="status-card-header">
                            <div className="status-card-icon" style={{ color: currentChartColors.line }}>{card.icon}</div>
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
                                        '.MuiChartsAxis-line, .MuiChartsAxis-tick, .MuiChartsGrid-line': {
                                            stroke: `${currentChartColors.axis} !important`,
                                        },
                                        '.MuiChartsAxis-tickLabel': {
                                            fill: `${currentChartColors.axis} !important`,
                                        },
                                        // Estiliza os pontos (marcadores) no gráfico
                                        '.MuiMarkElement-root': {
                                            fill: currentChartColors.circlePointer,
                                            stroke: currentChartColors.circleBorder,
                                            strokeWidth: 2,
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
                                            fill: currentChartColors.legendText
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