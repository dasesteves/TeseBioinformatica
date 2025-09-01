const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function investigarProblemasPerformance() {
  let connection;
  
  try {
    console.log('=======================================================');
    console.log('INVESTIGAÇÃO DETALHADA - PROBLEMAS PERFORMANCE');
    console.log('=======================================================\n');
    
    try { oracledb.initOracleClient(); } catch (_) {}
    connection = await oracledb.getConnection(dbConfig);

    // 1. Investigar por que PRF_PRESC_MOV_FDET é sempre lenta (~2s)
    console.log('1. ANÁLISE DA TABELA PRF_PRESC_MOV_FDET:\n');
    
    const estatisticasFDET = await connection.execute(`
      SELECT 
        COUNT(*) as TOTAL_REGISTOS,
        COUNT(DISTINCT nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid)) as MEDICAMENTOS_UNICOS,
        MIN(dta_lanca) as DATA_MAIS_ANTIGA,
        MAX(dta_lanca) as DATA_MAIS_RECENTE,
        COUNT(CASE WHEN dtmedd = 'MH' THEN 1 END) as REGISTOS_MH,
        COUNT(CASE WHEN TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 180 THEN 1 END) as ULTIMOS_180_DIAS
      FROM prf_presc_mov_fdet
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const stats = estatisticasFDET.rows[0];
    console.log(`Total de registos: ${stats.TOTAL_REGISTOS.toLocaleString()}`);
    console.log(`Medicamentos únicos: ${stats.MEDICAMENTOS_UNICOS.toLocaleString()}`);
    console.log(`Período: ${stats.DATA_MAIS_ANTIGA} → ${stats.DATA_MAIS_RECENTE}`);
    console.log(`Registos MH: ${stats.REGISTOS_MH.toLocaleString()}`);
    console.log(`Últimos 180 dias: ${stats.ULTIMOS_180_DIAS.toLocaleString()}`);

    // 2. Verificar índices existentes
    console.log('\n2. ÍNDICES NA TABELA PRF_PRESC_MOV_FDET:\n');
    
    const indices = await connection.execute(`
      SELECT 
        i.index_name,
        i.uniqueness,
        LISTAGG(ic.column_name, ', ') WITHIN GROUP (ORDER BY ic.column_position) as colunas
      FROM all_indexes i
      JOIN all_ind_columns ic ON i.index_name = ic.index_name AND i.owner = ic.index_owner
      WHERE i.table_name = 'PRF_PRESC_MOV_FDET' AND i.owner = 'PCE'
      GROUP BY i.index_name, i.uniqueness
      ORDER BY i.index_name
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    if (indices.rows.length > 0) {
      console.log('Índices encontrados:');
      indices.rows.forEach(idx => {
        console.log(`  ${idx.INDEX_NAME} (${idx.UNIQUENESS}): ${idx.COLUNAS}`);
      });
    } else {
      console.log('❌ PROBLEMA: Nenhum índice encontrado!');
    }

    // 3. Investigar valores NULL problemáticos
    console.log('\n3. ANÁLISE DE VALORES NULL PROBLEMÁTICOS:\n');
    
    const nullAnalysis = await connection.execute(`
      SELECT 
        'PRF_MEDICAMENTOS' as tabela,
        COUNT(CASE WHEN stock_atual IS NULL THEN 1 END) as stock_null,
        COUNT(CASE WHEN desc_c IS NULL THEN 1 END) as desc_null,
        COUNT(CASE WHEN afeta_stock IS NULL THEN 1 END) as afeta_stock_null,
        COUNT(*) as total
      FROM prf_medicamentos
      WHERE codigo LIKE 'FA%'
      
      UNION ALL
      
      SELECT 
        'PRF_PRESC_MOV_FDET' as tabela,
        COUNT(CASE WHEN cdu_csu_enviadoquantidade IS NULL THEN 1 END) as quantidade_null,
        COUNT(CASE WHEN numlote IS NULL THEN 1 END) as lote_null,
        COUNT(CASE WHEN dta_lanca IS NULL THEN 1 END) as data_null,
        COUNT(*) as total
      FROM prf_presc_mov_fdet
      WHERE TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 30
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    console.log('Análise de NULLs:');
    nullAnalysis.rows.forEach(row => {
      console.log(`${row.TABELA}:`);
      Object.keys(row).forEach(key => {
        if (key !== 'TABELA' && key !== 'TOTAL') {
          const pct = row.TOTAL > 0 ? ((row[key] / row.TOTAL) * 100).toFixed(1) : 0;
          console.log(`  ${key}: ${row[key]} (${pct}%)`);
        }
      });
      console.log(`  Total: ${row.TOTAL.toLocaleString()}\n`);
    });

    // 4. Investigar diferenças FA1* vs FA2*
    console.log('4. COMPARAÇÃO FA1* vs FA2*:\n');
    
    const comparacao = await connection.execute(`
      SELECT 
        CASE 
          WHEN codigo LIKE 'FA1%' THEN 'FA1_MEDICAMENTOS'
          WHEN codigo LIKE 'FA2%' THEN 'FA2_LOCAIS'
          ELSE 'OUTROS'
        END as tipo,
        COUNT(*) as total_prf,
        COUNT(CASE WHEN stock_atual IS NOT NULL THEN 1 END) as com_stock,
        AVG(stock_atual) as stock_medio,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM medh_caracterizacao_v2 m WHERE m.fa_cod = p.codigo
        ) THEN 1 END) as com_medh,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM csu_epentidadeactogastos c WHERE c.cdu_csu_artigo = p.codigo
        ) THEN 1 END) as com_csu
      FROM prf_medicamentos p
      WHERE codigo LIKE 'FA%'
      GROUP BY CASE 
        WHEN codigo LIKE 'FA1%' THEN 'FA1_MEDICAMENTOS'
        WHEN codigo LIKE 'FA2%' THEN 'FA2_LOCAIS'
        ELSE 'OUTROS'
      END
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    console.log('Tipo | Total PRF | Com Stock | Stock Médio | Com MEDH | Com CSU');
    console.log('-'.repeat(70));
    comparacao.rows.forEach(row => {
      const stockMedio = row.STOCK_MEDIO ? row.STOCK_MEDIO.toFixed(1) : 'N/A';
      console.log(`${row.TIPO.padEnd(15)} | ${String(row.TOTAL_PRF).padEnd(9)} | ${String(row.COM_STOCK).padEnd(9)} | ${stockMedio.padEnd(11)} | ${String(row.COM_MEDH).padEnd(8)} | ${row.COM_CSU}`);
    });

    // 5. Investigar medicamentos com mais movimentos FDET
    console.log('\n5. TOP MEDICAMENTOS COM MAIS MOVIMENTOS (ÚLTIMOS 180 DIAS):\n');
    
    const topMovimentos = await connection.execute(`
      SELECT * FROM (
        SELECT 
          nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid) as codigo,
          COUNT(*) as total_movimentos,
          COUNT(DISTINCT numlote) as lotes_diferentes,
          SUM(cdu_csu_enviadoquantidade) as quantidade_total,
          (SELECT desc_c FROM prf_medicamentos WHERE codigo = nvl(f.cdu_csu_enviadomedicid, f.cdu_csu_prescmedicid)) as descricao
        FROM prf_presc_mov_fdet f
        WHERE dtmedd = 'MH'
          AND TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 180
          AND nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid) IS NOT NULL
        GROUP BY nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid)
        ORDER BY COUNT(*) DESC
      ) WHERE ROWNUM <= 10
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    console.log('Código | Movimentos | Lotes | Qtd Total | Descrição');
    console.log('-'.repeat(80));
    topMovimentos.rows.forEach(row => {
      const desc = (row.DESCRICAO || 'N/A').substring(0, 30);
      console.log(`${row.CODIGO} | ${String(row.TOTAL_MOVIMENTOS).padEnd(10)} | ${String(row.LOTES_DIFERENTES).padEnd(5)} | ${String(row.QUANTIDADE_TOTAL || 0).padEnd(9)} | ${desc}`);
    });

    // 6. Verificar conexões ativas
    console.log('\n6. VERIFICAR ESTADO DAS CONEXÕES:\n');
    
    try {
      const conexoes = await connection.execute(`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_sessions,
          COUNT(CASE WHEN username = 'PCE' THEN 1 END) as pce_sessions
        FROM v$session
      `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

      const sess = conexoes.rows[0];
      console.log(`Total de sessões: ${sess.TOTAL_SESSIONS}`);
      console.log(`Sessões ativas: ${sess.ACTIVE_SESSIONS}`);
      console.log(`Sessões PCE: ${sess.PCE_SESSIONS}`);
    } catch (e) {
      console.log('⚠️  Sem permissões para verificar sessões');
    }

    // 7. Propor otimizações específicas
    console.log('\n7. OTIMIZAÇÕES PROPOSTAS:\n');
    
    // Verificar se seria útil um índice composto
    const indexSuggestion = await connection.execute(`
      SELECT COUNT(*) as total_queries_periodo
      FROM prf_presc_mov_fdet
      WHERE dtmedd = 'MH' 
        AND TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 180
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    console.log('RECOMENDAÇÕES ESPECÍFICAS:');
    console.log(`• Criar índice composto: (DTMEDD, DTA_LANCA, CDU_CSU_ENVIADOMEDICID)`);
    console.log(`• Período atual filtra ${indexSuggestion.rows[0].TOTAL_QUERIES_PERIODO.toLocaleString()} registos de ${stats.TOTAL_REGISTOS.toLocaleString()}`);
    console.log(`• Implementar LIMIT 1000 para medicamentos com muitos movimentos`);
    console.log(`• Cache agressivo para FA2* (artigos locais raramente mudam)`);
    console.log(`• AbortController já implementado ✓`);

    console.log('\n✅ INVESTIGAÇÃO CONCLUÍDA');

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
}

// Executar
investigarProblemasPerformance();
