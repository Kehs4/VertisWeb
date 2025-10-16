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

    const updateTask = (updatedTask: Task) => {
        setTasks(prevTasks =>
            prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
        );
    };

    const deleteTask = (taskId: number) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    // Retorna os estados e as funções para serem usados no componente
    return { tasks, isLoading, startDate, endDate, setStartDate, setEndDate, addTask, updateTask, deleteTask };
};