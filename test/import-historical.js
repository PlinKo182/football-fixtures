// Definir variáveis de ambiente diretamente
process.env.MONGODB_URI = 'mongodb+srv://jrplinko_db_user:73QXo1wsiFfHS2po@cluster0.tkqxcs2.mongodb.net/Empates?retryWrites=true&w=majority&appName=Cluster0';

// Importar dependências
import { importAllHistoricalData } from '../lib/historicalDataLoader.js';

// Script para importar dados históricos da época 2024-25
async function runHistoricalImport() {
  console.log('🚀 Iniciando importação automática de dados históricos...');
  console.log('📅 Época: 2024-25');
  console.log('🏆 Ligas: La Liga, Premier League, Ligue 1');
  console.log('─'.repeat(50));
  
  try {
    const results = await importAllHistoricalData('2024-25');
    
    console.log('─'.repeat(50));
    console.log('🎉 IMPORTAÇÃO COMPLETA!');
    console.log('📊 Resultados:');
    
    let totalTeams = 0;
    results.forEach(result => {
      if (result.savedCount) {
        console.log(`✅ ${result.league.toUpperCase()}: ${result.savedCount} equipas importadas`);
        totalTeams += result.savedCount;
      } else if (result.error) {
        console.log(`❌ ${result.league.toUpperCase()}: ERRO - ${result.error}`);
      }
    });
    
    console.log('─'.repeat(50));
    console.log(`🏆 TOTAL: ${totalTeams} equipas com dados históricos salvos no MongoDB`);
    console.log('✅ Os dados estão agora disponíveis nas páginas das equipas');
    console.log('💾 Dados armazenados em coleções separadas por época (ex: laliga_2024_25)');
    
  } catch (error) {
    console.error('❌ ERRO NA IMPORTAÇÃO:', error);
    process.exit(1);
  }
}

// Executar importação
runHistoricalImport();