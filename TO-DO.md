# 🎯 TO-DO: Implementação Sistema Dual Database

## 📋 **RESUMO DO## ✅ **FASE 3: SISTEMA DUAL IMPLEMENTADO**

### 🎯 **APIs CRIADAS:**
- [x] `POST /api/set-odds` - Define odd + migra instantaneamente
- [x] `PUT /api/edit-odds` - Edita odd na base Apostas
- [x] `GET /api/check-game-status` - Verifica status unificado

### 🔄 **FLUXO IMPLEMENTADO:**
1. **Página inicial**: Define odd → Migra para Apostas
2. **Página equipa**: Edita odd → Atualiza em Apostas  
3. **Proteção**: SportRadar nunca apaga odds definidasTO**
Separar dados dinâmicos (SportRadar) dos históricos (com odds personalizadas) para evitar perda de dados nas atualizações automáticas.

---

## ✅ **FASE 1: FUNDAÇÃO (CONCLUÍDA)**

### ✅ Modelos e APIs Base
- [x] `models/HistoricalGame.js` - Modelo para jogos históricos com odds protegidas
- [x] `app/api/migrate-game/route.js` - API de migração com modo teste
- [x] `test/migration-tester.js` - Utilitário de teste

### 🔍 **Estrutura OPTIMIZADA para Martingale:**
```
Colecções por Liga: laliga_2025_26, ligue1_2025_26, etc.
├── Cada documento = 1 equipa
├── Campo 'games' = array com todos os jogos
├── Estrutura: { teamName, league, games: [...] }
└── SportRadar atualiza estes arrays

historical_games (MongoDB) - SÓ EMPATES! ✅
├── SÓ jogos que terminaram empatados
├── teamOdds.MAP APENAS se homeScore === awayScore  
├── Outros jogos = sem odds (não interessam)
└── NUNCA sobrescrito
```

### 🚨 **DESCOBERTA CRÍTICA:**
Os dados NÃO estão numa colecção `games` unificada! Cada liga tem sua colecção própria (`laliga_2025_26`) onde cada documento representa uma **equipa** com um array `games` contendo todos os seus jogos.

---

## ✅ **FASE 2: TESTE E VALIDAÇÃO (CONCLUÍDA)**

### ✅ Validação Concluída  
- [x] **Testar migração de jogo real** ✅
  - [x] Verificar se dados ficam corretos ✅
  - [x] Validar estrutura teamOdds Map ✅ 
  - [x] Confirmar season calculation ✅
  
### 🎯 **DADOS REAIS ENCONTRADOS E CORRIGIDOS:**
- **5 jogos históricos** com resultados (La Liga 2024-25)
- **Empate encontrado**: Real Sociedad vs Atl. Bilbao (0-0)
- **Estrutura validada**: homeTeam, awayTeam, homeScore, awayScore
- **Season**: 2024-25 (calculado correctamente)

### 🚨 **CORREÇÃO IMPORTANTE - ODDS EM TODOS OS JOGOS:**
- ❌ **ANTES**: Só guardar odds nos jogos que terminaram em empate
- ✅ **AGORA**: Guardar odds em **TODOS os jogos** (apostamos em todos!)
- 🎯 **Campo principal**: `drawOdds` (Number, obrigatório)
- 📊 **Odds inteligentes**: 2.9 (favoritos), 3.1 (normal), 3.4 (empates realizados)

### 🧪 **Como Testar:**
```javascript
// 1. Listar candidatos
await MigrationTester.listCandidates();

// 2. Testar sem salvar
await MigrationTester.testMigration('GAME_ID');

// 3. Só depois migrar real
await MigrationTester.executeMigration('GAME_ID');
```

---

## � **FASE 3: INTEGRAÇÃO CUIDADOSA (ATUAL)**

### ⚠️ **FICHEIROS CRÍTICOS (NÃO TOCAR ATÉ VALIDAR):**
- `app/components/GameCard.js` - Lógica de leitura MongoDB
- `app/page.js` - Lógica principal de dados
- `lib/teams.js` - Dados das equipas

### 🔄 **Modificações Necessárias:**

