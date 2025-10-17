import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { serialize } from 'cookie';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Log para depuração: Verificar se as variáveis de ambiente foram carregadas
console.log('[ENV] DB_USER:', process.env.DB_USER);
console.log('[ENV] DB_HOST:', process.env.DB_HOST);

// --- ENDPOINTS PARA CONTATOS COM POSTGRESQL ---
// Configuração do Pool de Conexões com o PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    // Usar + para converter para número é um pouco mais limpo que parseInt
    port: +(process.env.DB_PORT || "5432"),
});

const app = express();
const port = 9000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // Adiciona o middleware para processar cookies
app.use(cors());
 
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Log dos dados recebidos do frontend
        console.log(`[API /login] Recebida requisição para o usuário: ${username}`);

        const payload = {
            unid_negoc: 211,
            unid_oper: 1,
            dev_mode: "S",
            svcName: "desenv-vertis"
        };

        // Log do que está sendo enviado para a API
        console.log(`[API /login] Enviando payload para a API externa:`, payload);
 
        const apiResponse = await fetch('http://177.11.209.38/constellation/IISConstellationAPI.dll/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
            },
            body: JSON.stringify(payload)
        });
 
        if (apiResponse.status === 200) {
            const data = await apiResponse.json();
            // Log da resposta de sucesso da API
            console.log(`[API /login] Resposta de sucesso (200) da API externa:`, data);

            // Define o token em um cookie HttpOnly seguro
            res.setHeader('Set-Cookie', serialize('authToken', data.token, {
                httpOnly: true, // Impede o acesso via JavaScript
                secure: process.env.NODE_ENV !== 'development', // Garante HTTPS em produção
                sameSite: 'strict', // Proteção contra CSRF
                maxAge: 60 * 60 * 24, // Expira em 1 dia
                path: '/', // Disponível em todo o site
            }));

            // Decodifica o payload do token JWT para extrair o nome de usuário.
            // O token é dividido em 3 partes (header, payload, signature), pegamos a segunda (payload).
            const payloadBase64 = data.token.split('.')[1];
            const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
            const userName = decodedPayload.username;

            // Envia uma resposta de sucesso com dados não sensíveis do usuário
            res.status(200).json({ name: userName, message: 'Login bem-sucedido' });
        } else {
            // Log da resposta de erro da API
            const errorText = await apiResponse.text();
            console.error(`[API /login] Erro da API (${apiResponse.status}):`, errorText);
            res.status(apiResponse.status).send(errorText || 'Erro ao autenticar na API externa.');
        };
 
    } catch (error) {
        console.error('Erro ao processar o login:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.post('/logout', (req, res) => {
    // Define o cookie 'authToken' com uma data de expiração no passado para removê-lo
    res.setHeader('Set-Cookie', serialize('authToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      expires: new Date(0), // Expira imediatamente
      path: '/',
    }));
    res.status(200).json({ message: 'Logout bem-sucedido' });
  });

// Função para formatar a data como YYYY-MM-DD
const getFormattedDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

