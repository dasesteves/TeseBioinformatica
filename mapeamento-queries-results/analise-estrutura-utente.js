const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function analisarEstruturaUtente() {
  let connection;
  
  try {
    try {
      oracledb.initOracleClient();
    } catch (err) {
      // Pode falhar se já estiver inicializado
    }

    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado ao Oracle');

    console.log('\n🔍 ANALISANDO ESTRUTURA PARA CRIAR UTENTE DE TESTE:');
    console.log('=' .repeat(70));

    // 1. Analisar estrutura de PCEDOENTES
    console.log('\n1. ESTRUTURA DA TABELA PCEDOENTES:');
    const estruturaDoentes = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE, DATA_DEFAULT 
       FROM ALL_TAB_COLUMNS 
       WHERE TABLE_NAME = 'PCEDOENTES' AND OWNER = 'PCE'
       ORDER BY COLUMN_ID`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('   Campos importantes:');
    estruturaDoentes.rows.forEach(col => {
      const nullable = col.NULLABLE === 'Y' ? 'Opcional' : 'OBRIGATÓRIO';
      const defaultVal = col.DATA_DEFAULT ? ` (Default: ${col.DATA_DEFAULT})` : '';
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} - ${nullable}${defaultVal}`);
    });

    // 2. Analisar estrutura de PCEEPISODIOS
    console.log('\n2. ESTRUTURA DA TABELA PCEEPISODIOS:');
    const estruturaEpisodios = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE, DATA_DEFAULT 
       FROM ALL_TAB_COLUMNS 
       WHERE TABLE_NAME = 'PCEEPISODIOS' AND OWNER = 'PCE'
       ORDER BY COLUMN_ID`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('   Campos importantes:');
    estruturaEpisodios.rows.forEach(col => {
      const nullable = col.NULLABLE === 'Y' ? 'Opcional' : 'OBRIGATÓRIO';
      const defaultVal = col.DATA_DEFAULT ? ` (Default: ${col.DATA_DEFAULT})` : '';
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} - ${nullable}${defaultVal}`);
    });

    // 3. Ver exemplos de doentes existentes no BLO
    console.log('\n3. EXEMPLOS DE DOENTES NO MÓDULO BLO:');
    const exemplosDoentes = await connection.execute(
      `SELECT 
         d.NUM_SEQUENCIAL as DOENTE, d.NOME, d.SEXO, d.DTA_NASCIMENTO as NASCIMENTO,
         e.EPISODIO, e.MODULO, e.DES_ESPECIALIDADE, e.COD_ESPECIALIDADE, e.DTA_EPISODIO
       FROM PCE.PCEDOENTES d
       JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
       WHERE e.MODULO = 'BLO'
       AND ROWNUM <= 3
       ORDER BY e.DTA_EPISODIO DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    exemplosDoentes.rows.forEach((exemplo, index) => {
      console.log(`\n   Exemplo ${index + 1}:`);
      console.log(`     DOENTE: ${exemplo.DOENTE}, NOME: ${exemplo.NOME}`);
      console.log(`     EPISODIO: ${exemplo.EPISODIO}, ESPECIALIDADE: ${exemplo.DES_ESPECIALIDADE}`);
      console.log(`     DTA_EPISODIO: ${exemplo.DTA_EPISODIO}`);
    });

    // 4. Ver próximos números disponíveis
    console.log('\n4. PRÓXIMOS NÚMEROS DISPONÍVEIS:');
    
    const maxDoente = await connection.execute(
      `SELECT MAX(NUM_SEQUENCIAL) + 1 as PROXIMO_DOENTE FROM PCE.PCEDOENTES`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const maxEpisodio = await connection.execute(
      `SELECT MAX(EPISODIO) + 1 as PROXIMO_EPISODIO FROM PCE.PCEEPISODIOS`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`   Próximo DOENTE: ${maxDoente.rows[0].PROXIMO_DOENTE}`);
    console.log(`   Próximo EPISODIO: ${maxEpisodio.rows[0].PROXIMO_EPISODIO}`);

    // 5. Ver especialidades disponíveis para BLO
    console.log('\n5. ESPECIALIDADES DISPONÍVEIS PARA BLO:');
    const especialidades = await connection.execute(
      `SELECT DISTINCT COD_ESPECIALIDADE, DES_ESPECIALIDADE 
       FROM PCE.PCEEPISODIOS 
       WHERE MODULO = 'BLO' 
       AND DES_ESPECIALIDADE IS NOT NULL
       ORDER BY DES_ESPECIALIDADE`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    especialidades.rows.forEach(esp => {
      console.log(`   ${esp.COD_ESPECIALIDADE}: ${esp.DES_ESPECIALIDADE}`);
    });

    // 6. Ver sequências (se existirem)
    console.log('\n6. VERIFICAR SEQUÊNCIAS:');
    try {
      const sequencias = await connection.execute(
        `SELECT SEQUENCE_NAME, LAST_NUMBER 
         FROM USER_SEQUENCES 
         WHERE SEQUENCE_NAME LIKE '%DOENTE%' OR SEQUENCE_NAME LIKE '%EPISODIO%'`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (sequencias.rows && sequencias.rows.length > 0) {
        sequencias.rows.forEach(seq => {
          console.log(`   ${seq.SEQUENCE_NAME}: próximo valor = ${seq.LAST_NUMBER + 1}`);
        });
      } else {
        console.log('   Nenhuma sequência encontrada para DOENTE/EPISODIO');
      }
    } catch (error) {
      console.log('   Erro ao verificar sequências (podem não existir)');
    }

    console.log('\n✅ Análise concluída!');

  } catch (error) {
    console.error('\n❌ Erro durante a análise:', error);
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

analisarEstruturaUtente();