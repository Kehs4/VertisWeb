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
    client_encoding: 'utf8', // Garante que a conexão sempre use UTF-8
});

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // Adiciona o middleware para processar cookies
app.use(cors());

// Middleware para reescrever a URL com base no parâmetro 'path' da Vercel
// Isso garante que o roteamento do Express funcione sem precisar prefixar todas as rotas com /api
app.use((req, res, next) => {
  if (req.query.path) {
    req.url = `/${req.query.path}`;
  }
  next();
});

 
app.post('/login', async (req, res) => { // endpoint de login que retorna o token
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
            console.log(`[API /login] Resposta de sucesso (200) da API externa:`, data, `Usuário: ${username}`);

            // Define o token em um cookie HttpOnly seguro
            res.setHeader('Set-Cookie', serialize('authToken', data.token, {
                httpOnly: true, // Impede o acesso via JavaScript
                secure: process.env.NODE_ENV !== 'development', // Garante HTTPS em produção
                sameSite: 'strict', // Proteção contra CSRF
                maxAge: 3600, // Expira em 1 hora
                path: '/', // Disponível em todo o site
            }));

            // Decodifica o payload do token JWT para extrair o nome de usuário.
            // O token é dividido em 3 partes (header, payload, signature), pegamos a segunda (payload).
            const payloadBase64 = data.token.split('.')[1];
            const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
            const userName = decodedPayload.username;

            // Envia uma resposta de sucesso com dados não sensíveis do usuário
            res.status(200).json({ name: userName, message: 'Login bem-sucedido' });

        } else if (apiResponse.status === 401){
            console.error(`[API /login] Usuário não autorizado. Status:(${apiResponse.status}): Usuário: ${username}`);
            res.status(apiResponse.status).send({error: 'Erro ao autenticar na API externa.'});

        } else if (apiResponse.status === 404) {
            console.error(`[API /login] Usuário não encontrados. Status:(${apiResponse.status}) Usuário: ${username}`);
            res.status(apiResponse.status).send({error: 'Usuário não encontrado.'});

        } else if (apiResponse.status === 403) {
            console.error(`[API /login] Usuário ou senha incorretos. Status:(${apiResponse.status}), Usuário: ${username}`);
            res.status(apiResponse.status).send({error: 'Usuário ou senha incorretos, tente novamente.'});

        } else {
            console.error(`[API /login] Erro desconhecido. Status:(${apiResponse.status}) Usuário: ${username}`);
            res.status(apiResponse.status).send({error: 'Erro desconhecido.'});
        }
            

    } catch (error) {
        console.error('Erro ao processar o login:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route POST /logout
 * @description Realiza o logout do usuário invalidando o cookie de autenticação.
 */
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

/**
 * @route GET /verify-token
 * @description Verifica se o cookie de autenticação existe e é válido.
 * Usado pelo frontend para validar a sessão do usuário.
 */
app.get('/verify-token', (req, res) => {
    const token = req.cookies.authToken;

    if (!token) {
        // Se não há token, o usuário não está autenticado.
        return res.status(401).json({ isAuthenticated: false, message: 'Token não encontrado.' });
    }

    // Se o token existe, consideramos a sessão válida (a validação real ocorre em cada chamada à API externa).
    // Em uma implementação mais complexa, poderíamos decodificar o JWT aqui para verificar a expiração.
    res.status(200).json({ isAuthenticated: true });
});

/**
 * Formata um objeto Date para uma string no formato 'YYYY-MM-DD'.
 * @param {Date} date O objeto Date a ser formatado.
 * @returns {string} A data formatada.
 */
const getFormattedDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formata um objeto Date para um timestamp de banco de dados no formato 'YYYY-MM-DD HH:mm:ss'.
 * @param {Date | string} date O objeto Date ou string a ser formatado.
 * @returns {string | null} O timestamp formatado ou null se a data for inválida.
 */
// Helper function to format a Date object to 'YYYY-MM-DD HH:mm:ss' local time string
const formatToDbTimestamp = (date) => {
    if (!date) return null;
    const d = new Date(date); // Ensure it's a Date object
    // Check if the date is valid
    if (isNaN(d.getTime())) {
        console.warn(`Invalid date provided to formatToDbTimestamp: ${date}`);
        return null;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * @route GET /tasks
 * @description Retorna uma lista de tarefas ativas (não excluídas) com base em um intervalo de datas.
 * Também anexa os recursos, marcadores e comentários associados a cada tarefa.
 */
app.get('/tasks', async (req, res) => {
    // Pega as datas da query string ou usa a data atual como padrão
    const today = getFormattedDate(new Date());
    // Pega os valores da query. Se não vierem, o padrão é `undefined`.
    let { dat_inicial, dat_final } = req.query; // Removido resource_ids daqui

    // Se a data final não for fornecida, usa a data de hoje como padrão.
    if (!dat_final) {
        dat_final = today;
    }

    // Converte string vazia para null para a lógica da query
    const final_dat_inicial = dat_inicial === '' ? null : dat_inicial;

    // console.log(`[API /tasks] Buscando tarefas de ${final_dat_inicial || 'início'} até ${dat_final} no banco de dados.`);

    try {
        let query = `
            SELECT
                t.id, t.id_unid_oper,
                creator.nom_contato as nom_criado_por, -- Adiciona o nome do criador
                t.ind_prioridade, t.ind_sit_tarefa, t.titulo_tarefa,
                (
                    SELECT COALESCE(array_agg(utm.id_marcador::text), ARRAY[]::text[])
                    FROM unid_oper_tarefa_x_marcador utm
                    WHERE utm.id_tarefa = t.id and dth_exclusao is null
                ) as tipo_chamado,
                t.tarefa_avaliacao,
                t.dth_inclusao, t.dth_prev_entrega, t.dth_encerramento
            FROM unid_oper_tarefa t
            LEFT JOIN unid_oper_contatos creator ON t.id_criado_por = creator.id_contato
        `;

        const params = [];
        const whereClauses = [];

        // Adiciona a cláusula WHERE dinamicamente
        whereClauses.push('t.dth_exclusao IS NULL'); // Adiciona a condição para não buscar tarefas excluídas
        
        if (final_dat_inicial) {
            params.push(final_dat_inicial);
            whereClauses.push(`t.dth_inclusao::date >= $${params.length}`);
        }
        params.push(dat_final); // A data final sempre existe
        whereClauses.push(`t.dth_inclusao::date <= $${params.length}`);

        query += ` WHERE ${whereClauses.join(' AND ')}`;
        query += ' ORDER BY t.dth_inclusao DESC;';

        const { rows } = await pool.query(query, params);
        
        // Adiciona os recursos associados a cada tarefa
        for (const task of rows) {
            // Busca os recursos na tabela 'unid_oper_contatos'
            const resourceQuery = `
                SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso, utr.ind_responsavel, utr.dth_exclusao
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

/**
 * @route GET /tasks/basic/:id
 * @description Retorna apenas os dados básicos (id, titulo, status) de uma tarefa ativa.
 * Usado para carregamento rápido em modais que não precisam de todos os detalhes.
 */
app.get('/tasks/basic/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        console.log(`[API /tasks/basic/:id] Buscando dados básicos da tarefa vinculada com ID: ${taskId}`);

        const query = `
            SELECT
                id,
                titulo_tarefa,
                ind_sit_tarefa
            FROM unid_oper_tarefa
            WHERE id = $1 AND dth_exclusao IS NULL;
        `;
        const { rows, rowCount } = await pool.query(query, [taskId]);

        if (rowCount === 0) {
            return res.status(404).send('Tarefa básica não encontrada.');
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`[API /tasks/basic/:id] Erro ao buscar dados básicos da tarefa ${req.params.id}:`, error);
        res.status(500).send('Erro interno do servidor');
    }
});
/**
 * @route GET /tasks/search-for-linking
 * @description Retorna uma lista de tarefas ativas, filtradas por IDs de recursos e/ou termo de busca.
 * Usado especificamente para o modal de vinculação de tarefas.
 * Também anexa os recursos, marcadores e comentários associados a cada tarefa.
 */
app.get('/tasks/search-for-linking', async (req, res) => {
    const { resource_ids, search_term } = req.query;

    try {
        let query = `
            SELECT
                t.id, 
                t.ind_sit_tarefa, 
                t.titulo_tarefa,
                t.id_tarefa_pai
            FROM unid_oper_tarefa t
        `;

        const params = [];
        const whereClauses = [];

        whereClauses.push(`t.dth_exclusao IS NULL AND t.ind_sit_tarefa not in ('FN', 'CA')`);

        // Adiciona filtro por IDs de recursos, se fornecido
        if (resource_ids) {
            // Converte a string '1,2,3' para um array de inteiros [1, 2, 3]
            const resourceIdsArray = String(resource_ids).split(',').map(id => parseInt(id.trim(), 10));
            params.push(resourceIdsArray);
            // Verifica se existe algum recurso associado à tarefa que esteja na lista de IDs fornecida
            whereClauses.push(`t.ind_sit_tarefa not in('FN', 'CA') AND EXISTS (SELECT 1 FROM unid_oper_tarefa_x_recurso utr WHERE utr.id_tarefa = t.id AND utr.id_recurso = ANY($${params.length}))`);
        }

        // Adiciona filtro por termo de busca, se fornecido
        if (search_term) {
            params.push(`%${search_term.toLowerCase()}%`);
            whereClauses.push(`(LOWER(t.titulo_tarefa) ILIKE $${params.length} OR t.id::text ILIKE $${params.length})`);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        query += ' ORDER BY t.dth_inclusao DESC;';

        const { rows } = await pool.query(query, params);
        
        // Adiciona os recursos associados a cada tarefa
        for (const task of rows) {
            // Busca os recursos na tabela 'unid_oper_contatos'
            const resourceQuery = `
                SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso, utr.ind_responsavel
                FROM unid_oper_tarefa_x_recurso utr
                JOIN unid_oper_contatos c ON c.id_contato = utr.id_recurso
                WHERE utr.id_tarefa = $1 AND utr.dth_exclusao IS NULL`;
            const { rows: resources } = await pool.query(resourceQuery, [task.id]);
            task.recursos = resources; 
        }
        res.status(200).json(rows);
    } catch (error) {
        console.error('Ocorreu um erro ao buscar as listas de tarefas para vinculação:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route GET /task/:id
 * @description Retorna os detalhes completos de uma única tarefa ativa, incluindo recursos, marcadores e comentários.
 */
app.get('/task/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        console.log(`[API /task/:id] Buscando dados da tarefa ID: ${taskId}`);

        // Query principal para buscar os dados da tarefa e o nome do criador
        const taskQuery = `
            SELECT 
                t.id, t.id_unid_negoc, t.id_unid_oper, t.id_sist_modulo, t.id_criado_por,
                creator.nom_contato as nom_criado_por,
                t.ind_prioridade, t.ind_sit_tarefa, t.qtd_pontos, t.titulo_tarefa, t.tarefa_avaliacao, t.id_tarefa_pai,
                (
                    SELECT COALESCE(array_agg(utm.id_marcador::text), ARRAY[]::text[])
                    FROM unid_oper_tarefa_x_marcador utm
                    WHERE utm.id_tarefa = t.id and dth_exclusao is null
                ) as tipo_chamado, 
                t.dth_inclusao,
                t.dth_abertura,
                t.dth_encerramento,
                t.dth_prev_entrega,
                t.dth_exclusao
            FROM unid_oper_tarefa t
            LEFT JOIN unid_oper_contatos creator ON t.id_criado_por = creator.id_contato
            WHERE t.id = $1 AND t.dth_exclusao IS NULL;
        `;
        const { rows: taskRows, rowCount } = await pool.query(taskQuery, [taskId]);

        if (rowCount === 0) {
            return res.status(404).send('Tarefa não encontrada.');
        }

        const task = taskRows[0];

        // Query para buscar os recursos associados
        const resourceQuery = `
            SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso, utr.ind_responsavel
            FROM unid_oper_tarefa_x_recurso utr
            JOIN unid_oper_contatos c ON c.id_contato = utr.id_recurso
            WHERE utr.id_tarefa = $1 and dth_exclusao is null`;
        const { rows: resources } = await pool.query(resourceQuery, [taskId]);
        task.recursos = resources;

        // Query para buscar os comentários associados
        const commentQuery = `
            SELECT
                utc.id,
                utc.id_incluido_por as id_recurso,
                uoc.nom_contato as nom_recurso,
                utc.comentario,
                utc.dth_inclusao
            FROM unid_oper_tarefa_comentario utc
            LEFT JOIN unid_oper_contatos uoc ON utc.id_incluido_por = uoc.id_contato
            WHERE utc.id_tarefa = $1 and dth_exclusao is null ORDER BY utc.dth_inclusao ASC;`;
        const { rows: comentario } = await pool.query(commentQuery, [taskId]);
        task.comentarios = comentario;
        // A propriedade 'comentarios' é adicionada ao objeto 'task' antes de ser enviada.
        res.status(200).json(task);
    } catch (error) {
        console.error(`[API /task/${taskId}] Ocorreu um erro ao buscar detalhes da tarefa:`, error);
        res.status(500).send('Erro interno do servidor');
    }
})

/**
 * @route DELETE /tasks/:id
 * @description Realiza a exclusão lógica (soft delete) de uma tarefa e suas associações
 * (recursos, marcadores, comentários), definindo a coluna `dth_exclusao`.
 */
app.delete('/tasks/:id', async (req, res) => {
    // Alterado para fazer "soft delete" (exclusão lógica)
    const { id } = req.params;
    const client = await pool.connect(); // Obter cliente para transação
    try {
        await client.query('BEGIN'); // Inicia a transação

        // 1. Soft-delete a tarefa principal
        const taskUpdateQuery = `
            UPDATE unid_oper_tarefa 
            SET dth_exclusao = NOW() 
            WHERE id = $1 AND dth_exclusao IS NULL
            RETURNING id;
        `;
        const { rowCount } = await client.query(taskUpdateQuery, [id]);

        if (rowCount === 0) {
            await client.query('ROLLBACK'); // Rollback se a tarefa não for encontrada
            return res.status(404).send('Tarefa não encontrada ou já foi removida.');
        }

        // 2. Soft-delete associações de recursos (apenas as ativas)
        await client.query('UPDATE unid_oper_tarefa_x_recurso SET dth_exclusao = NOW() WHERE id_tarefa = $1 AND dth_exclusao IS NULL', [id]);

        // 3. Soft-delete associações de marcadores (apenas as ativas)
        await client.query('UPDATE unid_oper_tarefa_x_marcador SET dth_exclusao = NOW() WHERE id_tarefa = $1 AND dth_exclusao IS NULL', [id]);

        // 4. Soft-delete comentários associados
        await client.query('UPDATE unid_oper_tarefa_comentario SET dth_exclusao = NOW() WHERE id_tarefa = $1 AND dth_exclusao IS NULL', [id]);


        await client.query('COMMIT'); // Confirma a transação
        console.log(`[API /tasks] Tarefa ${id} marcada como excluída (soft delete).`);
        res.status(204).send(); // 204 No Content é a resposta padrão para um DELETE bem-sucedido.
    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error(`Ocorreu um erro ao remover a tarefa ${id}:`, error);
        res.status(500).send('Erro interno do servidor');
    } finally {
        if (client) client.release(); // Libera o cliente de volta para o pool, se ele foi conectado.
    }
});

/**
 * @route POST /tasks
 * @description Cria uma nova tarefa e suas associações (recursos, marcadores).
 */
app.post('/tasks', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Inicia a transação

        const { titulo_tarefa, id_criado_por, id_unid_negoc, id_unid_oper, ind_prioridade, dth_prev_entrega, recursos = [], tipo_chamado = [] } = req.body;

        // Se dth_prev_entrega for a data de hoje, usamos NOW() para incluir a hora exata.
        // Se for uma data futura, usamos o valor como está (que será 'YYYY-MM-DD 00:00:00' no DB).
        const todayStr = new Date().toISOString().split('T')[0];
        const isToday = dth_prev_entrega && dth_prev_entrega.startsWith(todayStr);
        
        // 1. Insere a tarefa principal
        const taskQuery = `
            INSERT INTO unid_oper_tarefa (titulo_tarefa, id_criado_por, id_unid_negoc, id_unid_oper, ind_prioridade, dth_prev_entrega, ind_sit_tarefa, dth_inclusao)
            VALUES ($1, $2, $3, $4, $5, ${isToday ? `NOW()::timestamp(0)` : `$6`}, 'AB', NOW()::timestamp(0))
            RETURNING *;
        `;
        const taskValues = [titulo_tarefa, id_criado_por, id_unid_negoc, id_unid_oper, ind_prioridade];
        if (!isToday) {
            taskValues.push(dth_prev_entrega || null);
        }
        const { rows: [newTask] } = await client.query(taskQuery, taskValues);

        // 2. Insere os recursos associados
        if (recursos && recursos.length > 0) {
            const resourceQuery = 'INSERT INTO unid_oper_tarefa_x_recurso (id_tarefa, id_recurso, ind_responsavel, dth_inclusao) VALUES ($1, $2, $3, NOW())';
            for (const recurso of recursos) {
                await client.query(resourceQuery, [newTask.id, recurso.id_recurso, recurso.ind_responsavel || 'N']);
            }
        }

        // 3. Insere os marcadores (flags) associados
        if (tipo_chamado && tipo_chamado.length > 0) {
            const markerQuery = 'INSERT INTO unid_oper_tarefa_x_marcador (id_tarefa, id_marcador, dth_inclusao) VALUES ($1, $2, NOW())';
            for (const id_marcador of tipo_chamado) {
                await client.query(markerQuery, [newTask.id, id_marcador]);
            }
        }

        // 4. Busca a tarefa completa para retornar ao frontend
        const selectFullTaskQuery = `
            SELECT 
                t.*,
                creator.nom_contato as nom_criado_por
            FROM unid_oper_tarefa t
            LEFT JOIN unid_oper_contatos creator ON t.id_criado_por = creator.id_contato
            WHERE t.id = $1 AND t.dth_exclusao IS NULL;
        `;
        const { rows: [fullTask] } = await client.query(selectFullTaskQuery, [newTask.id]);

        // Busca os recursos associados para adicionar à resposta
        const resourceQuery = `
            SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso, utr.ind_responsavel
            FROM unid_oper_tarefa_x_recurso utr
            JOIN unid_oper_contatos c ON c.id_contato = utr.id_recurso
            WHERE utr.id_tarefa = $1 AND utr.dth_exclusao IS NULL;`;
        const { rows: finalResources } = await client.query(resourceQuery, [newTask.id]);
        fullTask.recursos = finalResources;

        // Busca os marcadores associados para adicionar à resposta
        const markerQuery = `
            SELECT id_marcador::text FROM unid_oper_tarefa_x_marcador WHERE id_tarefa = $1
        `;
        const { rows: finalMarkers } = await client.query(markerQuery, [newTask.id]);
        // Mapeia para um array de strings, como o frontend espera
        fullTask.tipo_chamado = finalMarkers.map(m => m.id_marcador);

        // Busca os comentários associados para adicionar à resposta
        const commentQuery = `
            SELECT
                utc.id,
                utc.id_incluido_por as id_recurso,
                uoc.nom_contato as nom_recurso,
                utc.comentario,
                utc.dth_inclusao
            FROM unid_oper_tarefa_comentario utc
            JOIN unid_oper_contatos uoc ON utc.id_incluido_por = uoc.id_contato
            WHERE utc.id_tarefa = $1 ORDER BY utc.dth_inclusao ASC;`;
        const { rows: finalComments } = await client.query(commentQuery, [newTask.id]);
        fullTask.comentarios = finalComments;
        await client.query('COMMIT'); // Confirma a transação
        console.log('[API /tasks] Tarefa criada com sucesso:', fullTask);
        res.status(201).json(fullTask);

    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error('Ocorreu um erro ao criar a tarefa:', error);
        res.status(500).send('Erro interno do servidor');
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
});

/**
 * @route PUT /tasks/:id
 * @description Atualiza os dados de uma tarefa existente. Também gerencia as associações
 * de recursos e marcadores, realizando "soft delete" para os removidos e inserindo os novos.
 */
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
            id_tarefa_pai,
            tarefa_avaliacao,
            tipo_chamado = [],
            recursos = [] // Array de objetos { id_recurso, nom_recurso }
        } = req.body;

        // 1. Atualização dinâmica da tarefa principal
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        // Mapeia os campos do body para as colunas do DB
        const fieldMapping = {
            titulo_tarefa: titulo_tarefa,
            id_unid_negoc: id_unid_negoc,
            id_unid_oper: id_unid_oper,
            id_sist_modulo: id_sist_modulo,
            ind_prioridade: ind_prioridade,
            ind_sit_tarefa: ind_sit_tarefa,
            qtd_pontos: qtd_pontos,
            dth_prev_entrega: formatToDbTimestamp(dth_prev_entrega),
            dth_abertura: formatToDbTimestamp(dth_abertura),
            dth_exclusao: formatToDbTimestamp(dth_exclusao),
            id_tarefa_pai: id_tarefa_pai,
            tarefa_avaliacao: tarefa_avaliacao,
        };

        // Adiciona a data de encerramento com lógica especial
        // Se o status for 'Finalizado' E nenhuma data de encerramento foi enviada, usa a data atual.
        // Se uma data foi enviada, ela será respeitada.
        if (ind_sit_tarefa === 'FN' && !dth_encerramento) {
            fieldMapping.dth_encerramento = formatToDbTimestamp(new Date());
        // Se o status não for 'Finalizado', mas uma data foi enviada (ou limpa), atualiza.
        } else if (dth_encerramento !== undefined) {
            fieldMapping.dth_encerramento = formatToDbTimestamp(dth_encerramento);
        }

        for (const [key, value] of Object.entries(fieldMapping)) {
            if (value !== undefined) { // Apenas campos definidos são atualizados
                updateFields.push(`${key} = $${paramIndex++}`);
                updateValues.push(value);
            }
        }

        updateValues.push(id); // Adiciona o ID da tarefa como último parâmetro
        const updateTaskQuery = `UPDATE unid_oper_tarefa SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
        
        const { rows: [updatedTask], rowCount } = await client.query(updateTaskQuery, updateValues);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Tarefa não encontrada.');
        }

        // --- 2. Gerenciamento de Recursos Associados (Soft Delete) ---
        // Busca os recursos atualmente ativos para esta tarefa
        const currentActiveResourcesQuery = `
            SELECT id_recurso FROM unid_oper_tarefa_x_recurso 
            WHERE id_tarefa = $1 AND dth_exclusao IS NULL;
        `;
        const { rows: currentActiveResourcesRows } = await client.query(currentActiveResourcesQuery, [id]);
        const currentActiveResourceIds = new Set(currentActiveResourcesRows.map(r => r.id_recurso));

        const newResourceIds = new Set(recursos.map(r => r.id_recurso));

        // Processa recursos a serem adicionados
        for (const newResourceId of newResourceIds) {
            if (!currentActiveResourceIds.has(newResourceId)) {
                // Insere um novo registro de associação, independentemente de ter existido antes.
                await client.query(
                    `INSERT INTO unid_oper_tarefa_x_recurso (id_tarefa, id_recurso, dth_inclusao) VALUES ($1, $2, NOW());`,
                    [id, newResourceId]
                );
            }
        }

        // Processa recursos a serem soft-deletados
        for (const oldResourceId of currentActiveResourceIds) {
            if (!newResourceIds.has(oldResourceId)) {
                await client.query(
                    `UPDATE unid_oper_tarefa_x_recurso SET dth_exclusao = NOW() WHERE id_tarefa = $1 AND id_recurso = $2;`,
                    [id, oldResourceId]
                );
            }
        }

        // --- 3. Gerenciamento de Marcadores (Flags) Associados (Soft Delete) ---
        // Busca os marcadores atualmente ativos para esta tarefa
        const currentActiveMarkersQuery = `
            SELECT id_marcador FROM unid_oper_tarefa_x_marcador 
            WHERE id_tarefa = $1 AND dth_exclusao IS NULL;
        `;
        const { rows: currentActiveMarkersRows } = await client.query(currentActiveMarkersQuery, [id]);
        const currentActiveMarkerIds = new Set(currentActiveMarkersRows.map(m => m.id_marcador));

        const newMarkerIds = new Set(tipo_chamado.map(id => parseInt(id, 10))); // Converte para número para consistência

        // Processa marcadores a serem adicionados
        for (const newMarkerId of newMarkerIds) {
            if (!currentActiveMarkerIds.has(newMarkerId)) {
                // Insere um novo registro de associação, independentemente de ter existido antes.
                await client.query(
                    `INSERT INTO unid_oper_tarefa_x_marcador (id_tarefa, id_marcador, dth_inclusao) VALUES ($1, $2, NOW());`,
                    [id, newMarkerId]
                );
            }
        }

        // Processa marcadores a serem soft-deletados
        for (const oldMarkerId of currentActiveMarkerIds) {
            if (!newMarkerIds.has(oldMarkerId)) {
                await client.query(
                    `UPDATE unid_oper_tarefa_x_marcador SET dth_exclusao = NOW() WHERE id_tarefa = $1 AND id_marcador = $2;`,
                    [id, oldMarkerId]
                );
            }
        }


        // 3. Busca a tarefa completa para retornar ao frontend
        const selectFullTaskQuery = `
            SELECT 
                t.*,
                creator.nom_contato as nom_criado_por
            FROM unid_oper_tarefa t
            LEFT JOIN unid_oper_contatos creator ON t.id_criado_por = creator.id_contato
            WHERE t.id = $1;
        `;
        const { rows: [fullTask] } = await client.query(selectFullTaskQuery, [id]);

        // Busca os recursos associados para adicionar à resposta
        const resourceQuery = `
            SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso, utr.ind_responsavel
            FROM unid_oper_tarefa_x_recurso utr
            JOIN unid_oper_contatos c ON c.id_contato = utr.id_recurso 
            WHERE utr.id_tarefa = $1 AND utr.dth_exclusao IS NULL;`; // Retorna apenas recursos ativos
        const { rows: finalResources } = await client.query(resourceQuery, [id]);
        fullTask.recursos = finalResources;

        // Busca os marcadores associados para adicionar à resposta
        const markerQuery = `
            SELECT DISTINCT id_marcador::text FROM unid_oper_tarefa_x_marcador WHERE id_tarefa = $1 AND dth_exclusao IS NULL;
        `;
        const { rows: finalMarkers } = await client.query(markerQuery, [id]);
        // Mapeia para um array de strings, como o frontend espera
        fullTask.tipo_chamado = finalMarkers.map(m => m.id_marcador);

        // Busca os comentários associados para adicionar à resposta
        const commentQuery = `
            SELECT
                utc.id,
                utc.id_incluido_por as id_recurso,
                uoc.nom_contato as nom_recurso,
                utc.comentario,
                utc.dth_inclusao
            FROM unid_oper_tarefa_comentario utc
            JOIN unid_oper_contatos uoc ON utc.id_incluido_por = uoc.id_contato
            WHERE utc.id_tarefa = $1 ORDER BY utc.dth_inclusao ASC;`;
        const { rows: finalComments } = await client.query(commentQuery, [id]);
        fullTask.comentarios = finalComments;
        // A propriedade 'comentarios' é adicionada ao objeto 'fullTask' antes de ser enviada.
        await client.query('COMMIT'); // Confirma a transação
        console.log(`[API /tasks] Tarefa ${id} atualizada com sucesso:`, fullTask);
        res.status(200).json(fullTask);

    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error(`Ocorreu um erro ao atualizar a tarefa ${id}:`, error);
        res.status(500).send('Erro interno do servidor');
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
});

/**
 * @route GET /flags
 * @description Retorna uma lista de todos os marcadores (flags) ativos
 * disponíveis no sistema.
 */
app.get('/flags', async (req, res) => {
    try {
        // A query busca os marcadores e já formata a resposta para ser compatível
        // com a interface FlagConfig do frontend, usando os IDs do banco.
        const query = `
            SELECT 
                id::text, -- Converte id para texto para corresponder à interface
                nome_marcador as label
            FROM unid_oper_marcador 
            WHERE dth_exclusao IS NULL 
            ORDER BY nome_marcador;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar flags/marcadores:', error);
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
*/

/**
 * @route POST /contacts
 * @description Cria um novo registro de contato no banco de dados.
 */
app.post('/contacts', async (req, res) => {
    const { nome, id_unid_oper, telefone, email, inf_adicional } = req.body;
    try {
        const query = `
            INSERT INTO unid_oper_contatos (nom_contato, id_unid_oper, num_telefone1, email_1, inf_adicional)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_contato as id, nom_contato as nome, id_unid_oper, num_telefone1 as telefone, email_1 as email, inf_adicional;
        `;
        const values = [nome, id_unid_oper || null, telefone || null, email || null, inf_adicional || null];
        const { rows } = await pool.query(query, values);
        console.log('[API /contacts] Novo contato adicionado:', rows[0]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao criar contato:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route PUT /contacts/:id
 * @description Atualiza os dados de um contato existente.
 */
app.put('/contacts/:id', async (req, res) => {
    const contactId = parseInt(req.params.id, 10);
    const { nome, id_unid_oper, telefone, email, inf_adicional } = req.body;
    try {
        const query = `
            UPDATE unid_oper_contatos
            SET nom_contato = $1, id_unid_oper = $2, num_telefone1 = $3, email_1 = $4, inf_adicional = $5
            WHERE id_contato = $6
            RETURNING id_contato as id, nom_contato as nome, id_unid_oper, num_telefone1 as telefone, email_1 as email, inf_adicional;
        `;
        const values = [nome, id_unid_oper || null, telefone || null, email || null, inf_adicional || null, contactId];
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

/**
 * @route DELETE /contacts/:id
 * @description Realiza a exclusão lógica (soft delete) de um contato.
 */
app.delete('/contacts/:id', async (req, res) => {
    const contactId = parseInt(req.params.id, 10);
    try {
        const { rowCount } = await pool.query('UPDATE unid_oper_contatos SET dth_exclusao = NOW() WHERE id_contato = $1', [contactId]);
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

// --- ENDPOINTS PARA RECURSOS (ANALISTAS/DESENVOLVEDORES) ---

/**
 * @route GET /resources
 * @description Retorna uma lista de contatos que são considerados "recursos" (analistas/desenvolvedores),
 * com opção de busca por texto.
 */
app.get('/resources', async (req, res) => {
    const { search } = req.query;
    try {
        // A função é um valor estático, pois não existe na tabela de contatos.
        let query = `
            SELECT 
                id_contato as id_recurso,
                nom_contato as nom_recurso,
                inf_adicional as recurso_funcao,
                num_telefone1 as telefone,
                email_1 as email
            FROM unid_oper_contatos
        `;
        const params = [];
        if (search) {
            // Busca por nome, função (inf_adicional), telefone ou email
            query += ` WHERE nom_contato ILIKE $1 OR inf_adicional ILIKE $1 OR num_telefone1 ILIKE $1 OR email_1 ILIKE $1 AND dth_exclusao IS NULL`;
            params.push(`%${search}%`);
        }
        query += ' ORDER BY nom_recurso';
        const { rows } = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar recursos:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route POST /resources
 * @description Cria um novo recurso (que também é um contato).
 */
app.post('/resources', async (req, res) => {
    const { nom_recurso, recurso_funcao, telefone, email } = req.body;
    if (!nom_recurso) {
        return res.status(400).send('O nome do recurso é obrigatório.');
    }
    try {
        const query = `
            INSERT INTO unid_oper_contatos (nom_contato, inf_adicional, num_telefone1, email_1) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id_contato as id_recurso, nom_contato as nom_recurso, inf_adicional as recurso_funcao, num_telefone1 as telefone, email_1 as email;
        `;
        const values = [nom_recurso, recurso_funcao || null, telefone || null, email || null];
        const { rows: [newResource] } = await pool.query(query, values);
        console.log('[API /resources] Novo recurso adicionado:', newResource);
        res.status(201).json(newResource);
    } catch (error) {
        console.error('Erro ao criar recurso:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route PUT /resources/:id
 * @description Atualiza os dados de um recurso existente.
 */
app.put('/resources/:id', async (req, res) => {
    const resourceId = parseInt(req.params.id, 10);
    const { nom_recurso, recurso_funcao, telefone, email } = req.body;
    try {
        const query = `
            UPDATE unid_oper_contatos 
            SET nom_contato = $1, inf_adicional = $2, num_telefone1 = $3, email_1 = $4
            WHERE id_contato = $5 
            RETURNING id_contato as id_recurso, nom_contato as nom_recurso, inf_adicional as recurso_funcao, num_telefone1 as telefone, email_1 as email;
        `;
        const values = [nom_recurso, recurso_funcao, telefone, email, resourceId];
        const { rows: [updatedResource], rowCount } = await pool.query(query, values);
        if (rowCount === 0) return res.status(404).send('Recurso não encontrado.');
        console.log(`[API /resources] Recurso ${resourceId} atualizado.`);
        res.status(200).json(updatedResource);
    } catch (error) {
        console.error('Erro ao atualizar recurso:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route DELETE /resources/:id
 * @description Realiza a exclusão lógica (soft delete) de um recurso.
 */
app.delete('/resources/:id', async (req, res) => {
    const resourceId = parseInt(req.params.id, 10);
    try {
        const { rowCount } = await pool.query('UPDATE unid_oper_contatos SET dth_exclusao = NOW() WHERE id_contato = $1', [resourceId]);
        if (rowCount === 0) return res.status(404).send('Recurso não encontrado.');
        console.log(`[API /resources] Recurso ${resourceId} excluído.`);
        res.status(204).send();
    } catch (error) {
        // Adiciona tratamento para erro de chave estrangeira
        if (error.code === '23503') { // Código de erro para foreign_key_violation
            return res.status(400).send('Não é possível excluir o recurso pois ele está associado a uma ou mais tarefas.');
        }
        console.error('Erro ao excluir recurso:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route PATCH /tasks/:id/status
 * @description Atualiza de forma otimizada apenas o status de uma tarefa.
 * Se o status for 'FN' (Finalizado), também define a data de encerramento.
 */
app.patch('/tasks/:id/status', async (req, res) => {
    const { id } = req.params;
    const { ind_sit_tarefa } = req.body;

    if (!ind_sit_tarefa) {
        return res.status(400).send('O novo status (ind_sit_tarefa) é obrigatório.');
    }

    try {
        let query = 'UPDATE unid_oper_tarefa SET ind_sit_tarefa = $1';
        const params = [ind_sit_tarefa, id];

        // Se o status for 'Finalizado', atualiza também a data de encerramento
        if (ind_sit_tarefa === 'FN') {
            query += ', dth_encerramento = NOW()';
        }

        query += ' WHERE id = $2 RETURNING id, ind_sit_tarefa, dth_encerramento;';

        const { rows, rowCount } = await pool.query(query, params);

        if (rowCount === 0) {
            return res.status(404).send('Tarefa não encontrada.');
        }

        console.log(`[API /tasks/:id/status] Status da tarefa ${id} atualizado para ${ind_sit_tarefa}.`);
        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(`Erro ao atualizar status da tarefa ${id}:`, error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route PATCH /tasks/:id/link-parent
 * @description Vincula uma tarefa (filha) a uma tarefa pai, atualizando a referência
 * na tabela de tarefas e criando um registro na tabela de histórico de vínculos.
 */
app.patch('/tasks/:id/link-parent', async (req, res) => {
    const { id } = req.params; // Este é o ID da tarefa FILHA
    const { id_tarefa_pai } = req.body; // Este é o ID da tarefa PAI
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Atualiza a tarefa filha com o ID da tarefa pai
        const updateQuery = `
            UPDATE unid_oper_tarefa 
            SET id_tarefa_pai = $1 
            WHERE id = $2 and dth_exclusao IS NULL 
            RETURNING id, id_tarefa_pai;
        `;
        const { rows, rowCount } = await client.query(updateQuery, [id_tarefa_pai, id]);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Tarefa filha não encontrada.');
        }

        // 2. Insere o registro na tabela de histórico de vínculos
        const insertLinkQuery = `
            INSERT INTO unid_oper_tarefa_vinculo (id_tarefa, id_tarefa_top, dth_inclusao)
            VALUES ($1, $2, NOW());
        `;
        await client.query(insertLinkQuery, [id, id_tarefa_pai]);

        await client.query('COMMIT');
        console.log(`[API] Tarefa ${id} vinculada com sucesso à tarefa pai ${id_tarefa_pai}.`);
        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(`Erro ao vincular tarefa ${id} à tarefa pai ${id_tarefa_pai}:`, error);
        res.status(500).send('Erro interno do servidor');
    }
    finally {
        if (client) client.release();
    }
});

/**
 * @route PATCH /tasks/:id/unlink-parent
 * @description Remove o vínculo de uma tarefa filha com sua tarefa pai, limpando a referência
 * na tabela de tarefas e marcando o registro de vínculo como excluído.
 */
app.patch('/tasks/:id/unlink-parent', async (req, res) => {
    const { id } = req.params; // Este é o ID da tarefa FILHA
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Remove o ID da tarefa pai da tarefa filha
        const updateQuery = `
            UPDATE unid_oper_tarefa 
            SET id_tarefa_pai = NULL 
            WHERE id = $1 and dth_exclusao IS NULL 
            RETURNING id, id_tarefa_pai;
        `;
        const { rows, rowCount } = await client.query(updateQuery, [id]);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Tarefa não encontrada.');
        }

        // 2. Marca o vínculo como excluído na tabela de histórico
        await client.query(`
            UPDATE unid_oper_tarefa_vinculo
            SET dth_exclusao = NOW()
            WHERE id_tarefa = $1 AND dth_exclusao IS NULL;`, [id]);

        await client.query('COMMIT');
        console.log(`[API] Vínculo da tarefa pai removido da tarefa ${id}.`);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao remover vínculo da tarefa pai para a tarefa ${id}:`, error);
        res.status(500).send('Erro interno do servidor');
    } finally {
        if (client) client.release();
    }
});

/**
 * @route GET /units
 * @description Retorna uma lista de unidades operacionais, com opção de busca
 * por nome ou ID.
 */
app.get('/units', async (req, res) => {
    const { search, limit = 100, offset = 0 } = req.query;
    
    // Validação do token de autenticação
    if (!req.cookies.authToken) {
        return res.status(401).json({ 
            error: 'Token de autenticação não fornecido',
            message: 'É necessário estar logado para acessar as unidades operacionais'
        });
    }

    try {
        console.log(`[API /units] Buscando unidades operacionais - Filtro: ${search || 'nenhum'}`);
        
        // Configuração da requisição com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
        
        const apiResponse = await fetch(
            `http://177.11.209.38:80/constellation/IISConstellationAPI.dll/constellation-api/V1.1/get_unid_operacional`, 
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.cookies.authToken}`,
                },
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        // Verificação do status da resposta
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`[API /units] Erro na API externa: ${apiResponse.status} - ${errorText}`);
            
            if (apiResponse.status === 401) {
                return res.status(401).json({ 
                    error: 'Token inválido ou expirado',
                    message: 'Sessão expirada. Faça login novamente.'
                });
            }
            
            return res.status(apiResponse.status).json({ 
                error: 'Erro na API externa',
                message: `Falha ao buscar unidades operacionais: ${apiResponse.statusText}`
            });
        }

        const units = await apiResponse.json();
        
        // Validação da resposta
        if (!Array.isArray(units)) {
            console.error('[API /units] Resposta da API externa não é um array:', typeof units);
            return res.status(500).json({ 
                error: 'Formato de dados inválido',
                message: 'A API retornou dados em formato inesperado'
            });
        }

        // Aplicação de filtros se fornecidos
        let filteredUnits = units;
        
        if (search) {
            const searchTerm = search.toString().toLowerCase();
            filteredUnits = units.filter(unit => 
                (unit.nom_unid_oper && unit.nom_unid_oper.toLowerCase().includes(searchTerm)) ||
                (unit.cod_unid_oper && unit.cod_unid_oper.toString().includes(searchTerm))
            );
        }

        // Aplicação de paginação
        const startIndex = parseInt(offset.toString()) || 0;
        const maxLimit = parseInt(limit.toString()) || 100;
        const paginatedUnits = filteredUnits.slice(startIndex, startIndex + maxLimit);

        console.log(`[API /units] Retornando ${paginatedUnits.length} de ${filteredUnits.length} unidades`);
        
        res.status(200).json({
            data: paginatedUnits,
            total: filteredUnits.length,
            limit: maxLimit,
            offset: startIndex,
            hasMore: startIndex + maxLimit < filteredUnits.length
        });
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[API /units] Timeout na requisição para a API externa');
            return res.status(504).json({ 
                error: 'Timeout',
                message: 'A requisição demorou muito para ser processada'
            });
        }
        
        console.error('[API /units] Erro ao buscar unidades operacionais:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Não foi possível buscar as unidades operacionais no momento'
        });
    }
});

/**
 * @route POST /tasks/:id/comments
 * @description Adiciona um novo comentário a uma tarefa específica e retorna
 * o comentário completo com os dados do autor.
 */
app.post('/tasks/:id/comments', async (req, res) => {
    const { id: id_tarefa } = req.params;
    const { id_incluido_por, comentario } = req.body;

    if (!id_incluido_por || !comentario) {
        return res.status(400).send('ID do usuário e comentário são obrigatórios.');
    }

    const client = await pool.connect(); // Pega uma conexão do pool para a transação
    try {
        await client.query('BEGIN'); // Inicia a transação

        // 1. Insere o novo comentário e retorna seu ID dentro da transação
        const insertQuery = `
            INSERT INTO unid_oper_tarefa_comentario (id_tarefa, id_incluido_por, comentario, dth_inclusao)
            VALUES ($1, $2, $3, NOW())
            RETURNING id;
        `;
        const { rows: [newComment] } = await client.query(insertQuery, [id_tarefa, id_incluido_por, comentario]);

        // 2. Busca o comentário completo (com o nome do usuário) dentro da mesma transação
        const selectQuery = `
            SELECT
                c.id, c.id_tarefa, c.id_incluido_por as id_recurso, u.nom_contato as nom_recurso, c.comentario, c.dth_inclusao
            FROM unid_oper_tarefa_comentario c
            LEFT JOIN unid_oper_contatos u ON c.id_incluido_por = u.id_contato
            WHERE c.id = $1;
        `;
        const { rows: [fullComment] } = await client.query(selectQuery, [newComment.id]);

        await client.query('COMMIT'); // Confirma a transação
        console.log(`[API /tasks/:id/comments] Novo comentário adicionado à tarefa ${id_tarefa}.`);
        res.status(201).json(fullComment);

    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error(`Erro ao adicionar comentário à tarefa ${id_tarefa}:`, error);
        res.status(500).send('Erro interno do servidor');
    } finally {
        client.release(); // Libera a conexão de volta para o pool
    }
});

/**
 * @route PUT /comments/:id
 * @description Atualiza o texto de um comentário existente.
 */
app.put('/comments/:id', async (req, res) => {
    const { id } = req.params;
    const { comentario } = req.body;

    if (!comentario) {
        return res.status(400).send('O texto do comentário é obrigatório.');
    }

    try {
        const updateQuery = `
            UPDATE unid_oper_tarefa_comentario
            SET comentario = $1
            WHERE id = $2
            RETURNING id;
        `;
        const { rowCount } = await pool.query(updateQuery, [comentario, id]);

        if (rowCount === 0) {
            return res.status(404).send('Comentário não encontrado.');
        }

        // Retorna o comentário atualizado completo
        const selectQuery = `
            SELECT c.id, c.id_tarefa, c.id_incluido_por as id_recurso, u.nom_contato as nom_recurso, c.comentario, c.dth_inclusao
            FROM unid_oper_tarefa_comentario c
            LEFT JOIN unid_oper_contatos u ON c.id_incluido_por = u.id_contato
            WHERE c.id = $1;
        `;
        const { rows: [updatedComment] } = await pool.query(selectQuery, [id]);
        res.status(200).json(updatedComment);
    } catch (error) {
        console.error(`Erro ao atualizar comentário ${id}:`, error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route GET /tasks/:id/history
 * @description Retorna o histórico completo de uma tarefa, incluindo alocação de recursos e um log de alterações.
 */
app.get('/tasks/:id/history', async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Busca o histórico de alocação de recursos
        const resourceHistoryQuery = `
            SELECT 
                utr.id, -- ID do registro de alocação
                utr.id_recurso, -- ID do recurso
                c.nom_contato as nom_recurso,
                utr.dth_inclusao,
                utr.dth_exclusao,
                utr.ind_responsavel
            FROM unid_oper_tarefa_x_recurso utr
            JOIN unid_oper_contatos c ON utr.id_recurso = c.id_contato
            WHERE utr.id_tarefa = $1
            ORDER BY utr.dth_inclusao;
        `;
        const { rows: resources } = await pool.query(resourceHistoryQuery, [id]);

        // 2. Monta o log de alterações (timeline)
        const changes = [];

        // Evento de Criação da Tarefa
        const taskCreationQuery = `
            SELECT t.dth_inclusao, t.dth_encerramento, c.nom_contato as nom_criado_por 
            FROM unid_oper_tarefa t
            LEFT JOIN unid_oper_contatos c ON t.id_criado_por = c.id_contato
            WHERE t.id = $1;
        `;
        const { rows: [taskCreation] } = await pool.query(taskCreationQuery, [id]);
        if (taskCreation) {
            changes.push({
                type: 'CRIAÇÃO',
                description: 'Tarefa foi criada.',
                author: taskCreation.nom_criado_por || 'Sistema',
                date: taskCreation.dth_inclusao
            });

            // Adiciona o evento de encerramento, se existir
            if (taskCreation.dth_encerramento) {
                changes.push({
                    type: 'FINALIZAÇÃO',
                    description: 'Tarefa foi finalizada.',
                    author: 'Sistema', // Não temos o autor do encerramento, então usamos 'Sistema'
                    date: taskCreation.dth_encerramento
                });
            }
        }

        // Eventos de Comentários
        const commentsQuery = `
            SELECT c.comentario, u.nom_contato as nom_recurso, c.dth_inclusao
            FROM unid_oper_tarefa_comentario c
            LEFT JOIN unid_oper_contatos u ON c.id_incluido_por = u.id_contato
            WHERE c.id_tarefa = $1;
        `;
        const { rows: comments } = await pool.query(commentsQuery, [id]);
        comments.forEach(comment => {
            changes.push({
                type: 'COMENTÁRIO',
                description: comment.comentario,
                author: comment.nom_recurso || 'Usuário desconhecido',
                date: comment.dth_inclusao
            });
        });

        // Eventos de Vínculo de Tarefa
        const linksQuery = `
            SELECT id_tarefa_top, dth_inclusao, dth_exclusao
            FROM unid_oper_tarefa_vinculo
            WHERE id_tarefa = $1;
        `;
        const { rows: links } = await pool.query(linksQuery, [id]);
        links.forEach(link => {
            // Adiciona o evento de criação do vínculo
            changes.push({
                type: 'VÍNCULO',
                description: `Vinculada à tarefa pai #${link.id_tarefa_top}.`,
                author: 'Sistema', // A ação de vincular não tem um autor registrado
                date: link.dth_inclusao
            });
            // Adiciona o evento de remoção do vínculo, se houver
            if (link.dth_exclusao) {
                changes.push({
                    type: 'DESVINCULO',
                    description: `Vínculo com a tarefa pai #${link.id_tarefa_top} foi removido.`,
                    author: 'Sistema',
                    date: link.dth_exclusao
                });
            }
        });

        // Ordena todas as alterações pela data
        changes.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({ resources, changes });

    } catch (error) {
        console.error(`Erro ao buscar histórico da tarefa ${id}:`, error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route DELETE /tasks/:taskId/resources/:resourceId
 * @description Realiza a exclusão permanente (hard delete) de um registro de alocação de recurso para uma tarefa específica.
 * Usado na tela de histórico para remover um registro específico.
 */
app.delete('/tasks/:taskId/resources/:resourceId', async (req, res) => {
    const { taskId, resourceId } = req.params;

    try {
        const deleteQuery = `
            DELETE FROM unid_oper_tarefa_x_recurso
            WHERE id_tarefa = $1 AND id_recurso = $2;
        `;
        const { rowCount } = await pool.query(deleteQuery, [taskId, resourceId]);

        if (rowCount === 0) {
            // Pode acontecer se o registro já foi deletado, então não é necessariamente um erro fatal.
            // Retornamos sucesso para a UI ser atualizada de qualquer forma.
            console.log(`[API] Tentativa de exclusão, mas registro de alocação não foi encontrado para tarefa ${taskId} e recurso ${resourceId}.`);
            return res.status(204).send();
        }

        console.log(`[API] Alocação do recurso ${resourceId} na tarefa ${taskId} excluída permanentemente.`);
        res.status(204).send(); // 204 No Content para sucesso na exclusão
    } catch (error) {
        console.error(`Erro ao excluir alocação do recurso ${resourceId} na tarefa ${taskId}:`, error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * @route PATCH /tasks/:taskId/set-default-resource
 * @description Define um recurso como o padrão/responsável para uma tarefa,
 * garantindo que apenas um recurso seja o padrão por vez.
 */
app.patch('/tasks/:taskId/set-default-resource', async (req, res) => {
    const { taskId } = req.params;
    const { resourceId } = req.body;

    if (!resourceId) {
        return res.status(400).send('O ID do recurso é obrigatório.');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Remove a flag 'S' de qualquer outro recurso nesta tarefa
        await client.query(
            `UPDATE unid_oper_tarefa_x_recurso 
             SET ind_responsavel = 'N' 
             WHERE id_tarefa = $1 AND ind_responsavel = 'S'`,
            [taskId]
        );

        // 2. Define o novo recurso como responsável
        const { rowCount } = await client.query(
            `UPDATE unid_oper_tarefa_x_recurso 
             SET ind_responsavel = 'S' 
             WHERE id_tarefa = $1 AND id_recurso = $2`,
            [taskId, resourceId]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Recurso responsável atualizado com sucesso.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Erro ao definir recurso padrão para a tarefa ${taskId}:`, error);
        res.status(500).send('Erro interno do servidor');
    } finally {
        client.release();
    }
});

/**
 * @route POST /consulta_contatos
 * @description Atua como um proxy para o endpoint externo de consulta de contatos,
 * usando o token de autenticação do cookie.
 * Retorna uma lista de contatos ativos, com opções de filtro por termo de busca
 * e por ID da unidade operacional.
 */
app.post('/consulta_contatos', async (req, res) => {
    const { nom_contato, cod_unid_negoc, cod_unid_oper } = req.body;

    if (!req.cookies.authToken) {
        return res.status(401).json({ error: 'Não autorizado', message: 'Token de autenticação não fornecido.' });
    }

    try {
        const payload = {
            nom_contato: nom_contato || "",
            cod_unid_negoc: cod_unid_negoc,
            cod_unid_oper: cod_unid_oper
        };

        const apiResponse = await fetch('http://177.11.209.38:80/constellation/IISConstellationAPI.dll/constellation-api/V1.1/consulta_contatos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.authToken}`,
            },
            body: JSON.stringify(payload)
        });

        if (apiResponse.ok) {
            const data = await apiResponse.json();
            res.status(200).json(data);
        } else {
            const errorText = await apiResponse.text();
            console.error(`[API /consulta_contatos] Erro na API externa: ${apiResponse.status} - ${errorText}`);
            res.status(apiResponse.status).json({ error: 'Erro na API externa', message: errorText });
        }

    } catch (error) {
        console.error('[API /consulta_contatos] Erro ao processar a requisição:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/*
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Rodando em http://0.0.0.0:${PORT}`);
});

process.stdin.resume();
*/
 
export default app; 
