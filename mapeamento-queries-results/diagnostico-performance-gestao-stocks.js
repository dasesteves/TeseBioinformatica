const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Códigos FA para testar (variados)
const CODIGOS_TESTE = [
  // FA1* - medicamentos principais
  'FA10002829', // Paracetamol - extremo movimentos
  'FA10059004', // Pantoprazol 40mg - poucos movimentos  
  'FA10047564', // Pantoprazol 20mg - muitos movimentos
  'FA10005405', // Cloreto sódio - funciona bem
  'FA10104168', // Colagenase - sem movimentos
  'FA10040790', // Macrogol - problema conhecido
  
  // FA2* - artigos locais/personalizados
  'FA20000024', // Álcool isopropílico - sem movimentos
  'FA20000036', // Álcool etílico - tem CSU mas sem movimentos FDET
  'FA20000001', // Teste - pode não existir
  'FA20000050', // Teste - pode não existir
  
  // Códigos edge cases
  'FA10001001', // Não existe
  'FA10999999', // Não existe
  'FA11000000', // Fora do range
];

async function medirTempoQuery(connection, sql, binds = {}) {
  const inicio = Date.now();
  try {
    const result = await connection.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const tempo = Date.now() - inicio;
    return { sucesso: true, tempo, rows: result.rows?.length || 0, dados: result.rows };
  } catch (error) {
    const tempo = Date.now() - inicio;
    return { sucesso: false, tempo, erro: error.message };
  }
}

