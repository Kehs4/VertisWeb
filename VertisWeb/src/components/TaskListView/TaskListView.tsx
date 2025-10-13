import React from 'react';
import './TaskListView.css';
import FlagIcon from '@mui/icons-material/Flag';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// --- Tipagem dos Dados ---
// No futuro, esta tipagem pode ser movida para um arquivo central de tipos

interface Recurso {
    id_recurso: number;
    nom_recurso: string;
}

interface Comentario {
    id_recurso: number;
    nom_recurso: string;
    comentario: string;
    dth_inclusao: string;
}

interface Contato {
    id_contato: number;
    nom_recurso: string;
}

interface Task {
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

interface TaskListViewProps {
    title: string;
    tasks: Task[];
}

const priorityConfig: { [key: number]: { color: string, label: string } } = {
    1: { color: '#7dcea0', label: 'Baixa' },
    2: { color: '#f7dc6f', label: 'Média' },
    3: { color: '#f0b27a', label: 'Alta' },
    4: { color: '#e74c3c', label: 'Urgente' },
};

const statusConfig: { [key: string]: { backgroundColor: string, color?: string } } = {
    'AG': { backgroundColor: '#aeb6bf' },       // Aguardando
    'ER': { backgroundColor: '#5dade2' },       // Em resolução
    'AT': { backgroundColor: '#f39c12' },       // Em atraso
    'CA': { backgroundColor: '#2c3e50', color: '#bdc3c7' }, // Cancelado
    'FN': { backgroundColor: '#2ecc71' },       // Finalizado
    'AB': { backgroundColor: '#85c1e9' },       // Aberto
};

const TaskListView: React.FC<TaskListViewProps> = ({ title, tasks }) => {
    return (
        <main className="task-list-container">
            <div className="task-list-header">
                <h1 className="task-list-title">{title}</h1>
                <button className="add-task-button">Adicionar Chamado</button>
            </div>
            <div className="task-table-wrapper">
                <table className="task-table">
                    <thead>
                        <tr>
                            <th>Prioridade</th>
                            <th>Status</th>
                            <th>Chamado</th>
                            <th>Solicitante</th>
                            <th>Unidade</th>
                            <th>Analista</th>
                            <th>Criação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.id} className={`task-row status-${task.ind_sit_tarefa.toLowerCase()}`}>
                                <td className="cell-priority">
                                    <FlagIcon style={{ color: priorityConfig[task.ind_prioridade]?.color || '#ccc' }} />
                                    <span>{priorityConfig[task.ind_prioridade]?.label || 'N/D'}</span>
                                </td>
                                <td className="cell-status">
                                    <span className="status-badge" style={statusConfig[task.ind_sit_tarefa] || {}}>
                                        {task.sit_tarefa}
                                    </span>
                                </td>
                                <td className="cell-content">
                                    <p className="task-description">{task.titulo_tarefa}</p>
                                </td>
                                <td>{task.criado_por}</td>
                                <td>{task.nom_unid_oper}</td>
                                <td>{task.recursos.map(r => r.nom_recurso).join(', ') || 'N/A'}</td>
                                <td>{new Date(task.dth_inclusao).toLocaleDateString()}</td>
                                <td className="cell-actions">
                                    <button className="action-button" title="Mais opções">
                                        <MoreVertIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export default TaskListView;