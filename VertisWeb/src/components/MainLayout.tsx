import React, { useState, useEffect } from 'react';
import Menu from '../pages/Menu/Menu.tsx';
import { Outlet } from 'react-router-dom';
import Header from './Header.tsx';
import './MainLayout.css';
import { ThemeContext, Theme } from './ThemeContext.tsx';
import AlertStatus, { AlertOptions } from './AlertStatus/AlertStatus.tsx';

// Criação do Contexto para o Alerta
export const AlertContext = React.createContext<(options: AlertOptions) => void>(() => {});

function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [alert, setAlert] = useState<AlertOptions | null>(null);

    const showAlert = (options: AlertOptions) => {
        setAlert(options);
    };

    // Inicializa o tema lendo do localStorage, com 'light' como padrão.
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) || 'light';
    });

    // Efeito para salvar o tema no localStorage sempre que ele mudar.
    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <AlertContext.Provider value={showAlert}>
                <div className="main-layout-wrapper">
                    <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <Menu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                    
                    {alert && <AlertStatus {...alert} onClose={() => setAlert(null)} />}

                    {/* Adiciona a classe de tema aqui, no container do conteúdo */}
                    <div className={`content-area ${isSidebarOpen ? 'shifted' : ''} ${theme}-mode`}>
                        <Outlet /> {/* O conteúdo da rota filha será renderizado aqui */}
                    </div>
                </div>
            </AlertContext.Provider>
        </ThemeContext.Provider>
    );
}

export default MainLayout;