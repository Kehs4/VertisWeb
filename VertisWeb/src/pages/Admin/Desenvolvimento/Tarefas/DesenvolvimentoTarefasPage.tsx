import React, { useState, useEffect } from 'react';
import TaskListView from '../../../../components/TaskListView/TaskListView';
import { Task } from '../../../Suporte/Tarefas/TarefasPage'; // Reutilizando a interface

function DesenvolvimentoTarefasPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Novo estado de loading

    useEffect(() => {
        document.title = "Vertis | Tarefas - Desenvolvimento";

        // Função para buscar os dados da API
        const fetchTasks = async () => {
            setIsLoading(true); // Ativa o loading antes da busca
            try {
                // A configuração de proxy no Vite redireciona /api para o seu backend
                const response = await fetch('/api/tasks');
                if (response.ok) {
                    const data = await response.json();
                    // Filtra as tarefas para exibir apenas as da unidade de negócio de Desenvolvimento (ex: id 200)
                    const devTasks = data.filter((task: Task) => task.id_unid_negoc === 200);
                    setTasks(devTasks);
                } else {
                    console.error("Falha ao buscar tarefas de desenvolvimento:", response.statusText);
                }
            } catch (error) {
                console.error("Erro ao buscar tarefas de desenvolvimento:", error);
            } finally {
                setIsLoading(false); // Desativa o loading ao final (sucesso ou erro)
            }
        };

        fetchTasks();
    }, []);

    const handleAddTask = (newTask: Task) => {
        setTasks(prevTasks => [newTask, ...prevTasks]);
    };

    const handleDeleteTask = (taskId: number) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    const handleUpdateTask = (updatedTask: Task) => {
        setTasks(prevTasks =>
            prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
        );
    };

    return (
        <TaskListView
            title="Planilha de Tarefas - Desenvolvimento"
            tasks={tasks}
            isLoading={isLoading} // Passa o estado de loading para o componente
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            contextType="development"
        />
    );
}

export default DesenvolvimentoTarefasPage;