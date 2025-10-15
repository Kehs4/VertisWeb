import React, { useState, useEffect } from 'react';
import TaskListView from '../../../../components/TaskListView/TaskListView';

// --- Tipagem dos Dados ---
// Esta tipagem pode ser movida para um arquivo central de tipos no futuro

export interface Recurso { // Exportando para utilizar no edit task
    id_recurso: number;
    nom_recurso: string;
}

export interface Comentario { // Exportando para utilizar no edit task
    id_recurso: number;
    nom_recurso: string;
    comentario: string;
    dth_inclusao: string;
}

export interface Contato { // Exportando para utilizar no edit task
    id_contato: number;
    nom_recurso: string;
    telefone?: string;
}

export interface Task { // Exportando para ser usado no Modal
    id: number;
    id_unid_negoc: number;
    nom_unid_negoc: string;
    id_unid_oper: number;
    nom_unid_oper: string;
    criado_por: string;
    ind_prioridade: number;
    ind_sit_tarefa: string;
    sit_tarefa: string;
    qtd_pontos: number;
    titulo_tarefa: string;
    recursos: Recurso[] | number;
    comentarios?: Comentario[] | number;
    contatos?: Contato[] | number;
    dth_prev_entrega?: string;
    dth_encerramento?: string;
    dth_inclusao: string;
    satisfaction_rating?: number; // Novo campo para satisfação do cliente
    dth_exclusao?: string;
}

// --- Dados de Exemplo (Mock Data) ---
// No futuro, esses dados virão de uma API

function TarefasPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Novo estado de loading

    useEffect(() => {
        document.title = "Vertis | Chamados - Suporte";

        // Função para buscar os dados da API
        const fetchTasks = async () => {
            setIsLoading(true); // Ativa o loading antes da busca
            try {
                // A configuração de proxy no Vite redireciona /api para o seu backend
                const response = await fetch('/api/tasks');
                if (response.ok) {
                    const data = await response.json();
                    // Filtra as tarefas para exibir apenas as que NÃO são de Desenvolvimento
                    const supportTasks = data.filter((task: Task) => task.id_unid_negoc !== 200);
                    setTasks(supportTasks);
                } else {
                    console.error("Falha ao buscar tarefas:", response.statusText);
                }
            } catch (error) {
                console.error("Erro de rede ao buscar tarefas:", error);
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
        // Adicionar um alerta de confirmação antes de remover
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    const handleUpdateTask = (updatedTask: Task) => {
        setTasks(prevTasks => 
            prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
        );
    };

    return (
        <TaskListView
            title="Planilha de Chamados - Suporte"
            tasks={tasks}
            isLoading={isLoading} // Passa o estado de loading para o componente
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            contextType='support'
        />
    );
}

export default TarefasPage;