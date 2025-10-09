import React from 'react';
import { Outlet } from 'react-router-dom';
import Menu from '../pages/Menu/Menu.tsx';

function MainLayout() {
    return (
        <>
            <Menu />
            <Outlet /> {/* O conteúdo da rota filha será renderizado aqui */}
        </>
    );
}

export default MainLayout;