const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Queries críticas do sistema para testar
const queriesCriticas = [
  {
    nome: 'Lista de Actos Disponíveis',
    query: `SELECT 
              CDU_CSU_ID as ID,
              CDU_CSU_DESCRICAO as NAME,
              CDU_CSU_ID as CSU_DEFACTOSID
            FROM PCE.CSU_DEFACTOS
            WHERE CDU_CSU_DESCRICAO IS NOT NULL
              AND ROWNUM <= 10
            ORDER BY CDU_CSU_DESCRICAO`
  },
  {
    nome: 'Artigos de um Acto',
    query: `SELECT 
              ga.CDU_CSU_ARTIGO,
              ga.CDU_CSU_DESCRICAO,
              ga.CDU_CSU_QUANTIDADE,
              ga.CDU_CSU_ACTIVO
            FROM PCE.CSU_DEFACTOSENTGASTOS ga
            WHERE ga.CDU_CSU_ACTOID = (
              SELECT CDU_CSU_ID 
              FROM PCE.CSU_DEFACTOS 
              WHERE ROWNUM = 1
            )`
  },
  {
    nome: 'Episódios com Actos Registados',
    query: `SELECT DISTINCT
              e.EPISODIO,
              e.NUM_SEQUENCIAL,
              e.DES_ESPECIALIDADE,
              COUNT(a.CDU_CSU_ID) as TOTAL_ACTOS
            FROM PCE.PCEEPISODIOS e
            JOIN PCE.CSU_EPENTIDADEACTOS a ON e.EPISODIO = a.EPISODIO
            WHERE ROWNUM <= 10
            GROUP BY e.EPISODIO, e.NUM_SEQUENCIAL, e.DES_ESPECIALIDADE`
  },
  {
    nome: 'Medicamentos PRF',
    query: `SELECT 
              CODIGO,
              DESC_C as DESCRICAO,
              GRUPO_T,
              VIA
            FROM PCE.PRF_MEDICAMENTOS
            WHERE ROWNUM <= 10
            ORDER BY DESC_C`
  },
  {
    nome: 'Artigos com Stock',
    query: `SELECT DISTINCT
              a.CODIGO,
              a.NOME,
              a.UNID_MEDIDA
            FROM ARTIGOS a
            WHERE EXISTS (
              SELECT 1 
              FROM PCE.CSU_EPENTIDADEACTOGASTOS g
              WHERE g.CDU_CSU_ARTIGO = a.CODIGO
            )
              AND ROWNUM <= 10`
  },
  {
    nome: 'Verificar campos CSU_DEFACTOSENTGASTOS',
    query: `SELECT column_name, data_type, nullable
            FROM all_tab_columns
            WHERE table_name = 'CSU_DEFACTOSENTGASTOS'
              AND owner = 'PCE'
            ORDER BY column_id`
  },
  {
    nome: 'Actos mais utilizados',
    query: `SELECT 
              d.CDU_CSU_DESCRICAO,
              COUNT(a.CDU_CSU_ID) as TOTAL_USOS
            FROM PCE.CSU_DEFACTOS d
            JOIN PCE.CSU_EPENTIDADEACTOS a ON d.CDU_CSU_ID = a.CDU_CSU_ACTOID
            GROUP BY d.CDU_CSU_DESCRICAO
            ORDER BY TOTAL_USOS DESC
            FETCH FIRST 10 ROWS ONLY`
  }
];

async function testarQueriesCriticas() {
  let connection;
  
  try {
    console.log('='.repeat(80));
    console.log('TESTE DE QUERIES CRÍTICAS DO SISTEMA');
    console.log('='.repeat(80));
    
    connection = await oracledb.getConnection(dbConfig);
    
    const resultados = {
      sucesso: [],
      erro: [],
      timestamp: new Date().toISOString()
    };
    
    for (const teste of queriesCriticas) {
      console.log(`\n\nTestando: ${teste.nome}`);
      console.log('-'.repeat(50));
      
      try {
        const startTime = Date.now();
        const result = await connection.execute(teste.query);
        const execTime = Date.now() - startTime;
        
        console.log(`✓ Sucesso (${execTime}ms)`);
        console.log(`  Linhas retornadas: ${result.rows.length}`);
        
        if (result.metaData) {
          console.log(`  Colunas: ${result.metaData.map(m => m.name).join(', ')}`);
        }
        
        // Mostrar primeiras 3 linhas
        if (result.rows && result.rows.length > 0) {
          console.log('\n  Amostra de dados:');
          result.rows.slice(0, 3).forEach((row, idx) => {
            console.log(`    ${idx + 1}: ${JSON.stringify(row)}`);
          });
        }
        
        resultados.sucesso.push({
          nome: teste.nome,
          tempoExecucao: execTime,
          totalLinhas: result.rows.length,
          colunas: result.metaData ? result.metaData.map(m => m.name) : [],
          amostra: result.rows.slice(0, 3)
        });
        
      } catch (err) {
        console.log(`✗ ERRO: ${err.message}`);
        
        resultados.erro.push({
          nome: teste.nome,
          erro: err.message,
          codigo: err.errorNum,
          query: teste.query
        });
      }
    }
    
    // Salvar resultados
    fs.writeFileSync(
      path.join(__dirname, 'TESTE_QUERIES_CRITICAS.json'),
      JSON.stringify(resultados, null, 2)
    );
    
    // Gerar relatório
    console.log('\n\n' + '='.repeat(80));
    console.log('RESUMO DOS TESTES');
    console.log('='.repeat(80));
    console.log(`✓ Sucesso: ${resultados.sucesso.length}`);
    console.log(`✗ Erros: ${resultados.erro.length}`);
    
    if (resultados.erro.length > 0) {
      console.log('\nERROS ENCONTRADOS:');
      resultados.erro.forEach(erro => {
        console.log(`\n  ${erro.nome}:`);
        console.log(`    Erro: ${erro.erro}`);
        console.log(`    Código: ${erro.codigo}`);
      });
    }
    
    console.log('\n✓ Resultados salvos em queries-results/TESTE_QUERIES_CRITICAS.json');
    
  } catch (err) {
    console.error('Erro fatal:', err);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✓ Conexão fechada');
    }
  }
}

testarQueriesCriticas(); 