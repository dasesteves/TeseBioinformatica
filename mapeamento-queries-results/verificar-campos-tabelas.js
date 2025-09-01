const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function verificarCampos(connection, tabela) {
  try {
    const result = await connection.execute(
      `SELECT 
        column_name,
        data_type,
        data_length,
        nullable
       FROM all_tab_columns
       WHERE table_name = :tabela 
         AND owner = 'PCE'
       ORDER BY column_id`,
      { tabela }
    );
    
    console.log(`\n=== ${tabela} ===`);
    console.log(`Total de colunas: ${result.rows.length}\n`);
    
    result.rows.forEach(col => {
      console.log(`${col[0].padEnd(30)} ${col[1].padEnd(15)} ${String(col[2]).padEnd(10)} ${col[3]}`);
    });
    
    // Verificar campos específicos
    const camposInteresse = ['NISS', 'NUM_BENEF', 'NUM_IDENT', 'TELEFONE', 'TELEMOVEL', 'ESTADO', 'COD_MEDICO'];
    console.log('\nCampos de interesse encontrados:');
    result.rows.forEach(col => {
      if (camposInteresse.some(campo => col[0].includes(campo))) {
        console.log(`✓ ${col[0]}`);
      }
    });
    
  } catch (err) {
    console.error(`Erro ao verificar ${tabela}:`, err.message);
  }
}

async function main() {
  let connection;
  
  try {
    console.log('Verificando campos das tabelas...\n');
    connection = await oracledb.getConnection(dbConfig);
    
    // Verificar PCEDOENTES
    await verificarCampos(connection, 'PCEDOENTES');
    
    // Verificar PCEEPISODIOS
    await verificarCampos(connection, 'PCEEPISODIOS');
    
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

main(); 