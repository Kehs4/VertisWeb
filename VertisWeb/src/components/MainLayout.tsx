import React, { useState, useEffect } from 'react';
import Menu from '../pages/Menu/Menu.tsx';
import { Outlet } from 'react-router-dom';
import Header from './Header.tsx'; // Import the new Header component
import './MainLayout.css'; // We'll create this CSS file
import { ThemeContext, Theme } from '../components/ThemeContext.tsx';

function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
            <div className="main-layout-wrapper">
                <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <Menu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                {/* Adiciona a classe de tema aqui, no container do conteúdo */}
                <div className={`content-area ${isSidebarOpen ? 'shifted' : ''} ${theme}-mode`}>
                    <Outlet /> {/* O conteúdo da rota filha será renderizado aqui */}
                </div>
            </div>
        </ThemeContext.Provider>
    );
}

export default MainLayout;