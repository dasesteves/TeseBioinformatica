const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function debugProtocolosCount() {
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

    console.log('\n🔍 DEBUG: POR QUE SÓ ALGUMAS ESPECIALIDADES MOSTRAM "APLICAR PROTOCOLO"?');
    console.log('=' .repeat(70));

    // 1. Simular a query exata da API /api/pacientes com CIR
    console.log('\n1️⃣ SIMULANDO QUERY DA API /api/pacientes?modulo=CIR:');
    console.log('-' .repeat(50));
    
    const queryAPI = await connection.execute(
      `SELECT 
        EPISODIO,
        doentes.NUM_SEQUENCIAL as NUM_SEQUENCIAL,
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
        (SELECT COUNT(*)
         FROM CSU_EPENTIDADEACTOS P
         WHERE P.EPISODIO = episodios.EPISODIO
           AND P.MODULO = 'BLO'
           AND P.CDU_CSU_ACTOID IN (
             SELECT COD_PROT FROM PRF_PROTOCOLOS WHERE ESTADO = 1
           )) AS PROTOCOLOS_COUNT
       FROM PCEEPISODIOS episodios
       INNER JOIN PCEDOENTES doentes on episodios.NUM_SEQUENCIAL = doentes.NUM_SEQUENCIAL
       WHERE DTA_EPISODIO >= to_date('2025-07-05', 'YYYY-MM-DD')
         AND DTA_EPISODIO <= to_date('2025-08-05', 'YYYY-MM-DD')
         AND MODULO = 'BLO'
       ORDER BY NOME`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`Total de episódios retornados: ${queryAPI.rows.length}`);
    
    // Mostrar primeiros 10 resultados
    console.log('\n📊 PRIMEIROS 10 EPISÓDIOS (como a API retorna):');
    queryAPI.rows.slice(0, 10).forEach((row, index) => {
      console.log(`${index + 1}. ${row.NOME}`);
      console.log(`   Episódio: ${row.EPISODIO} | Especialidade: ${row.DES_ESPECIALIDADE}`);
      console.log(`   Tratamentos: ${row.CSU_EPENTIDADEACTOS_COUNT} | Protocolos: ${row.PROTOCOLOS_COUNT}`);
      console.log(`   Data: ${row.DTA_EPISODIO}`);
      console.log('');
    });

    // 2. Verificar especificamente os episódios do print
    console.log('\n2️⃣ VERIFICANDO EPISÓDIOS ESPECÍFICOS DO PRINT:');
    console.log('-' .repeat(50));
    
    const episodiosEspecificos = [
      '18032118', // AMERICO MIGUEL MOTA FERNANDES - CIRURGIA GERAL
      '18031994', // ANA FRANCISCA CAMPINHO PINTO - ORTORRINOLARINGOLOGIA 
      '18032133', // ANA ISABEL VELOSO OLIVEIRA - CIRURGIA VASCULAR
      '18032225', // ANA MARIA COSTA PEREIRA - CIRURGIA PLASTICA
      '18032140', // ANA OLIVEIRA ASCENCAO - OFTALMOLOGIA
    ];

    for (const episodio of episodiosEspecificos) {
      const resultado = await connection.execute(
        `SELECT 
          EPISODIO,
          DES_ESPECIALIDADE,
          (SELECT COUNT(*)
           FROM CSU_EPENTIDADEACTOS P
           WHERE P.EPISODIO = episodios.EPISODIO
             AND P.MODULO = 'BLO'
             AND P.CDU_CSU_ACTOID IN (
               SELECT COD_PROT FROM PRF_PROTOCOLOS WHERE ESTADO = 1
             )) AS PROTOCOLOS_COUNT
        FROM PCE.PCEEPISODIOS episodios
        WHERE EPISODIO = :episodio`,
        { episodio },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (resultado.rows.length > 0) {
        const row = resultado.rows[0];
        console.log(`📋 Episódio ${episodio}:`);
        console.log(`   Especialidade: ${row.DES_ESPECIALIDADE}`);
        console.log(`   PROTOCOLOS_COUNT: ${row.PROTOCOLOS_COUNT}`);
        console.log(`   Status botão: ${row.PROTOCOLOS_COUNT > 0 ? 'Badge com contador' : 'Aplicar Protocolo Cirúrgico'}`);
      } else {
        console.log(`❌ Episódio ${episodio} não encontrado`);
      }
      console.log('');
    }

    // 3. Verificar se há protocolos aplicados no módulo BLO
    console.log('\n3️⃣ VERIFICANDO PROTOCOLOS JÁ APLICADOS NO BLO:');
    console.log('-' .repeat(50));
    
    const protocolosAplicados = await connection.execute(
      `SELECT 
        COUNT(*) as TOTAL_APLICADOS,
        COUNT(DISTINCT EPISODIO) as EPISODIOS_UNICOS
      FROM CSU_EPENTIDADEACTOS 
      WHERE MODULO = 'BLO'
        AND CDU_CSU_ACTOID IN (SELECT COD_PROT FROM PRF_PROTOCOLOS WHERE ESTADO = 1)`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`Total de protocolos aplicados no BLO: ${protocolosAplicados.rows[0].TOTAL_APLICADOS}`);
    console.log(`Episódios únicos com protocolos: ${protocolosAplicados.rows[0].EPISODIOS_UNICOS}`);

    // 4. Testar especificamente a subquery de contagem
    console.log('\n4️⃣ TESTANDO SUBQUERY DE CONTAGEM ISOLADAMENTE:');
    console.log('-' .repeat(50));
    
    for (const episodio of episodiosEspecificos) {
      const subqueryTest = await connection.execute(
        `SELECT COUNT(*) as COUNT_RESULT
         FROM CSU_EPENTIDADEACTOS P
         WHERE P.EPISODIO = :episodio
           AND P.MODULO = 'BLO'
           AND P.CDU_CSU_ACTOID IN (
             SELECT COD_PROT FROM PRF_PROTOCOLOS WHERE ESTADO = 1
           )`,
        { episodio },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      console.log(`Episódio ${episodio}: COUNT = ${subqueryTest.rows[0].COUNT_RESULT}`);
    }

    // 5. Verificar se o problema é nos códigos de protocolo
    console.log('\n5️⃣ VERIFICANDO CÓDIGOS DE PROTOCOLO VÁLIDOS:');
    console.log('-' .repeat(50));
    
    const codigosProtocolos = await connection.execute(
      `SELECT COD_PROT, DES_PROT 
       FROM PRF_PROTOCOLOS 
       WHERE ESTADO = 1 
       ORDER BY COD_PROT`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`Total de protocolos ativos: ${codigosProtocolos.rows.length}`);
    codigosProtocolos.rows.forEach((prot, index) => {
      console.log(`${index + 1}. ${prot.COD_PROT} - ${prot.DES_PROT}`);
    });

    // 6. Verificar se há dados em CSU_EPENTIDADEACTOS para BLO
    console.log('\n6️⃣ VERIFICANDO DADOS EM CSU_EPENTIDADEACTOS PARA BLO:');
    console.log('-' .repeat(50));
    
    const dadosBLO = await connection.execute(
      `SELECT 
        COUNT(*) as TOTAL_REGISTOS,
        COUNT(DISTINCT EPISODIO) as EPISODIOS_UNICOS,
        COUNT(DISTINCT CDU_CSU_ACTOID) as ACTOS_UNICOS,
        MIN(CDU_CSU_DATA) as DATA_MAIS_ANTIGA,
        MAX(CDU_CSU_DATA) as DATA_MAIS_RECENTE
      FROM CSU_EPENTIDADEACTOS 
      WHERE MODULO = 'BLO'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const stats = dadosBLO.rows[0];
    console.log(`Total de registos no módulo BLO: ${stats.TOTAL_REGISTOS}`);
    console.log(`Episódios únicos: ${stats.EPISODIOS_UNICOS}`);
    console.log(`Actos únicos: ${stats.ACTOS_UNICOS}`);
    console.log(`Data mais antiga: ${stats.DATA_MAIS_ANTIGA}`);
    console.log(`Data mais recente: ${stats.DATA_MAIS_RECENTE}`);

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

debugProtocolosCount();