import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MainLayout from './MainLayout';

const ProtectedRoute = () => {
  const isAuthenticated = useAuth();

  // Se o usuário estiver autenticado, renderiza o layout principal (que contém o <Outlet />).
  // Caso contrário, redireciona para a página de login.
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
