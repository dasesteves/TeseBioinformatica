const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Configuração de monitorização
const CONFIG = {
  INTERVALO_SEGUNDOS: 10,
  MAX_CONEXOES_ALERTA: 40,
  MAX_MEMORIA_PGA_MB: 50,
  MAX_TEMPO_QUERY_MS: 5000,
  LOG_FILE: 'monitor-aplicacao.log'
};

// Estado anterior para detectar mudanças
let estadoAnterior = {
  conexoes: 0,
  memoria: 0,
  queriesLentas: 0
};

function logMonitor(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  try {
    fs.appendFileSync(path.join(__dirname, CONFIG.LOG_FILE), logMessage + '\n');
  } catch (e) {
    console.error('Erro ao escrever log:', e.message);
  }
}

async function verificarSaudeSistema(connection) {
  const saude = {
    timestamp: new Date().toISOString(),
    conexoes: null,
    memoria: null,
    queries_ativas: null,
    queries_lentas: null,
    problemas: [],
    alertas: []
  };

  try {
    // 1. Verificar conexões ativas
    const conexoes = await connection.execute(`
      SELECT 
        COUNT(*) as TOTAL_SESSIONS,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as ACTIVE_SESSIONS,
        COUNT(CASE WHEN username = 'PCE' THEN 1 END) as PCE_SESSIONS
      FROM v$session
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    saude.conexoes = conexoes.rows[0];
    
    if (saude.conexoes.PCE_SESSIONS > CONFIG.MAX_CONEXOES_ALERTA) {
      saude.alertas.push(`🔴 CRÍTICO: ${saude.conexoes.PCE_SESSIONS} conexões PCE (limite: ${CONFIG.MAX_CONEXOES_ALERTA})`);
      saude.problemas.push('EXCESSO_CONEXOES');
    }

    // 2. Verificar memória Oracle
    const memoria = await connection.execute(`
      SELECT name, value 
      FROM v$mystat s, v$statname n 
      WHERE s.statistic# = n.statistic# 
        AND n.name IN ('session pga memory', 'session pga memory max')
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    const memoriaObj = {};
    memoria.rows.forEach(row => {
      memoriaObj[row.NAME] = parseInt(row.VALUE);
    });
    
    saude.memoria = {
      pga_mb: Math.round(memoriaObj['session pga memory'] / 1024 / 1024),
      pga_max_mb: Math.round(memoriaObj['session pga memory max'] / 1024 / 1024)
    };
    
    if (saude.memoria.pga_mb > CONFIG.MAX_MEMORIA_PGA_MB) {
      saude.alertas.push(`🟡 ATENÇÃO: ${saude.memoria.pga_mb}MB PGA (limite: ${CONFIG.MAX_MEMORIA_PGA_MB}MB)`);
      saude.problemas.push('MEMORIA_ALTA');
    }

    // 3. Verificar queries ativas
    const queriesAtivas = await connection.execute(`
      SELECT 
        COUNT(*) as QUERIES_ATIVAS,
        COUNT(CASE WHEN sql_text LIKE '%prf_presc_mov_fdet%' THEN 1 END) as QUERIES_FDET,
        COUNT(CASE WHEN sql_text LIKE '%verificarStock%' THEN 1 END) as QUERIES_STOCK
      FROM v$session s
      JOIN v$sql q ON s.sql_id = q.sql_id
      WHERE s.username = 'PCE' AND s.status = 'ACTIVE'
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    saude.queries_ativas = queriesAtivas.rows[0];

    // 4. Verificar queries lentas recentes (última hora)
    const queriesLentas = await connection.execute(`
      SELECT COUNT(*) as QUERIES_LENTAS
      FROM v$sql
      WHERE parsing_user_id = (SELECT user_id FROM all_users WHERE username = 'PCE')
        AND elapsed_time > 5000000  -- >5 segundos
        AND last_active_time > SYSDATE - 1/24  -- última hora
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    saude.queries_lentas = queriesLentas.rows[0];
    
    if (saude.queries_lentas.QUERIES_LENTAS > 5) {
      saude.alertas.push(`🟡 ${saude.queries_lentas.QUERIES_LENTAS} queries lentas na última hora`);
      saude.problemas.push('QUERIES_LENTAS_FREQUENTES');
    }

  } catch (e) {
    saude.alertas.push(`❌ Erro ao verificar saúde: ${e.message}`);
    saude.problemas.push('ERRO_MONITORIZAÇÃO');
  }

  return saude;
}

async function detectarQueryAssassina(connection) {
  try {
    // Procurar pela query específica que está matando a aplicação
    const queryAssassina = await connection.execute(`
      SELECT 
        sql_id,
        sql_text,
        executions,
        elapsed_time/1000000 as elapsed_seconds,
        cpu_time/1000000 as cpu_seconds,
        last_active_time
      FROM v$sql
      WHERE parsing_user_id = (SELECT user_id FROM all_users WHERE username = 'PCE')
        AND (
          sql_text LIKE '%NVL(f.cdu_csu_enviadomedicid, f.cdu_csu_prescmedicid) AS Artigo%'
          OR sql_text LIKE '%prf_presc_mov_fdet%'
        )
        AND elapsed_time > 10000000  -- >10 segundos
      ORDER BY elapsed_time DESC
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    if (queryAssassina.rows.length > 0) {
      logMonitor('🔴 QUERY ASSASSINA DETECTADA:');
      queryAssassina.rows.forEach((query, idx) => {
        logMonitor(`  ${idx + 1}. SQL_ID: ${query.SQL_ID} - ${query.ELAPSED_SECONDS.toFixed(2)}s`);
        logMonitor(`     Execuções: ${query.EXECUTIONS} | Última: ${query.LAST_ACTIVE_TIME}`);
      });
      return queryAssassina.rows;
    }
    
    return [];
  } catch (e) {
    logMonitor(`Erro ao detectar query assassina: ${e.message}`);
    return [];
  }
}

async function monitorarContinuo() {
  let connection;
  let ciclo = 0;
  
  try {
    try { oracledb.initOracleClient(); } catch (_) {}
    connection = await oracledb.getConnection(dbConfig);
    
    logMonitor('🚀 MONITOR INICIADO - Verificando saúde da aplicação...');
    
    while (true) {
      ciclo++;
      
      try {
        // Verificar saúde geral
        const saude = await verificarSaudeSistema(connection);
        
        // Detectar query assassina
        const queriesAssassinas = await detectarQueryAssassina(connection);
        
        // Log resumido a cada ciclo
        const status = saude.problemas.length > 0 ? '🔴 PROBLEMAS' : '✅ OK';
        logMonitor(`[CICLO ${ciclo}] ${status} | PCE: ${saude.conexoes?.PCE_SESSIONS || '?'} | PGA: ${saude.memoria?.pga_mb || '?'}MB | Queries: ${saude.queries_ativas?.QUERIES_ATIVAS || '?'}`);
        
        // Alertas críticos
        if (saude.alertas.length > 0) {
          saude.alertas.forEach(alerta => logMonitor(alerta));
        }
        
        // Query assassina
        if (queriesAssassinas.length > 0) {
          logMonitor(`🚨 ${queriesAssassinas.length} QUERIES ASSASSINAS ATIVAS!`);
          queriesAssassinas.forEach(q => {
            logMonitor(`   SQL_ID: ${q.SQL_ID} - ${q.ELAPSED_SECONDS.toFixed(2)}s`);
          });
        }
        
        // Detectar mudanças críticas
        if (saude.conexoes) {
          const deltaConexoes = saude.conexoes.PCE_SESSIONS - estadoAnterior.conexoes;
          if (Math.abs(deltaConexoes) > 5) {
            logMonitor(`📊 MUDANÇA CONEXÕES: ${estadoAnterior.conexoes} → ${saude.conexoes.PCE_SESSIONS} (Δ${deltaConexoes})`);
          }
          estadoAnterior.conexoes = saude.conexoes.PCE_SESSIONS;
        }
        
        if (saude.memoria) {
          const deltaMem = saude.memoria.pga_mb - estadoAnterior.memoria;
          if (Math.abs(deltaMem) > 10) {
            logMonitor(`💾 MUDANÇA MEMÓRIA: ${estadoAnterior.memoria}MB → ${saude.memoria.pga_mb}MB (Δ${deltaMem}MB)`);
          }
          estadoAnterior.memoria = saude.memoria.pga_mb;
        }
        
        // Salvar snapshot a cada 10 ciclos
        if (ciclo % 10 === 0) {
          const snapshot = {
            ciclo,
            saude,
            queries_assassinas: queriesAssassinas
          };
          
          fs.writeFileSync(
            path.join(__dirname, `snapshot-${ciclo}.json`),
            JSON.stringify(snapshot, null, 2)
          );
        }
        
        // Aguardar próximo ciclo
        await new Promise(resolve => setTimeout(resolve, CONFIG.INTERVALO_SEGUNDOS * 1000));
        
      } catch (error) {
        logMonitor(`❌ Erro no ciclo ${ciclo}: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5s antes de tentar novamente
      }
    }
    
  } catch (error) {
    logMonitor(`❌ Erro fatal no monitor: ${error.message}`);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
}

// Verificar se deve executar automaticamente
if (process.argv.includes('--auto')) {
  logMonitor('🔧 MODO AUTOMÁTICO - Monitor contínuo iniciado');
  monitorarContinuo();
} else {
  console.log('📋 MONITOR DE APLICAÇÃO DISPONÍVEL');
  console.log('');
  console.log('Para iniciar monitorização contínua:');
  console.log('  node monitor-aplicacao-realtime.js --auto');
  console.log('');
  console.log('O monitor irá:');
  console.log('• Verificar conexões Oracle a cada 10s');
  console.log('• Detectar queries assassinas');
  console.log('• Alertar sobre uso excessivo de memória');
  console.log('• Salvar snapshots para análise posterior');
  console.log('• Criar logs detalhados em monitor-aplicacao.log');
}

module.exports = {
  verificarSaudeSistema,
  detectarQueryAssassina,
  monitorarContinuo
};
