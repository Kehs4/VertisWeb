import { useState, useEffect, useCallback } from 'react';
import { Task } from '../pages/Admin/Suporte/Tarefas/TarefasPage'; // Reutilizando a tipagem

type TaskContext = 'support' | 'development' | 'commercial';

/**
 * Hook customizado para buscar e gerenciar a lista de tarefas.
 * @param context - O contexto das tarefas a serem buscadas ('support', 'development', etc.).
 */
export const useTasks = (context: TaskContext) => {
    // Função para formatar a data para o formato YYYY-MM-DD
    const getFormattedDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Inicializa as datas como null para que a busca inicial aguarde a data correta
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState(getFormattedDate(new Date()));

    useEffect(() => {
        // Na montagem inicial, busca a data da tarefa pendente mais antiga
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

    const addTask = (newTask: Task) => {
        setTasks(prevTasks => [newTask, ...prevTasks]);
    };

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
                tarefa_avaliacao: taskToUpdate.tarefa_avaliacao,
                id_vinculo: taskToUpdate.id_vinculo || null,
                ind_vinculo: taskToUpdate.id_vinculo ? 'S' : 'N',
                tipo_chamado: taskToUpdate.tipo_chamado || [],
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
                alert(`Erro ao atualizar tarefa: ${errorText}`);
                throw new Error(errorText); // Lança um erro para o .catch do chamador
            }
        } catch (error) {
            console.error(`Erro de rede ao atualizar tarefa ${taskToUpdate.id}:`, error);
            throw error; // Re-lança o erro
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteTask = useCallback(async (taskId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Se a exclusão no backend for bem-sucedida, remove a tarefa do estado local
                setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
                // Opcional: Se houver alguma complexidade na atualização da lista,
                // você pode chamar fetchTasks() novamente para garantir a consistência.
                // await fetchTasks();
            } else {
                const errorText = await response.text();
                console.error(`Falha ao remover tarefa ${taskId}:`, errorText);
                alert(`Erro ao remover tarefa: ${errorText}`);
            }
        } catch (error) {
            console.error(`Erro de rede ao remover tarefa ${taskId}:`, error);
            alert('Erro de rede ao remover tarefa.');
        } finally {
            setIsLoading(false);
        }
    }, []); // Não há dependências externas que mudem o comportamento desta função


    // Retorna os estados e as funções para serem usados no componente
    return { tasks, isLoading, startDate, endDate, setStartDate, setEndDate, addTask, updateTask, deleteTask, updateTaskStatus };
};