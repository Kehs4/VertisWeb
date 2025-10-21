import { useState, useEffect, useCallback, useContext } from 'react';
import { Task } from '../pages/Admin/Suporte/Tarefas/TarefasPage'; // Reutilizando a tipagem
import { AlertContext } from '../components/MainLayout';

type TaskContext = 'support' | 'development' | 'commercial';

/**
 * Hook customizado para buscar e gerenciar a lista de tarefas.
 * Centraliza a lógica de estado, busca de dados e manipulação (CRUD) de tarefas.
 * @param context O contexto das tarefas a serem buscadas ('support', 'development', etc.), usado para filtrar os resultados.
 * @returns Um objeto contendo a lista de tarefas, estados de carregamento, datas de filtro e funções para manipular as tarefas.
 */
export const useTasks = (context: TaskContext) => {
    const showAlert = useContext(AlertContext);
    /**
     * Formata um objeto Date para uma string no formato 'YYYY-MM-DD'.
     * @param date O objeto Date a ser formatado.
     * @returns A data formatada como string.
     */
    const getFormattedDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Inicializa as datas como null para que a busca inicial aguarde a data correta
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState(getFormattedDate(new Date()));

    useEffect(() => {
        /**
         * Na montagem inicial do hook, busca a data da tarefa pendente mais antiga
         * para definir como a data de início padrão do filtro.
         */
        const fetchInitialDate = async () => {
            if (startDate === null) { // Executa apenas uma vez
                try {
                    const response = await fetch('/api/oldest-pending-task-date');
                    if (response.ok) {
                        const data = await response.json();
                        setStartDate(data.oldestDate);
                    } else {
                        setStartDate(getFormattedDate(new Date()));
                    }
                } catch (error) {
                    console.error("Erro ao buscar data da tarefa mais antiga:", error);
                    setStartDate(getFormattedDate(new Date()));
                }
            }
        };
        fetchInitialDate();
    }, []); // Array de dependência vazio para rodar apenas uma vez

    useEffect(() => {
        /**
         * Efeito que busca as tarefas da API sempre que o intervalo de datas (startDate, endDate)
         * ou o contexto da aplicação é alterado.
         */
        const fetchTasks = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/tasks?dat_inicial=${startDate}&dat_final=${endDate}`);
                if (response.ok) {
                    const data: Task[] = await response.json();

                    // Filtra os dados com base no contexto recebido
                    const filteredData = data.filter(task => {
                        if (context === 'support') {
                            return task.id_unid_negoc !== 1000; // Exclui Desenvolvimento
                        }
                        if (context === 'development') {
                            return task.id_unid_negoc === 1000; // Apenas Desenvolvimento
                        }
                        return true; // Retorna tudo se não houver filtro específico
                    });

                    setTasks(filteredData);
                } else {
                    console.error(`Falha ao buscar tarefas para o contexto ${context}:`, response.statusText);
                }
            } catch (error) {
                console.error("Erro de rede ao buscar tarefas:", error);
            }
            setIsLoading(false);
        };

        if (startDate) { // Só busca as tarefas quando a data inicial estiver definida
            fetchTasks();
        }
    }, [startDate, endDate, context]);

    // --- Funções de Manipulação de Estado ---
    // Movidas para o hook para centralizar a lógica

    /**
     * Adiciona uma nova tarefa ao início da lista de tarefas no estado local.
     * @param newTask A nova tarefa a ser adicionada.
     */
    const addTask = (newTask: Task) => {
        setTasks(prevTasks => [newTask, ...prevTasks]);
    };

    /**
     * Atualiza o status de uma tarefa específica.
     * @param taskId O ID da tarefa a ser atualizada.
     * @param newStatus O novo código de status da tarefa.
     */
    const updateTaskStatus = useCallback(async (taskId: number, newStatus: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/tasks/${taskId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ind_sit_tarefa: newStatus }),
            });

            if (response.ok) {
                const { ind_sit_tarefa, dth_encerramento } = await response.json();
                // Atualiza o estado local de forma otimizada, sem refazer a busca
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === taskId
                            ? { ...task, ind_sit_tarefa, dth_encerramento: dth_encerramento || task.dth_encerramento }
                            : task
                    )
                );
            } else {
                console.error(`Falha ao atualizar status da tarefa ${taskId}`);
            }
        } catch (error) {
            console.error(`Erro de rede ao atualizar status da tarefa ${taskId}:`, error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Atualiza os dados de uma tarefa completa no backend e no estado local.
     * @param taskToUpdate O objeto da tarefa com os dados atualizados.
     * @throws Lança um erro se a atualização na API falhar.
     */
    const updateTask = useCallback(async (taskToUpdate: Task): Promise<void> => {
        setIsLoading(true);
        try {
            // Prepara o payload para a API, removendo campos que não devem ser enviados
            // e enviando apenas os dados que podem ser editados.
            const payload = {
                titulo_tarefa: taskToUpdate.titulo_tarefa,
                ind_prioridade: taskToUpdate.ind_prioridade,
                ind_sit_tarefa: taskToUpdate.ind_sit_tarefa,
                dth_prev_entrega: taskToUpdate.dth_prev_entrega || null,
                dth_encerramento: taskToUpdate.dth_encerramento || null,
                tarefa_avaliacao: taskToUpdate.tarefa_avaliacao,
                id_tarefa_pai: taskToUpdate.id_tarefa_pai || null,
                tipo_chamado: taskToUpdate.tipo_chamado || [],
                comentarios: taskToUpdate.comentarios || [],
                recursos: Array.isArray(taskToUpdate.recursos) ? taskToUpdate.recursos.map(r => ({ id_recurso: r.id_recurso })) : [],
            };

            const response = await fetch(`/api/tasks/${taskToUpdate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const returnedTask = await response.json();
                // Atualiza o estado local com a tarefa retornada pela API (que é a fonte da verdade)
                setTasks(prevTasks =>
                    prevTasks.map(task => (task.id === returnedTask.id ? returnedTask : task))
                );
            } else {
                const errorText = await response.text();
                console.error(`Falha ao atualizar tarefa ${taskToUpdate.id}:`, errorText);
                showAlert({ message: `Erro ao atualizar tarefa: ${errorText}`, type: 'error' });
                throw new Error(errorText); // Lança um erro para o .catch do chamador
            }
        } catch (error) {
            console.error(`Erro de rede ao atualizar tarefa ${taskToUpdate.id}:`, error);
            // Não precisa de outro alerta aqui, pois o throw acima já é um erro de rede.
            // Apenas relança para que o chamador saiba que falhou.
            throw error; // Re-lança o erro
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Realiza a exclusão lógica (soft delete) de uma tarefa.
     * @param taskId O ID da tarefa a ser removida.
     */
    const deleteTask = useCallback(async (taskId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
            });

            // Se a resposta for OK (204) ou Not Found (404 - já foi removida), removemos do estado local.
            if (response.ok || response.status === 404) {
                // Se a exclusão no backend for bem-sucedida, remove a tarefa do estado local
                setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
                showAlert({ message: 'Tarefa removida com sucesso.', type: 'success' });
            } else {
                const errorText = await response.text();
                console.error(`Falha ao remover tarefa ${taskId}:`, errorText);
                showAlert({ message: `Erro ao remover tarefa: ${errorText}`, type: 'error' });
            }
        } catch (error) {
            console.error(`Erro de rede ao remover tarefa ${taskId}:`, error);
            showAlert({ message: 'Erro de rede ao remover tarefa.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [showAlert]);

    // Retorna os estados e as funções para serem usados no componente
    return { tasks, isLoading, startDate, endDate, setStartDate, setEndDate, addTask, updateTask, deleteTask, updateTaskStatus };
};