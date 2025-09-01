const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function testeSimples() {
  let connection;
  
  try {
    console.log('🔍 Testando conexão...');
    
    try {
      oracledb.initOracleClient();
    } catch (err) {
      // Pode falhar se já estiver inicializado
    }

    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado ao Oracle');

    // Testar diretamente IDT189
    console.log('\n🔍 Testando protocolo IDT189:');
    const resultado = await connection.execute(
      `SELECT COUNT(*) as TOTAL FROM PRF_PROT_LIN WHERE COD_PROT = 'IDT189'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('Total de linhas:', resultado.rows[0].TOTAL);

    // Testar linhas específicas
    const linhas = await connection.execute(
      `SELECT COD_MED, DOSE, ESTADO FROM PRF_PROT_LIN WHERE COD_PROT = 'IDT189' AND ROWNUM <= 3`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('Primeiras 3 linhas:');
    linhas.rows.forEach(linha => {
      console.log(`  ${linha.COD_MED} - Dose: ${linha.DOSE} - Estado: ${linha.ESTADO}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Conexão fechada');
    }
  }
}

testeSimples();