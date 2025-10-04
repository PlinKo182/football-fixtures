/**
 * UTILITÁRIO DE TESTE - Migração de Jogos
 * 
 * Este ficheiro permite testar a migração sem afetar GameCard ou page.js
 * Use com cuidado! Sempre teste primeiro com testMode=true
 */

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app' 
  : 'http://localhost:3000';

class MigrationTester {
  
  /**
   * Lista jogos candidatos à migração
   */
  static async listCandidates() {
    try {
      const response = await fetch(`${API_BASE}/api/migrate-game`);
      const data = await response.json();
      
      console.log('🔍 CANDIDATOS À MIGRAÇÃO:');
      console.log('═'.repeat(50));
      
      if (data.candidates && data.candidates.length > 0) {
        data.candidates.forEach((game, index) => {
          console.log(`${index + 1}. ${game.homeTeam} vs ${game.awayTeam}`);
          console.log(`   📅 ${new Date(game.date).toLocaleDateString('pt-PT')}`);
          console.log(`   ⚽ Resultado: ${game.score}`);
          console.log(`   🎯 Odds personalizadas: ${game.hasCustomOdds ? `${game.customOdds}` : 'Não'}`);
          console.log(`   🆔 ID: ${game._id}`);
          console.log('─'.repeat(30));
        });
      } else {
        console.log('❌ Nenhum jogo candidato encontrado');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao listar candidatos:', error);
      return null;
    }
  }
  
  /**
   * Testa migração de um jogo (sem salvar)
   */
  static async testMigration(gameId) {
    try {
      console.log(`🧪 TESTANDO MIGRAÇÃO: ${gameId}`);
      console.log('═'.repeat(50));
      
      const response = await fetch(`${API_BASE}/api/migrate-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId, 
          testMode: true 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ SIMULAÇÃO CONCLUÍDA');
        console.log('Original:', {
          teams: `${data.originalGame.homeTeam} vs ${data.originalGame.awayTeam}`,
          date: new Date(data.originalGame.date).toLocaleDateString('pt-PT'),
          score: `${data.originalGame.homeScore}-${data.originalGame.awayScore}`,
          customOdds: data.originalGame.customOdds?.draw
        });
        console.log('Seria criado:', {
          season: data.wouldCreate.season,
          odds: data.teamOddsPreview
        });
      } else {
        console.log('❌ ERRO:', data.error);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return null;
    }
  }
  
  /**
   * Executa migração real (CUIDADO!)
   */
  static async executeMigration(gameId) {
    console.log(`⚠️  MIGRAÇÃO REAL: ${gameId}`);
    console.log('═'.repeat(50));
    console.log('🚨 ISTO VAI ALTERAR A BASE DE DADOS!');
    
    try {
      const response = await fetch(`${API_BASE}/api/migrate-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId, 
          testMode: false 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ MIGRAÇÃO CONCLUÍDA');
        console.log('Jogo histórico criado:', data.historicalGame._id);
      } else {
        console.log('❌ ERRO:', data.error);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      return null;
    }
  }
}

// Para usar em Node.js ou browser console
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MigrationTester;
}

// Para usar no browser
if (typeof window !== 'undefined') {
  window.MigrationTester = MigrationTester;
}

/*
COMO USAR:

1. No browser console (F12):
   await MigrationTester.listCandidates();
   await MigrationTester.testMigration('GAME_ID_AQUI');
   
2. Linha de comandos:
   node -e "
   const MigrationTester = require('./test/migration-tester.js');
   MigrationTester.listCandidates().then(console.log);
   "
*/