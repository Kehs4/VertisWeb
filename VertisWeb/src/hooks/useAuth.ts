import { useState, useEffect, useCallback } from 'react';

export const useAuth = () => {
    // Inicializa o estado com o valor atual do localStorage
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('isAuthenticated') === 'true';
    });

    /**
     * Realiza o logout forçado do usuário, limpando o estado e redirecionando para a página de login.
     */
    const logout = useCallback(() => {
        localStorage.setItem('isAuthenticated', 'false');
        setIsAuthenticated(false);
        // Opcional: fazer uma chamada à API para invalidar o cookie no backend
        fetch('/api/logout', { method: 'POST' });
        // Redireciona para a página de home
        window.location.href = '/';
    }, []);

    useEffect(() => {
        /**
         * Verifica a validade do token no backend.
         * Se o token for inválido, força o logout.
         */
        const checkAuthStatus = async () => {
            try {
                const response = await fetch('/api/verify-token');
                if (!response.ok) {
                    // Se a resposta não for OK (ex: 401 Unauthorized), o token é inválido.
                    logout();
                }
            } catch (error) {
                console.error("Erro ao verificar o status de autenticação:", error);
                logout(); // Força o logout em caso de erro de rede
            }
        };

        // Verifica o status ao carregar a aplicação
        if (isAuthenticated) {
            checkAuthStatus();
        }

        // Define um intervalo para verificar o token periodicamente (ex: a cada 15 minutos)
        const interval = setInterval(checkAuthStatus, 15 * 60 * 1000);

        // Limpa o intervalo quando o componente for desmontado
        return () => clearInterval(interval);
    }, [isAuthenticated, logout]);

    return isAuthenticated;
};