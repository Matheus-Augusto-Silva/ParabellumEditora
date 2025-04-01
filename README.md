# Sistema de Gestão de Vendas de Livros

Sistema para controle de vendas de livros e cálculo de comissões para autores.

## Funcionalidades

- Cadastro de livros e autores
- Registro de vendas manual e importação por CSV
- Cálculo automático de comissões
- Dashboard com estatísticas de vendas
- Relatórios por autor, livro e plataforma

## Tecnologias

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Banco de Dados**: MongoDB

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/projeto-vendas-livros.git

# Entre na pasta do projeto
cd projeto-vendas-livros

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Inicie o servidor de desenvolvimento
npm start
```

## Scripts

- `npm start` - Inicia o backend e o frontend simultaneamente
- `npm run server` - Inicia apenas o servidor backend
- `npm run dev` - Inicia apenas o servidor de desenvolvimento frontend
- `npm run build` - Compila o projeto para produção

## Estrutura do Projeto

```
src/
├── backend/               # Código do servidor
│   ├── config/            # Configurações
│   ├── controllers/       # Controladores
│   ├── middleware/        # Middlewares
│   ├── models/            # Modelos do banco de dados
│   ├── routes/            # Rotas da API
│   └── utils/             # Utilitários
│
└── frontend/              # Código do cliente
    ├── components/        # Componentes React
    ├── pages/             # Páginas da aplicação
    ├── services/          # Serviços e API
    ├── types/             # Tipos e interfaces TypeScript
    └── utils/             # Utilitários
```

## Importação de Dados

O sistema suporta a importação de arquivos CSV com vendas. O formato esperado é:

```
bookTitle,platform,saleDate,quantity,salePrice
"Livro de Exemplo","WooCommerce","2023-01-15",2,29.90
```

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
# ParabellumEditora
