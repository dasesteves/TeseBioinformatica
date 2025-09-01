const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Configurações
const CONFIG = {
  TIMEOUT_MS: 30000,
  MAX_SAMPLE_ROWS: 3
};

async function descobrirTodasTabelas(connection) {
  console.log('\n🔍 DESCOBRINDO TODAS AS TABELAS DA BASE DE DADOS...\n');
  
  const query = `
    SELECT DISTINCT OWNER, TABLE_NAME 
    FROM ALL_TABLES 
    WHERE OWNER IN ('PCE', 'GESTAO', 'SYS') 
    AND TABLE_NAME NOT LIKE 'BIN$%'
    AND TABLE_NAME NOT LIKE '%$%'
    ORDER BY OWNER, TABLE_NAME
  `;
  
  const result = await connection.execute(query);
  
  const tabelas = result.rows.map(row => ({
    owner: row[0],
    table: row[1],
    fullName: `${row[0]}.${row[1]}`
  }));
  
  console.log(`📊 Total de tabelas encontradas: ${tabelas.length}`);
  console.log(`   - PCE: ${tabelas.filter(t => t.owner === 'PCE').length}`);
  console.log(`   - GESTAO: ${tabelas.filter(t => t.owner === 'GESTAO').length}`);
  console.log(`   - SYS: ${tabelas.filter(t => t.owner === 'SYS').length}`);
  
  return tabelas;
}

async function verificarTabelasJaMapeadas() {
  console.log('\n📋 VERIFICANDO TABELAS JÁ MAPEADAS...\n');
  
  const arquivosExistentes = fs.readdirSync(__dirname)
    .filter(file => file.startsWith('tabela_') && file.endsWith('.json'))
    .map(file => {
      const match = file.match(/tabela_(.+)\.json$/);
      return match ? match[1] : null;
    })
    .filter(Boolean);
  
  console.log(`✅ Encontrados ${arquivosExistentes.length} arquivos de tabelas já mapeadas`);
  
  return new Set(arquivosExistentes);
}

async function obterEstrutura(connection, owner, tableName) {
  const fullTableName = `${owner}.${tableName}`;
  
  try {
    // Timeout para operações lentas
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONFIG.TIMEOUT_MS)
    );
    
    // Obter estrutura das colunas
    const colunasQuery = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        DATA_LENGTH,
        DATA_PRECISION,
        DATA_SCALE,
        NULLABLE,
        DATA_DEFAULT,
        COLUMN_ID
      FROM ALL_TAB_COLUMNS 
      WHERE OWNER = :owner AND TABLE_NAME = :table
      ORDER BY COLUMN_ID
    `;
    
    const colunasResult = await Promise.race([
      connection.execute(colunasQuery, { owner, table: tableName }),
      timeoutPromise
    ]);
    
    const colunas = colunasResult.rows.map(row => ({
      nome: row[0],
      tipo: row[1],
      tamanho: row[2],
      precisao: row[3],
      escala: row[4],
      nullable: row[5] === 'Y',
      default: row[6],
      posicao: row[7]
    }));
    
    // Contar registros (com timeout)
    let totalRegistros = 0;
    try {
      const countResult = await Promise.race([
        connection.execute(`SELECT COUNT(*) FROM ${fullTableName}`),
        timeoutPromise
      ]);
      totalRegistros = countResult.rows[0][0];
    } catch (error) {
      console.log(`    ⚠️  Erro ao contar registros: ${error.message}`);
    }
    
    // Obter dados exemplo (apenas se houver registros)
    let exemplos = [];
    if (totalRegistros > 0 && totalRegistros < 10000) {
      try {
        const exemploQuery = `SELECT * FROM ${fullTableName} WHERE ROWNUM <= ${CONFIG.MAX_SAMPLE_ROWS}`;
        const exemploResult = await Promise.race([
          connection.execute(exemploQuery),
          timeoutPromise
        ]);
        
        exemplos = exemploResult.rows.map(row => {
          const obj = {};
          colunas.forEach((col, index) => {
            obj[col.nome] = row[index];
          });
          return obj;
        });
      } catch (error) {
        console.log(`    ⚠️  Erro ao obter exemplos: ${error.message}`);
      }
    }
    
    return {
      owner,
      table: tableName,
      colunas,
      totalRegistros,
      exemplos
    };
    
  } catch (error) {
    console.log(`    ❌ Erro ao processar ${fullTableName}: ${error.message}`);
    return null;
  }
}

async function mapearTabela(estrutura) {
  if (!estrutura) return;
  
  const fileName = `tabela_${estrutura.owner}_${estrutura.table}.json`;
  const filePath = path.join(__dirname, fileName);
  
  const dados = {
    dataHora: new Date().toISOString(),
    ...estrutura
  };
  
  fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), 'utf8');
  console.log(`📁 Salvo: ${fileName}`);
}

async function main() {
  let connection;
  
  try {
    console.log('🔌 Conectando à base de dados...');
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado com sucesso!\n');
    
    // Descobrir todas as tabelas
    const todasTabelas = await descobrirTodasTabelas(connection);
    
    // Verificar quais já foram mapeadas
    const tabelasMapeadas = await verificarTabelasJaMapeadas();
    
    // Filtrar tabelas que ainda não foram mapeadas
    const tabelasFaltantes = todasTabelas.filter(tabela => {
      const key = `${tabela.owner}_${tabela.table}`;
      return !tabelasMapeadas.has(key);
    });
    
    console.log(`\n🎯 TABELAS A MAPEAR: ${tabelasFaltantes.length}`);
    
    if (tabelasFaltantes.length === 0) {
      console.log('🎉 Todas as tabelas já foram mapeadas!');
      return;
    }
    
    // Processar tabelas em lotes
    const BATCH_SIZE = 5;
    for (let i = 0; i < tabelasFaltantes.length; i += BATCH_SIZE) {
      const lote = tabelasFaltantes.slice(i, i + BATCH_SIZE);
      
      console.log(`\n📦 PROCESSANDO LOTE ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(tabelasFaltantes.length/BATCH_SIZE)}`);
      
      for (const tabela of lote) {
        console.log(`  🔄 Mapeando ${tabela.fullName}...`);
        const estrutura = await obterEstrutura(connection, tabela.owner, tabela.table);
        
        if (estrutura) {
          await mapearTabela(estrutura);
          console.log(`    ✅ ${tabela.fullName}: ${estrutura.totalRegistros} registros, ${estrutura.colunas.length} colunas`);
        }
      }
    }
    
    console.log('\n🎉 Mapeamento completo!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('🔌 Conexão fechada');
      } catch (error) {
        console.error('❌ Erro ao fechar conexão:', error);
      }
    }
  }
}

main();
