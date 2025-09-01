const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function verificarCamposMedicamentos() {
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

    console.log('\n🔍 VERIFICANDO ESTRUTURA DA TABELA PRF_MEDICAMENTOS:');
    console.log('=' .repeat(60));

    // Verificar campos da tabela PRF_MEDICAMENTOS
    const campos = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
       FROM USER_TAB_COLUMNS 
       WHERE TABLE_NAME = 'PRF_MEDICAMENTOS'
       ORDER BY COLUMN_ID`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('🏗️ Campos disponíveis na tabela PRF_MEDICAMENTOS:');
    if (campos.rows) {
      campos.rows.forEach(campo => {
        console.log(`   ${campo.COLUMN_NAME}: ${campo.DATA_TYPE} ${campo.NULLABLE === 'Y' ? '(NULL)' : '(NOT NULL)'}`);
      });
    }

    // Buscar alguns registos de exemplo
    console.log('\n📦 Exemplo de registos na tabela:');
    const exemplos = await connection.execute(
      `SELECT * FROM PRF_MEDICAMENTOS WHERE ROWNUM <= 3`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (exemplos.rows && exemplos.rows.length > 0) {
      console.log('Registos de exemplo:');
      exemplos.rows.forEach((reg, index) => {
        console.log(`\n   ${index + 1}. ${reg.CODIGO} - ${reg.DESC_C}`);
        Object.keys(reg).forEach(key => {
          if (key !== 'CODIGO' && key !== 'DESC_C') {
            console.log(`      ${key}: ${reg[key]}`);
          }
        });
      });
    }

    console.log('\n✅ Verificação completada!');

  } catch (error) {
    console.error('\n❌ Erro durante a verificação:', error);
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

// Executar a verificação
verificarCamposMedicamentos();