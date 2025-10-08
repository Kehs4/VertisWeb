import { Route, Routes } from 'react-router-dom'
import Login from './pages/login/Login.jsx'
import Home from './pages/home/Home.jsx'
import NotFound from './pages/NotFound/NotFound.jsx';
import { useEffect } from 'react';
import Menu from './pages/Menu/Menu.jsx';
import PartnerPage from './pages/Vertis/Arquivo/Parceiro de Negocio/PartnerPage.jsx';
import OperationalUnitPage from './pages/Vertis/Arquivo/Unidades Operacionais/OperationalUnitPage.jsx';

function AppRoutes() {

  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/unidades-operacionais" element={<OperationalUnitPage />} />
      <Route path="/parceiros/:partnerType" element={<PartnerPage />} />
      <Route path="/login" element={<Login />} />
      <Route path='/dashboard' element={<Menu />} />
      <Route path="*" element={<NotFound/>} />
    </Routes>
  );
}

export default AppRoutes;