#### A. `lib/dataLoader.js` → `lib/teamLoader.js` (RENOMEAR)
```javascript
// ANTES: Só lê games
const games = await Game.find(...);

// DEPOIS: Lê das duas bases
const [currentGames, historicalGames] = await Promise.all([
  Game.find({ status: { $in: ['scheduled', 'live'] } }),
  HistoricalGame.find({ homeTeam: team, awayTeam: team })
]);

// Combina dados mantendo chronologia
return [...historicalGames, ...currentGames].sort(by date);
```

#### B. `lib/bettingCalculator.js` (ATUALIZAR)
```javascript
// Adaptar para ler teamOdds.get(teamName).draw
const getGameOdds = (game, teamName) => {
  if (game.teamOdds) {
    return game.teamOdds.get(teamName)?.draw || 3.0;
  }
  return game.customOdds?.draw || 3.0;
};
```

#### C. `app/components/BettingAnalysis.js` (ATUALIZAR)
```javascript
// EditableOdds deve decidir onde salvar:
// - HistoricalGame se jogo terminado
// - Game se jogo futuro/atual
```

---

## 🔧 **FASE 4: SISTEMA DE MIGRAÇÃO**

### 🤖 **Migração Automática**
- [ ] Timer que executa após jogos terminarem
- [ ] Verificar status "finished" 
- [ ] Migrar automaticamente com odds preservadas
- [ ] Log de migrações

### 📊 **Script de Migração em Massa**
```javascript
// Migrar todos os jogos históricos existentes
node scripts/migrate-all-historical.js
```

---

## ⏰ **FASE 5: SISTEMA DE TIMER INTELIGENTE**

### 🕐 **Timer Adaptativo**
```javascript
// Durante jogos: verificar a cada 5min
// Fora de jogos: verificar a cada hora
// Sem jogos próximos: verificar diariamente
```

### 🎯 **Lógica do Timer:**
1. Buscar próximo jogo
2. Calcular intervalo baseado na proximidade
3. Durante jogo: atualizar frequentemente
4. Após jogo: migrar para histórico

---

## 🚨 **CUIDADOS ESPECIAIS**

### ⛔ **NÃO TOCAR ATÉ TESTAR:**
- GameCard.js
- page.js
- Qualquer lógica de leitura existente

### 🔒 **Backup Essencial:**
```bash
# Antes de qualquer mudança grande
mongodump --db football-fixtures --collection games
```

### 🧪 **Sempre Testar Primeiro:**
1. testMode=true em todas as APIs
2. Verificar dados no MongoDB Compass
3. Validar cálculos betting
4. Só depois fazer mudanças reais

---

## 📈 **MÉTRICAS DE SUCESSO**

### ✅ **Critérios de Validação:**
- [ ] Odds personalizadas nunca perdidas
- [ ] Cálculos betting mantêm accuracy  
- [ ] Performance não degradada
- [ ] UI mantém funcionalidade
- [ ] Migração automática funciona
- [ ] Rollback possível se necessário

---

## 🔄 **PRÓXIMOS PASSOS**

### 1. **AGORA (Fase 2)**
- Testar migração de 1-2 jogos
- Verificar dados no MongoDB
- Validar estrutura teamOdds

### 2. **DEPOIS DE VALIDAR (Fase 3)**  
- Modificar teamLoader com cuidado
- Adaptar bettingCalculator
- Testar integração

### 3. **FINAL (Fases 4-5)**
- Sistema de migração automática
- Timer inteligente
- Monitorização

---

## 📞 **PONTOS DE ATENÇÃO**

### 🚨 **Se Algo Correr Mal:**
1. Reverter para versão anterior
2. Verificar logs de erro
3. Validar estrutura MongoDB
4. Testar cálculos betting

### 🔍 **Debug Points:**
- teamOdds Map serialization/deserialization
- Date handling entre bases
- Performance queries com duas collections
- Memory usage com dados duplicados

---

*Última atualização: 4 Outubro 2025*  
*Status: ✅ Fase 2 Concluída → 🚧 Fase 3 - Integração*  
*Dados: 5 jogos históricos validados, estrutura confirmada*