const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function testarStatusExportacao() {
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

    console.log('\n🔍 TESTANDO NOVA QUERY COM TRATAMENTOS_EXPORT_STATUS:');
    console.log('=' .repeat(60));

    // Testar a query exata que está na API
    const result = await connection.execute(
      `select EPISODIO,
              doentes.NUM_SEQUENCIAL              as NUM_SEQUENCIAL,
              DTA_EPISODIO,
              HORA_EPISODIO,
              DES_ESPECIALIDADE,
              COD_ESPECIALIDADE,
              NUM_PROCESSO,
              NOME,
              (SELECT COUNT(*)
               FROM CSU_EPENTIDADEACTOS C
               WHERE C.EPISODIO = episodios.EPISODIO
                 and c.MODULO = episodios.MODULO) AS CSU_EPENTIDADEACTOS_COUNT,
              -- Status de exportação: 0=sem tratamentos, 1=todos OK, 2=alguns falharam, 3=todos falharam
              (CASE
                 WHEN (SELECT COUNT(*) FROM CSU_EPENTIDADEACTOS C 
                       WHERE C.EPISODIO = episodios.EPISODIO AND c.MODULO = episodios.MODULO) = 0 THEN 0
                 WHEN (SELECT COUNT(*) FROM CSU_EPENTIDADEACTOS C 
                       WHERE C.EPISODIO = episodios.EPISODIO AND c.MODULO = episodios.MODULO AND C.ERRO IS NOT NULL) = 0 THEN 1
                 WHEN (SELECT COUNT(*) FROM CSU_EPENTIDADEACTOS C 
                       WHERE C.EPISODIO = episodios.EPISODIO AND c.MODULO = episodios.MODULO AND C.ERRO IS NOT NULL) = 
                      (SELECT COUNT(*) FROM CSU_EPENTIDADEACTOS C 
                       WHERE C.EPISODIO = episodios.EPISODIO AND c.MODULO = episodios.MODULO) THEN 3
                 ELSE 2 
               END) AS TRATAMENTOS_EXPORT_STATUS,
              0 AS PROTOCOLOS_COUNT
       from PCEEPISODIOS episodios
                inner join PCEDOENTES doentes on episodios.NUM_SEQUENCIAL = doentes.NUM_SEQUENCIAL
       where DTA_EPISODIO = to_date('2025-08-05', 'YYYY-MM-DD')
         and MODULO = 'URG'
       order by NOME`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`📊 Total de episódios retornados: ${result.rows.length}`);
    
    // Mostrar primeiros 10 resultados com foco no status
    console.log('\n📋 PRIMEIROS 10 EPISÓDIOS COM STATUS:');
    result.rows.slice(0, 10).forEach((row, index) => {
      console.log(`${index + 1}. ${row.NOME}`);
      console.log(`   - Episódio: ${row.EPISODIO}`);
      console.log(`   - Tratamentos: ${row.CSU_EPENTIDADEACTOS_COUNT}`);
      console.log(`   - Status Exportação: ${row.TRATAMENTOS_EXPORT_STATUS} (${typeof row.TRATAMENTOS_EXPORT_STATUS})`);
      console.log(`   - Protocolos: ${row.PROTOCOLOS_COUNT}`);
      console.log('');
    });

    // Estatísticas dos status
    const statusCounts = {};
    result.rows.forEach(row => {
      const status = row.TRATAMENTOS_EXPORT_STATUS;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📈 DISTRIBUIÇÃO DOS STATUS:');
    console.log('Status 0 (sem tratamentos):', statusCounts[0] || 0);
    console.log('Status 1 (todos OK):', statusCounts[1] || 0);
    console.log('Status 2 (alguns falharam):', statusCounts[2] || 0);
    console.log('Status 3 (todos falharam):', statusCounts[3] || 0);

    // Verificar casos específicos com tratamentos
    const comTratamentos = result.rows.filter(row => row.CSU_EPENTIDADEACTOS_COUNT > 0);
    console.log(`\n🎯 CASOS COM TRATAMENTOS (${comTratamentos.length}):`);
    comTratamentos.slice(0, 5).forEach((row, index) => {
      console.log(`${index + 1}. ${row.NOME} - ${row.CSU_EPENTIDADEACTOS_COUNT} tratamentos, Status: ${row.TRATAMENTOS_EXPORT_STATUS}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('\n🔐 Conexão fechada');
      } catch (error) {
        console.error('Erro ao fechar conexão:', error);
      }
    }
  }
}

testarStatusExportacao();