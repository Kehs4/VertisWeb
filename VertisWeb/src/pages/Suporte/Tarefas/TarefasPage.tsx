import React, { useState, useEffect } from 'react';
import TaskListView from '../../../components/TaskListView/TaskListView';

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
    recursos: Recurso[];
    comentarios?: Comentario[];
    contatos?: Contato[];
    dth_prev_entrega?: string;
    dth_encerramento?: string;
    dth_inclusao: string;
    dth_exclusao?: string;
}

// --- Dados de Exemplo (Mock Data) ---
// No futuro, esses dados virão de uma API
const initialTasks: Task[] = [
    {
        id: 1, id_unid_negoc: 118, nom_unid_negoc: 'VETEX', id_unid_oper: 1, nom_unid_oper: 'VETEX BLUMENAU',
        criado_por: 'Ana Silva', ind_prioridade: 4, ind_sit_tarefa: 'ER', sit_tarefa: 'Em resolução', qtd_pontos: 8,
        titulo_tarefa: 'Corrigir bug na tela de login onde o botão "Entrar" não funciona em dispositivos móveis.',
        recursos: [{ id_recurso: 10, nom_recurso: 'Martins' }], dth_inclusao: '2025-10-13', dth_prev_entrega: '2025-10-15'
    },
    {
        id: 2, id_unid_negoc: 119, nom_unid_negoc: 'Hormonalle', id_unid_oper: 2, nom_unid_oper: 'Hormonalle SP',
        criado_por: 'Mariana Costa', ind_prioridade: 2, ind_sit_tarefa: 'AG', sit_tarefa: 'Aguardando', qtd_pontos: 3,
        titulo_tarefa: 'Ajudar cliente com dúvida sobre faturamento.',
        recursos: [{ id_recurso: 12, nom_recurso: 'Jéssica' }], dth_inclusao: '2025-10-14'
    },
    {
        id: 3, id_unid_negoc: 118, nom_unid_negoc: 'VETEX', id_unid_oper: 1, nom_unid_oper: 'VETEX BLUMENAU',
        criado_por: 'Luiza Lima', ind_prioridade: 4, ind_sit_tarefa: 'AT', sit_tarefa: 'Em atraso', qtd_pontos: 13,
        titulo_tarefa: 'Verificar lentidão na API de laudos ao gerar PDF.',
        recursos: [{ id_recurso: 10, nom_recurso: 'Martins' }], dth_inclusao: '2025-10-10', dth_prev_entrega: '2025-10-12'
    },
];

function TarefasPage() {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    useEffect(() => {
        document.title = "Vertis | Tarefas";
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
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
        />
    );
}

export default TarefasPage;