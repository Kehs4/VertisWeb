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
const port = 9000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // Adiciona o middleware para processar cookies
app.use(cors());
 
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

app.get('/tasks', async (req, res) => { // endpoint que retorna todas as tasks na task list view.
    // Pega as datas da query string ou usa a data atual como padrão
    const today = getFormattedDate(new Date());
    // Pega os valores da query. Se não vierem, o padrão é `undefined`.
    let { dat_inicial, dat_final } = req.query;

    // Se a data final não for fornecida, usa a data de hoje como padrão.
    if (!dat_final) {
        dat_final = today;
    }

    // Converte string vazia para null para a lógica da query
    const final_dat_inicial = dat_inicial === '' ? null : dat_inicial;

    console.log(`[API /tasks] Buscando tarefas de ${final_dat_inicial || 'início'} até ${dat_final} no banco de dados.`);

    try {
        let query = `
            SELECT
                t.id, t.id_unid_negoc, t.id_unid_oper, t.id_sist_modulo, t.id_criado_por,
                creator.nom_contato as nom_criado_por, -- Adiciona o nome do criador
                t.ind_prioridade, t.ind_sit_tarefa, t.qtd_pontos, t.titulo_tarefa, t.tarefa_avaliacao, t.id_tarefa_pai,
                (
                    SELECT COALESCE(array_agg(utm.id_marcador::text), ARRAY[]::text[])
                    FROM unid_oper_tarefa_x_marcador utm
                    WHERE utm.id_tarefa = t.id and dth_exclusao is null
                ) as tipo_chamado, 
                t.dth_inclusao, t.dth_abertura, t.dth_encerramento, t.dth_prev_entrega, t.dth_exclusao
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
                SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso 
                FROM unid_oper_tarefa_x_recurso utr
                JOIN unid_oper_contatos c ON c.id_contato = utr.id_recurso
                WHERE utr.id_tarefa = $1 AND utr.dth_exclusao IS NULL`;
            const { rows: resources } = await pool.query(resourceQuery, [task.id]);
            task.recursos = resources; 

            // Busca os comentários associados
            const commentQuery = `
                SELECT
                    utc.id,
                    utc.id_incluido_por as id_recurso,
                    uoc.nom_contato as nom_recurso,
                    utc.comentario,
                    utc.dth_inclusao
                FROM unid_oper_tarefa_comentario utc
                LEFT JOIN unid_oper_contatos uoc ON utc.id_incluido_por = uoc.id_contato
                WHERE utc.id_tarefa = $1 AND utc.dth_exclusao IS NULL ORDER BY utc.dth_inclusao ASC;`;
            const { rows: comentario } = await pool.query(commentQuery, [task.id]);
            task.comentarios = comentario;
            // A propriedade 'comentarios' é adicionada ao objeto 'task' antes de ser enviada.
        }
        res.status(200).json(rows);
    } catch (error) {
        console.error('Ocorreu um erro ao buscar as listas de tarefas:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/task/:id', async (req, res) => { // endpoint para get na aba de detalhes de uma tarefa por id especifico.
    try {
        const taskId = req.params.id;
        console.log(`[API /task/:id] Buscando tarefa com ID: ${taskId}`);

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
            SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso 
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

app.delete('/tasks/:id', async (req, res) => { // Endpoint de remoção de task por id.
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

app.post('/tasks', async (req, res) => { // endpoint de criação de uma task pelo botão adicionar.
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
            const resourceQuery = 'INSERT INTO unid_oper_tarefa_x_recurso (id_tarefa, id_recurso, dth_inclusao) VALUES ($1, $2, NOW())';
            for (const recurso of recursos) {
                await client.query(resourceQuery, [newTask.id, recurso.id_recurso]);
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
            SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso 
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
        console.log('[API /tasks] Nova tarefa criada com sucesso:', fullTask);
        res.status(201).json(fullTask);

    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error('Ocorreu um erro ao criar a tarefa:', error);
        res.status(500).send('Erro interno do servidor');
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
});

app.put('/tasks/:id', async (req, res) => { // Endpoint de atualização de uma task por id especifico.
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
            SELECT c.id_contato AS id_recurso, c.nom_contato AS nom_recurso 
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

// Endpoint para buscar as flags/marcadores
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
    const { search, id_unid_oper } = req.query;
    try {
        let query = `
            SELECT 
                c.id_contato as id, 
                c.nom_contato as nome, 
                c.id_unid_oper, 
                uo.nom_unid_oper,
                un.id_unid_negoc,
                un.nom_unid_negoc,
                c.num_telefone1 as telefone,
                c.email_1 as email,
                c.inf_adicional
            FROM unid_oper_contatos c
            LEFT JOIN unid_operacional uo ON c.id_unid_oper = uo.id_unid_oper
            LEFT JOIN unid_negocio un ON uo.id_unid_negoc = un.id_unid_negoc
        `;
        const params = [];
        const whereClauses = [];

        // Adiciona a condição para não buscar contatos excluídos logicamente
        whereClauses.push('c.dth_exclusao IS NULL');

        if (search) {
            params.push(`%${search}%`);
            whereClauses.push(`(c.nom_contato ILIKE $${params.length} OR c.num_telefone1 ILIKE $${params.length} OR c.email_1 ILIKE $${params.length} OR c.inf_adicional ILIKE $${params.length})`);
        }
        if (id_unid_oper) {
            params.push(id_unid_oper);
            whereClauses.push(`c.id_unid_oper = $${params.length}`);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        query += ' ORDER BY c.nom_contato;';
        const { rows } = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// POST /contacts - Criar novo contato
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

// PUT /contacts/:id - Atualizar contato
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

// DELETE /contacts/:id - Excluir contato
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

// GET /resources - Listar recursos (contatos) com busca
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

// POST /resources - Criar novo recurso (contato)
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

// PUT /resources/:id - Atualizar recurso (contato)
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

// DELETE /resources/:id - Excluir recurso (contato)
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

// Endpoint leve para atualizar apenas o status de uma tarefa
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

// Endpoint para remover o vínculo de uma tarefa pai
app.patch('/tasks/:id/unlink-parent', async (req, res) => {
    const { id } = req.params; // Este é o ID da tarefa FILHA
    try {
        const query = `
            UPDATE unid_oper_tarefa 
            SET id_tarefa_pai = NULL 
            WHERE id = $1 
            RETURNING id, id_tarefa_pai;
        `;
        const { rows, rowCount } = await pool.query(query, [id]);

        if (rowCount === 0) {
            return res.status(404).send('Tarefa não encontrada.');
        }

        console.log(`[API] Vínculo da tarefa pai removido da tarefa ${id}.`);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao remover vínculo da tarefa pai para a tarefa ${id}:`, error);
        res.status(500).send('Erro interno do servidor');
    }
});

// Endpoint para buscar Unidades Operacionais
app.get('/units', async (req, res) => {
    const { search_by = 'nom_unid_oper', search_term = '' } = req.query;

    // Validação simples para evitar SQL Injection
    const allowedSearchFields = ['nom_unid_oper', 'id_unid_oper'];
    if (!allowedSearchFields.includes(search_by)) {
        return res.status(400).send('Critério de busca inválido.');
    }

    try {
        const query = `
            SELECT 
                uo.id_unid_oper as id,
                uo.nom_unid_oper,
                un.nom_unid_negoc
            FROM unid_operacional uo
            LEFT JOIN unid_negocio un ON uo.id_unid_negoc = un.id_unid_negoc
            WHERE ${search_by}::text ILIKE $1
            ORDER BY uo.nom_unid_oper;
        `;
        const { rows } = await pool.query(query, [`%${search_term}%`]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar unidades operacionais:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// Endpoint para adicionar um novo comentário a uma tarefa
app.post('/tasks/:id/comments', async (req, res) => {
    const { id: id_tarefa } = req.params;
    const { id_incluido_por, comentario } = req.body;

    if (!id_incluido_por || !comentario) {
        return res.status(400).send('ID do usuário e comentário são obrigatórios.');
    }

    try {
        // Insere o novo comentário
        const insertQuery = `
            INSERT INTO unid_oper_tarefa_comentario (id_tarefa, id_incluido_por, comentario, dth_inclusao)
            VALUES ($1, $2, $3, NOW())
            RETURNING id;
        `;
        const { rows: [newComment] } = await pool.query(insertQuery, [id_tarefa, id_incluido_por, comentario]);

        // Busca o comentário completo (com o nome do usuário) para retornar ao frontend
        const selectQuery = `
            SELECT
                c.id, c.id_tarefa, c.id_incluido_por as id_recurso, u.nom_contato as nom_recurso, c.comentario, c.dth_inclusao
            FROM unid_oper_tarefa_comentario c
            JOIN unid_oper_contatos u ON c.id_incluido_por = u.id_contato
            WHERE c.id = $1;
        `;
        const { rows: [fullComment] } = await pool.query(selectQuery, [newComment.id]);

        console.log(`[API /tasks/:id/comments] Novo comentário adicionado à tarefa ${id_tarefa}.`);
        res.status(201).json(fullComment);

    } catch (error) {
        console.error(`Erro ao adicionar comentário à tarefa ${id_tarefa}:`, error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

process.stdin.resume();
