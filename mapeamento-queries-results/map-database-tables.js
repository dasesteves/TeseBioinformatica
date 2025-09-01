const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

// Configuração da conexão (usando as mesmas configurações do sistema)
const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Lista de tabelas principais usadas no sistema
const tabelasPrincipais = [
  // Tabelas de actos e tratamentos
  'PCE.CSU_DEFACTOS',
  'PCE.CSU_DEFACTOSENTGASTOS',
  'CSU_EPENTIDADEACTOS',
  'CSU_EPENTIDADEACTOGASTOS',
  'CSU_TRATAMENTOS',
  
  // Tabelas de episódios e utentes
  'PCE.PCEEPISODIOS',
  'PCE.PCEUTENTES',
  
  // Tabelas de artigos e medicamentos
  'ARTIGOS',
  'PRF_MEDICAMENTOS',
  'MEDH_CARACTERIZACAO_V2',
  'MEDH_GFT',
  
  // Tabelas de utilizadores
  'UTILIZADORES',
  
  // Tabelas de farmácia
  'FARDISPENSAS',
  'FARDISPENSASMOV'
];

async function mapearTabelas() {
  let connection;
  
  try {
    console.log('Conectando à base de dados...');
    connection = await oracledb.getConnection(dbConfig);
    
    const resultados = {};
    
    for (const tabela of tabelasPrincipais) {
      console.log(`\nMapeando tabela: ${tabela}`);
      
      try {
        // Query para obter estrutura da tabela
        const result = await connection.execute(
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
          {
            tableName: tabela.includes('.') ? tabela.split('.')[1] : tabela,
            owner: tabela.includes('.') ? tabela.split('.')[0] : 'PCE'
          }
        );
        
        if (result.rows && result.rows.length > 0) {
          resultados[tabela] = {
            colunas: result.rows.map(row => ({
              nome: row[0],
              tipo: row[1],
              tamanho: row[2],
              nullable: row[3] === 'Y',
              default: row[4]
            }))
          };
          
          console.log(`✓ ${result.rows.length} colunas encontradas`);
          
          // Salvar resultado individual
          fs.writeFileSync(
            path.join(__dirname, `${tabela.replace(/\./g, '_')}.json`),
            JSON.stringify(resultados[tabela], null, 2)
          );
        } else {
          console.log(`✗ Tabela não encontrada ou sem acesso`);
          resultados[tabela] = { erro: 'Tabela não encontrada ou sem acesso' };
        }
        
      } catch (err) {
        console.error(`✗ Erro ao mapear tabela ${tabela}:`, err.message);
        resultados[tabela] = { erro: err.message };
      }
    }
    
    // Salvar resultado completo
    fs.writeFileSync(
      path.join(__dirname, 'mapeamento-completo.json'),
      JSON.stringify(resultados, null, 2)
    );
    
    console.log('\n✓ Mapeamento completo salvo em queries-results/mapeamento-completo.json');
    
    // Também vamos buscar alguns dados de exemplo de CSU_DEFACTOS
    console.log('\nBuscando dados de exemplo de CSU_DEFACTOS...');
    
    const exemploActos = await connection.execute(
      `SELECT * FROM PCE.CSU_DEFACTOS WHERE ROWNUM <= 5 ORDER BY CDU_CSU_ID`
    );
    
    if (exemploActos.metaData && exemploActos.rows) {
      const colunas = exemploActos.metaData.map(col => col.name);
      const dados = exemploActos.rows.map(row => {
        const obj = {};
        colunas.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
      
      fs.writeFileSync(
        path.join(__dirname, 'exemplo-CSU_DEFACTOS.json'),
        JSON.stringify({ colunas, dados }, null, 2)
      );
      
      console.log('✓ Exemplos salvos em queries-results/exemplo-CSU_DEFACTOS.json');
    }
    
  } catch (err) {
    console.error('Erro fatal:', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('\n✓ Conexão fechada');
      } catch (err) {
        console.error('Erro ao fechar conexão:', err);
      }
    }
  }
}

// Executar o mapeamento
mapearTabelas(); 