const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function buscarTabelasRelacionadas(connection) {
  try {
    // Buscar todas as tabelas que contenham padrões específicos
    const query = `
      SELECT DISTINCT 
        table_name,
        num_rows,
        last_analyzed
      FROM all_tables
      WHERE owner = 'PCE'
        AND (
          table_name LIKE '%MEDH%'
          OR table_name LIKE '%PRF%'
          OR table_name LIKE '%CSU%'
          OR table_name LIKE '%MEDICAMENTO%'
          OR table_name LIKE '%FARMAC%'
          OR table_name LIKE '%STOCK%'
          OR table_name LIKE '%ARTIGO%'
          OR table_name LIKE '%DOSE%'
          OR table_name LIKE '%PRESCR%'
          OR table_name LIKE '%VALIDAC%'
          OR table_name LIKE '%MOVIMENTO%'
          OR table_name LIKE '%EPISODIO%'
          OR table_name LIKE '%DOENTE%'
          OR table_name LIKE '%UTENTE%'
        )
      ORDER BY table_name
    `;
    
    const result = await connection.execute(query);
    return result.rows.map(row => ({
      nome: row[0],
      totalRegistros: row[1] || 0,
      ultimaAnalise: row[2]
    }));
  } catch (err) {
    console.error('Erro ao buscar tabelas:', err);
    return [];
  }
}

async function obterDetalhesTabela(connection, tabela) {
  const detalhes = {
    nome: tabela,
    colunas: [],
    indices: [],
    constraints: [],
    totalRegistros: 0
  };
  
  try {
    // Obter colunas
    const colunasResult = await connection.execute(
      `SELECT 
        column_name,
        data_type,
        data_length,
        data_precision,
        data_scale,
        nullable,
        data_default,
        column_id
       FROM all_tab_columns
       WHERE table_name = :tabela AND owner = 'PCE'
       ORDER BY column_id`,
      { tabela }
    );
    
    detalhes.colunas = colunasResult.rows.map(col => ({
      posicao: col[7],
      nome: col[0],
      tipo: col[1],
      tamanho: col[2],
      precisao: col[3],
      escala: col[4],
      nullable: col[5] === 'Y',
      default: col[6]
    }));
    
    // Tentar contar registros de forma segura
    try {
      const countResult = await connection.execute(
        `SELECT COUNT(*) as TOTAL FROM PCE.${tabela} WHERE ROWNUM <= 1000001`
      );
      detalhes.totalRegistros = countResult.rows[0][0];
      if (detalhes.totalRegistros > 1000000) {
        detalhes.totalRegistros = '1000000+';
      }
    } catch (err) {
      detalhes.totalRegistros = 'Erro ao contar';
    }
    
    // Obter índices
    try {
      const indicesResult = await connection.execute(
        `SELECT 
          i.index_name,
          i.uniqueness,
          i.status
         FROM all_indexes i
         WHERE i.table_name = :tabela AND i.owner = 'PCE'`,
        { tabela }
      );
      
      detalhes.indices = indicesResult.rows.map(idx => ({
        nome: idx[0],
        unico: idx[1] === 'UNIQUE',
        status: idx[2]
      }));
    } catch (err) {
      console.log(`  ⚠️  Erro ao obter índices de ${tabela}`);
    }
    
    // Obter constraints básicas
    try {
      const constraintsResult = await connection.execute(
        `SELECT 
          constraint_name,
          constraint_type,
          status
         FROM all_constraints
         WHERE table_name = :tabela AND owner = 'PCE'
           AND constraint_type IN ('P', 'R', 'U', 'C')`,
        { tabela }
      );
      
      detalhes.constraints = constraintsResult.rows.map(con => ({
        nome: con[0],
        tipo: con[1],
        status: con[2]
      }));
    } catch (err) {
      console.log(`  ⚠️  Erro ao obter constraints de ${tabela}`);
    }
    
  } catch (err) {
    console.error(`  ❌ Erro ao processar ${tabela}: ${err.message}`);
  }
  
  return detalhes;
}

