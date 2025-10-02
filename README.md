# Football Fixtures - Next.js 14This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



Uma aplicação Next.js 14 para acompanhar fixtures de futebol dos principais times europeus, integrada com MongoDB Atlas e SportRadar API.## Getting Started



## 🚀 CaracterísticasFirst, run the development server:



- **Next.js 14** com App Router```bash

- **MongoDB Atlas** para persistência de dadosnpm run dev

- **SportRadar API** para dados de fixtures em tempo real# or

- **Tailwind CSS** para estilizaçãoyarn dev

- **Server-Side Rendering (SSR)** e **Incremental Static Regeneration (ISR)**# or

- **Páginas dinâmicas** para cada timepnpm dev

- **API Routes** para atualização automática de fixtures# or

bun dev

## 📋 Times Monitorados```



### La LigaOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- Real Madrid

- BarcelonaYou can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

- Atletico Madrid

- Athletic Bilbao## Learn More

- Real Sociedad

To learn more about Next.js, take a look at the following resources:

### Ligue 1

- Paris Saint-Germain- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- Marseille- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- Monaco

- LyonYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- Lille

## Deploy on Vercel

### Premier League

- ArsenalThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

- Manchester City

- LiverpoolCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

- Chelsea

## ⚙️ Configuração

### 1. Clonagem e Instalação

```bash
git clone <seu-repositorio>
cd football-fixtures
npm install
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://seu_usuario:sua_senha@cluster0.xxxxx.mongodb.net/football_fixtures?retryWrites=true&w=majority

# SportRadar API Key
SPORTRADAR_API_KEY=sua_chave_api_sportradar

# Next.js URL
NEXTAUTH_URL=http://localhost:3000
```

### 3. MongoDB Atlas Setup

1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie um novo cluster
3. Configure o acesso de rede (whitelist seu IP)
4. Crie um usuário de banco de dados
5. Obtenha a string de conexão e adicione ao `.env.local`

### 4. SportRadar API Setup

1. Registre-se no [SportRadar](https://developer.sportradar.com/)
2. Obtenha uma API key para a Soccer API
3. Adicione a chave ao `.env.local`

## 🏃‍♂️ Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3000`

### Produção

```bash
npm run build
npm start
```

## 📡 API Endpoints

### `GET/POST /api/update-fixtures`

Atualiza as fixtures de todas as ligas monitoradas.

**Resposta de exemplo:**
```json
{
  "success": true,
  "message": "Fixtures atualizadas com sucesso!",
  "stats": {
    "totalUpdated": 45,
    "totalErrors": 0,
    "timestamp": "2025-01-02T22:30:00.000Z"
  }
}
```

## 🗄️ Estrutura do Banco de Dados

### Game Schema

```javascript
{
  league: String, // 'La Liga', 'Ligue 1', 'Premier League'
  homeTeam: String,
  awayTeam: String,
  date: Date,
  time: String,
  status: String, // 'scheduled', 'live', 'finished', 'postponed'
  homeScore: Number,
  awayScore: Number,
  sportRadarId: String
}
```

## 📁 Estrutura do Projeto

```
football-fixtures/
├── app/
│   ├── api/
│   │   └── update-fixtures/
│   │       └── route.js           # API para atualizar fixtures
│   ├── components/
│   │   ├── GameCard.js            # Componente de card de jogo
│   │   └── UpdateButton.js        # Botão de atualização
│   ├── team/
│   │   └── [slug]/
│   │       └── page.js             # Páginas dinâmicas dos times
│   ├── globals.css
│   ├── layout.js
│   └── page.js                     # Página inicial
├── lib/
│   ├── mongodb.js                  # Conexão com MongoDB
│   └── teams.js                    # Lista de times e ligas
├── models/
│   └── Game.js                     # Modelo do jogo
├── .env.local                      # Variáveis de ambiente
├── .gitignore
├── jsconfig.json
├── next.config.mjs
├── package.json
├── tailwind.config.js
└── vercel.json                     # Configuração do Vercel
```

## 🚀 Deploy no Vercel

### 1. Deploy Automático

1. Conecte seu repositório ao [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente no dashboard do Vercel:
   - `MONGODB_URI`
   - `SPORTRADAR_API_KEY`
3. Deploy automático será executado

### 2. Deploy via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 🔄 Atualização de Fixtures

### Manual
Clique no botão "Atualizar Fixtures" na interface

### Automática via Cron (Vercel)
Configure um cron job no Vercel para executar `/api/update-fixtures` regularmente.

## 🛠️ Funcionalidades

- ✅ **Home Page**: Lista todos os times e próximos jogos
- ✅ **Páginas de Times**: Jogos específicos de cada time
- ✅ **Atualização em Tempo Real**: Integração com SportRadar API
- ✅ **Responsivo**: Design adaptável para mobile e desktop
- ✅ **SSR/ISR**: Performance otimizada
- ✅ **Rate Limiting**: Respeita limites da API SportRadar

## 📝 Notas de Desenvolvimento

- **Rate Limiting**: A API SportRadar tem limites de requests. O código inclui delays entre chamadas.
- **Error Handling**: Tratamento robusto de erros para APIs indisponíveis.
- **Database Indexes**: Índices otimizados para consultas rápidas.
- **Caching**: Implementado através do ISR do Next.js.

## 🐛 Troubleshooting

### Erro de Conexão MongoDB
- Verifique se o IP está na whitelist
- Confirme as credenciais na string de conexão
- Teste a conectividade

### Erro SportRadar API
- Verifique se a API key está correta
- Confirme se não excedeu o limite de requests
- Verifique se os IDs das ligas estão corretos

### Build Errors
- Execute `npm run build` para identificar erros
- Verifique se todas as dependências estão instaladas
- Confirme se as variáveis de ambiente estão definidas

## 📜 Licença

Este projeto é open source e está disponível sob a [MIT License](LICENSE).