app.get('/tasks', async (req, res) => {
    // Pega as datas da query string ou usa a data atual como padrão
    const today = getFormattedDate(new Date());
    const { dat_inicial = today, dat_final = today } = req.query;

    console.log(`[API /tasks] Buscando tarefas de ${dat_inicial} até ${dat_final} no banco de dados.`);

    try {
        // A coluna de data/hora na tabela parece ser 'dth_inclusao'.
        // Usamos '::date' para comparar apenas a parte da data.
        const query = `
            SELECT
                t.id, t.id_unid_negoc, t.id_unid_oper, t.id_sist_modulo, t.id_criado_por,
                creator.nom_contato as nom_criado_por, -- Adiciona o nome do criador
                t.ind_prioridade, t.ind_sit_tarefa, t.qtd_pontos, t.titulo_tarefa,
                TO_CHAR(t.dth_inclusao, 'YYYY-MM-DD HH24:MI:SS') as dth_inclusao,
                TO_CHAR(t.dth_abertura, 'YYYY-MM-DD HH24:MI:SS') as dth_abertura,
                TO_CHAR(t.dth_encerramento, 'YYYY-MM-DD HH24:MI:SS') as dth_encerramento,
                TO_CHAR(t.dth_prev_entrega, 'YYYY-MM-DD HH24:MI:SS') as dth_prev_entrega,
                t.dth_exclusao
            FROM unid_oper_tarefa t
            LEFT JOIN unid_oper_contatos creator ON t.id_criado_por = creator.id_contato
            WHERE t.dth_inclusao::date >= $1 AND t.dth_inclusao::date <= $2
            ORDER BY t.dth_inclusao DESC;
        `;
        const params = [dat_inicial, dat_final];

        const { rows } = await pool.query(query, params);
        
        // Adiciona os recursos associados a cada tarefa
        for (const task of rows) {
            // Busca os recursos na tabela 'unid_oper_contatos'
            const resourceQuery = `
                SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso 
                FROM unid_oper_tarefa_x_recurso utr
                JOIN unid_oper_contatos c ON c.id_contato = utr.id_recurso
                WHERE utr.id_tarefa = $1`;
            const { rows: resources } = await pool.query(resourceQuery, [task.id]);
            task.recursos = resources;
        }
        res.status(200).json(rows);
    } catch (error) {
        console.error('Ocorreu um erro ao buscar as listas de tarefas:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/task/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        console.log(`[API /task/:id] Buscando tarefa com ID: ${taskId}`);

        // Query principal para buscar os dados da tarefa e o nome do criador
        const taskQuery = `
            SELECT 
                t.id, t.id_unid_negoc, t.id_unid_oper, t.id_sist_modulo, t.id_criado_por,
                creator.nom_contato as nom_criado_por,
                t.ind_prioridade, t.ind_sit_tarefa, t.qtd_pontos, t.titulo_tarefa,
                TO_CHAR(t.dth_inclusao, 'YYYY-MM-DD HH24:MI:SS') as dth_inclusao,
                TO_CHAR(t.dth_abertura, 'YYYY-MM-DD HH24:MI:SS') as dth_abertura,
                TO_CHAR(t.dth_encerramento, 'YYYY-MM-DD HH24:MI:SS') as dth_encerramento,
                TO_CHAR(t.dth_prev_entrega, 'YYYY-MM-DD HH24:MI:SS') as dth_prev_entrega,
                t.dth_exclusao
            FROM unid_oper_tarefa t
            LEFT JOIN unid_oper_contatos creator ON t.id_criado_por = creator.id_contato
            WHERE t.id = $1;
        `;
        const { rows: taskRows, rowCount } = await pool.query(taskQuery, [taskId]);

        if (rowCount === 0) {
            return res.status(404).send('Tarefa não encontrada.');
        }

        const task = taskRows[0];

        // Query para buscar os recursos associados
        const resourceQuery = `
            SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso 
            FROM unid_oper_tarefa_x_recurso utr
            JOIN unid_oper_contatos c ON c.id_contato = utr.id_recurso
            WHERE utr.id_tarefa = $1`;
        const { rows: resources } = await pool.query(resourceQuery, [taskId]);
        task.recursos = resources;

        res.status(200).json(task);
    } catch (error) {
        console.error(`[API /task/${taskId}] Ocorreu um erro ao buscar detalhes da tarefa:`, error);
        res.status(500).send('Erro interno do servidor');
    }
})

app.post('/tasks', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Inicia a transação

        const { titulo_tarefa, id_criado_por, id_unid_negoc, id_unid_oper, ind_prioridade, dth_prev_entrega, recursos = [] } = req.body;

        // 1. Insere a tarefa principal
        const taskQuery = `
            INSERT INTO unid_oper_tarefa (titulo_tarefa, id_criado_por, id_unid_negoc, id_unid_oper, ind_prioridade, dth_prev_entrega, ind_sit_tarefa, dth_inclusao)
            VALUES ($1, $2, $3, $4, $5, $6, 'AB', NOW())
            RETURNING *;
        `;
        const taskValues = [titulo_tarefa, id_criado_por, id_unid_negoc, id_unid_oper, ind_prioridade, dth_prev_entrega || null];
        const { rows: [newTask] } = await client.query(taskQuery, taskValues);

        // 2. Insere os recursos associados
        if (recursos && recursos.length > 0) {
            const resourceQuery = 'INSERT INTO unid_oper_tarefa_x_recurso (id_tarefa, id_recurso) VALUES ($1, $2)';
            for (const recurso of recursos) {
                await client.query(resourceQuery, [newTask.id, recurso.id_recurso]);
            }
        }

        await client.query('COMMIT'); // Confirma a transação
        console.log('[API /tasks] Nova tarefa criada com sucesso:', newTask);
        res.status(201).json(newTask);

    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error('Ocorreu um erro ao criar a tarefa:', error);
        res.status(500).send('Erro interno do servidor');
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
});

