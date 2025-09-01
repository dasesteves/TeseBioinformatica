const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function mapearTabelasCSU() {
  let connection;
  
  try {
    console.log('Conectando à base de dados...');
    connection = await oracledb.getConnection(dbConfig);
    
    // Verificar owner correto das tabelas CSU
    console.log('\nBuscando tabelas CSU em todos os schemas...');
    
    const tabelasResult = await connection.execute(
      `SELECT owner, table_name 
       FROM all_tables 
       WHERE table_name LIKE 'CSU%' 
         AND (table_name LIKE '%ACTO%' OR table_name LIKE '%TRATAMENTO%')
       ORDER BY owner, table_name`
    );
    
    console.log('\nTabelas CSU encontradas:');
    if (tabelasResult.rows) {
      for (const [owner, table] of tabelasResult.rows) {
        console.log(`  ${owner}.${table}`);
      }
    }
    
    // Mapear estrutura das tabelas principais
    const tabelasParaMapear = [
      'CSU_EPENTIDADEACTOS',
      'CSU_EPENTIDADEACTOGASTOS',
      'CSU_TRATAMENTOS'
    ];
    
    for (const tabela of tabelasParaMapear) {
      console.log(`\n\nMapeando tabela: ${tabela}`);
      
      // Primeiro, verificar em qual schema está
      const ownerResult = await connection.execute(
        `SELECT owner FROM all_tables WHERE table_name = :tableName`,
        { tableName: tabela }
      );
      
      if (ownerResult.rows && ownerResult.rows.length > 0) {
        const owner = ownerResult.rows[0][0];
        console.log(`  Encontrada no schema: ${owner}`);
        
        // Buscar estrutura
        const estruturaResult = await connection.execute(
          `SELECT 
            column_name,
            data_type,
            data_length,
            nullable,
            data_default
          FROM all_tab_columns
          WHERE table_name = :tableName
            AND owner = :owner
          ORDER BY column_id`,
          { tableName: tabela, owner: owner }
        );
        
        if (estruturaResult.rows) {
          const colunas = estruturaResult.rows.map(row => ({
            nome: row[0],
            tipo: row[1],
            tamanho: row[2],
            nullable: row[3] === 'Y',
            default: row[4]
          }));
          
          fs.writeFileSync(
            path.join(__dirname, `${owner}_${tabela}.json`),
            JSON.stringify({ owner, tabela, colunas }, null, 2)
          );
          
          console.log(`  ✓ ${colunas.length} colunas mapeadas`);
        }
        
        // Buscar alguns dados de exemplo
        try {
          const exemploResult = await connection.execute(
            `SELECT * FROM ${owner}.${tabela} WHERE ROWNUM <= 3`
          );
          
          if (exemploResult.metaData && exemploResult.rows) {
            const colunas = exemploResult.metaData.map(col => col.name);
            const dados = exemploResult.rows.map(row => {
              const obj = {};
              colunas.forEach((col, idx) => {
                obj[col] = row[idx];
              });
              return obj;
            });
            
            fs.writeFileSync(
              path.join(__dirname, `exemplo-${owner}_${tabela}.json`),
              JSON.stringify({ colunas, dados }, null, 2)
            );
            
            console.log(`  ✓ ${dados.length} exemplos salvos`);
          }
        } catch (err) {
          console.log(`  ✗ Erro ao buscar exemplos: ${err.message}`);
        }
        
      } else {
        console.log(`  ✗ Tabela não encontrada`);
      }
    }
    
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✓ Conexão fechada');
    }
  }
}

mapearTabelasCSU(); 