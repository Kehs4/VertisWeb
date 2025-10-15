import { useState, useEffect } from 'react';
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
    const [startDate, setStartDate] = useState(getFormattedDate(new Date()));
    const [endDate, setEndDate] = useState(getFormattedDate(new Date()));

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
                            return task.id_unid_negoc !== 200; // Exclui Desenvolvimento
                        }
                        if (context === 'development') {
                            return task.id_unid_negoc === 200; // Apenas Desenvolvimento
                        }
                        // Adicione outras lógicas de filtro aqui (ex: para 'commercial')
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

        fetchTasks();
    }, [startDate, endDate, context]); // Refaz a busca se as datas ou o contexto mudarem

    // --- Funções de Manipulação de Estado ---
    // Movidas para o hook para centralizar a lógica

    const addTask = (newTask: Task) => {
        setTasks(prevTasks => [newTask, ...prevTasks]);
    };

    const updateTask = (updatedTask: Task) => {
        setTasks(prevTasks =>
            prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
        );
    };

    const deleteTask = (taskId: number) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    // Retorna os estados e as funções para serem usados no componente
    return { tasks, isLoading, setStartDate, setEndDate, addTask, updateTask, deleteTask };
};