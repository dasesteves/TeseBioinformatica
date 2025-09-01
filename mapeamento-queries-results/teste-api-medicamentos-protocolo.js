const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function testarAPIProtocoloMedicamentos() {
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

    console.log('\n🔍 TESTANDO ESTRUTURA DA NOVA API DE MEDICAMENTOS:');
    console.log('=' .repeat(60));

    // 1. Buscar um protocolo ativo para testar
    console.log('\n1. Buscando protocolo ativo para teste...');
    const protocolosAtivos = await connection.execute(
      `SELECT COD_PROT, DES_PROT, DOCS_LISTA, LISTA_SUSP, OBSERV
       FROM PRF_PROTOCOLOS 
       WHERE ESTADO = 1 AND DOCS_LISTA IS NOT NULL
       AND ROWNUM <= 3
       ORDER BY COD_PROT`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!protocolosAtivos.rows || protocolosAtivos.rows.length === 0) {
      console.log('❌ Nenhum protocolo ativo encontrado com medicamentos');
      return;
    }

    console.log(`📋 Encontrados ${protocolosAtivos.rows.length} protocolos ativos com medicamentos:`);
    protocolosAtivos.rows.forEach((prot, index) => {
      console.log(`   ${index + 1}. ${prot.COD_PROT} - ${prot.DES_PROT}`);
      console.log(`      Medicamentos: ${prot.DOCS_LISTA}`);
      if (prot.LISTA_SUSP) {
        console.log(`      Suspensos: ${prot.LISTA_SUSP}`);
      }
    });

    // 2. Testar processamento de medicamentos do primeiro protocolo
    const protocoloTeste = protocolosAtivos.rows[0];
    console.log(`\n2. Testando protocolo: ${protocoloTeste.COD_PROT} - ${protocoloTeste.DES_PROT}`);

    // Processar códigos de medicamentos incluídos
    let medicamentosIncluidos = [];
    if (protocoloTeste.DOCS_LISTA) {
      medicamentosIncluidos = protocoloTeste.DOCS_LISTA
        .split(',')
        .map(codigo => codigo.trim())
        .filter(codigo => codigo.length > 0);
    }

    console.log(`📦 Medicamentos incluídos (${medicamentosIncluidos.length}):`, medicamentosIncluidos);

    if (medicamentosIncluidos.length > 0) {
      // 3. Buscar informações detalhadas dos medicamentos
      console.log('\n3. Buscando informações detalhadas dos medicamentos...');
      
      const medicamentosPlaceholders = medicamentosIncluidos.map((_, index) => `:med${index}`).join(',');
      const medicamentosBinds = {};
      medicamentosIncluidos.forEach((codigo, index) => {
        medicamentosBinds[`med${index}`] = codigo;
      });

      const medicamentosQuery = await connection.execute(
        `SELECT 
           m.CODIGO,
           m.DESC_C as DESCRICAO,
           m.STOCK_ATUAL,
           m.MED_ALTO_RISCO,
           m.AFETA_STOCK,
           'un' as UNIDADE,
           NULL as PRECO_CUSTO,
           1 as QUANTIDADE_PADRAO
         FROM PRF_MEDICAMENTOS m
         WHERE m.CODIGO IN (${medicamentosPlaceholders})
         ORDER BY m.DESC_C`,
        medicamentosBinds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      console.log(`💊 Medicamentos encontrados na base de dados: ${medicamentosQuery.rows?.length || 0}`);
      
      if (medicamentosQuery.rows && medicamentosQuery.rows.length > 0) {
        console.log('\nDetalhes dos medicamentos:');
        medicamentosQuery.rows.forEach((med, index) => {
          console.log(`   ${index + 1}. ${med.CODIGO} - ${med.DESCRICAO}`);
          console.log(`      Stock: ${med.STOCK_ATUAL} ${med.UNIDADE || 'un'}`);
          console.log(`      Alto Risco: ${med.MED_ALTO_RISCO === 1 ? 'Sim' : 'Não'}`);
          console.log(`      Quantidade Padrão: ${med.QUANTIDADE_PADRAO}`);
          console.log(`      Preço: ${med.PRECO_CUSTO || 'N/A'}`);
        });

        // 4. Simular estrutura de resposta da API
        console.log('\n4. Simulando resposta da API...');
        const medicamentosProcessados = medicamentosQuery.rows.map(med => ({
          codigo: med.CODIGO,
          descricao: med.DESCRICAO,
          quantidade: med.QUANTIDADE_PADRAO || 1,
          unidade: med.UNIDADE || 'un',
          stock: med.STOCK_ATUAL,
          altoRisco: med.MED_ALTO_RISCO === 1 || med.MED_ALTO_RISCO === '1' || med.MED_ALTO_RISCO === 'True',
          afetaStock: med.AFETA_STOCK === 1 || med.AFETA_STOCK === '1',
          precoCusto: med.PRECO_CUSTO,
          isChecked: true,
          observacoes: null
        }));

        const responseSimulada = {
          protocolo: {
            codigo: protocoloTeste.COD_PROT,
            descricao: protocoloTeste.DES_PROT,
            observacoes: protocoloTeste.OBSERV
          },
          medicamentos: medicamentosProcessados,
          estatisticas: {
            totalMedicamentos: medicamentosProcessados.length,
            medicamentosAltoRisco: medicamentosProcessados.filter(m => m.altoRisco).length,
            medicamentosSemStock: medicamentosProcessados.filter(m => m.stock === 0).length
          }
        };

        console.log('\n📊 Resposta simulada da API:');
        console.log(JSON.stringify(responseSimulada, null, 2));

        // 5. Testar estrutura CSU_EPENTIDADEACTOGASTOS para protocolos personalizados
        console.log('\n5. Testando estrutura CSU_EPENTIDADEACTOGASTOS...');
        const estruturaGastos = await connection.execute(
          `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
           FROM USER_TAB_COLUMNS 
           WHERE TABLE_NAME = 'CSU_EPENTIDADEACTOGASTOS'
           ORDER BY COLUMN_ID`,
          {},
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log('🏗️ Estrutura da tabela CSU_EPENTIDADEACTOGASTOS:');
        estruturaGastos.rows?.forEach(col => {
          console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.NULLABLE === 'Y' ? '(NULL)' : '(NOT NULL)'}`);
        });
      }
    }

    console.log('\n✅ Teste da API de medicamentos completado com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
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

// Executar o teste
testarAPIProtocoloMedicamentos();