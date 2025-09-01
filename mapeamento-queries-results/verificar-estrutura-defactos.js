const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function verificarEstrutura() {
    let connection;
    
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        console.log('ESTRUTURA DA TABELA CSU_DEFACTOS:');
        console.log('='.repeat(50));
        
        const estrutura = await connection.execute(`
            SELECT column_name, data_type, data_length, nullable
            FROM user_tab_columns 
            WHERE table_name = 'CSU_DEFACTOS'
            ORDER BY column_id
        `);
        
        console.log('Coluna | Tipo | Tamanho | Nullable');
        console.log('-'.repeat(50));
        estrutura.rows.forEach(row => {
            const [coluna, tipo, tamanho, nullable] = row;
            console.log(`${coluna.padEnd(20)} | ${tipo.padEnd(10)} | ${tamanho?.toString().padEnd(7) || ''} | ${nullable}`);
        });
        
        console.log('\n\nAMOSTRA DE DADOS:');
        console.log('='.repeat(50));
        
        const amostra = await connection.execute(`
            SELECT * FROM (
                SELECT * FROM PCE.CSU_DEFACTOS 
                ORDER BY ROWNUM
            ) WHERE ROWNUM <= 3
        `);
        
        if (amostra.rows.length > 0) {
            console.log('Primeiros registos:');
            amostra.rows.forEach((row, index) => {
                console.log(`\nRegisto ${index + 1}:`);
                amostra.metaData.forEach((col, i) => {
                    const valor = row[i] === null ? 'NULL' : row[i].toString();
                    console.log(`  ${col.name}: ${valor}`);
                });
            });
        }
        
    } catch (err) {
        console.error('Erro:', err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

verificarEstrutura();