app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {

        await client.query('BEGIN'); // Inicia a transação

        const {
            titulo_tarefa,
            id_unid_negoc,
            id_unid_oper,
            id_sist_modulo, // Pode ser que não venha do frontend, mas é bom ter
            ind_prioridade,
            ind_sit_tarefa,
            qtd_pontos,
            dth_prev_entrega,
            dth_abertura, // Pode ser atualizado se o status mudar para 'AB'
            dth_encerramento, // Atualizado quando o status muda para 'FN'
            dth_exclusao, // Se a tarefa for excluída logicamente
            ind_vinculo,
            id_vinculo,
            satisfaction_rating,
            tipo_chamado = [], // Array de strings para flags
            recursos = [] // Array de objetos { id_recurso, nom_recurso }
        } = req.body;

        // Converte dth_prev_entrega para o formato de data do DB, ou null
        const formattedDthPrevEntrega = dth_prev_entrega ? new Date(dth_prev_entrega.split(' ')[0]).toISOString() : null;
        const formattedDthAbertura = dth_abertura ? new Date(dth_abertura.split(' ')[0]).toISOString() : null;
        const formattedDthEncerramento = dth_encerramento ? new Date(dth_encerramento.split(' ')[0]).toISOString() : null;
        const formattedDthExclusao = dth_exclusao ? new Date(dth_exclusao.split(' ')[0]).toISOString() : null;

        // 1. Atualiza a tarefa principal
        const updateTaskQuery = `
            UPDATE unid_oper_tarefa
            SET
                titulo_tarefa = $1,
                id_unid_negoc = $2,
                id_unid_oper = $3,
                id_sist_modulo = $4,
                ind_prioridade = $5,
                ind_sit_tarefa = $6,
                qtd_pontos = $7,
                dth_prev_entrega = $8,
                dth_abertura = $9,
                dth_encerramento = $10,
                dth_exclusao = $11,
                ind_vinculo = $12,
                id_vinculo = $13,
                satisfaction_rating = $14,
                tipo_chamado = $15
            WHERE id = $16
            RETURNING *;
        `;
        const updateTaskValues = [
            titulo_tarefa, id_unid_negoc, id_unid_oper, id_sist_modulo,
            ind_prioridade, ind_sit_tarefa, qtd_pontos, formattedDthPrevEntrega,
            formattedDthAbertura, formattedDthEncerramento, formattedDthExclusao,
            ind_vinculo, id_vinculo, satisfaction_rating, tipo_chamado, id
        ];
        const { rows: [updatedTask], rowCount } = await client.query(updateTaskQuery, updateTaskValues);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Tarefa não encontrada.');
        }

        // 2. Atualiza os recursos associados
        // Primeiro, remove todos os recursos existentes para esta tarefa
        await client.query('DELETE FROM unid_oper_tarefa_x_recurso WHERE id_tarefa = $1', [id]);

        // Em seguida, insere os novos recursos
        if (recursos && recursos.length > 0) {
            const insertResourceQuery = 'INSERT INTO unid_oper_tarefa_x_recurso (id_tarefa, id_recurso) VALUES ($1, $2)';
            for (const recurso of recursos) {
                await client.query(insertResourceQuery, [id, recurso.id_recurso]);
            }
        }

        await client.query('COMMIT'); // Confirma a transação
        console.log(`[API /tasks] Tarefa ${id} atualizada com sucesso:`, updatedTask);
        res.status(200).json(updatedTask);

    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error(`Ocorreu um erro ao atualizar a tarefa ${id}:`, error);
        res.status(500).send('Erro interno do servidor');
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
});





