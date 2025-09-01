const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function investigarEstruturaArtigos() {
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

    console.log('\n🔍 INVESTIGANDO ESTRUTURA DE ARTIGOS:');
    console.log('=' .repeat(60));

    // 1. Verificar estrutura da tabela CSU_EPENTIDADEACTOGASTOS
    console.log('\n1. Estrutura da tabela CSU_EPENTIDADEACTOGASTOS:');
    const estruturaGastos = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
       FROM USER_TAB_COLUMNS 
       WHERE TABLE_NAME = 'CSU_EPENTIDADEACTOGASTOS'
       ORDER BY COLUMN_ID`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('🏗️ Colunas da tabela CSU_EPENTIDADEACTOGASTOS:');
    if (estruturaGastos.rows) {
      estruturaGastos.rows.forEach(col => {
        console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.NULLABLE === 'Y' ? '(NULL)' : '(NOT NULL)'}`);
      });
    }

    // 2. Verificar exemplos de dados em CSU_EPENTIDADEACTOGASTOS
    console.log('\n2. Exemplos de dados em CSU_EPENTIDADEACTOGASTOS:');
    try {
      const exemplosGastos = await connection.execute(
        `SELECT * FROM CSU_EPENTIDADEACTOGASTOS WHERE ROWNUM <= 5`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (exemplosGastos.rows && exemplosGastos.rows.length > 0) {
        console.log('📦 Exemplos de registos:');
        exemplosGastos.rows.forEach((reg, index) => {
          console.log(`\n   ${index + 1}. Registo:`);
          Object.keys(reg).forEach(key => {
            console.log(`      ${key}: ${reg[key]}`);
          });
        });
      }
    } catch (error) {
      console.log('❌ Erro ao buscar exemplos:', error.message);
    }

    // 3. Verificar estrutura da tabela ARTIGOCODBARRAS
    console.log('\n3. Estrutura da tabela ARTIGOCODBARRAS:');
    const estruturaArtigosCod = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
       FROM USER_TAB_COLUMNS 
       WHERE TABLE_NAME = 'ARTIGOCODBARRAS'
       ORDER BY COLUMN_ID`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('🏗️ Colunas da tabela ARTIGOCODBARRAS:');
    if (estruturaArtigosCod.rows) {
      estruturaArtigosCod.rows.forEach(col => {
        console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.NULLABLE === 'Y' ? '(NULL)' : '(NOT NULL)'}`);
      });
    }

    // 4. Procurar códigos IDT* na tabela ARTIGOCODBARRAS
    console.log('\n4. Procurando códigos IDT* na tabela ARTIGOCODBARRAS:');
    try {
      const artigosIDT = await connection.execute(
        `SELECT * FROM ARTIGOCODBARRAS WHERE ROWNUM <= 10`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (artigosIDT.rows && artigosIDT.rows.length > 0) {
        console.log('📦 Exemplos de artigos:');
        artigosIDT.rows.forEach((art, index) => {
          console.log(`\n   ${index + 1}. Artigo:`);
          Object.keys(art).forEach(key => {
            console.log(`      ${key}: ${art[key]}`);
          });
        });
      }
    } catch (error) {
      console.log('❌ Erro ao buscar artigos:', error.message);
    }

    // 5. Procurar outras tabelas que possam conter artigos IDT*
    console.log('\n5. Procurando outras tabelas com potenciais artigos:');
    const tabelasArtigos = await connection.execute(
      `SELECT TABLE_NAME FROM USER_TABLES 
       WHERE TABLE_NAME LIKE '%IDT%' 
          OR TABLE_NAME LIKE '%ITEM%' 
          OR TABLE_NAME LIKE '%PROD%'
          OR TABLE_NAME LIKE '%CAT%'
       ORDER BY TABLE_NAME`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('📋 Tabelas que podem conter artigos IDT:');
    if (tabelasArtigos.rows) {
      tabelasArtigos.rows.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
    }

    // 6. Se os códigos IDT são códigos de protocolo, verificar se há uma estrutura diferente
    console.log('\n6. Verificando se códigos IDT* são na verdade referências de protocolo:');
    
    // Verificar se existe relação entre protocolos e seus itens
    try {
      // Procurar tabelas relacionadas com protocolos
      const tabelasProtocolos = await connection.execute(
        `SELECT TABLE_NAME FROM USER_TABLES 
         WHERE TABLE_NAME LIKE '%PROT%' 
         ORDER BY TABLE_NAME`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      console.log('📋 Tabelas relacionadas com protocolos:');
      if (tabelasProtocolos.rows) {
        tabelasProtocolos.rows.forEach(table => {
          console.log(`   - ${table.TABLE_NAME}`);
        });
      }
    } catch (error) {
      console.log('❌ Erro ao buscar tabelas de protocolos:', error.message);
    }

    console.log('\n✅ Investigação de estrutura concluída!');

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
investigarEstruturaArtigos();