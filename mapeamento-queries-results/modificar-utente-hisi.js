const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function modificarUtenteHiSi() {
  let connection;
  
  try {
    try {
      oracledb.initOracleClient();
    } catch (err) {
      // Pode falhar se já estiver inicializado
    }

    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado ao Oracle');

    console.log('\n🔄 MODIFICANDO DOENTE EXISTENTE PARA "Utente HiSi"');
    console.log('=' .repeat(60));

    // Dados da candidata escolhida (baseado na análise anterior)
    const numSequencial = 74901;
    const episodio = 14002456;
    const nomeOriginal = 'MARIA CEU MAGALHAES CUNHA MARTINS VILELA';
    const novoNome = 'Utente HiSi';
    
    const hoje = new Date();
    const hojeFormatada = hoje.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`📋 DADOS DA MODIFICAÇÃO:`);
    console.log(`   NUM_SEQUENCIAL: ${numSequencial}`);
    console.log(`   EPISODIO: ${episodio}`);
    console.log(`   NOME ORIGINAL: ${nomeOriginal}`);
    console.log(`   NOVO NOME: ${novoNome}`);
    console.log(`   NOVA DATA: ${hojeFormatada}`);

    // 1. Verificar se a doente existe
    console.log('\n🔍 1. Verificando doente atual...');
    const verificaDoente = await connection.execute(
      `SELECT 
         d.NUM_SEQUENCIAL, d.NOME, d.DTA_REGISTO,
         e.EPISODIO, e.MODULO, e.DES_ESPECIALIDADE, e.DTA_EPISODIO
       FROM PCE.PCEDOENTES d
       JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
       WHERE d.NUM_SEQUENCIAL = :num_seq AND e.EPISODIO = :episodio`,
      { 
        num_seq: numSequencial,
        episodio: episodio
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!verificaDoente.rows || verificaDoente.rows.length === 0) {
      console.log('❌ Doente não encontrado!');
      return;
    }

    const doenteAtual = verificaDoente.rows[0];
    console.log(`   ✅ Doente encontrado: ${doenteAtual.NOME}`);
    console.log(`   📅 Data episódio atual: ${doenteAtual.DTA_EPISODIO}`);
    console.log(`   🏥 Especialidade: ${doenteAtual.DES_ESPECIALIDADE}`);

    // 2. Verificar se já existe "Utente HiSi"
    console.log('\n🔍 2. Verificando se "Utente HiSi" já existe...');
    const verificaHiSi = await connection.execute(
      `SELECT NUM_SEQUENCIAL, NOME FROM PCE.PCEDOENTES WHERE NOME = :nome`,
      { nome: novoNome },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (verificaHiSi.rows && verificaHiSi.rows.length > 0) {
      console.log('⚠️  "Utente HiSi" já existe!');
      verificaHiSi.rows.forEach(utente => {
        console.log(`   ${utente.NUM_SEQUENCIAL}: ${utente.NOME}`);
      });
      
      // Se já existe, vamos apenas atualizar a data do episódio existente
      const utenteExistente = verificaHiSi.rows[0];
      console.log(`\n🔄 Atualizando data do episódio existente...`);
      
      // Buscar episódio BLO do utente existente
      const episodioExistente = await connection.execute(
        `SELECT EPISODIO, DTA_EPISODIO, DES_ESPECIALIDADE 
         FROM PCE.PCEEPISODIOS 
         WHERE NUM_SEQUENCIAL = :num_seq AND MODULO = 'BLO'`,
        { num_seq: utenteExistente.NUM_SEQUENCIAL },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (episodioExistente.rows && episodioExistente.rows.length > 0) {
        const ep = episodioExistente.rows[0];
        console.log(`   📅 Atualizando episódio ${ep.EPISODIO} de ${ep.DTA_EPISODIO} para hoje`);
        
        await connection.execute(
          `UPDATE PCE.PCEEPISODIOS 
           SET DTA_EPISODIO = TO_DATE(:nova_data, 'YYYY-MM-DD')
           WHERE EPISODIO = :episodio`,
          {
            nova_data: hojeFormatada,
            episodio: ep.EPISODIO
          }
        );
        
        await connection.commit();
        console.log('✅ Data atualizada com sucesso!');
        
        // Verificar resultado
        await verificarResultado(connection, utenteExistente.NUM_SEQUENCIAL, ep.EPISODIO);
        return;
      }
    }

    // 3. Fazer as atualizações
    console.log('\n💾 3. Aplicando modificações...');
    
    // Atualizar nome do doente
    console.log('   📝 Atualizando nome...');
    await connection.execute(
      `UPDATE PCE.PCEDOENTES SET NOME = :novo_nome WHERE NUM_SEQUENCIAL = :num_seq`,
      {
        novo_nome: novoNome,
        num_seq: numSequencial
      }
    );
    console.log('   ✅ Nome atualizado');

    // Atualizar data do episódio
    console.log('   📅 Atualizando data do episódio...');
    await connection.execute(
      `UPDATE PCE.PCEEPISODIOS 
       SET DTA_EPISODIO = TO_DATE(:nova_data, 'YYYY-MM-DD')
       WHERE EPISODIO = :episodio`,
      {
        nova_data: hojeFormatada,
        episodio: episodio
      }
    );
    console.log('   ✅ Data do episódio atualizada');

    // 4. Confirmar transação
    await connection.commit();
    console.log('\n🎉 MODIFICAÇÕES CONFIRMADAS!');

    // 5. Verificar resultado
    await verificarResultado(connection, numSequencial, episodio);

  } catch (error) {
    console.error('\n❌ Erro ao modificar utente:', error);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Transação revertida');
      } catch (rollbackError) {
        console.error('Erro ao reverter transação:', rollbackError);
      }
    }
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

async function verificarResultado(connection, numSequencial, episodio) {
  console.log('\n🔍 VERIFICAÇÃO DO RESULTADO:');
  
  const resultado = await connection.execute(
    `SELECT 
       d.NUM_SEQUENCIAL, d.NOME, d.SEXO, d.DTA_NASCIMENTO,
       e.EPISODIO, e.MODULO, e.DES_ESPECIALIDADE, e.DTA_EPISODIO, e.HORA_EPISODIO
     FROM PCE.PCEDOENTES d
     JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
     WHERE d.NUM_SEQUENCIAL = :num_seq AND e.EPISODIO = :episodio`,
    { 
      num_seq: numSequencial,
      episodio: episodio
    },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  if (resultado.rows && resultado.rows.length > 0) {
    const r = resultado.rows[0];
    console.log('✅ MODIFICAÇÃO CONFIRMADA:');
    console.log(`   👤 DOENTE: ${r.NUM_SEQUENCIAL} - ${r.NOME}`);
    console.log(`   🏥 EPISODIO: ${r.EPISODIO} (${r.MODULO})`);
    console.log(`   🔬 ESPECIALIDADE: ${r.DES_ESPECIALIDADE}`);
    console.log(`   📅 DATA: ${r.DTA_EPISODIO}`);
    console.log(`   🕐 HORA: ${r.HORA_EPISODIO}`);
    
    console.log('\n🚀 PRONTO PARA TESTAR PROTOCOLOS!');
    console.log(`   🌐 URL: http://10.21.101.246:3000/?modulo=CIR`);
    console.log(`   🔍 Procura por: "Utente HiSi"`);
    console.log(`   📋 Episódio: ${r.EPISODIO}`);
    
    // Verificar se aparece na API
    console.log('\n📡 TESTE RÁPIDO - Verificar se aparece na query do frontend:');
    const dataFormatada = r.DTA_EPISODIO.toISOString().split('T')[0];
    console.log(`   📅 Data para filtro: ${dataFormatada}`);
    
    // Simular query do frontend
    const testeQuery = await connection.execute(
      `SELECT 
         d.NUM_SEQUENCIAL, d.NOME,
         e.EPISODIO, e.MODULO, e.DES_ESPECIALIDADE, e.DTA_EPISODIO
       FROM PCE.PCEDOENTES d
       JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
       WHERE e.MODULO = 'BLO'
         AND (UPPER(e.DES_ESPECIALIDADE) LIKE '%CIRURG%' OR UPPER(e.DES_ESPECIALIDADE) LIKE '%ANEST%')
         AND e.DTA_EPISODIO = TO_DATE(:data, 'YYYY-MM-DD')
       ORDER BY e.DTA_EPISODIO DESC`,
      { data: dataFormatada },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (testeQuery.rows && testeQuery.rows.length > 0) {
      console.log(`   ✅ Aparece na query da Cirurgia! (${testeQuery.rows.length} registos encontrados)`);
      testeQuery.rows.forEach(paciente => {
        console.log(`      ${paciente.NOME} - ${paciente.DES_ESPECIALIDADE}`);
      });
    } else {
      console.log(`   ⚠️  Não aparece na query da Cirurgia (pode precisar de filtro de data específico)`);
    }
    
  } else {
    console.log('❌ Erro na verificação - doente não encontrado');
  }
}

modificarUtenteHiSi();