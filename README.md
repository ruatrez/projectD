# GestPRO

Aplicacao web para gestao de obras e processos da construcao civil. O projeto concentra operacoes comerciais, planejamento, compras, contratos, financeiro, diario de obra e controle de usuarios em uma interface unica.

## Visao geral

O sistema foi construido como um frontend React que consome diretamente a camada de dados via SDK. A aplicacao organiza o fluxo da operacao em modulos independentes, com autenticacao, controle de acesso por perfil e entidades descritas em arquivos JSON.

## Tecnologias utilizadas

### Frontend

- React 18
- TypeScript
- Vite 5
- React Router DOM 6
- Tailwind CSS 3
- Lucide React
- React Hot Toast

### Dados e integracoes

- `@lumi.new/sdk` para acesso as entidades e operacoes CRUD
- Schemas JSON em `src/entities/*.json`
- `localStorage` para persistencia da sessao autenticada
- `jsPDF` e `html2canvas` para exportacao de documentos em PDF

### Ferramentas de desenvolvimento

- ESLint 9
- TypeScript ESLint
- PostCSS
- pnpm (`pnpm-lock.yaml` presente no projeto)

## Principais modulos

- `Dashboard`: visao consolidada de indicadores e atalhos operacionais.
- `CRM`: gestao de leads e evolucao do funil comercial.
- `Base de Insumos`: cadastro de insumos, composicoes e atualizacao de estoque.
- `Proposta`: montagem de propostas comerciais e templates.
- `Contratos`: gestao contratual e vinculo com propostas e orcamentos.
- `Funcionarios`: cadastro, status e informacoes operacionais da equipe.
- `Planejamento de Obra`: cronograma, etapas, subetapas, custos e recursos.
- `Planejamento Semanal`: desdobramento tatico das atividades da obra.
- `Compras/Estoque`: fornecedores, compras, entradas e movimentacoes.
- `Diario de Obra`: registros diarios, evidencias e geracao de PDF.
- `Financeiro`: lancamentos, projecoes, custos e acompanhamento financeiro.
- `Usuarios`: controle de acesso, perfis e administracao da base de usuarios.

## Arquitetura da aplicacao

### Fluxo principal

- O ponto de entrada esta em `src/main.tsx`.
- As rotas sao definidas em `src/App.tsx`.
- O layout autenticado fica em `src/components/Layout.tsx`.
- A autenticacao e as permissoes ficam em `src/contexts/AuthContext.tsx`.
- O cliente do banco de dados esta centralizado em `src/lib/lumi.ts`.

### Camada de dados

As entidades sao modeladas em arquivos como:

- `src/entities/usuarios.json`
- `src/entities/propostas.json`
- `src/entities/planejamentos.json`
- `src/entities/financeiro.json`
- `src/entities/contratos.json`

Esses arquivos definem validadores e estrutura dos dados consumidos pelo SDK.

### Controle de acesso

O projeto implementa autenticacao com:

- validacao de usuario via entidade `usuarios`
- persistencia da sessao no `localStorage`
- redirecionamento por perfil de acesso
- restricao de menus e rotas por modulo

Perfis identificados no codigo:

- `administrador`
- `juridico`
- `financeiro`
- `compras`
- `engenheiro`
- `gestor`
- `encarregado`

## Estrutura do projeto

```text
.
|- src/
|  |- components/        # modulos principais da interface
|  |- contexts/          # autenticacao e estado global
|  |- entities/          # schemas JSON das entidades
|  |- lib/               # cliente do Banco de Dados e utilitarios
|  |- pages/             # variacoes e paginas especificas
|  |- App.tsx            # composicao de rotas
|  |- main.tsx           # bootstrap da aplicacao
|  \- index.css          # Tailwind base/components/utilities
|- index.html
|- vite.config.ts
|- tailwind.config.js
|- postcss.config.js
|- eslint.config.js
|- tsconfig.json
\- package.json
```

## Scripts disponiveis

```bash
pnpm dev
pnpm build
pnpm build:dev
pnpm lint
pnpm preview
```

Equivalentes com `npm` tambem funcionam:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Como executar localmente

### Pre-requisitos

- Node.js 18 ou superior
- pnpm ou npm

### Instalacao

```bash
pnpm install
```

### Ambiente de desenvolvimento

```bash
pnpm dev
```

Aplicacao disponivel em:

```text
http://localhost:5173
```

### Build de producao

```bash
pnpm build
```

### Preview local do build

```bash
pnpm preview
```

## Configuracao atual

Atualmente a integracao com o banco de dados nao usa arquivo `.env`. A configuracao esta fixa em `src/lib/lumi.ts`, incluindo:

- `projectId`
- `apiBaseUrl`
- `authOrigin`

Se o projeto precisar ser promovido entre ambientes, esse e o primeiro ponto que vale externalizar para variaveis de ambiente.

## Observacoes tecnicas

- O frontend faz acesso direto as entidades do banco de dados; nao ha backend Node.js implementado neste repositorio.
- Ha uso forte de componentes grandes orientados a dominio, concentrando logica de interface e operacoes CRUD.
- O projeto ja possui responsividade basica no layout principal, especialmente no menu lateral.
- Existem duas implementacoes relacionadas a contratos (`components/Contratos.tsx` e `pages/ContratosV2.tsx`) e duas para planejamento (`PlanejamentoObra.tsx` e `PlanejamentoObraV2.tsx`), indicando evolucao incremental da interface.

## Resumo da stack

Projeto SPA em React + TypeScript, empacotado com Vite, estilizado com Tailwind CSS e integrado ao banco de dados de propriedade da <a href="[RuatreZ](https://ruatrez.com/)" target="_blank" rel="noopener noreferrer">RuatreZ</a>
, para persistencia e modelagem de dados.
