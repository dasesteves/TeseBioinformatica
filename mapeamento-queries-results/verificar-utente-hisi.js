const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function verificarUtenteHiSi() {
  let connection;
  
  try {
    try {
      oracledb.initOracleClient();
    } catch (err) {
      // Pode falhar se já estiver inicializado
    }

    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado ao Oracle');

    console.log('\n🔍 VERIFICAÇÃO FINAL DO "Utente HiSi"');
    console.log('=' .repeat(50));

    // 1. Buscar "Utente HiSi" específico
    console.log('\n1. 📋 DADOS DO UTENTE HISI:');
    const utenteHisi = await connection.execute(
      `SELECT 
         d.NUM_SEQUENCIAL, d.NOME, d.SEXO, d.DTA_NASCIMENTO,
         e.EPISODIO, e.MODULO, e.DES_ESPECIALIDADE, e.COD_ESPECIALIDADE,
         e.DTA_EPISODIO, e.HORA_EPISODIO
       FROM PCE.PCEDOENTES d
       JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
       WHERE d.NOME = 'Utente HiSi' AND e.MODULO = 'BLO'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (utenteHisi.rows && utenteHisi.rows.length > 0) {
      const utente = utenteHisi.rows[0];
      console.log(`   ✅ ENCONTRADO!`);
      console.log(`   👤 NUM_SEQUENCIAL: ${utente.NUM_SEQUENCIAL}`);
      console.log(`   📝 NOME: ${utente.NOME}`);
      console.log(`   🏥 EPISODIO: ${utente.EPISODIO}`);
      console.log(`   🔬 ESPECIALIDADE: ${utente.DES_ESPECIALIDADE} (${utente.COD_ESPECIALIDADE})`);
      console.log(`   📅 DATA_EPISODIO: ${utente.DTA_EPISODIO}`);
      console.log(`   🕐 HORA_EPISODIO: ${utente.HORA_EPISODIO}`);

      // 2. Verificar se aparece no filtro da data de hoje
      console.log('\n2. 🔍 TESTE NO FILTRO DE HOJE:');
      const hoje = new Date();
      const hojeFormatada = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
      console.log(`   📅 Data de hoje: ${hojeFormatada}`);

      const testeFiltroHoje = await connection.execute(
        `SELECT 
           d.NUM_SEQUENCIAL, d.NOME,
           e.EPISODIO, e.DES_ESPECIALIDADE, e.DTA_EPISODIO
         FROM PCE.PCEDOENTES d
         JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
         WHERE e.MODULO = 'BLO'
           AND (UPPER(e.DES_ESPECIALIDADE) LIKE '%CIRURG%' OR UPPER(e.DES_ESPECIALIDADE) LIKE '%ANEST%')
           AND e.DTA_EPISODIO = TO_DATE(:data, 'YYYY-MM-DD')
         ORDER BY d.NOME`,
        { data: hojeFormatada },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      console.log(`   📊 Encontrados ${testeFiltroHoje.rows ? testeFiltroHoje.rows.length : 0} registos para hoje:`);
      if (testeFiltroHoje.rows && testeFiltroHoje.rows.length > 0) {
        testeFiltroHoje.rows.forEach((paciente, index) => {
          const isHiSi = paciente.NOME === 'Utente HiSi' ? ' ⭐' : '';
          console.log(`     ${index + 1}. ${paciente.NOME} - ${paciente.DES_ESPECIALIDADE}${isHiSi}`);
        });
      }

      // Se não aparecer hoje, corrigir a data
      const apareceHoje = testeFiltroHoje.rows && testeFiltroHoje.rows.some(p => p.NOME === 'Utente HiSi');
      
      if (!apareceHoje) {
        console.log('\n⚠️  Utente HiSi não aparece na data de hoje. Corrigindo...');
        
        await connection.execute(
          `UPDATE PCE.PCEEPISODIOS 
           SET DTA_EPISODIO = TO_DATE(:nova_data, 'YYYY-MM-DD')
           WHERE EPISODIO = :episodio`,
          {
            nova_data: hojeFormatada,
            episodio: utente.EPISODIO
          }
        );
        
        await connection.commit();
        console.log(`   ✅ Data corrigida para ${hojeFormatada}`);
        
        // Verificar novamente
        const testeCorrigido = await connection.execute(
          `SELECT COUNT(*) as COUNT
           FROM PCE.PCEDOENTES d
           JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
           WHERE d.NOME = 'Utente HiSi' 
             AND e.MODULO = 'BLO'
             AND e.DTA_EPISODIO = TO_DATE(:data, 'YYYY-MM-DD')`,
          { data: hojeFormatada },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (testeCorrigido.rows[0].COUNT > 0) {
          console.log(`   ✅ Agora aparece na data de hoje!`);
        }
      } else {
        console.log(`   ✅ Utente HiSi já aparece na data de hoje!`);
      }

      // 3. Teste final da API
      console.log('\n3. 🌐 TESTE FINAL DA API:');
      console.log(`   URL para testar: http://10.21.101.246:3000/?modulo=CIR`);
      console.log(`   🔍 Filtro padrão (sem data): Deverá mostrar Utente HiSi`);
      console.log(`   📅 Com filtro de hoje (${hojeFormatada}): Deverá aparecer`);
      console.log(`   🔬 Especialidade: ${utente.DES_ESPECIALIDADE}`);
      console.log(`   📋 Episódio para protocolos: ${utente.EPISODIO}`);

      // 4. Verificar protocolos disponíveis
      console.log('\n4. 🧪 PROTOCOLOS DISPONÍVEIS PARA TESTE:');
      const protocolos = await connection.execute(
        `SELECT COD_PROT, DES_PROT, DES_COMP, ESTADO 
         FROM PRF_PROTOCOLOS 
         WHERE ESTADO = 1 
         ORDER BY DES_PROT`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (protocolos.rows && protocolos.rows.length > 0) {
        console.log(`   📊 ${protocolos.rows.length} protocolos ativos encontrados:`);
        protocolos.rows.slice(0, 5).forEach((prot, index) => {
          console.log(`     ${index + 1}. ${prot.COD_PROT} - ${prot.DES_PROT}`);
        });
        if (protocolos.rows.length > 5) {
          console.log(`     ... e mais ${protocolos.rows.length - 5} protocolos`);
        }
      } else {
        console.log(`   ⚠️  Nenhum protocolo ativo encontrado`);
      }

    } else {
      console.log(`   ❌ "Utente HiSi" não encontrado!`);
    }

    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('\n❌ Erro na verificação:', error);
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

verificarUtenteHiSi();