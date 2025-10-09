import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './pages/login/Login.tsx'
import Home from './pages/home/Home.tsx'
import NotFound from './pages/NotFound/NotFound.tsx';
import Dashboard from './pages/Dashboard/Dashboard.tsx';
import PartnerPage from './pages/Vertis/Arquivo/Parceiro de Negocio/PartnerPage.tsx';
import OperationalUnitPage from './pages/Vertis/Arquivo/Unidades Operacionais/OperationalUnitPage.tsx';

function AppRoutes() {

  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/unidades-operacionais" element={<OperationalUnitPage />} />
      <Route path="/parceiros/:partnerType" element={<PartnerPage />} />
      <Route path="/login" element={<Login />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path="*" element={<NotFound/>} />
    </Routes>
  );
}

export default AppRoutes;