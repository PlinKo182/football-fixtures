# Scripts de Teste - Football Fixtures

Esta pasta contém todos os scripts de teste e debug do projeto Football Fixtures.

## Scripts Disponíveis

### 🔍 **Scripts de Verificação**
- **`check-all-collections.js`** - Verifica todas as coleções da base de dados
- **`check-db-teams.js`** - Verifica equipas específicas na base de dados
- **`check-team-names.js`** - Verifica nomes das equipas
- **`inspect-db.js`** - Inspeção detalhada da base de dados
- **`quick-check.js`** - Verificação rápida do estado atual

### 📊 **Scripts de Análise**
- **`analyze-teams.js`** - Análise detalhada das equipas
- **`show-all-teams.js`** - Lista todas as equipas disponíveis
- **`find-problem-teams.js`** - Encontra equipas com problemas

### 🧪 **Scripts de Teste Específicos**
- **`test-betis.js`** - Teste específico da equipa Bétis
- **`test-betis-direct.js`** - Teste direto da API para Bétis
- **`test-get-all-games.js`** - Teste da função getAllGames
- **`test-homepage-logic.js`** - Teste da lógica da página inicial
- **`test-problem-teams.js`** - Teste de equipas problemáticas

### 🔄 **Scripts de Atualização**
- **`force-update.js`** - Força atualização completa dos dados
- **`fetch-raw-api.js`** - Busca dados brutos da API SportsRadar

## Como Usar

Para executar qualquer script, use:
```bash
cd "c:\Minhas Apps\football-fixtures"
node test/[nome-do-script].js
```

Exemplos:
```bash
# Verificar todas as coleções
node test/check-all-collections.js

# Forçar atualização
node test/force-update.js

# Teste rápido
node test/quick-check.js
```

## Notas
- Todos os scripts assumem que o arquivo `.env.local` está configurado
- Alguns scripts podem demorar a executar devido à API externa
- Os scripts de atualização modificam a base de dados