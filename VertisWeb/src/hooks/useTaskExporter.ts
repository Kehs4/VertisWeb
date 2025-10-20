import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task } from '../pages/Admin/Suporte/Tarefas/TarefasPage'; // Ajuste o caminho se necessário

type TaskContext = 'support' | 'development' | 'commercial';

const priorityConfig: { [key: number]: { label: string } } = {
    1: { label: 'Baixa' },
    2: { label: 'Média' },
    3: { label: 'Alta' },
    4: { label: 'Urgente' },
};

// Função para escapar caracteres especiais para CSV
const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

// Função para carregar imagem como Base64 para o PDF
const getBase64Image = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = reject;
        img.src = url;
    });
};

export const useTaskExporter = (tasks: Task[], contextType?: TaskContext) => {

    const handleExport = async (format: 'csv' | 'pdf') => {
        if (tasks.length === 0) {
            alert("Não há tarefas para exportar.");
            return;
        }

        const headers = {
            id: 'ID',
            title: contextType === 'development' ? 'Tarefa' : 'Chamado',
            status: 'Status',
            priority: 'Prioridade',
            user: 'Solicitante',
            customer: contextType === 'development' ? 'Cliente' : 'Unidade de Negócio',
            analyst: contextType === 'development' ? 'Desenvolvedor' : 'Analista(s)',
            includeDate: 'Data de Inclusão',
            prevDate: 'Previsão de Entrega',
            finishDate: 'Data de Encerramento',
            rating: 'Avaliação'
        };

        const body = tasks.map(task => ({
            id: task.id,
            title: task.titulo_tarefa,
            status: task.ind_sit_tarefa,
            priority: priorityConfig[task.ind_prioridade]?.label || 'N/D',
            user: task.nom_criado_por,
            customer: contextType === 'support' ? task.id_unid_negoc : 'N/A',
            analyst: Array.isArray(task.recursos) ? task.recursos.map(r => r.nom_recurso).join(', ') : task.recursos,
            includeDate: new Date(task.dth_inclusao).toLocaleDateString('pt-BR'),
            prevDate: task.dth_prev_entrega ? new Date(task.dth_prev_entrega).toLocaleDateString('pt-BR') : '',
            finishDate: task.dth_encerramento ? new Date(task.dth_encerramento).toLocaleString('pt-BR') : '',
            rating: task.tarefa_avaliacao || ''
        }));

        const fileName = `TaskList_Vertis_${new Date().toLocaleDateString().replace(/\//g, '-')}`;

        if (format === 'csv') {
            const csvHeaders = Object.values(headers).join(';');
            const csvRows = body.map(row => Object.values(row).map(escapeCSV).join(';'));
            const csvString = [csvHeaders, ...csvRows].join('\n');
            const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${fileName}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } else if (format === 'pdf') {
            const doc = new jsPDF({ orientation: 'landscape' });
            const logoBase64 = await getBase64Image('/logo-white.png');
            doc.addImage(logoBase64, 'PNG', 14, 8, 25, 16);

            autoTable(doc, {
                head: [Object.values(headers)],
                body: body.map(row => Object.values(row)),
                startY: 30,
                theme: 'striped',
                headStyles: { fillColor: [45, 55, 72], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 249, 250] },
                styles: { fontSize: 8, cellPadding: 2 },
                didDrawPage: (data) => {
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    const pageCount = (doc as any).internal.getNumberOfPages();
                    doc.text(`Página ${data.pageNumber} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                    doc.text(`Relatório gerado em: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' });
                },
            });

            if (typeof (doc as any).putTotalPages === 'function') {
                (doc as any).putTotalPages('{totalPages}');
            }

            doc.save(`${fileName}.pdf`);
        }
    };

    return { handleExport };
};