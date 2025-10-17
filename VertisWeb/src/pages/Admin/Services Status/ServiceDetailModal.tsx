import React from 'react';
import './ServiceDetailModal.css';
import { LineChart, PieChart } from '@mui/x-charts';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

// Tipagem para os dados do serviço, espelhando a configuração da página principal
interface ServiceCardData {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    chartType: 'line' | 'pie';
    chartData: any;
}

interface ServiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceData: ServiceCardData | null;
    theme: 'light' | 'dark';
    chartColors: any;
}

// Dados de exemplo para as novas métricas
const mockDetailMetrics = {
    success: Math.floor(Math.random() * 5000) + 1000,
    errors: Math.floor(Math.random() * 50),
    topClients: [
        { name: 'Clínica Vet ABC', usage: Math.floor(Math.random() * 500) + 100 },
        { name: 'PetCare Central', usage: Math.floor(Math.random() * 400) + 100 },
        { name: 'Animacão Pet', usage: Math.floor(Math.random() * 300) + 100 },
    ].sort((a, b) => b.usage - a.usage),
};

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ isOpen, onClose, serviceData, theme, chartColors }) => {
    if (!isOpen || !serviceData) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content service-detail-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-title">
                        {serviceData.icon}
                        <h2>{serviceData.title}</h2>
                    </div>
                    <button onClick={onClose} className="close-button" style={{borderRadius: '50%', border: 'none', cursor: 'pointer', justifyContent: 'center', alignItems: 'center', display: 'flex', backgroundColor: 'rgb(102, 102, 102)', color: 'white'}}><CloseIcon /></button>
                </div>

                <div className="modal-body">
                    {/* Gráfico Principal */}
                    <div className="main-chart-container">
                        {serviceData.chartType === 'line' && (
                            <LineChart
                                {...serviceData.chartData}
                                height={300}
                                margin={{ top: 20, right: 20, bottom: 30, left: 30 }}
                                sx={{
                                    '& .MuiAreaElement-root': { fill: "url('#modalGradient')" },
                                    '& .MuiLineElement-root': { stroke: chartColors.line, strokeWidth: 2 },
                                    '.MuiChartsAxis-line, .MuiChartsAxis-tick, .MuiChartsGrid-line': { stroke: `${chartColors.axis} !important` },
                                    '.MuiChartsAxis-tickLabel': { fill: `${chartColors.axis} !important` },
                                    '.MuiMarkElement-root': { fill: chartColors.circlePointer, stroke: chartColors.circleBorder, strokeWidth: 2 },
                                }}
                            >
                                <defs>
                                    <linearGradient id="modalGradient" gradientTransform="rotate(90)">
                                        <stop offset="5%" stopColor={chartColors.gradientStart} />
                                        <stop offset="95%" stopColor={chartColors.gradientEnd} />
                                    </linearGradient>
                                </defs>
                            </LineChart>
                        )}
                        {serviceData.chartType === 'pie' && (
                            <PieChart
                                {...serviceData.chartData}
                                height={300}
                                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                sx={{ '.MuiChartsLegend-label text': { fill: chartColors.legendText } }}
                            />
                        )}
                    </div>

                    {/* Cards de Métricas Adicionais */}
                    <div className="detail-metrics-grid">
                        <div className="metric-card success">
                            <div className="metric-card-header">
                                <CheckCircleIcon />
                                <h4>Sucessos</h4>
                            </div>
                            <p className="metric-card-value">{mockDetailMetrics.success.toLocaleString('pt-BR')}</p>
                            <span className="metric-card-period">no período</span>
                        </div>

                        <div className="metric-card error">
                            <div className="metric-card-header">
                                <ErrorIcon />
                                <h4>Erros</h4>
                            </div>
                            <p className="metric-card-value">{mockDetailMetrics.errors}</p>
                            <span className="metric-card-period">no período</span>
                        </div>

                        <div className="metric-card top-clients">
                            <div className="metric-card-header">
                                <LeaderboardIcon />
                                <h4>Top Clientes</h4>
                            </div>
                            <ul className="top-clients-list">
                                {mockDetailMetrics.topClients.map((client, index) => (
                                    <li key={index}>
                                        <span className="client-name">{client.name}</span>
                                        <span className="client-usage">{client.usage.toLocaleString('pt-BR')}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailModal;