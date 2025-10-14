import React, { useState, useEffect } from 'react';
import TaskListView from '../../../components/TaskListView/TaskListView';
import { Task } from '../../Suporte/Tarefas/TarefasPage'; // Reutilizando a interface

// --- Dados de Exemplo para a equipe de Desenvolvimento ---
const initialDevTasks: Task[] = [
    {
        id: 101, id_unid_negoc: 200, nom_unid_negoc: 'DEV_TEAM', id_unid_oper: 10, nom_unid_oper: 'Core System',
        criado_por: 'Gerente de Produto', ind_prioridade: 4, ind_sit_tarefa: 'ER', sit_tarefa: 'Em resolução', qtd_pontos: 13,
        titulo_tarefa: 'Implementar autenticação OAuth 2.0 para nova API.',
        recursos: [{ id_recurso: 50, nom_recurso: 'Siuah' }], dth_inclusao: '2025-10-10', dth_prev_entrega: '2025-10-20'
    },
    {
        id: 102, id_unid_negoc: 200, nom_unid_negoc: 'DEV_TEAM', id_unid_oper: 11, nom_unid_oper: 'Frontend',
        criado_por: 'UX Designer', ind_prioridade: 3, ind_sit_tarefa: 'AG', sit_tarefa: 'Aguardando', qtd_pontos: 8,
        titulo_tarefa: 'Refatorar componente de Tabela para usar virtualização.',
        recursos: [{ id_recurso: 51, nom_recurso: 'Martins' }], dth_inclusao: '2025-10-12',
    },
    {
        id: 103, id_unid_negoc: 200, nom_unid_negoc: 'DEV_TEAM', id_unid_oper: 12, nom_unid_oper: 'Infra/DevOps',
        criado_por: 'Arquiteto de Software', ind_prioridade: 2, ind_sit_tarefa: 'FN', sit_tarefa: 'Finalizado', qtd_pontos: 5,
        titulo_tarefa: 'Migrar pipeline de CI/CD para novo provedor.',
        recursos: [{ id_recurso: 52, nom_recurso: 'Jéssica' }], dth_inclusao: '2025-10-01', dth_encerramento: '2025-10-05T14:00:00Z', satisfaction_rating: 10
    },
];

function DesenvolvimentoTarefasPage() {
    const [tasks, setTasks] = useState<Task[]>(initialDevTasks);

    useEffect(() => {
        document.title = "Vertis | Tarefas - Desenvolvimento";
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
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            contextType="development"
        />
    );
}

export default DesenvolvimentoTarefasPage;