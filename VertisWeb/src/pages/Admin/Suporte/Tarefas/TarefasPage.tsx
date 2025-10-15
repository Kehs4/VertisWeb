import React from 'react';
import TaskListView from '../../../../components/TaskListView/TaskListView';
import { useTasks } from '../../../../hooks/useTasks';

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
    // Utiliza o hook customizado para buscar e gerenciar as tarefas de suporte
    const { tasks, isLoading, setStartDate, setEndDate, addTask, updateTask, deleteTask } = useTasks('support');

    // Função que será passada para o TaskListView para atualizar as datas
    const handleDateChange = (newStartDate: string, newEndDate: string) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
    };

    return (
        <TaskListView
            title="Planilha de Chamados - Suporte"
            tasks={tasks}
            isLoading={isLoading} // Passa o estado de loading para o componente
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onDateChange={handleDateChange} // Passa a função de callback para o filho
            contextType='support'
        />
    );
}

export default TarefasPage;