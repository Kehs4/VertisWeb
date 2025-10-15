import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { serialize } from 'cookie';
import cookieParser from 'cookie-parser';

const app = express();
const port = 9000;

app.use(express.urlencoded({ extended: false }));
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
  

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

// Adicione esta linha para manter o processo Node.js em execução em ambientes ESM.
// Isso impede que o processo termine prematuramente após o app.listen() ser chamado.
process.stdin.resume();
