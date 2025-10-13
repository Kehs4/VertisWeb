import * as React from 'react';
import { useEffect, useState } from 'react';
import './DashSupport.css';
import { useTheme } from '../../components/ThemeContext';
import { LineChart, PieChart } from '@mui/x-charts';

// Ícones do Material-UI
import {
    Public as PublicIcon,
    FactCheck as FactCheckIcon,
    TrendingDown as TrendingDownIcon,
    Dvr as DvrIcon,
    Webhook as WebhookIcon,
    Insights as InsightsIcon,
    People as PeopleIcon,
    Summarize as SummarizeIcon,
    EmojiEvents as EmojiEventsIcon, Leaderboard as LeaderboardIcon,
} from '@mui/icons-material';

// --- DADOS DE EXEMPLO (MOCK DATA) ---
// Você deverá substituir isso por chamadas à sua API
const mockData = {
    monthPatientData: {
        month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        // Contagem de pacientes para cada mês
        counts: [137, 221, 194, 240, 182, 195, 316, 275, 199, 260, 374, 394],
    },
    patientsThisMonth: {
        count: 394,
        comparison: 2.1, // Porcentagem em relação ao mês passado
    },
    apiStatus: {
        constellation: 'Online',
        laudos: 'Online',
        vertis: 'Online',
        nfse: 'Online',
    },
    topPublishers: [
        { code: 118, name: 'VETEX', publications: 18239 },
        { code: 186, name: 'Vet Vision', publications: 5753 },
        { code: 74, name: 'Hormonalle', publications: 4594 },
        { code: 206, name: 'De Olho No Bicho', publications: 3858 },
        { code: 146, name: 'Mellislab', publications: 3196 },
    ],

    topCallers: [
        { code: 123, name: 'Vet Popular', calls: 351 },
        { code: 203, name: 'Hospital São Pedro', calls: 329 },
        { code: 47, name: 'Amarvets', calls: 316 },
        { code: 118, name: 'VETEX', calls: 298 },
        { code: 177, name: 'Lapavet', calls: 274 },
    ],
    supportAnalysts: [
        { name: 'Luiza', tickets: 54 },
        { name: 'Martins', tickets: 42 },
        { name: 'Mariana', tickets: 38 },
        { name: 'Ivan', tickets: 33 },
        { name: 'Siuah', tickets: 29 }
    ],
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
    const { theme, setTheme } = useTheme();
    const [lastUpdated, setLastUpdated] = useState('');
    const [isChartLoading, setIsChartLoading] = useState(true);
    const currentChartColors = chartThemeColors[theme];

    useEffect(() => {
        document.title = "Vertis | Dashboard";
        const now = new Date();
        setLastUpdated(
            now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );

        // Simula um carregamento de 800ms para o gráfico
        const timer = setTimeout(() => setIsChartLoading(false), 800);
        return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado
    }, []);

    return (
        <> {/* MainLayout already renders Menu and Header */}
            <main className="ds-container">
                <div className="ds-header-toolbar">
                    <h1 className="ds-title">Dashboard Suporte</h1>
                    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="ds-theme-toggle-button">
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </button>
                </div>

                <div className="ds-grid">

                    {/* Constellation API */}
                    <div className="ds-widget-card">
                        <div className="ds-widget-header">
                            <PublicIcon className="ds-icon-constellation" />
                            <h3>Constellation API - Status</h3>
                        </div>
                        <div className="ds-widget-content">
                            <p className={`ds-main-metric ${mockData.apiStatus.constellation === 'Online' ? 'ds-status-online' : 'ds-status-offline'}`}>
                                {mockData.apiStatus.constellation}
                            </p>
                            <span className="ds-sub-metric" />
                        </div>
                        <div className="ds-widget-footer">
                            <span>Atualizado por último às: {lastUpdated}</span>
                        </div>
                    </div>

                    {/* Laudos Online API */}
                    <div className="ds-widget-card">
                        <div className="ds-widget-header">
                            <FactCheckIcon className="ds-icon-laudos-api" />
                            <h3>Laudos Online API - Status</h3>
                        </div>
                        <div className="ds-widget-content">
                            <p className={`ds-main-metric ${mockData.apiStatus.laudos === 'Online' ? 'ds-status-online' : 'ds-status-offline'}`}>
                                {mockData.apiStatus.laudos}
                            </p>
                            <span className="ds-sub-metric" />
                        </div>
                        <div className="ds-widget-footer">
                            <span>Atualizado por último às: {lastUpdated}</span>
                        </div>
                    </div>

                    {/* Vertis API */}
                    <div className="ds-widget-card">
                        <div className="ds-widget-header">
                            <DvrIcon className="ds-icon-vertis-api" />
                            <h3>Vertis API - Status</h3>
                        </div>
                        <div className="ds-widget-content">
                            <p className={`ds-main-metric ${mockData.apiStatus.vertis === 'Online' ? 'ds-status-online' : 'ds-status-offline'}`}>
                                {mockData.apiStatus.vertis}
                            </p>
                            <span className="ds-sub-metric" />
                        </div>
                        <div className="ds-widget-footer">
                            <span>Atualizado por último às: {lastUpdated}</span>
                        </div>
                    </div>



                    {/* NFSe API */}
                    <div className="ds-widget-card">
                        <div className="ds-widget-header">
                            <WebhookIcon className="ds-icon-nfse-api" />
                            <h3>NFSe API - Status</h3>
                        </div>
                        <div className="ds-widget-content">
                            <p className={`ds-main-metric ${mockData.apiStatus.nfse === 'Online' ? 'ds-status-online' : 'ds-status-offline'}`}>
                                {mockData.apiStatus.nfse}
                            </p>
                            <span className="ds-sub-metric" />
                        </div>
                        <div className="ds-widget-footer">
                            <span>Atualizado por último às: {lastUpdated}</span>
                        </div>
                    </div>


                    {/* Laudos Publicados por Hora */}
                    <div className="ds-widget-card full-width">
                        <div className="ds-widget-header no-border">
                            <InsightsIcon className="ds-icon-laudos-hora" />
                            <h3>Laudos Publicados por Hora</h3>
                        </div>
                        <div className="ds-widget-content ds-list-content flex-grow">
                            <div className="ds-chart-container full-size">
                                {isChartLoading ? (
                                    <div className="ds-loading-placeholder">Carregando gráfico...</div>
                                ) : (
                                    <LineChart
                                        xAxis={[{
                                            data: mockData.monthPatientData.month,
                                            scaleType: 'point',
                                            tickLabelStyle: { fill: currentChartColors?.axisLabel, fontSize: 10, fontWeight: 300 },
                                        }]}
                                        yAxis={[{
                                            tickLabelStyle: { fill: currentChartColors?.axisLabel, fontSize: 10, fontWeight: 300 },
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
                                        margin={{ left: 15, right: 40 }}
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
                                        height={320}
                                    >
                                        <defs>
                                            <linearGradient id="myGradient" gradientTransform="rotate(90)">
                                                <stop offset="5%" stopColor={currentChartColors.gradientStart} />
                                                <stop offset="95%" stopColor={currentChartColors.gradientEnd} />
                                            </linearGradient>
                                        </defs>
                                    </LineChart>
                                )}
                            </div>
                        </div>
                        <div className="ds-widget-footer">
                            <span>Atualizado por último às: {lastUpdated}</span>
                        </div>
                    </div>

                    <div className="ds-bottom-cards-container">

                        {/* Clientes que mais publicam */}
                        <div className="ds-widget-card">
                            <div className="ds-widget-header no-border">
                                <LeaderboardIcon className="ds-icon-top-publishers" />
                                <h3>Ranking Publicadores de Laudos</h3>
                            </div>
                            <div className="ds-widget-content ds-list-content">
                                <div className="ds-list-header">
                                    <span>Cód.</span>
                                    <span>Nome</span>
                                    <span>Publicações</span>
                                </div>
                                {mockData.topPublishers.map((client) => (
                                    <div key={client.code} className="ds-list-item top-publisher-item">
                                        <span className="code">{client.code}</span>
                                        <span className="name">{client.name}</span>
                                        <strong className="publications">{client.publications.toLocaleString('pt-BR')}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="ds-widget-footer">
                                <span>Atualizado por último às: {lastUpdated}</span>
                            </div>
                        </div>


                        {/* Clientes que mais solicitam chamados */}
                        <div className="ds-widget-card">
                            <div className="ds-widget-header no-border">
                                <EmojiEventsIcon className="ds-icon-ranking" />
                                <h3>Ranking Chamados Solicitados</h3>
                            </div>
                            <div className="ds-widget-content ds-list-content">
                                <div className="ds-list-header">
                                    <span>Cód.</span>
                                    <span>Nome</span>
                                    <span>Chamados</span>
                                </div>
                                {mockData.topCallers.map((client) => (
                                    <div key={client.code} className="ds-list-item top-caller-item">
                                        <span className="code">{client.code}</span>
                                        <span className="name">{client.name}</span>
                                        <strong className="calls">{client.calls.toLocaleString('pt-BR')}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="ds-widget-footer">
                                <span>Atualizado por último às: {lastUpdated}</span>
                            </div>

                        </div>

                        {/* Analistas de Suporte */}
                        <div className="ds-widget-card">
                            <div className="ds-widget-header no-border">
                                <PeopleIcon className="ds-icon-analistas" />
                                <h3>Chamados por Analista</h3>
                            </div>
                            <div className="ds-widget-content ds-list-content">
                                <div className="ds-list-header analyst-header">
                                    <span>Analistas</span>
                                    <span>Chamados</span>
                                </div>
                                {mockData.supportAnalysts.map((analyst, index) => (
                                    <div key={analyst.name} className="ds-list-item analyst-item">
                                        <span className="name">
                                            {index < 3 && (
                                                <EmojiEventsIcon className={`trophy-icon trophy-${['gold', 'silver', 'bronze'][index]}`} />
                                            )}
                                            {analyst.name}
                                        </span>
                                        <strong className="tickets">{analyst.tickets.toLocaleString('pt-BR')}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="ds-widget-footer">
                                <span>Atualizado por último às: {lastUpdated}</span>
                            </div>

                        </div>


                    </div>
                </div>
            </main>
        </>
    );
}

export default Dashboard;