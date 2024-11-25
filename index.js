import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';

const app = express();
const porta = 3000;
const host = '0.0.0.0';

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(cookieParser());

app.use(
    session({
        secret: 'chave-secreta-segura',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 3600000,
        },
    })
);

const produtos = [];
const usuarios = { admin: '123456' };

app.get('/login', (req, res) => {
    if (req.session.usuario) {
        return res.redirect('/cadastroProdutos'); 
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Login</title>
        </head>
        <body>
            <div class="container w-25 mt-5">
                <form action='/login' method='POST' class="row g-3 needs-validation" novalidate>
                    <fieldset class="border p-2">
                        <legend class="mb-3">Autenticação do Sistema</legend>
                        <div class="col-md-12">
                            <label for="usuario" class="form-label">Usuário:</label>
                            <input type="text" class="form-control" id="usuario" name="usuario" required>
                        </div>
                        <div class="col-md-12">
                            <label for="senha" class="form-label">Senha</label>
                            <input type="password" class="form-control" id="senha" name="senha" required>
                        </div>
                        <div class="col-12 mt-2">
                            <button class="btn btn-primary" type="submit">Login</button>
                        </div>
                    </fieldset>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).send('<h1>Por favor, preencha todos os campos. <a href="/login">Tente novamente.</a></h1>');
    }

    if (usuarios[usuario] && usuarios[usuario] === senha) {
        req.session.usuario = usuario;
        req.session.ultimoAcesso = new Date().toISOString();
        res.redirect('/cadastroProdutos');
    } else {
        res.status(401).send('<h1>Usuário ou senha inválidos. <a href="/login">Tente novamente.</a></h1>');
    }
});

app.get('/cadastroProdutos', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send('<h1>Você precisa estar logado para acessar esta página. <a href="/login">Login</a></h1>');
    }

    const { usuario, ultimoAcesso } = req.session;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Cadastro de Produtos</title>
        </head>
        <body>
            <div class="container mt-5">
                <h1>Bem-vindo, ${usuario}</h1>
                <p>Último acesso: ${ultimoAcesso}</p>
                <form action="/cadastroProdutos" method="POST" class="row g-3">
                    <fieldset class="border p-3">
                        <legend>Cadastro de Produto</legend>
                        <div class="col-md-4">
                            <label for="codigoBarras" class="form-label">Código de Barras:</label>
                            <input type="text" class="form-control" id="codigoBarras" name="codigoBarras" required>
                        </div>
                        <div class="col-md-4">
                            <label for="descricao" class="form-label">Descrição:</label>
                            <input type="text" class="form-control" id="descricao" name="descricao" required>
                        </div>
                        <div class="col-md-4">
                            <label for="precoCusto" class="form-label">Preço de Custo:</label>
                            <input type="number" step="0.01" class="form-control" id="precoCusto" name="precoCusto" required>
                        </div>
                        <div class="col-md-4">
                            <label for="precoVenda" class="form-label">Preço de Venda:</label>
                            <input type="number" step="0.01" class="form-control" id="precoVenda" name="precoVenda" required>
                        </div>
                        <div class="col-md-4">
                            <label for="dataValidade" class="form-label">Data de Validade:</label>
                            <input type="date" class="form-control" id="dataValidade" name="dataValidade" required>
                        </div>
                        <div class="col-md-4">
                            <label for="estoque" class="form-label">Qtd em Estoque:</label>
                            <input type="number" class="form-control" id="estoque" name="estoque" required>
                        </div>
                        <div class="col-md-4">
                            <label for="fabricante" class="form-label">Fabricante:</label>
                            <input type="text" class="form-control" id="fabricante" name="fabricante" required>
                        </div>
                        <div class="col-12 mt-3">
                            <button class="btn btn-success" type="submit">Cadastrar</button>
                        </div>
                    </fieldset>
                </form>
                ${renderTabela()}
            </div>
        </body>
        </html>
    `);
});

app.post('/cadastroProdutos', (req, res) => {
    try {
        const { codigoBarras, descricao, precoCusto, precoVenda, dataValidade, estoque, fabricante } = req.body;

        if (!codigoBarras || !descricao || !precoCusto || !precoVenda || !dataValidade || !estoque || !fabricante) {
            return res.status(400).send('Todos os campos devem ser preenchidos.');
        }

        produtos.push({ codigoBarras, descricao, precoCusto, precoVenda, dataValidade, estoque, fabricante });
        res.redirect('/cadastroProdutos');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ocorreu um erro no servidor.');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao encerrar sessão.');
        }
        res.redirect('/login');
    });
});

function renderTabela() {
    if (produtos.length === 0) {
        return '<p>Nenhum produto cadastrado ainda.</p>';
    }

    const rows = produtos.map(produto => `
        <tr>
            <td>${produto.codigoBarras}</td>
            <td>${produto.descricao}</td>
            <td>${produto.precoCusto}</td>
            <td>${produto.precoVenda}</td>
            <td>${produto.dataValidade}</td>
            <td>${produto.estoque}</td>
            <td>${produto.fabricante}</td>
        </tr>
    `).join('');

    return `
        <table class="table table-striped mt-5">
            <thead>
                <tr>
                    <th>Código de Barras</th>
                    <th>Descrição</th>
                    <th>Preço de Custo</th>
                    <th>Preço de Venda</th>
                    <th>Data de Validade</th>
                    <th>Estoque</th>
                    <th>Fabricante</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

app.listen(porta, host, () => {
    console.log(`Servidor rodando em http://${host}:${porta}`);
});