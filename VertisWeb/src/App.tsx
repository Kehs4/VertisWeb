import { createBrowserRouter, RouterProvider, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

// Layout Principal que contém o Header e o Menu Lateral
import MainLayout from './components/MainLayout';

// Páginas Públicas
import Home from './pages/home/Home';
import Login from './pages/login/Login';

// Páginas "Filhas" que serão renderizadas dentro do MainLayout
import Dashboard from './pages/Dashboard/Dashboard';
import PartnerPage from './pages/Vertis/Arquivo/Parceiro de Negocio/PartnerPage';
import OperationalUnitPage from './pages/Vertis/Arquivo/Unidades Operacionais/OperationalUnitPage';
import ServiceOrderPage from './pages/Vertis/Operacional/Ordem de Serviço/ServiceOrderPage';
import NotFound from './pages/NotFound/NotFound';
import DashSupport from './pages/Suporte/Dashboard/DashSupport'
import TarefasPage from './pages/Suporte/Tarefas/TarefasPage';
import ProtectedRoute from './components/ProtectedRoute';


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
  // Foi realizado a alteração para que o arquivo ProtectedRoute faça a verificação se há
  // um token valido para o usuario, ou se ele realizou o login, se sim agora o projeto passa para o
  // MainLayout.tsx e entrega as páginas normalmente, caso contrário envia o usuario para o /login.
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/parceiros/:partnerType', element: <PartnerPage /> },
      { path: '/unidades-operacionais', element: <OperationalUnitPage /> },
      { path: '/ordem-de-servico', element: <ServiceOrderPage /> },
      { path: '/suporte/dashboard', element: <DashSupport /> },
      { path: '/suporte/tarefas', element: <TarefasPage /> },
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