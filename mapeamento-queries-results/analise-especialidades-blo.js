const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function analisarEspecialidadesBLO() {
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

    // 1. Listar todas as especialidades no módulo BLO
    console.log('\n🏥 ESPECIALIDADES NO MÓDULO BLO:');
    console.log('=' .repeat(50));
    
    const especialidadesBLO = await connection.execute(
      `SELECT 
        DES_ESPECIALIDADE,
        COUNT(*) as TOTAL_EPISODIOS
      FROM PCE.PCEEPISODIOS 
      WHERE MODULO = 'BLO'
        AND DTA_EPISODIO >= DATE '2025-01-01'  -- Episódios recentes
      GROUP BY DES_ESPECIALIDADE 
      ORDER BY TOTAL_EPISODIOS DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    especialidadesBLO.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.DES_ESPECIALIDADE} (${row.TOTAL_EPISODIOS} episódios)`);
    });

    // 2. Verificar quais têm protocolos
    console.log('\n💊 ESPECIALIDADES COM PROTOCOLOS DISPONÍVEIS:');
    console.log('=' .repeat(50));
    
    const especialidadesComProtocolos = await connection.execute(
      `SELECT DISTINCT
        e.DES_ESPECIALIDADE,
        COUNT(DISTINCT p.COD_PROT) as PROTOCOLOS_DISPONIVEIS
      FROM PCE.PCEEPISODIOS e
      LEFT JOIN PRF_PROTOCOLOS p ON (
        UPPER(p.DES_PROT) LIKE '%' || UPPER(e.DES_ESPECIALIDADE) || '%'
        OR UPPER(p.DES_PROT) LIKE '%CIRURG%'
        OR UPPER(p.DES_PROT) LIKE '%ANEST%'
      )
      WHERE e.MODULO = 'BLO'
        AND e.DTA_EPISODIO >= DATE '2025-01-01'
        AND p.ESTADO = 1
      GROUP BY e.DES_ESPECIALIDADE
      ORDER BY PROTOCOLOS_DISPONIVEIS DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    especialidadesComProtocolos.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.DES_ESPECIALIDADE} (${row.PROTOCOLOS_DISPONIVEIS} protocolos)`);
    });

    // 3. Verificar episódios com protocolos já aplicados
    console.log('\n🩺 EPISÓDIOS COM PROTOCOLOS JÁ APLICADOS:');
    console.log('=' .repeat(50));
    
    const episodiosComProtocolos = await connection.execute(
      `SELECT 
        e.DES_ESPECIALIDADE,
        COUNT(DISTINCT e.EPISODIO) as EPISODIOS_COM_PROTOCOLOS
      FROM PCE.PCEEPISODIOS e
      INNER JOIN CSU_EPENTIDADEACTOS a ON e.EPISODIO = a.EPISODIO
      INNER JOIN PRF_PROTOCOLOS p ON a.CDU_CSU_ACTOID = p.COD_PROT
      WHERE e.MODULO = 'BLO'
        AND a.MODULO = 'BLO'
        AND e.DTA_EPISODIO >= DATE '2025-01-01'
        AND p.ESTADO = 1
      GROUP BY e.DES_ESPECIALIDADE
      ORDER BY EPISODIOS_COM_PROTOCOLOS DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (episodiosComProtocolos.rows.length > 0) {
      episodiosComProtocolos.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.DES_ESPECIALIDADE} (${row.EPISODIOS_COM_PROTOCOLOS} episódios)`);
      });
    } else {
      console.log('Nenhum episódio com protocolos aplicados encontrado.');
    }

    // 4. Sugestão de filtro inteligente
    console.log('\n🎯 ANÁLISE PARA FILTRO INTELIGENTE:');
    console.log('=' .repeat(50));
    
    const filtroInteligente = await connection.execute(
      `SELECT 
        DES_ESPECIALIDADE,
        CASE 
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%' THEN 'CIRÚRGICA'
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%ANEST%' THEN 'ANESTESIA'
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%ORTOP%' THEN 'CIRÚRGICA'
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%GINEC%' THEN 'CIRÚRGICA'
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%OFTALM%' THEN 'CIRÚRGICA'
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%OTORINOLAR%' THEN 'CIRÚRGICA'
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%UROL%' THEN 'CIRÚRGICA'
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%CARDIO%' THEN 'CIRÚRGICA'
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%VASC%' THEN 'CIRÚRGICA'
          WHEN UPPER(DES_ESPECIALIDADE) LIKE '%PLAST%' THEN 'CIRÚRGICA'
          ELSE 'OUTRAS'
        END as CATEGORIA,
        COUNT(*) as TOTAL
      FROM PCE.PCEEPISODIOS 
      WHERE MODULO = 'BLO'
        AND DTA_EPISODIO >= DATE '2025-01-01'
      GROUP BY DES_ESPECIALIDADE
      ORDER BY CATEGORIA, TOTAL DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('Categorização sugerida:');
    filtroInteligente.rows.forEach((row) => {
      console.log(`${row.CATEGORIA}: ${row.DES_ESPECIALIDADE} (${row.TOTAL} episódios)`);
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

analisarEspecialidadesBLO();