/* app.get('/tasks', async (req, res) => {
    try {
        // Pega as datas da query string ou usa a data atual como padrão
        const today = getFormattedDate(new Date());
        const { dat_inicial = today, dat_final = today } = req.query;

        console.log(`[API /tasks] Buscando tarefas de ${dat_inicial} até ${dat_final}.`);
        const apiUrl = `http://177.11.209.38:80/constellation/IISConstellationAPI.dll/constellation-api/V1.1/unid_oper_tarefa?dat_inicial=${dat_inicial}&dat_final=${dat_final}`;

        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + req.cookies.authToken, // Usa o token do cookie
            },
        });

        if (apiResponse.ok) {
            const tasks = await apiResponse.json();
            res.status(200).json(tasks);
        } else {
            res.status(apiResponse.status).send('Erro ao buscar tarefas da API externa.');
        }
    } catch (error) {
        console.error('Ocorreu um erro ao buscar as listas de tarefas:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/*
app.get('/oldest-pending-task-date', async (req, res) => {
    try {
        console.log(`[API /oldest-pending-task-date] Buscando data da tarefa pendente mais antiga.`);
        // Busca todas as tarefas, sem filtro de data inicial, para encontrar a mais antiga
        const apiUrl = `http://177.11.209.38:80/constellation/IISConstellationAPI.dll/constellation-api/V1.1/unid_oper_tarefa`;

        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + req.cookies.authToken,
            },
        });

        if (apiResponse.ok) {
            const tasks = await apiResponse.json();
            // Filtra para encontrar tarefas pendentes (não finalizadas ou canceladas)
            const pendingTasks = tasks.filter(task => task.ind_sit_tarefa !== 'FN' && task.ind_sit_tarefa !== 'CA');

            if (pendingTasks.length > 0) {
                // Encontra a data mais antiga (menor) entre as tarefas pendentes
                const oldestDate = pendingTasks.reduce((oldest, task) => {
                    return task.dth_inclusao < oldest ? task.dth_inclusao : oldest;
                }, pendingTasks[0].dth_inclusao);
                res.status(200).json({ oldestDate: oldestDate.split('T')[0] });
            } else {
                // Se não houver tarefas pendentes, retorna a data de hoje
                res.status(200).json({ oldestDate: getFormattedDate(new Date()) });
            }
        } else {
            res.status(apiResponse.status).send('Erro ao buscar tarefas da API externa.');
        }
    } catch (error) {
        console.error('Ocorreu um erro ao buscar a data da tarefa mais antiga:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/task/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        console.log(`[API /task/${taskId}] Recebida requisição para buscar detalhes da tarefa.`);
        const apiResponse = await fetch(`http://177.11.209.38:80/constellation/IISConstellationAPI.dll/constellation-api/V1.1/unid_oper_tarefa/${taskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + req.cookies.authToken, // Usa o token do cookie
        },
        });
        
        if (apiResponse.ok) {
            const task = await apiResponse.json();
            res.status(200).json(task);
        } else {
            res.status(apiResponse.status).send('Erro ao buscar detalhes da tarefa da API externa.');
        }
        
    } catch (error) {
        console.error(`[API /task/${taskId}] Ocorreu um erro ao buscar detalhes da tarefa:`, error);
        res.status(500).send('Erro interno do servidor');
    }

})

*/

