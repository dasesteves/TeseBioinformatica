const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Top medicamentos identificados no diagnóstico anterior
const TOP_MEDICAMENTOS = [
  'FA10047564', // PANTOprazol 20mg - 7080 movimentos
  'FA10027580', // Bisacodilo - 4332 movimentos  
  'FA10025906', // ATORvastatina - 3747 movimentos
  'FA10015285', // Furosemida - 3361 movimentos
  'FA10005729', // Brometo ipratrópio - 2821 movimentos
];

async function testarMedicamentoDetalhado(connection, codigo) {
  console.log(`\n🔍 TESTANDO ${codigo} (medicamento com muitos movimentos):`);
  console.log('-'.repeat(60));
  
  const inicio = Date.now();
  
  // 1. Info básica
  const info = await connection.execute(`
    SELECT codigo, desc_c, stock_atual, afeta_stock, formhosp, e_medc, psico_f, med_alto_risco
    FROM prf_medicamentos 
    WHERE codigo = :codigo
  `, { codigo }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

  if (info.rows.length === 0) {
    console.log('❌ Medicamento não encontrado em PRF_MEDICAMENTOS');
    return null;
  }

  const med = info.rows[0];
  console.log(`📦 ${med.DESC_C}`);
  console.log(`   Stock atual: ${med.STOCK_ATUAL || 'NULL'}`);
  console.log(`   Afeta stock: ${med.AFETA_STOCK}`);
  console.log(`   Alto risco: ${med.MED_ALTO_RISCO || 'NULL'}`);

  // 2. Contar movimentos FDET por período
  console.log('\n📊 MOVIMENTOS PRF_PRESC_MOV_FDET:');
  
  const periodos = [30, 90, 180, 365];
  for (const dias of periodos) {
    const movs = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT numlote) as lotes_unicos,
        SUM(cdu_csu_enviadoquantidade) as quantidade_total,
        COUNT(CASE WHEN numlote IS NULL THEN 1 END) as lotes_null
      FROM prf_presc_mov_fdet
      WHERE nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid) = :codigo
        AND dtmedd = 'MH'
        AND TRUNC(dta_lanca) >= TRUNC(SYSDATE) - :dias
    `, { codigo, dias }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const m = movs.rows[0];
    console.log(`   ${dias} dias: ${m.TOTAL} movs, ${m.LOTES_UNICOS} lotes, ${m.LOTES_NULL} lotes NULL`);
  }

  // 3. Verificar CSU
  const csu = await connection.execute(`
    SELECT COUNT(*) as total
    FROM csu_epentidadeactogastos 
    WHERE cdu_csu_artigo = :codigo
  `, { codigo }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

  console.log(`💰 CSU: ${csu.rows[0].TOTAL} registos`);

  // 4. Testar query com LIMIT
  console.log('\n⚡ TESTE COM LIMIT 1000:');
  const inicioLimit = Date.now();
  
  const movimentosLimit = await connection.execute(`
    SELECT numlote, SUM(cdu_csu_enviadoquantidade) as quantidade,
           TO_CHAR(MAX(dta_lanca), 'YYYY-MM-DD HH24:MI:SS') as data_ult_mov
    FROM (
      SELECT * FROM prf_presc_mov_fdet
      WHERE nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid) = :codigo
        AND dtmedd = 'MH'
        AND TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 180
        AND ROWNUM <= 1000
    )
    GROUP BY numlote
    ORDER BY SUM(cdu_csu_enviadoquantidade) DESC
  `, { codigo }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

  const tempoLimit = Date.now() - inicioLimit;
  console.log(`   Tempo com LIMIT 1000: ${tempoLimit}ms`);
  console.log(`   Lotes retornados: ${movimentosLimit.rows.length}`);

  // 5. Testar query sem LIMIT (original)
  console.log('\n🐌 TESTE SEM LIMIT (original):');
  const inicioOriginal = Date.now();
  
  const movimentosOriginal = await connection.execute(`
    SELECT numlote, SUM(cdu_csu_enviadoquantidade) as quantidade,
           TO_CHAR(MAX(dta_lanca), 'YYYY-MM-DD HH24:MI:SS') as data_ult_mov
    FROM prf_presc_mov_fdet
    WHERE nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid) = :codigo
      AND dtmedd = 'MH'
      AND TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 180
    GROUP BY numlote
    ORDER BY numlote
  `, { codigo }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

  const tempoOriginal = Date.now() - inicioOriginal;
  console.log(`   Tempo sem LIMIT: ${tempoOriginal}ms`);
  console.log(`   Lotes retornados: ${movimentosOriginal.rows.length}`);
  
  const melhoria = tempoOriginal > 0 ? ((tempoOriginal - tempoLimit) / tempoOriginal * 100).toFixed(1) : 0;
  console.log(`   🚀 Melhoria: ${melhoria}% mais rápido com LIMIT`);

  const tempoTotal = Date.now() - inicio;
  console.log(`\n⏱️  Tempo total para ${codigo}: ${tempoTotal}ms`);

  return {
    codigo,
    med,
    tempoLimit,
    tempoOriginal,
    melhoria: parseFloat(melhoria),
    lotesLimit: movimentosLimit.rows.length,
    lotesOriginal: movimentosOriginal.rows.length
  };
}

async function investigarTopMedicamentos() {
  let connection;
  
  try {
    console.log('=======================================================');
    console.log('INVESTIGAÇÃO - TOP MEDICAMENTOS COM MUITOS MOVIMENTOS');
    console.log('=======================================================');
    
    try { oracledb.initOracleClient(); } catch (_) {}
    connection = await oracledb.getConnection(dbConfig);

    const resultados = [];
    
    for (const codigo of TOP_MEDICAMENTOS) {
      const resultado = await testarMedicamentoDetalhado(connection, codigo);
      if (resultado) {
        resultados.push(resultado);
      }
    }

    // Análise final
    console.log('\n=======================================================');
    console.log('RESUMO DAS OTIMIZAÇÕES');
    console.log('=======================================================\n');

    console.log('RESULTADOS LIMIT vs SEM LIMIT:');
    console.log('Código | Tempo Original | Tempo LIMIT | Melhoria | Lotes Orig | Lotes LIMIT');
    console.log('-'.repeat(80));
    
    resultados.forEach(r => {
      console.log(`${r.codigo} | ${String(r.tempoOriginal).padEnd(14)} | ${String(r.tempoLimit).padEnd(11)} | ${String(r.melhoria).padEnd(8)}% | ${String(r.lotesOriginal).padEnd(10)} | ${r.lotesLimit}`);
    });

    const melhoriaMedia = resultados.reduce((acc, r) => acc + r.melhoria, 0) / resultados.length;
    console.log(`\n📈 Melhoria média com LIMIT 1000: ${melhoriaMedia.toFixed(1)}%`);

    console.log('\n🎯 RECOMENDAÇÕES IMPLEMENTAÇÃO:');
    console.log('1. Adicionar LIMIT 1000 na query PRF_PRESC_MOV_FDET');
    console.log('2. Ordenar por quantidade DESC em vez de numlote ASC');
    console.log('3. Implementar paginação para medicamentos com >1000 movimentos');
    console.log('4. Cache específico para FA2* (artigos locais)');
    console.log('5. Timeout de 10s para queries FDET');

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
}

// Executar
investigarTopMedicamentos();
