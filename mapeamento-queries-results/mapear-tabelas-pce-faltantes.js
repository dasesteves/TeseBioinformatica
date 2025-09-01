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

async function descobrirTabelasPCE(connection) {
  console.log('\n🔍 DESCOBRINDO TABELAS PCE...\n');
  
  const query = `
    SELECT TABLE_NAME 
    FROM USER_TABLES 
    WHERE TABLE_NAME NOT LIKE 'BIN$%'
    ORDER BY TABLE_NAME
  `;
  
  const result = await connection.execute(query);
  
  const tabelas = result.rows.map(row => ({
    owner: 'PCE',
    table: row[0],
    fullName: `PCE.${row[0]}`
  }));
  
  console.log(`📊 Total de tabelas PCE encontradas: ${tabelas.length}`);
  
  return tabelas;
}

async function verificarTabelasJaMapeadas() {
  console.log('\n📋 VERIFICANDO TABELAS JÁ MAPEADAS...\n');
  
  const arquivosExistentes = fs.readdirSync(__dirname)
    .filter(file => file.startsWith('tabela_PCE_') && file.endsWith('.json'))
    .map(file => {
      const match = file.match(/tabela_PCE_(.+)\.json$/);
      return match ? match[1] : null;
    })
    .filter(Boolean);
  
  console.log(`✅ Encontrados ${arquivosExistentes.length} arquivos de tabelas PCE já mapeadas`);
  
  return new Set(arquivosExistentes);
}

async function obterEstrutura(connection, tableName) {
  const fullTableName = `PCE.${tableName}`;
  
  try {
    // Timeout para operações lentas
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONFIG.TIMEOUT_MS)
    );
    
    // Obter estrutura das colunas - sem usar bind variables para evitar erro ORA-01745
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
      FROM USER_TAB_COLUMNS 
      WHERE TABLE_NAME = '${tableName}'
      ORDER BY COLUMN_ID
    `;
    
    const colunasResult = await Promise.race([
      connection.execute(colunasQuery),
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
    if (totalRegistros > 0 && totalRegistros < 50000) {
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
      owner: 'PCE',
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
  
  const fileName = `tabela_PCE_${estrutura.table}.json`;
  const filePath = path.join(__dirname, fileName);
  
  // Função para serializar dados evitando estruturas circulares
  function serializarDados(obj, profundidade = 0) {
    if (profundidade > 3) return '[Dados muito profundos - truncados]';
    
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) return obj.toISOString();
    
    if (Array.isArray(obj)) {
      return obj.map(item => serializarDados(item, profundidade + 1));
    }
    
    const resultado = {};
    for (const [key, value] of Object.entries(obj)) {
      try {
        resultado[key] = serializarDados(value, profundidade + 1);
      } catch (error) {
        resultado[key] = `[Erro ao serializar: ${error.message}]`;
      }
    }
    return resultado;
  }
  
  const dados = {
    dataHora: new Date().toISOString(),
    owner: estrutura.owner,
    table: estrutura.table,
    colunas: estrutura.colunas,
    totalRegistros: estrutura.totalRegistros,
    exemplos: serializarDados(estrutura.exemplos)
  };
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), 'utf8');
    console.log(`📁 Salvo: ${fileName}`);
  } catch (error) {
    console.log(`    ⚠️  Erro ao salvar ${fileName}: ${error.message}`);
    // Tentar salvar sem exemplos
    const dadosSemExemplos = { ...dados, exemplos: [] };
    fs.writeFileSync(filePath, JSON.stringify(dadosSemExemplos, null, 2), 'utf8');
    console.log(`📁 Salvo (sem exemplos): ${fileName}`);
  }
}

async function gerarResumo(tabelasMapeadas) {
  console.log('\n📋 GERANDO RESUMO...\n');
  
  const resumo = {
    dataHora: new Date().toISOString(),
    totalTabelasMapeadas: tabelasMapeadas.length,
    tabelasComDados: tabelasMapeadas.filter(t => t.totalRegistros > 0),
    tabelasVazias: tabelasMapeadas.filter(t => t.totalRegistros === 0),
    estatisticas: {
      totalRegistros: tabelasMapeadas.reduce((acc, t) => acc + t.totalRegistros, 0),
      totalColunas: tabelasMapeadas.reduce((acc, t) => acc + t.colunas.length, 0)
    },
    tabelasPorTamanho: {
      pequenas: tabelasMapeadas.filter(t => t.totalRegistros > 0 && t.totalRegistros <= 1000).length,
      medias: tabelasMapeadas.filter(t => t.totalRegistros > 1000 && t.totalRegistros <= 50000).length,
      grandes: tabelasMapeadas.filter(t => t.totalRegistros > 50000).length
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'RESUMO_MAPEAMENTO_PCE.json'), 
    JSON.stringify(resumo, null, 2), 
    'utf8'
  );
  
  console.log(`📊 RESUMO DO MAPEAMENTO:`);
  console.log(`   - Total de tabelas: ${resumo.totalTabelasMapeadas}`);
  console.log(`   - Com dados: ${resumo.tabelasComDados.length}`);
  console.log(`   - Vazias: ${resumo.tabelasVazias.length}`);
  console.log(`   - Total de registros: ${resumo.estatisticas.totalRegistros.toLocaleString()}`);
  console.log(`   - Total de colunas: ${resumo.estatisticas.totalColunas}`);
}

async function main() {
  let connection;
  
  try {
    console.log('🔌 Conectando à base de dados PCE...');
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado com sucesso!\n');
    
    // Descobrir todas as tabelas PCE
    const todasTabelas = await descobrirTabelasPCE(connection);
    
    // Verificar quais já foram mapeadas
    const tabelasMapeadas = await verificarTabelasJaMapeadas();
    
    // Filtrar tabelas que ainda não foram mapeadas
    const tabelasFaltantes = todasTabelas.filter(tabela => {
      return !tabelasMapeadas.has(tabela.table);
    });
    
    console.log(`\n🎯 TABELAS PCE A MAPEAR: ${tabelasFaltantes.length}`);
    
    if (tabelasFaltantes.length === 0) {
      console.log('🎉 Todas as tabelas PCE já foram mapeadas!');
      return;
    }
    
    // Mostrar algumas tabelas que vão ser mapeadas
    console.log('\n📋 Primeiras 10 tabelas a mapear:');
    tabelasFaltantes.slice(0, 10).forEach((tabela, i) => {
      console.log(`   ${i + 1}. ${tabela.table}`);
    });
    
    // Processar tabelas em lotes
    const BATCH_SIZE = 3; // Lotes menores para melhor controlo
    const tabelasProcessadas = [];
    
    for (let i = 0; i < tabelasFaltantes.length; i += BATCH_SIZE) {
      const lote = tabelasFaltantes.slice(i, i + BATCH_SIZE);
      
      console.log(`\n📦 PROCESSANDO LOTE ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(tabelasFaltantes.length/BATCH_SIZE)}`);
      
      for (const tabela of lote) {
        console.log(`  🔄 Mapeando ${tabela.table}...`);
        const estrutura = await obterEstrutura(connection, tabela.table);
        
        if (estrutura) {
          await mapearTabela(estrutura);
          tabelasProcessadas.push(estrutura);
          console.log(`    ✅ ${tabela.table}: ${estrutura.totalRegistros.toLocaleString()} registros, ${estrutura.colunas.length} colunas`);
        }
      }
      
      // Pequena pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (tabelasProcessadas.length > 0) {
      await gerarResumo(tabelasProcessadas);
    }
    
    console.log('\n🎉 Mapeamento de tabelas PCE completo!');
    
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