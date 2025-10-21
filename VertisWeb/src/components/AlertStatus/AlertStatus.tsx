import React, { useEffect, useState } from 'react';
import './AlertStatus.css';

// Ícones para cada tipo de alerta
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertOptions {
    message: string;
    type: AlertType;
    duration?: number;
}

interface AlertStatusProps extends AlertOptions {
    onClose: () => void;
}

const alertConfig = {
    success: { icon: <CheckCircleIcon />, className: 'alert-success' },
    error: { icon: <ErrorIcon />, className: 'alert-error' },
    info: { icon: <InfoIcon />, className: 'alert-info' },
    warning: { icon: <WarningIcon />, className: 'alert-warning' },
};

const AlertStatus: React.FC<AlertStatusProps> = ({ message, type, duration = 5000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animação de entrada
        setIsVisible(true);

        // Configura o timer para fechar automaticamente
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        // Limpa o timer se o componente for desmontado
        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        // Aguarda a animação de saída antes de chamar o onClose principal
        setTimeout(onClose, 300);
    };

    const config = alertConfig[type];

    return (
        <div className={`alert-status-container ${config.className} ${isVisible ? 'visible' : ''}`}>
            <div className="alert-icon">
                {config.icon}
            </div>
            <div className="alert-content">
                <p className="alert-message">{message}</p>
            </div>
            <button onClick={handleClose} className="alert-close-button">
                <CloseIcon />
            </button>
        </div>
    );
};

export default AlertStatus;