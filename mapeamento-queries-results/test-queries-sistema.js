const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Configurações de performance
const CONFIG = {
  QUERY_TIMEOUT: 30, // segundos
  MAX_ROWS: 100,     // limite de linhas por query
  FETCH_SIZE: 50     // tamanho do buffer de fetch
};

// Configurar oracledb
oracledb.fetchAsString = [ oracledb.CLOB ];
oracledb.autoCommit = true;

// Queries principais do sistema
const queriesSistema = [
  // API Tratamentos
  {
    nome: 'Listar Actos Disponíveis (GET /api/tratamentos)',
    categoria: 'Tratamentos',
    query: `SELECT 
              CDU_CSU_ID as ID,
              CDU_CSU_DESCRICAO as NAME,
              CDU_CSU_ID as CSU_DEFACTOSID
            FROM PCE.CSU_DEFACTOS
            WHERE CDU_CSU_DESCRICAO IS NOT NULL
            ORDER BY CDU_CSU_DESCRICAO`,
    esperado: { minRows: 200, maxRows: 300 }
  },
  
  {
    nome: 'Buscar Artigos de um Acto (GET /api/tratamentos/artigos)',
    categoria: 'Tratamentos',
    query: `SELECT 
              g.CDU_CSU_ARTIGO as CODIGO,
              g.DESCRICAO as DESCRICAO,
              g.CDU_CSU_QTDSUGERIDA as QTD_PADRAO,
              g.AFETA_STOCK
            FROM PCE.CSU_DEFACTOSENTGASTOS g
            WHERE g.CDU_CSU_DEFACTOENTIDADEID = (
              SELECT CDU_CSU_ID FROM PCE.CSU_DEFACTOS WHERE ROWNUM = 1
            )
              AND ROWNUM <= ${CONFIG.MAX_ROWS}`,
    esperado: { minRows: 0, maxRows: CONFIG.MAX_ROWS }
  },
  
  {
    nome: 'Inserir Acto (POST /api/tratamentos)',
    categoria: 'Tratamentos',
    query: `SELECT ISEQ$$_654576.NEXTVAL as NEXT_ID FROM DUAL`,
    esperado: { minRows: 1, maxRows: 1 },
    warning: 'Query apenas para testar sequence'
  },
  
  // API Farmácia - Movimentos
  {
    nome: 'Movimentos de Medicação Hospitalar',
    categoria: 'Farmácia',
    query: `SELECT DISTINCT
              initcap(p.nome) AS NOME_UTENTE,
              m.episodio AS EPISODIO,
              m.modulo AS MODULO,
              p.num_processo AS PROCESSO,
              trunc((sysdate-p.dta_nascimento)/365.25) AS IDADE,
              m.id_presc AS ID,
              m.codigo AS CODIGO_ARTIGO,
              NVL(med.desc_c, 'Medicamento') AS DESCRICAO_ARTIGO,
              m.estado AS ESTADO,
              m.user_val AS USER_VAL,
              m.dose AS DOSE,
              m.cod_v AS COD_VIA,
              m.cod_f AS COD_FREQUENCIA
            FROM 
              prf_presc_mov m
              INNER JOIN pcedoentes p ON m.num_sequencial = p.num_sequencial
              LEFT JOIN prf_medicamentos med ON m.codigo = med.codigo
            WHERE 
              m.dtmed = 'MH'
              AND m.estado <> 9
              AND m.codigo IS NOT NULL
              AND ROWNUM <= ${CONFIG.MAX_ROWS}`,
    esperado: { minRows: 0, maxRows: CONFIG.MAX_ROWS },
    warning: 'Query pesada - pode ter muitos resultados'
  },
  
  {
    nome: 'Validar Prescrição',
    categoria: 'Farmácia',
    query: `SELECT COUNT(*) as TOTAL
            FROM prf_presc_mov 
            WHERE estado = 1 
              AND dtmed = 'MH'
              AND codigo IS NOT NULL`,
    esperado: { minRows: 1, maxRows: 1 }
  },
  
  // API Farmácia - Stock Crítico
  {
    nome: 'Medicamentos com Stock Crítico',
    categoria: 'Stock',
    query: `SELECT 
              pm.codigo,
              pm.desc_c,
              pm.stock_atual,
              pm.afeta_stock,
              pm.med_alto_risco,
              CASE WHEN pmz.codigo IS NOT NULL THEN 1 ELSE 0 END as na_lista_zero
            FROM prf_medicamentos pm
            LEFT JOIN prf_med_zero pmz ON pm.codigo = pmz.codigo
            WHERE pm.codigo IS NOT NULL
              AND (pmz.codigo IS NOT NULL OR pm.stock_atual <= 100)
              AND ROWNUM <= ${CONFIG.MAX_ROWS}
            ORDER BY pm.stock_atual ASC`,
    esperado: { minRows: 0, maxRows: CONFIG.MAX_ROWS }
  },
  
  {
    nome: 'Lista Zero - Medicamentos',
    categoria: 'Stock',
    query: `SELECT codigo, desc_c 
            FROM prf_med_zero 
            WHERE ROWNUM <= 50
            ORDER BY desc_c`,
    esperado: { minRows: 0, maxRows: 50 }
  },
  
  // API Login/Auth
  {
    nome: 'Validar Utilizador',
    categoria: 'Auth',
    query: `SELECT IDUTILIZADOR, UTILIZADOR, PASSWORD_HASH, PASSWORD 
            FROM UTILIZADORES 
            WHERE IDUTILIZADOR = '0123' 
              AND ESTADO = 1`,
    esperado: { minRows: 0, maxRows: 1 }
  },
  
  // API Procurar Utente
  {
    nome: 'Procurar Utente por Processo',
    categoria: 'Utentes',
    query: `SELECT DISTINCT
              d.NUM_SEQUENCIAL,
              d.NUM_PROCESSO,
              d.NOME,
              TO_CHAR(d.DTA_NASCIMENTO, 'YYYY-MM-DD') as DTA_NASCIMENTO,
              d.SEXO,
              d.MOR_MORADA,
              d.LOC_MORADA,
              d.TEL_MORADAV2 as TELEFONE,
              d.COD_POSTAL,
              e.EPISODIO,
              e.DTA_EPISODIO,
              e.COD_ESPECIALIDADE,
              e.DES_ESPECIALIDADE,
              e.MODULO
            FROM PCE.PCEDOENTES d
            LEFT JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
            WHERE d.NUM_PROCESSO = '12345678'
              AND ROWNUM <= 10`,
    esperado: { minRows: 0, maxRows: 10 }
  },
  
  // API Episódios
  {
    nome: 'Episódios Recentes',
    categoria: 'Episódios',
    query: `SELECT 
              e.EPISODIO,
              e.NUM_SEQUENCIAL,
              e.DTA_EPISODIO,
              e.DES_ESPECIALIDADE,
              e.MODULO,
              e.COD_ESPECIALIDADE,
              e.HORA_EPISODIO,
              e.NUM_ORDEM
            FROM PCE.PCEEPISODIOS e
            WHERE e.DTA_EPISODIO >= SYSDATE - 30
              AND ROWNUM <= ${CONFIG.MAX_ROWS}
            ORDER BY e.DTA_EPISODIO DESC`,
    esperado: { minRows: 0, maxRows: CONFIG.MAX_ROWS }
  },
  
  // Queries de JOIN complexas
  {
    nome: 'Actos com Artigos Agrupados',
    categoria: 'Joins',
    query: `SELECT 
              a.CDU_CSU_ID,
              a.EPISODIO,
              d.CDU_CSU_DESCRICAO as ACTO_DESCRICAO,
              COUNT(ag.CDU_CSU_ID) as TOTAL_ARTIGOS,
              SUM(ag.CDU_CSU_QUANTIDADE) as TOTAL_QUANTIDADE
            FROM PCE.CSU_EPENTIDADEACTOS a
            JOIN PCE.CSU_DEFACTOS d ON a.CDU_CSU_ACTOID = d.CDU_CSU_ID
            LEFT JOIN PCE.CSU_EPENTIDADEACTOGASTOS ag ON a.CDU_CSU_ID = ag.CDU_CSU_EPISODIOENTIDADEACTOID
            WHERE a.CDU_CSU_DATA >= SYSDATE - 7
              AND ROWNUM <= 50
            GROUP BY a.CDU_CSU_ID, a.EPISODIO, d.CDU_CSU_DESCRICAO`,
    esperado: { minRows: 0, maxRows: 50 },
    warning: 'Query com agregação - pode ser lenta'
  },
  
  {
    nome: 'Prescrições com Info Completa',
    categoria: 'Joins',
    query: `SELECT 
              m.id_presc,
              m.episodio,
              p.nome as nome_utente,
              med.desc_c as medicamento,
              via.de_dia as via_admin,
              freq.desc_f as frequencia,
              u.utilizador as medico
            FROM prf_presc_mov m
            JOIN pcedoentes p ON m.num_sequencial = p.num_sequencial
            LEFT JOIN prf_medicamentos med ON m.codigo = med.codigo
            LEFT JOIN prf_vias via ON m.cod_v = via.id_via
            LEFT JOIN prf_freqs freq ON m.cod_f = freq.cod_f
            LEFT JOIN utilizadores u ON m.user_alt = u.idutilizador
            WHERE m.estado = 1
              AND m.dtmed = 'MH'
              AND ROWNUM <= 20`,
    esperado: { minRows: 0, maxRows: 20 }
  },
  
  // Queries de performance/contagem
  {
    nome: 'Contagem Total de Actos',
    categoria: 'Performance',
    query: `SELECT COUNT(*) as TOTAL FROM PCE.CSU_EPENTIDADEACTOS WHERE CDU_CSU_DATA >= SYSDATE - 365`,
    esperado: { minRows: 1, maxRows: 1 }
  },
  
  {
    nome: 'Estatísticas de Exportação',
    categoria: 'Performance',
    query: `SELECT 
              CDU_CSU_EXPORTADO,
              COUNT(*) as TOTAL,
              MIN(CDU_CSU_DATA) as DATA_MAIS_ANTIGA,
              MAX(CDU_CSU_DATA) as DATA_MAIS_RECENTE
            FROM PCE.CSU_EPENTIDADEACTOS
            WHERE CDU_CSU_DATA >= SYSDATE - 30
            GROUP BY CDU_CSU_EXPORTADO`,
    esperado: { minRows: 0, maxRows: 10 }
  }
];

