const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function investigarPrfProtLin() {
  let connection;
  
  try {
    // Configurar o Oracle para usar Thick Client mode
    try {
      oracledb.initOracleClient();
    } catch (err) {
      // Pode falhar se já estiver inicializado
    }

    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado ao Oracle');

    console.log('\n🔍 INVESTIGANDO TABELA PRF_PROT_LIN (Linhas de Protocolos):');
    console.log('=' .repeat(60));

    // 1. Verificar estrutura da tabela PRF_PROT_LIN
    console.log('\n1. Estrutura da tabela PRF_PROT_LIN:');
    const estruturaPrfProtLin = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
       FROM USER_TAB_COLUMNS 
       WHERE TABLE_NAME = 'PRF_PROT_LIN'
       ORDER BY COLUMN_ID`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('🏗️ Colunas da tabela PRF_PROT_LIN:');
    if (estruturaPrfProtLin.rows) {
      estruturaPrfProtLin.rows.forEach(col => {
        console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.NULLABLE === 'Y' ? '(NULL)' : '(NOT NULL)'}`);
      });
    }

    // 2. Verificar exemplos de dados em PRF_PROT_LIN
    console.log('\n2. Exemplos de dados em PRF_PROT_LIN:');
    try {
      const exemplosPrfProtLin = await connection.execute(
        `SELECT * FROM PRF_PROT_LIN WHERE ROWNUM <= 10`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (exemplosPrfProtLin.rows && exemplosPrfProtLin.rows.length > 0) {
        console.log('📦 Exemplos de linhas de protocolo:');
        exemplosPrfProtLin.rows.forEach((lin, index) => {
          console.log(`\n   ${index + 1}. Linha de protocolo:`);
          Object.keys(lin).forEach(key => {
            console.log(`      ${key}: ${lin[key]}`);
          });
        });
      }
    } catch (error) {
      console.log('❌ Erro ao buscar exemplos:', error.message);
    }

    // 3. Verificar se os códigos IDT* dos protocolos têm linhas associadas
    console.log('\n3. Verificando linhas para protocolos IDT*:');
    const protocolosIDT = ['IDT057', 'IDT134A', 'IDT134B', 'IDT134C', 'IDT189'];
    
    for (const protocoloCode of protocolosIDT) {
      console.log(`\n   🔍 Protocolo ${protocoloCode}:`);
      try {
        const linhasProtocolo = await connection.execute(
          `SELECT * FROM PRF_PROT_LIN WHERE COD_PROT = :codigo`,
          { codigo: protocoloCode },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (linhasProtocolo.rows && linhasProtocolo.rows.length > 0) {
          console.log(`      Encontradas ${linhasProtocolo.rows.length} linhas:`);
          linhasProtocolo.rows.forEach((linha, idx) => {
            console.log(`         ${idx + 1}. `, Object.fromEntries(Object.entries(linha).slice(0, 5)));
            // Mostrar só as primeiras 5 propriedades para não poluir muito
          });
        } else {
          console.log(`      Nenhuma linha encontrada`);
        }
      } catch (error) {
        console.log(`      ❌ Erro: ${error.message}`);
      }
    }

    // 4. Verificar padrões nos artigos em PRF_PROT_LIN
    console.log('\n4. Analisando padrões de artigos em PRF_PROT_LIN:');
    try {
      const padroesPrfProtLin = await connection.execute(
        `SELECT 
           SUBSTR(COD_ARTIGO, 1, 3) as PREFIXO,
           COUNT(*) as QUANTIDADE,
           MIN(COD_ARTIGO) as EXEMPLO_MIN,
           MAX(COD_ARTIGO) as EXEMPLO_MAX
         FROM PRF_PROT_LIN 
         WHERE COD_ARTIGO IS NOT NULL
         GROUP BY SUBSTR(COD_ARTIGO, 1, 3)
         ORDER BY COUNT(*) DESC`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (padroesPrfProtLin.rows && padroesPrfProtLin.rows.length > 0) {
        console.log('📊 Padrões de códigos de artigos:');
        padroesPrfProtLin.rows.forEach(padrao => {
          console.log(`   ${padrao.PREFIXO}*: ${padrao.QUANTIDADE} artigos (ex: ${padrao.EXEMPLO_MIN} - ${padrao.EXEMPLO_MAX})`);
        });
      }
    } catch (error) {
      console.log('❌ Erro ao analisar padrões:', error.message);
    }

    // 5. Verificar se existem relações com outras tabelas
    console.log('\n5. Verificando relações com outras tabelas de artigos:');
    try {
      // Verificar alguns códigos de artigo específicos de PRF_PROT_LIN em outras tabelas
      const artigosExemplo = await connection.execute(
        `SELECT DISTINCT COD_ARTIGO FROM PRF_PROT_LIN WHERE ROWNUM <= 5`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (artigosExemplo.rows && artigosExemplo.rows.length > 0) {
        for (const artigo of artigosExemplo.rows) {
          console.log(`\n   🔍 Artigo ${artigo.COD_ARTIGO}:`);
          
          // Verificar em PRF_MEDICAMENTOS
          try {
            const medicamento = await connection.execute(
              `SELECT CODIGO, DESC_C, STOCK_ATUAL FROM PRF_MEDICAMENTOS WHERE CODIGO = :codigo`,
              { codigo: artigo.COD_ARTIGO },
              { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (medicamento.rows && medicamento.rows.length > 0) {
              console.log(`      📦 Medicamento: ${medicamento.rows[0].DESC_C} (Stock: ${medicamento.rows[0].STOCK_ATUAL})`);
            } else {
              console.log(`      ❌ Não encontrado em PRF_MEDICAMENTOS`);
            }
          } catch (error) {
            console.log(`      ❌ Erro ao verificar medicamento: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('❌ Erro ao verificar relações:', error.message);
    }

    console.log('\n✅ Investigação de PRF_PROT_LIN concluída!');

  } catch (error) {
    console.error('\n❌ Erro durante a investigação:', error);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('\n🔌 Conexão fechada');
      } catch (error) {
        console.error('Erro ao fechar conexão:', error);
      }
    }
  }
}

// Executar a investigação
investigarPrfProtLin();