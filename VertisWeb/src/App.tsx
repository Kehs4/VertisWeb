import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React from 'react';

// Layout Principal que contém o Header e o Menu Lateral
import MainLayout from './components/MainLayout';

// Páginas Públicas
import Home from './pages/home/Home';
import Login from './pages/Login/Login';

// Páginas "Filhas" que serão renderizadas dentro do MainLayout
import Dashboard from './pages/Dashboard/Dashboard';
import PartnerPage from './pages/Vertis/Arquivo/Parceiro de Negocio/PartnerPage';
import OperationalUnitPage from './pages/Vertis/Arquivo/Unidades Operacionais/OperationalUnitPage';
import ServiceOrderPage from './pages/Vertis/Operacional/Ordem de Serviço/ServiceOrderPage';
import NotFound from './pages/NotFound/NotFound';

const router = createBrowserRouter([
  // Rotas públicas que NÃO usam o MainLayout
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  // Rota "Pai" que usa o MainLayout. Todas as rotas filhas aparecerão dentro dele.
  {
    element: <MainLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/parceiros/:partnerType', element: <PartnerPage /> },
      { path: '/unidades-operacionais', element: <OperationalUnitPage /> },
      { path: '/ordem-de-servico', element: <ServiceOrderPage /> },
      // Adicione outras rotas protegidas aqui
    ],
  },
  // Rota "catch-all" para páginas não encontradas
  {
    path: '*',
    element: <NotFound />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;