// Função para executar query com timeout
async function executarQueryComTimeout(connection, query, params = {}, timeout = CONFIG.QUERY_TIMEOUT) {
  return new Promise(async (resolve, reject) => {
    let timeoutHandle;
    let cancelled = false;
    
    timeoutHandle = setTimeout(() => {
      cancelled = true;
      reject(new Error(`Timeout após ${timeout} segundos`));
    }, timeout * 1000);
    
    try {
      const result = await connection.execute(query, params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        maxRows: CONFIG.MAX_ROWS + 1, // +1 para detectar se há mais rows
        fetchArraySize: CONFIG.FETCH_SIZE
      });
      
      if (!cancelled) {
        clearTimeout(timeoutHandle);
        resolve(result);
      }
    } catch (err) {
      if (!cancelled) {
        clearTimeout(timeoutHandle);
        reject(err);
      }
    }
  });
}

// Função principal
async function testarQueriesSistema() {
  let connection;
  
  try {
    console.log('='.repeat(80));
    console.log('TESTE DE QUERIES DO SISTEMA DE REGISTO DE TRATAMENTOS');
    console.log('='.repeat(80));
    console.log(`\nConfiguração:`);
    console.log(`- Timeout por query: ${CONFIG.QUERY_TIMEOUT}s`);
    console.log(`- Limite de registros: ${CONFIG.MAX_ROWS}`);
    console.log(`- Tamanho do buffer: ${CONFIG.FETCH_SIZE}`);
    
    console.log('\nConectando à base de dados...');
    connection = await oracledb.getConnection(dbConfig);
    console.log('✓ Conectado com sucesso\n');
    
    const resultados = {
      sucesso: [],
      erro: [],
      timeout: [],
      timestamp: new Date().toISOString(),
      configuracao: CONFIG
    };
    
    // Agrupar queries por categoria
    const categorias = {};
    queriesSistema.forEach(q => {
      if (!categorias[q.categoria]) {
        categorias[q.categoria] = [];
      }
      categorias[q.categoria].push(q);
    });
    
    console.log(`Categorias encontradas: ${Object.keys(categorias).join(', ')}\n`);
    
    // Executar queries por categoria
    for (const [categoria, queries] of Object.entries(categorias)) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`CATEGORIA: ${categoria}`);
      console.log('='.repeat(50));
      
      for (const teste of queries) {
        console.log(`\nTestando: ${teste.nome}`);
        if (teste.warning) {
          console.log(`⚠️  Aviso: ${teste.warning}`);
        }
        console.log('-'.repeat(50));
        
        try {
          const startTime = Date.now();
          const result = await executarQueryComTimeout(connection, teste.query);
          const execTime = Date.now() - startTime;
          
          // Análise dos resultados
          const rowCount = result.rows?.length || 0;
          const dentroDoEsperado = 
            rowCount >= (teste.esperado?.minRows || 0) &&
            rowCount <= (teste.esperado?.maxRows || CONFIG.MAX_ROWS);
          
          console.log(`✓ Sucesso (${execTime}ms)`);
          console.log(`  Linhas retornadas: ${rowCount}`);
          console.log(`  Dentro do esperado: ${dentroDoEsperado ? 'SIM' : 'NÃO'}`);
          
          if (result.metaData) {
            console.log(`  Colunas: ${result.metaData.map(m => m.name).join(', ')}`);
          }
          
          // Mostrar amostra de dados para queries não-agregadas
          if (result.rows && result.rows.length > 0 && !teste.nome.includes('COUNT')) {
            console.log('\n  Amostra de dados:');
            result.rows.slice(0, 2).forEach((row, idx) => {
              // Truncar valores longos para melhor visualização
              const rowTruncado = {};
              Object.entries(row).forEach(([key, value]) => {
                if (typeof value === 'string' && value.length > 50) {
                  rowTruncado[key] = value.substring(0, 47) + '...';
                } else {
                  rowTruncado[key] = value;
                }
              });
              console.log(`    ${idx + 1}: ${JSON.stringify(rowTruncado)}`);
            });
          }
          
          // Análise de performance
          let performanceStatus = 'BOM';
          if (execTime > 1000) performanceStatus = 'ACEITÁVEL';
          if (execTime > 3000) performanceStatus = 'LENTO';
          if (execTime > 10000) performanceStatus = 'MUITO LENTO';
          
          // Sugestões de otimização
          const sugestoes = [];
          if (execTime > 3000) {
            sugestoes.push('Considerar adicionar índices');
          }
          if (rowCount >= CONFIG.MAX_ROWS) {
            sugestoes.push('Query pode ter mais resultados - considerar paginação');
          }
          if (teste.query.includes('GROUP BY') && execTime > 2000) {
            sugestoes.push('Agregações podem ser pré-calculadas');
          }
          
          resultados.sucesso.push({
            nome: teste.nome,
            categoria: teste.categoria,
            tempoExecucao: execTime,
            performanceStatus,
            totalLinhas: rowCount,
            dentroDoEsperado,
            colunas: result.metaData ? result.metaData.map(m => m.name) : [],
            sugestoes
          });
          
        } catch (err) {
          if (err.message.includes('Timeout')) {
            console.log(`⏱️  TIMEOUT: Query cancelada após ${CONFIG.QUERY_TIMEOUT}s`);
            resultados.timeout.push({
              nome: teste.nome,
              categoria: teste.categoria,
              timeout: CONFIG.QUERY_TIMEOUT
            });
          } else {
            console.log(`✗ ERRO: ${err.message}`);
            resultados.erro.push({
              nome: teste.nome,
              categoria: teste.categoria,
              erro: err.message,
              codigo: err.errorNum
            });
          }
        }
        
        // Pequena pausa entre queries
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Salvar resultados detalhados
    const outputPath = path.join(__dirname, 'TESTE_QUERIES_SISTEMA.json');
    fs.writeFileSync(outputPath, JSON.stringify(resultados, null, 2));
    
    // Gerar relatório resumido
    console.log('\n\n' + '='.repeat(80));
    console.log('RESUMO GERAL');
    console.log('='.repeat(80));
    console.log(`✓ Sucesso: ${resultados.sucesso.length}`);
    console.log(`⏱️  Timeout: ${resultados.timeout.length}`);
    console.log(`✗ Erros: ${resultados.erro.length}`);
    
    // Análise por categoria
    console.log('\nRESUMO POR CATEGORIA:');
    const resumoPorCategoria = {};
    resultados.sucesso.forEach(r => {
      if (!resumoPorCategoria[r.categoria]) {
        resumoPorCategoria[r.categoria] = {
          total: 0,
          tempoTotal: 0,
          performanceBom: 0,
          performanceAceitavel: 0,
          performanceLento: 0
        };
      }
      resumoPorCategoria[r.categoria].total++;
      resumoPorCategoria[r.categoria].tempoTotal += r.tempoExecucao;
      
      if (r.performanceStatus === 'BOM') resumoPorCategoria[r.categoria].performanceBom++;
      else if (r.performanceStatus === 'ACEITÁVEL') resumoPorCategoria[r.categoria].performanceAceitavel++;
      else resumoPorCategoria[r.categoria].performanceLento++;
    });
    
    Object.entries(resumoPorCategoria).forEach(([categoria, stats]) => {
      console.log(`\n${categoria}:`);
      console.log(`  - Total queries: ${stats.total}`);
      console.log(`  - Tempo médio: ${Math.round(stats.tempoTotal / stats.total)}ms`);
      console.log(`  - Performance: ${stats.performanceBom} bom, ${stats.performanceAceitavel} aceitável, ${stats.performanceLento} lento`);
    });
    
    // Top 5 queries mais lentas
    console.log('\n\nTOP 5 QUERIES MAIS LENTAS:');
    resultados.sucesso
      .sort((a, b) => b.tempoExecucao - a.tempoExecucao)
      .slice(0, 5)
      .forEach((q, idx) => {
        console.log(`${idx + 1}. ${q.nome} (${q.categoria}): ${q.tempoExecucao}ms`);
        if (q.sugestoes.length > 0) {
          console.log(`   Sugestões: ${q.sugestoes.join('; ')}`);
        }
      });
    
    // Queries que precisam atenção
    const queriesAtencao = resultados.sucesso.filter(q => 
      q.performanceStatus === 'LENTO' || 
      q.performanceStatus === 'MUITO LENTO' ||
      !q.dentroDoEsperado
    );
    
    if (queriesAtencao.length > 0) {
      console.log('\n\nQUERIES QUE PRECISAM ATENÇÃO:');
      queriesAtencao.forEach(q => {
        console.log(`\n- ${q.nome} (${q.categoria})`);
        console.log(`  Performance: ${q.performanceStatus} (${q.tempoExecucao}ms)`);
        console.log(`  Dentro do esperado: ${q.dentroDoEsperado ? 'SIM' : 'NÃO'}`);
        if (q.sugestoes.length > 0) {
          console.log(`  Sugestões: ${q.sugestoes.join('; ')}`);
        }
      });
    }
    
    console.log(`\n✓ Resultados detalhados salvos em: ${outputPath}`);
    
  } catch (err) {
    console.error('\nErro fatal:', err);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✓ Conexão fechada');
    }
  }
}

// Tratamento de interrupções
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Execução interrompida pelo usuário');
  process.exit(1);
});

// Executar testes
testarQueriesSistema();
