import React, { useEffect } from 'react';
import TaskListView from '../../../../components/TaskListView/TaskListView'; // Corrigido para importação correta
import { useTasks } from '../../../../hooks/useTasks';

// --- Tipagem dos Dados ---
// Esta tipagem pode ser movida para um arquivo central de tipos no futuro

export interface Recurso { // Exportando para utilizar no edit task
    id_recurso: number;
    nom_recurso: string;
    recurso_funcao?: string; // Mapeado de inf_adicional
    telefone?: string;
    email?: string;
}

export interface Comentario { // Exportando para utilizar no edit task
    id_recurso: number;
    nom_recurso: string;
    comentario: string;
    dth_inclusao: string;
}

export interface Task { // Exportando para ser usado no Modal
    id: number;
    id_unid_negoc: number;
    nom_unid_negoc: string;
    id_unid_oper: number;
    nom_unid_oper: string;
    id_criado_por: number | null; // Permite nulo para o estado inicial do formulário
    nom_criado_por: string;
    ind_prioridade: number;
    ind_sit_tarefa: string;
    sit_tarefa: string;
    ind_vinculo: 'S' | 'N'; // Indica se há um vínculo
    id_vinculo?: number; // Armazena o ID da tarefa principal do vínculo
    qtd_pontos: number;
    titulo_tarefa: string;
    recursos: Recurso[] | number;
    comentarios?: Comentario[] | number; 
    dth_abertura?: string;
    dth_prev_entrega?: string;
    dth_encerramento?: string;
    dth_inclusao: string;
    tipo_chamado?: string[]; // Alterado para array de strings
    tarefa_avaliacao?: number; // Novo campo para satisfação do cliente
    dth_exclusao?: string;
}

// --- Dados de Exemplo (Mock Data) ---
// No futuro, esses dados virão de uma API

function TarefasPage() {
    // Utiliza o hook customizado para buscar e gerenciar as tarefas de suporte
    const { tasks, isLoading, startDate, endDate, setStartDate, setEndDate, addTask, updateTask, deleteTask, updateTaskStatus } = useTasks('support');

    // Efeito para atualizar o título da página no navegador
    useEffect(() => {
        document.title = "Vertis | Chamados - Suporte";
    }, []);

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
            startDate={startDate}
            endDate={endDate}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            updateTaskStatus={updateTaskStatus}
            onDateChange={handleDateChange} // Passa a função de callback para o filho
            contextType='support'
        />
    );
}

export default TarefasPage;