async function main() {
  let connection;
  
  try {
    console.log('='.repeat(80));
    console.log('BUSCA COMPLETA DE TABELAS RELACIONADAS');
    console.log('='.repeat(80));
    console.log('\nConectando à base de dados...');
    
    connection = await oracledb.getConnection(dbConfig);
    console.log('✓ Conectado com sucesso\n');
    
    // Buscar todas as tabelas relacionadas
    console.log('Buscando tabelas relacionadas...');
    const tabelasEncontradas = await buscarTabelasRelacionadas(connection);
    console.log(`\n✓ Encontradas ${tabelasEncontradas.length} tabelas relacionadas\n`);
    
    // Agrupar por prefixo
    const grupos = {};
    tabelasEncontradas.forEach(tabela => {
      const prefixo = tabela.nome.split('_')[0];
      if (!grupos[prefixo]) {
        grupos[prefixo] = [];
      }
      grupos[prefixo].push(tabela);
    });
    
    // Mostrar resumo por grupo
    console.log('RESUMO POR GRUPO:');
    console.log('-'.repeat(50));
    Object.entries(grupos).forEach(([grupo, tabelas]) => {
      console.log(`${grupo}: ${tabelas.length} tabelas`);
    });
    
    // Processar tabelas que ainda não foram mapeadas
    const tabelasJaMapeadas = fs.readdirSync(__dirname)
      .filter(f => f.startsWith('tabela_PCE_') && f.endsWith('.json'))
      .map(f => f.replace('tabela_PCE_', '').replace('.json', '').replace('_COMPLETA', '').replace('_NOVA', ''));
    
    const tabelasNovas = tabelasEncontradas.filter(t => 
      !tabelasJaMapeadas.includes(t.nome)
    );
    
    console.log(`\n\nTABELAS NOVAS PARA MAPEAR: ${tabelasNovas.length}`);
    console.log('='.repeat(50));
    
    // Mapear apenas as novas
    const resultadoDetalhado = {
      timestamp: new Date().toISOString(),
      totalTabelas: tabelasEncontradas.length,
      tabelasJaMapeadas: tabelasJaMapeadas.length,
      tabelasNovas: [],
      gruposCompletos: {}
    };
    
    // Processar em lotes pequenos
    const BATCH_SIZE = 5;
    for (let i = 0; i < tabelasNovas.length && i < 50; i += BATCH_SIZE) { // Limitar a 50 para não demorar muito
      const lote = tabelasNovas.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessando lote ${Math.floor(i/BATCH_SIZE) + 1}...`);
      
      for (const tabela of lote) {
        console.log(`\n📋 ${tabela.nome}`);
        const detalhes = await obterDetalhesTabela(connection, tabela.nome);
        
        if (detalhes.colunas.length > 0) {
          console.log(`   ✓ ${detalhes.colunas.length} colunas, ${detalhes.totalRegistros} registros`);
          
          // Salvar arquivo
          const nomeArquivo = `tabela_PCE_${tabela.nome}_AUTO.json`;
          fs.writeFileSync(
            path.join(__dirname, nomeArquivo),
            JSON.stringify(detalhes, null, 2)
          );
          
          resultadoDetalhado.tabelasNovas.push({
            ...tabela,
            colunas: detalhes.colunas.length,
            indices: detalhes.indices.length,
            constraints: detalhes.constraints.length
          });
        }
      }
    }
    
    // Criar índice completo
    Object.entries(grupos).forEach(([grupo, tabelas]) => {
      resultadoDetalhado.gruposCompletos[grupo] = tabelas.map(t => t.nome);
    });
    
    // Salvar resultado completo
    fs.writeFileSync(
      path.join(__dirname, 'TODAS_TABELAS_RELACIONADAS.json'),
      JSON.stringify(resultadoDetalhado, null, 2)
    );
    
    // Resumo final
    console.log('\n\n' + '='.repeat(80));
    console.log('RESUMO FINAL');
    console.log('='.repeat(80));
    console.log(`Total de tabelas encontradas: ${tabelasEncontradas.length}`);
    console.log(`Tabelas já mapeadas: ${tabelasJaMapeadas.length}`);
    console.log(`Tabelas novas processadas: ${resultadoDetalhado.tabelasNovas.length}`);
    console.log(`\n✓ Resultado salvo em TODAS_TABELAS_RELACIONADAS.json`);
    
  } catch (err) {
    console.error('\nErro fatal:', err);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✓ Conexão fechada');
    }
  }
}

main(); 