async function analisarMedicamento(connection, codigo, sequencia) {
  console.log(`\n${sequencia}. ANALISANDO ${codigo}:`);
  console.log('-'.repeat(50));
  
  const resultado = {
    codigo,
    sequencia,
    tempos: {},
    problemas: [],
    dados: {},
    memoria: null
  };

  // 1. Info básica PRF_MEDICAMENTOS
  console.log('   📦 PRF_MEDICAMENTOS...');
  const sqlInfo = `
    SELECT codigo, desc_c, stock_atual, afeta_stock, formhosp, e_medc
    FROM prf_medicamentos 
    WHERE codigo = :codigo`;
  
  const resInfo = await medirTempoQuery(connection, sqlInfo, { codigo });
  resultado.tempos.prf_info = resInfo.tempo;
  
  if (resInfo.sucesso && resInfo.dados?.length > 0) {
    resultado.dados.prf = resInfo.dados[0];
    console.log(`      ✓ ${resInfo.tempo}ms - ${resultado.dados.prf.DESC_C}`);
  } else {
    resultado.problemas.push('NAO_EXISTE_PRF');
    console.log(`      ❌ ${resInfo.tempo}ms - Não encontrado`);
  }

  // 2. MEDH metadata
  console.log('   🏥 MEDH_CARACTERIZACAO_V2...');
  const sqlMedh = `
    SELECT fa_cod, nome_ext, dci_id, codigo_atc_id, gft_id
    FROM medh_caracterizacao_v2 
    WHERE fa_cod = :codigo`;
  
  const resMedh = await medirTempoQuery(connection, sqlMedh, { codigo });
  resultado.tempos.medh = resMedh.tempo;
  
  if (resMedh.sucesso && resMedh.dados?.length > 0) {
    resultado.dados.medh = resMedh.dados[0];
    console.log(`      ✓ ${resMedh.tempo}ms - ${resultado.dados.medh.NOME_EXT}`);
  } else {
    resultado.problemas.push('NAO_EXISTE_MEDH');
    console.log(`      ❌ ${resMedh.tempo}ms - Não encontrado`);
  }

  // 3. Movimentos PRF_PRESC_MOV_FDET (período 180 dias)
  console.log('   📊 PRF_PRESC_MOV_FDET...');
  const sqlMovimentos = `
    SELECT numlote, SUM(cdu_csu_enviadoquantidade) as quantidade,
           TO_CHAR(MAX(dta_lanca), 'YYYY-MM-DD HH24:MI:SS') as data_ult_mov
    FROM prf_presc_mov_fdet
    WHERE nvl(cdu_csu_enviadomedicid, cdu_csu_prescmedicid) = :codigo
      AND dtmedd = 'MH'
      AND TRUNC(dta_lanca) >= TRUNC(SYSDATE) - 180
    GROUP BY numlote
    ORDER BY numlote`;
  
  const resMovimentos = await medirTempoQuery(connection, sqlMovimentos, { codigo });
  resultado.tempos.movimentos_fdet = resMovimentos.tempo;
  
  if (resMovimentos.sucesso) {
    resultado.dados.movimentos_fdet = resMovimentos.rows;
    console.log(`      ✓ ${resMovimentos.tempo}ms - ${resMovimentos.rows} movimentos`);
    if (resMovimentos.tempo > 5000) {
      resultado.problemas.push('MOVIMENTOS_LENTA');
    }
  } else {
    resultado.problemas.push('ERRO_MOVIMENTOS_FDET');
    console.log(`      ❌ ${resMovimentos.tempo}ms - ${resMovimentos.erro}`);
  }

  // 4. CSU_EPENTIDADEACTOGASTOS
  console.log('   💰 CSU_EPENTIDADEACTOGASTOS...');
  const sqlCSU = `
    SELECT COUNT(*) as total
    FROM csu_epentidadeactogastos 
    WHERE cdu_csu_artigo = :codigo`;
  
  const resCSU = await medirTempoQuery(connection, sqlCSU, { codigo });
  resultado.tempos.csu = resCSU.tempo;
  
  if (resCSU.sucesso) {
    resultado.dados.csu_count = resCSU.dados[0]?.TOTAL || 0;
    console.log(`      ✓ ${resCSU.tempo}ms - ${resultado.dados.csu_count} registos CSU`);
    if (resultado.dados.csu_count === 0 && resultado.dados.movimentos_fdet > 0) {
      resultado.problemas.push('MOVIMENTOS_SEM_CSU');
    }
  } else {
    resultado.problemas.push('ERRO_CSU');
    console.log(`      ❌ ${resCSU.tempo}ms - ${resCSU.erro}`);
  }

  // 5. Verificar memória Oracle (PGA)
  try {
    const memRes = await connection.execute(`
      SELECT name, value FROM v$mystat s, v$statname n 
      WHERE s.statistic# = n.statistic# 
        AND n.name IN ('session pga memory', 'session pga memory max')
    `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    const memoria = {};
    memRes.rows.forEach(row => {
      if (row.NAME.includes('max')) memoria.pga_max = parseInt(row.VALUE);
      else memoria.pga_used = parseInt(row.VALUE);
    });
    resultado.memoria = memoria;
  } catch (e) {
    // Ignorar se não tiver permissões
  }

  // 6. Análise de problemas
  if (resultado.dados.prf && resultado.dados.prf.STOCK_ATUAL === null) {
    resultado.problemas.push('STOCK_NULL');
  }
  
  const tempoTotal = Object.values(resultado.tempos).reduce((a, b) => a + b, 0);
  if (tempoTotal > 10000) {
    resultado.problemas.push('TEMPO_TOTAL_ALTO');
  }

  console.log(`   📈 Tempo total: ${tempoTotal}ms | Problemas: ${resultado.problemas.length}`);
  
  return resultado;
}

async function diagnosticoCompleto() {
  let connection;
  
  try {
    console.log('=======================================================');
    console.log('DIAGNÓSTICO PERFORMANCE - GESTÃO DE STOCKS');
    console.log('=======================================================\n');
    
    try { oracledb.initOracleClient(); } catch (_) {}
    connection = await oracledb.getConnection(dbConfig);
    
    const resultados = [];
    const estatisticas = {
      total_testados: CODIGOS_TESTE.length,
      existem_prf: 0,
      existem_medh: 0,
      existem_csu: 0,
      com_movimentos: 0,
      com_problemas: 0,
      tempo_medio: 0
    };

    // Testar cada código
    for (let i = 0; i < CODIGOS_TESTE.length; i++) {
      const codigo = CODIGOS_TESTE[i];
      const resultado = await analisarMedicamento(connection, codigo, i + 1);
      resultados.push(resultado);
      
      // Estatísticas
      if (resultado.dados.prf) estatisticas.existem_prf++;
      if (resultado.dados.medh) estatisticas.existem_medh++;
      if (resultado.dados.csu_count > 0) estatisticas.existem_csu++;
      if (resultado.dados.movimentos_fdet > 0) estatisticas.com_movimentos++;
      if (resultado.problemas.length > 0) estatisticas.com_problemas++;
    }

    estatisticas.tempo_medio = Math.round(
      resultados.reduce((acc, r) => acc + Object.values(r.tempos).reduce((a, b) => a + b, 0), 0) / resultados.length
    );

    // Análise de degradação
    console.log('\n=======================================================');
    console.log('ANÁLISE DE DEGRADAÇÃO DE PERFORMANCE');
    console.log('=======================================================\n');
    
    const temposMovimentos = resultados.map(r => r.tempos.movimentos_fdet).filter(t => t > 0);
    if (temposMovimentos.length > 2) {
      const primeiro = temposMovimentos[0];
      const ultimo = temposMovimentos[temposMovimentos.length - 1];
      const degradacao = ((ultimo - primeiro) / primeiro * 100).toFixed(1);
      
      console.log(`Degradação movimentos: ${primeiro}ms → ${ultimo}ms (${degradacao}%)`);
      if (Math.abs(parseFloat(degradacao)) > 50) {
        console.log('⚠️  DEGRADAÇÃO SIGNIFICATIVA DETECTADA!');
      }
    }

    // Padrões identificados
    console.log('\n📊 PADRÕES IDENTIFICADOS:');
    const fa1Codes = resultados.filter(r => r.codigo.startsWith('FA1'));
    const fa2Codes = resultados.filter(r => r.codigo.startsWith('FA2'));
    
    console.log(`FA1* (${fa1Codes.length} testados):`);
    fa1Codes.forEach(r => {
      const status = r.dados.prf ? '✓' : '❌';
      const movs = r.dados.movimentos_fdet || 0;
      const csu = r.dados.csu_count || 0;
      console.log(`  ${status} ${r.codigo}: ${movs} movs, ${csu} CSU`);
    });
    
    console.log(`\nFA2* (${fa2Codes.length} testados):`);
    fa2Codes.forEach(r => {
      const status = r.dados.prf ? '✓' : '❌';
      const movs = r.dados.movimentos_fdet || 0;
      const csu = r.dados.csu_count || 0;
      console.log(`  ${status} ${r.codigo}: ${movs} movs, ${csu} CSU`);
    });

    // Salvar resultado detalhado
    const relatorio = {
      timestamp: new Date().toISOString(),
      estatisticas,
      resultados_detalhados: resultados,
      medicamentos_testados: CODIGOS_TESTE,
      problemas_identificados: [
        ...new Set(resultados.flatMap(r => r.problemas))
      ].map(p => [p, resultados.filter(r => r.problemas.includes(p)).length]),
      recomendacoes: [
        'Implementar timeout nas queries FDET para medicamentos com muitos movimentos',
        'Adicionar cache específico para medicamentos FA2* (artigos locais)',
        'Verificar e corrigir valores NULL em STOCK_ATUAL', 
        'Otimizar query de movimentos com LIMIT quando necessário',
        'Implementar retry logic para queries que falham'
      ]
    };

    fs.writeFileSync(
      path.join(__dirname, 'ANALISE_MEDICAMENTOS_VARIADOS.json'),
      JSON.stringify(relatorio, null, 2)
    );

    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
    console.log(`📋 Relatório salvo em: ANALISE_MEDICAMENTOS_VARIADOS.json`);
    console.log(`📊 Estatísticas: ${estatisticas.existem_prf}/${estatisticas.total_testados} em PRF, ${estatisticas.com_problemas} com problemas`);

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
