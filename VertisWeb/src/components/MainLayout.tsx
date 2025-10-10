import React, { useState } from 'react';
import Menu from '../pages/Menu/Menu.tsx';
import { Outlet } from 'react-router-dom';
import Header from './Header.tsx'; // Import the new Header component
import './MainLayout.css'; // We'll create this CSS file
import { ThemeContext } from '../components/ThemeContext.tsx';

function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // O estado do tema agora vive no MainLayout
    const [theme, setTheme] = useState<'dark' | 'light'>('light');

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