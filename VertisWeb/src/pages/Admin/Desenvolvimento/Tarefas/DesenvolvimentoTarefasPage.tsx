import React from 'react';
import TaskListView from '../../../../components/TaskListView/TaskListView';
import { Task } from '../../../Admin/Suporte/Tarefas/TarefasPage'; // Reutilizando a interface
import { useTasks } from '../../../../hooks/useTasks';

function DesenvolvimentoTarefasPage() {
    // Utiliza o hook customizado para buscar e gerenciar as tarefas de desenvolvimento
    const { tasks, isLoading, setStartDate, setEndDate, addTask, updateTask, deleteTask } = useTasks('development');

    // Função que será passada para o TaskListView para atualizar as datas
    const handleDateChange = (newStartDate: string, newEndDate: string) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
    };

    return (
        <TaskListView
            title="Planilha de Tarefas - Desenvolvimento"
            tasks={tasks}
            isLoading={isLoading} // Passa o estado de loading para o componente
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onDateChange={handleDateChange} // Passa a função de callback para o filho
            contextType="development"
        />
    );
}

export default DesenvolvimentoTarefasPage;