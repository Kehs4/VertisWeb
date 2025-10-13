import { useState, useEffect } from 'react';

export const useAuth = () => {
  // Inicializa o estado com o valor atual do localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    // Função para lidar com mudanças no storage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'isAuthenticated') {
        setIsAuthenticated(event.newValue === 'true');
      }
    };

    // Adiciona o ouvinte de eventos
    window.addEventListener('storage', handleStorageChange);

    // Remove o ouvinte quando o componente for desmontado
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return isAuthenticated;
};