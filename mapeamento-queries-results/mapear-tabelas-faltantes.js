const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Tabelas que provavelmente faltam mapear
const TABELAS_FALTANTES = {
  MEDH_ADICIONAIS: [
    'MEDH_FORMA_FARMACEUTICA',
    'MEDH_PRINCIPIO_ACTIVO',
    'MEDH_LABORATORIO',
    'MEDH_TITULAR_AIM',
    'MEDH_APRESENTACAO',
    'MEDH_COMPOSICAO',
    'MEDH_INDICACAO',
    'MEDH_CONTRA_INDICACAO',
    'MEDH_POSOLOGIA',
    'MEDH_INTERACOES',
    'MEDH_PRECAUCOES',
    'MEDH_GRUPOS_TERAPEUTICOS'
  ],
  
  PRF_ADICIONAIS: [
    'PRF_HORARIOS_ADMINISTRACAO',
    'PRF_DILUICOES',
    'PRF_COMPATIBILIDADES',
    'PRF_ESTABILIDADES',
    'PRF_ALERTAS_MEDICACAO',
    'PRF_STOCK_SERVICOS',
    'PRF_REQUISICOES'
  ],
  
  AUXILIARES_IMPORTANTES: [
    'ESPECIALIDADES',
    'ARMAZENS',
    'LOTES',
    'GRUPOS_FARMACOLOGICOS',
    'TIPOS_MOVIMENTO',
    'FORNECEDORES',
    'ALERGIAS_MEDICAMENTOS'
  ]
};

async function obterEstrutura(connection, tabela) {
  const estrutura = {
    nome: tabela,
    existe: false,
    colunas: [],
    totalRegistros: 0
  };
  
  try {
    // Verificar se existe
    const existeResult = await connection.execute(
      `SELECT COUNT(*) as EXISTE FROM all_tables WHERE table_name = :tabela AND owner = 'PCE'`,
      { tabela }
    );
    
    if (existeResult.rows[0].EXISTE === 0) {
      return estrutura;
    }
    
    estrutura.existe = true;
    
    // Obter colunas
    const colunasResult = await connection.execute(
      `SELECT 
        column_name,
        data_type,
        data_length,
        nullable
       FROM all_tab_columns
       WHERE table_name = :tabela AND owner = 'PCE'
       ORDER BY column_id`,
      { tabela }
    );
    
    estrutura.colunas = colunasResult.rows.map(col => ({
      nome: col.COLUMN_NAME,
      tipo: col.DATA_TYPE,
      tamanho: col.DATA_LENGTH,
      nullable: col.NULLABLE === 'Y'
    }));
    
    // Contar registros
    try {
      const countResult = await connection.execute(
        `SELECT COUNT(*) as TOTAL FROM PCE.${tabela}`
      );
      estrutura.totalRegistros = countResult.rows[0].TOTAL;
    } catch (err) {
      console.log(`  ⚠️  Erro ao contar registros de ${tabela}`);
    }
    
  } catch (err) {
    console.error(`  ❌ Erro ao processar ${tabela}: ${err.message}`);
  }
  
  return estrutura;
}

async function main() {
  let connection;
  
  try {
    console.log('MAPEAMENTO DE TABELAS FALTANTES\n');
    connection = await oracledb.getConnection(dbConfig);
    console.log('✓ Conectado com sucesso\n');
    
    const resultado = {
      timestamp: new Date().toISOString(),
      tabelasEncontradas: [],
      tabelasNaoEncontradas: []
    };
    
    for (const [grupo, tabelas] of Object.entries(TABELAS_FALTANTES)) {
      console.log(`\n=== ${grupo} ===\n`);
      
      for (const tabela of tabelas) {
        const estrutura = await obterEstrutura(connection, tabela);
        
        if (estrutura.existe) {
          console.log(`✓ ${tabela}: ${estrutura.totalRegistros} registros, ${estrutura.colunas.length} colunas`);
          resultado.tabelasEncontradas.push({
            grupo,
            ...estrutura
          });
          
          // Salvar arquivo individual apenas se existir
          const nomeArquivo = `tabela_PCE_${tabela}_NOVA.json`;
          fs.writeFileSync(
            path.join(__dirname, nomeArquivo),
            JSON.stringify(estrutura, null, 2)
          );
        } else {
          console.log(`❌ ${tabela}: Não existe`);
          resultado.tabelasNaoEncontradas.push({
            grupo,
            tabela
          });
        }
      }
    }
    
    // Resumo
    console.log('\n\nRESUMO:');
    console.log(`- Tabelas encontradas: ${resultado.tabelasEncontradas.length}`);
    console.log(`- Tabelas não encontradas: ${resultado.tabelasNaoEncontradas.length}`);
    
    // Salvar resultado
    fs.writeFileSync(
      path.join(__dirname, 'TABELAS_FALTANTES_RESULTADO.json'),
      JSON.stringify(resultado, null, 2)
    );
    
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

main(); 