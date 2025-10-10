import React from 'react';
import { Link } from 'react-router-dom';
import { Menu as MenuIcon } from '@mui/icons-material';
import './Header.css';

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    return (
        <header className='app-header'>
            <div className='header-left'>
                <button className='hamburger-button' onClick={toggleSidebar}>
                    <MenuIcon />
                </button>
                <Link to={'/dashboard'} className='header-logo-link'>
                    <img src="/public/logo-white.png" alt="Vertis Logo" className="header-logo" />
                </Link>
            </div>
            {/* Você pode adicionar outros conteúdos ao cabeçalho aqui, como informações do usuário, notificações, etc. */}
        </header>
    );
};

export default Header;