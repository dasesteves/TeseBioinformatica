const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Lista de endpoints da farmácia para testar
const ENDPOINTS_FARMACIA = [
  '/api/farmacia/verificarStock',
  '/api/farmacia/stock-critico',
  '/api/farmacia/medicamentos/autocomplete',
  '/api/farmacia/lista-zero',
  '/api/farmacia/medicamentos/medh',
  '/api/farmacia/movimentos',
  '/api/farmacia/agenda'
];

async function diagnosticoCompleto() {
  let connection;
  
  try {
    console.log('=======================================================');
    console.log('DIAGNÓSTICO COMPLETO - CRASH DA APLICAÇÃO FARMÁCIA');
    console.log('=======================================================\n');
    
    try { oracledb.initOracleClient(); } catch (_) {}
    connection = await oracledb.getConnection(dbConfig);
    
    const relatorio = {
      timestamp: new Date().toISOString(),
      problemas_identificados: [],
      hipoteses_crash: [],
      recomendacoes: [],
      estatisticas_bd: {},
      conexoes_ativas: null,
      memoria_oracle: null,
      locks_detectados: [],
      queries_lentas: []
    };

    // 1. ANÁLISE DO POOL DE CONEXÕES
    console.log('1. ANÁLISE DO POOL DE CONEXÕES ORACLE:\n');
    
    try {
      const poolStats = await connection.execute(`
        SELECT 
          COUNT(*) as TOTAL_SESSIONS,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as ACTIVE_SESSIONS,
          COUNT(CASE WHEN username = 'PCE' THEN 1 END) as PCE_SESSIONS,
          COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as INACTIVE_SESSIONS,
          COUNT(CASE WHEN lockwait IS NOT NULL THEN 1 END) as WAITING_LOCKS
        FROM v$session
      `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

      const stats = poolStats.rows[0];
      relatorio.conexoes_ativas = stats;
      
      console.log(`Total de sessões: ${stats.TOTAL_SESSIONS}`);
      console.log(`Sessões ativas: ${stats.ACTIVE_SESSIONS}`);
      console.log(`Sessões PCE: ${stats.PCE_SESSIONS}`);
      console.log(`Sessões inativas: ${stats.INACTIVE_SESSIONS}`);
      console.log(`Sessões esperando locks: ${stats.WAITING_LOCKS}`);
      
      if (stats.PCE_SESSIONS > 50) {
        relatorio.problemas_identificados.push('EXCESSO_CONEXOES_PCE');
        relatorio.hipoteses_crash.push('Pool de conexões esgotado - muitas conexões PCE ativas');
      }
      
      if (stats.WAITING_LOCKS > 0) {
        relatorio.problemas_identificados.push('LOCKS_DETECTADOS');
        relatorio.hipoteses_crash.push('Deadlocks ou locks prolongados bloqueando queries');
      }
      
    } catch (e) {
      console.log('⚠️  Sem permissões para v$session - usando métodos alternativos');
      relatorio.problemas_identificados.push('SEM_PERMISSOES_VDOLLAR');
    }

    // 2. ANÁLISE DE MEMÓRIA ORACLE
    console.log('\n2. ANÁLISE DE MEMÓRIA ORACLE:\n');
    
    try {
      const memoriaOracle = await connection.execute(`
        SELECT name, value 
        FROM v$mystat s, v$statname n 
        WHERE s.statistic# = n.statistic# 
          AND n.name IN ('session pga memory', 'session pga memory max', 'session uga memory')
      `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      
      const memoria = {};
      memoriaOracle.rows.forEach(row => {
        memoria[row.NAME] = parseInt(row.VALUE);
      });
      
      relatorio.memoria_oracle = memoria;
      
      console.log(`PGA Memory: ${Math.round(memoria['session pga memory']/1024/1024)}MB`);
      console.log(`PGA Max: ${Math.round(memoria['session pga memory max']/1024/1024)}MB`);
      console.log(`UGA Memory: ${Math.round((memoria['session uga memory'] || 0)/1024/1024)}MB`);
      
      if (memoria['session pga memory'] > 100 * 1024 * 1024) { // >100MB
        relatorio.problemas_identificados.push('MEMORIA_ORACLE_ALTA');
        relatorio.hipoteses_crash.push('Consumo excessivo de memória Oracle por sessão');
      }
      
    } catch (e) {
      console.log('⚠️  Sem permissões para estatísticas de memória');
    }

    // 3. ANÁLISE DE LOCKS E QUERIES BLOQUEADAS
    console.log('\n3. ANÁLISE DE LOCKS E QUERIES BLOQUEADAS:\n');
    
    try {
      const locks = await connection.execute(`
        SELECT 
          s.sid,
          s.serial#,
          s.username,
          s.program,
          s.machine,
          s.status,
          s.sql_id,
          l.type,
          l.lmode,
          l.request
        FROM v$session s
        JOIN v$lock l ON s.sid = l.sid
        WHERE s.username = 'PCE'
          AND l.type IN ('TX', 'TM', 'UL')
        ORDER BY s.sid
      `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      
      if (locks.rows.length > 0) {
        console.log(`🔒 LOCKS DETECTADOS: ${locks.rows.length}`);
        locks.rows.forEach(lock => {
          console.log(`  SID ${lock.SID}: ${lock.TYPE} lock (${lock.LMODE}/${lock.REQUEST}) - ${lock.PROGRAM}`);
        });
        relatorio.locks_detectados = locks.rows;
        relatorio.problemas_identificados.push('LOCKS_ATIVAS');
      } else {
        console.log('✅ Nenhum lock problemático detectado');
      }
      
    } catch (e) {
      console.log('⚠️  Sem permissões para v$lock');
    }

    // 4. ANÁLISE DE QUERIES LENTAS RECENTES
    console.log('\n4. ANÁLISE DE QUERIES LENTAS RECENTES:\n');
    
    try {
      const queriesLentas = await connection.execute(`
        SELECT 
          sql_id,
          sql_text,
          executions,
          elapsed_time/1000000 as elapsed_seconds,
          cpu_time/1000000 as cpu_seconds,
          disk_reads,
          buffer_gets,
          rows_processed
        FROM v$sql
        WHERE parsing_user_id = (SELECT user_id FROM all_users WHERE username = 'PCE')
          AND elapsed_time > 5000000  -- >5 segundos
          AND executions > 0
        ORDER BY elapsed_time DESC
        FETCH FIRST 10 ROWS ONLY
      `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      
      if (queriesLentas.rows.length > 0) {
        console.log('🐌 QUERIES LENTAS DETECTADAS:');
        queriesLentas.rows.forEach((query, idx) => {
          console.log(`  ${idx + 1}. SQL_ID: ${query.SQL_ID}`);
          console.log(`     Tempo: ${query.ELAPSED_SECONDS.toFixed(2)}s | CPU: ${query.CPU_SECONDS.toFixed(2)}s`);
          console.log(`     Execuções: ${query.EXECUTIONS} | Rows: ${query.ROWS_PROCESSED}`);
          console.log(`     SQL: ${query.SQL_TEXT.substring(0, 100)}...`);
          console.log('');
        });
        relatorio.queries_lentas = queriesLentas.rows;
        relatorio.problemas_identificados.push('QUERIES_LENTAS_RECORRENTES');
      } else {
        console.log('✅ Nenhuma query lenta detectada recentemente');
      }
      
    } catch (e) {
      console.log('⚠️  Sem permissões para v$sql');
    }

    // 5. ANÁLISE DA TABELA PRF_PRESC_MOV_FDET (principal suspeita)
    console.log('\n5. ANÁLISE DETALHADA PRF_PRESC_MOV_FDET:\n');
    
    const fdetStats = await connection.execute(`
      SELECT 
        COUNT(*) as TOTAL_REGISTOS,
        COUNT(CASE WHEN TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 1 THEN 1 END) as HOJE,
        COUNT(CASE WHEN TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 7 THEN 1 END) as ULTIMOS_7_DIAS,
        COUNT(CASE WHEN TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 30 THEN 1 END) as ULTIMOS_30_DIAS,
        COUNT(CASE WHEN numlote IS NULL THEN 1 END) as LOTES_NULL,
        COUNT(DISTINCT nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid)) as MEDICAMENTOS_UNICOS,
        MIN(dta_lanca) as DATA_MAIS_ANTIGA,
        MAX(dta_lanca) as DATA_MAIS_RECENTE
      FROM prf_presc_mov_fdet
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const fdet = fdetStats.rows[0];
    relatorio.estatisticas_bd.prf_presc_mov_fdet = fdet;
    
    console.log(`Total de registos: ${fdet.TOTAL_REGISTOS.toLocaleString()}`);
    console.log(`Hoje: ${fdet.HOJE.toLocaleString()}`);
    console.log(`Últimos 7 dias: ${fdet.ULTIMOS_7_DIAS.toLocaleString()}`);
    console.log(`Últimos 30 dias: ${fdet.ULTIMOS_30_DIAS.toLocaleString()}`);
    console.log(`Lotes NULL: ${fdet.LOTES_NULL.toLocaleString()} (${(fdet.LOTES_NULL/fdet.TOTAL_REGISTOS*100).toFixed(1)}%)`);
    console.log(`Medicamentos únicos: ${fdet.MEDICAMENTOS_UNICOS.toLocaleString()}`);
    
    if (fdet.TOTAL_REGISTOS > 2000000) {
      relatorio.problemas_identificados.push('TABELA_FDET_MUITO_GRANDE');
      relatorio.hipoteses_crash.push('Tabela PRF_PRESC_MOV_FDET com >2M registos causa queries lentas');
    }
    
    if (fdet.LOTES_NULL / fdet.TOTAL_REGISTOS > 0.8) {
      relatorio.problemas_identificados.push('MUITOS_LOTES_NULL');
      relatorio.hipoteses_crash.push('84% dos lotes são NULL, causando GROUP BY ineficiente');
    }

    // 6. ANÁLISE DE CRESCIMENTO DA TABELA
    console.log('\n6. ANÁLISE DE CRESCIMENTO DA TABELA FDET:\n');
    
    const crescimento = await connection.execute(`
      SELECT 
        TO_CHAR(dta_lanca, 'YYYY-MM') as MES,
        COUNT(*) as REGISTOS_MES,
        COUNT(DISTINCT nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid)) as MEDICAMENTOS_MES
      FROM prf_presc_mov_fdet
      WHERE dta_lanca >= ADD_MONTHS(SYSDATE, -6)
      GROUP BY TO_CHAR(dta_lanca, 'YYYY-MM')
      ORDER BY MES DESC
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    console.log('Crescimento mensal (últimos 6 meses):');
    console.log('Mês | Registos | Medicamentos');
    console.log('-'.repeat(40));
    crescimento.rows.forEach(row => {
      console.log(`${row.MES} | ${row.REGISTOS_MES.toLocaleString().padEnd(8)} | ${row.MEDICAMENTOS_MES}`);
    });
    
    relatorio.estatisticas_bd.crescimento_mensal = crescimento.rows;

    // 7. ANÁLISE DE MEDICAMENTOS PROBLEMÁTICOS
    console.log('\n7. MEDICAMENTOS COM MAIS MOVIMENTOS (POTENCIAIS CAUSADORES):\n');
    
    const medicamentosProblematicos = await connection.execute(`
      SELECT * FROM (
        SELECT 
          nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid) as codigo,
          COUNT(*) as total_movimentos,
          COUNT(DISTINCT numlote) as lotes_diferentes,
          (SELECT desc_c FROM prf_medicamentos WHERE codigo = nvl(f.cdu_csu_enviadomedicid, f.cdu_csu_prescmedicid)) as descricao
        FROM prf_presc_mov_fdet f
        WHERE dtmedd = 'MH'
          AND TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 180
        GROUP BY nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid)
        ORDER BY COUNT(*) DESC
      ) WHERE ROWNUM <= 15
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    console.log('TOP 15 medicamentos com mais movimentos:');
    console.log('Código | Movimentos | Lotes | Descrição');
    console.log('-'.repeat(80));
    medicamentosProblematicos.rows.forEach(row => {
      const desc = (row.DESCRICAO || 'N/A').substring(0, 30);
      console.log(`${row.CODIGO} | ${String(row.TOTAL_MOVIMENTOS).padEnd(10)} | ${String(row.LOTES_DIFERENTES).padEnd(5)} | ${desc}`);
      
      if (row.TOTAL_MOVIMENTOS > 5000) {
        relatorio.problemas_identificados.push(`MEDICAMENTO_MUITOS_MOVIMENTOS_${row.CODIGO}`);
      }
    });
    
    relatorio.estatisticas_bd.medicamentos_problematicos = medicamentosProblematicos.rows;

    // 8. ANÁLISE DE ÍNDICES CRÍTICOS
    console.log('\n8. ANÁLISE DE ÍNDICES CRÍTICOS:\n');
    
    const indices = await connection.execute(`
      SELECT 
        i.table_name,
        i.index_name,
        i.uniqueness,
        i.status,
        LISTAGG(ic.column_name, ', ') WITHIN GROUP (ORDER BY ic.column_position) as colunas
      FROM all_indexes i
      JOIN all_ind_columns ic ON i.index_name = ic.index_name AND i.owner = ic.index_owner
      WHERE i.table_name IN ('PRF_PRESC_MOV_FDET', 'PRF_MEDICAMENTOS', 'CSU_EPENTIDADEACTOGASTOS')
        AND i.owner = 'PCE'
      GROUP BY i.table_name, i.index_name, i.uniqueness, i.status
      ORDER BY i.table_name, i.index_name
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    console.log('Índices nas tabelas críticas:');
    indices.rows.forEach(idx => {
      const status = idx.STATUS === 'VALID' ? '✅' : '❌';
      console.log(`${status} ${idx.TABLE_NAME}.${idx.INDEX_NAME}: ${idx.COLUNAS}`);
    });
    
    relatorio.estatisticas_bd.indices_criticos = indices.rows;

    // 9. VERIFICAR TABLESPACES E ESPAÇO EM DISCO
    console.log('\n9. ANÁLISE DE TABLESPACES:\n');
    
    try {
      const tablespaces = await connection.execute(`
        SELECT 
          tablespace_name,
          ROUND(SUM(bytes)/1024/1024/1024, 2) as size_gb,
          ROUND(SUM(maxbytes)/1024/1024/1024, 2) as max_size_gb,
          COUNT(*) as datafiles
        FROM dba_data_files
        WHERE tablespace_name IN (
          SELECT DISTINCT tablespace_name 
          FROM dba_tables 
          WHERE owner = 'PCE' 
            AND table_name IN ('PRF_PRESC_MOV_FDET', 'PRF_MEDICAMENTOS', 'CSU_EPENTIDADEACTOGASTOS')
        )
        GROUP BY tablespace_name
      `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      
      console.log('Tablespaces das tabelas críticas:');
      tablespaces.rows.forEach(ts => {
        const pctUsed = ts.MAX_SIZE_GB > 0 ? (ts.SIZE_GB / ts.MAX_SIZE_GB * 100).toFixed(1) : 'N/A';
        console.log(`${ts.TABLESPACE_NAME}: ${ts.SIZE_GB}GB/${ts.MAX_SIZE_GB}GB (${pctUsed}%)`);
        
        if (parseFloat(pctUsed) > 90) {
          relatorio.problemas_identificados.push(`TABLESPACE_${ts.TABLESPACE_NAME}_CHEIO`);
        }
      });
      
      relatorio.estatisticas_bd.tablespaces = tablespaces.rows;
      
    } catch (e) {
      console.log('⚠️  Sem permissões para DBA_DATA_FILES');
    }

    // 10. TESTAR QUERIES ESPECÍFICAS QUE CAUSAM PROBLEMAS
    console.log('\n10. TESTE DE QUERIES PROBLEMÁTICAS:\n');
    
    const queriesProblematicas = [
      {
        nome: 'FDET_SEM_LIMIT',
        sql: `SELECT COUNT(*) FROM prf_presc_mov_fdet WHERE nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid) = 'FA10002829' AND dtmedd = 'MH' AND TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 180`,
        timeout: 10000
      },
      {
        nome: 'AUTOCOMPLETE_PESADO',
        sql: `SELECT COUNT(*) FROM prf_medicamentos WHERE UPPER(desc_c) LIKE UPPER('%para%')`,
        timeout: 5000
      },
      {
        nome: 'STOCK_CRITICO_FULL',
        sql: `SELECT COUNT(*) FROM prf_medicamentos WHERE stock_atual < 100`,
        timeout: 5000
      }
    ];
    
    for (const query of queriesProblematicas) {
      const inicio = Date.now();
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT')), query.timeout)
        );
        
        const queryPromise = connection.execute(query.sql);
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        const tempo = Date.now() - inicio;
        console.log(`✅ ${query.nome}: ${tempo}ms`);
        
        if (tempo > query.timeout * 0.8) {
          relatorio.problemas_identificados.push(`QUERY_LENTA_${query.nome}`);
        }
        
      } catch (error) {
        const tempo = Date.now() - inicio;
        console.log(`❌ ${query.nome}: TIMEOUT após ${tempo}ms`);
        relatorio.problemas_identificados.push(`QUERY_TIMEOUT_${query.nome}`);
      }
    }

    // 11. ANÁLISE DE PADRÕES DE USO
    console.log('\n11. ANÁLISE DE PADRÕES DE USO:\n');
    
    const padroesUso = await connection.execute(`
      SELECT 
        TO_CHAR(dta_lanca, 'HH24') as hora,
        COUNT(*) as total_movimentos,
        COUNT(DISTINCT nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid)) as medicamentos_diferentes
      FROM prf_presc_mov_fdet
      WHERE TRUNC(dta_lanca) = TRUNC(SYSDATE)
      GROUP BY TO_CHAR(dta_lanca, 'HH24')
      ORDER BY hora
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    console.log('Padrão de uso hoje (por hora):');
    console.log('Hora | Movimentos | Medicamentos');
    console.log('-'.repeat(35));
    padroesUso.rows.forEach(row => {
      console.log(`${row.HORA}h  | ${String(row.TOTAL_MOVIMENTOS).padEnd(10)} | ${row.MEDICAMENTOS_DIFERENTES}`);
    });
    
    relatorio.estatisticas_bd.padroes_uso_horario = padroesUso.rows;

    // 12. VERIFICAR CONFIGURAÇÃO DO POOL DE CONEXÕES
    console.log('\n12. CONFIGURAÇÃO DO POOL DE CONEXÕES:\n');
    
    try {
      const poolConfig = await connection.execute(`
        SELECT 
          name,
          value
        FROM v$parameter
        WHERE name IN ('processes', 'sessions', 'open_cursors', 'pga_aggregate_target', 'sga_target')
      `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      
      console.log('Configuração Oracle:');
      poolConfig.rows.forEach(param => {
        console.log(`${param.NAME}: ${param.VALUE}`);
      });
      
      relatorio.estatisticas_bd.configuracao_oracle = poolConfig.rows;
      
    } catch (e) {
      console.log('⚠️  Sem permissões para v$parameter');
    }

    // 13. ANÁLISE DE HIPÓTESES ESPECÍFICAS
    console.log('\n13. ANÁLISE DE HIPÓTESES ESPECÍFICAS:\n');
    
    // Hipótese 1: Cache do middleware crescendo
    console.log('HIPÓTESE 1: Cache do middleware');
    console.log(`- tokenCache no middleware pode acumular tokens`);
    console.log(`- TTL de 12 horas pode ser muito longo`);
    console.log(`- Limpeza a cada 60s pode não ser suficiente`);
    
    // Hipótese 2: AbortController não está funcionando
    console.log('\nHIPÓTESE 2: AbortController');
    console.log(`- Requests cancelados podem não estar sendo limpos`);
    console.log(`- Promises podem estar vazando memória`);
    console.log(`- useEffect cleanup pode estar falhando`);
    
    // Hipótese 3: Pool de conexões Oracle
    console.log('\nHIPÓTESE 3: Pool de conexões Oracle');
    console.log(`- Conexões não sendo devolvidas ao pool`);
    console.log(`- Pool esgotado após múltiplas consultas`);
    console.log(`- Timeout de conexões muito baixo`);
    
    // Hipótese 4: Vazamento de memória React
    console.log('\nHIPÓTESE 4: Vazamento de memória React');
    console.log(`- Estados não sendo limpos no useEffect`);
    console.log(`- Event listeners não removidos`);
    console.log(`- Closures capturando objetos grandes`);
    
    // Hipótese 5: Next.js cache interno
    console.log('\nHIPÓTESE 5: Next.js cache interno');
    console.log(`- Cache de API routes acumulando`);
    console.log(`- Webpack HMR causando vazamentos`);
    console.log(`- SSR/SSG cache crescendo`);

    // 14. COMPILAR TODAS AS HIPÓTESES
    relatorio.hipoteses_crash = [
      ...relatorio.hipoteses_crash,
      'Cache do middleware tokenCache crescendo descontroladamente',
      'AbortController não cancelando requests corretamente',
      'Pool de conexões Oracle esgotado (>50 conexões PCE ativas)',
      'Vazamento de memória em React hooks (useEffect sem cleanup)',
      'Next.js cache interno acumulando dados de API routes',
      'Queries PRF_PRESC_MOV_FDET sem LIMIT causando OOM',
      'Event listeners não removidos em componentes desmontados',
      'Promises não resolvidas acumulando na memória',
      'Oracle PGA memory >100MB por sessão',
      'Tablespace cheio causando falhas silenciosas',
      'Locks prolongados bloqueando novas conexões',
      'Webpack HMR em desenvolvimento causando vazamentos',
      'Cache LRU do autocomplete crescendo indefinidamente',
      'Estados React não sendo limpos entre modais',
      'Conexões Oracle não sendo fechadas corretamente'
    ];

    // 15. RECOMENDAÇÕES IMEDIATAS
    relatorio.recomendacoes = [
      'Reduzir TTL do tokenCache de 12h para 30min',
      'Adicionar logs de debug em todos os componentes críticos',
      'Implementar monitorização de memória em tempo real',
      'Adicionar timeout agressivo em todas as queries (5-10s)',
      'Implementar limpeza forçada de cache no modal',
      'Verificar pool de conexões Oracle (max connections)',
      'Adicionar AbortController em todos os fetch()',
      'Implementar useEffect cleanup em todos os hooks',
      'Adicionar logs de conexões Oracle (open/close)',
      'Implementar circuit breaker para queries problemáticas',
      'Adicionar monitorização de memória Node.js',
      'Implementar restart automático em caso de OOM',
      'Adicionar logs de performance em middleware',
      'Implementar cache LRU com limite máximo de entradas',
      'Adicionar timeout global para todas as APIs farmácia'
    ];

    // Salvar relatório completo
    fs.writeFileSync(
      path.join(__dirname, 'RELATORIO_CRASH_COMPLETO.json'),
      JSON.stringify(relatorio, null, 2)
    );

    console.log('\n=======================================================');
    console.log('RESUMO DO DIAGNÓSTICO');
    console.log('=======================================================\n');
    
    console.log(`📊 PROBLEMAS IDENTIFICADOS: ${relatorio.problemas_identificados.length}`);
    relatorio.problemas_identificados.forEach((problema, idx) => {
      console.log(`  ${idx + 1}. ${problema}`);
    });
    
    console.log(`\n🔍 HIPÓTESES DE CRASH: ${relatorio.hipoteses_crash.length}`);
    relatorio.hipoteses_crash.forEach((hipotese, idx) => {
      console.log(`  ${idx + 1}. ${hipotese}`);
    });
    
    console.log(`\n💡 RECOMENDAÇÕES: ${relatorio.recomendacoes.length}`);
    relatorio.recomendacoes.slice(0, 5).forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });
    
    console.log('\n✅ RELATÓRIO COMPLETO SALVO EM: RELATORIO_CRASH_COMPLETO.json');

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
}

// Executar
diagnosticoCompleto();