// GET /contacts - Listar contatos com busca
app.get('/contacts', async (req, res) => {
    const { search } = req.query;
    try {
        let query = 'SELECT id_contato as id, nom_contato as nome, id_unid_oper, num_telefone1 as telefone FROM unid_oper_contatos';
        const params = [];
        if (search) {
            query += ` WHERE nom_contato ILIKE $1 OR num_telefone1 ILIKE $1`;
            params.push(`%${search}%`);
        }
        query += ' ORDER BY id_contato';
        const { rows } = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// POST /contacts - Criar novo contato
app.post('/contacts', async (req, res) => {
    const { nome, id_unid_negoc, nom_unid_negoc, id_unid_oper, nom_unid_oper, telefone } = req.body;
    try {
        const query = `
            INSERT INTO unid_oper_contatos (nom_contato, id_unid_oper, num_telefone1)
            VALUES ($1, $2, $3)
            RETURNING id_contato as id, nom_contato as nome, id_unid_oper, num_telefone1 as telefone;
        `;
        const values = [nome, id_unid_oper || null, telefone];
        const { rows } = await pool.query(query, values);
        console.log('[API /contacts] Novo contato adicionado:', rows[0]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao criar contato:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// PUT /contacts/:id - Atualizar contato
app.put('/contacts/:id', async (req, res) => {
    const contactId = parseInt(req.params.id, 10);
    const { nome, id_unid_negoc, nom_unid_negoc, id_unid_oper, nom_unid_oper, telefone } = req.body;
    try {
        const query = `
            UPDATE unid_oper_contatos
            SET nom_contato = $1, id_unid_oper = $2, num_telefone1 = $3
            WHERE id_contato = $4
            RETURNING id_contato as id, nom_contato as nome, id_unid_oper, num_telefone1 as telefone;
        `;
        const values = [nome, id_unid_oper || null, telefone, contactId];
        const { rows, rowCount } = await pool.query(query, values);
        if (rowCount === 0) {
            return res.status(404).send('Contato não encontrado.');
        }
        console.log(`[API /contacts] Contato ${contactId} atualizado:`, rows[0]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar contato:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// DELETE /contacts/:id - Excluir contato
app.delete('/contacts/:id', async (req, res) => {
    const contactId = parseInt(req.params.id, 10);
    try {
        const { rowCount } = await pool.query('DELETE FROM unid_oper_contatos WHERE id_contato = $1', [contactId]);
        if (rowCount === 0) {
            return res.status(404).send('Contato não encontrado.');
        }
        console.log(`[API /contacts] Contato ${contactId} excluído.`);
        res.status(204).send(); // No Content
    } catch (error) {
        console.error('Erro ao excluir contato:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// --- MOCK DATA E ENDPOINTS PARA RECURSOS (ANALISTAS/DESENVOLVEDORES) ---

let mockResources = [
    { id_recurso: 1, nom_recurso: 'Kleyton', recurso_funcao: 'Desenvolvedor' },
    { id_recurso: 2, nom_recurso: 'Lima', recurso_funcao: 'Desenvolvedor' },
    { id_recurso: 3, nom_recurso: 'Marcelo', recurso_funcao: 'Desenvolvedor' },
    { id_recurso: 4, nom_recurso: 'David', recurso_funcao: 'Desenvolvedor' },
    { id_recurso: 5, nom_recurso: 'Martins', recurso_funcao: 'Analista de Suporte' },
    { id_recurso: 6, nom_recurso: 'Mariana', recurso_funcao: 'Analista de Suporte' },
    { id_recurso: 7, nom_recurso: 'Luiza', recurso_funcao: 'Analista de Suporte' },
    { id_recurso: 8, nom_recurso: 'Ivan', recurso_funcao: 'Analista de Suporte' },
    { id_recurso: 9, nom_recurso: 'Siuah', recurso_funcao: 'Desenvolvedor' },
];
let nextResourceId = 10;

// GET /api/resources - Listar recursos com busca
app.get('/resources', (req, res) => {
    const { search = '' } = req.query;
    const lowercasedSearch = search.toLowerCase();

    const filtered = mockResources.filter(r => r.nom_recurso.toLowerCase().includes(lowercasedSearch));
    res.status(200).json(filtered);
});

// POST /api/resources - Criar novo recurso
app.post('/resources', (req, res) => {
    const { nom_recurso, recurso_funcao } = req.body;
    if (!nom_recurso) {
        return res.status(400).send('O nome do recurso é obrigatório.');
    }
    const newResource = { id_recurso: nextResourceId++, nom_recurso, recurso_funcao };
    mockResources.push(newResource);
    console.log('[API /resources] Novo recurso adicionado:', newResource);
    res.status(201).json(newResource);
});

// PUT /api/resources/:id - Atualizar recurso
app.put('/resources/:id', (req, res) => {
    const resourceId = parseInt(req.params.id, 10);
    const { nom_recurso, recurso_funcao } = req.body;
    const resourceIndex = mockResources.findIndex(r => r.id_recurso === resourceId);

    if (resourceIndex === -1) {
        return res.status(404).send('Recurso não encontrado.');
    }
    // Atualiza os campos, se eles forem fornecidos
    if (nom_recurso) mockResources[resourceIndex].nom_recurso = nom_recurso;
    if (recurso_funcao) mockResources[resourceIndex].recurso_funcao = recurso_funcao;

    console.log(`[API /resources] Recurso ${resourceId} atualizado.`);
    res.status(200).json(mockResources[resourceIndex]);
});

// DELETE /api/resources/:id - Excluir recurso
app.delete('/resources/:id', (req, res) => {
    const resourceId = parseInt(req.params.id, 10);
    const initialLength = mockResources.length;
    mockResources = mockResources.filter(r => r.id_recurso !== resourceId);

    if (mockResources.length === initialLength) {
        return res.status(404).send('Recurso não encontrado.');
    }
    console.log(`[API /resources] Recurso ${resourceId} excluído.`);
    res.status(204).send();
});


app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

process.stdin.resume();
