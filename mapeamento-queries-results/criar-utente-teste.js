const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function criarUtenteHiSi() {
  let connection;
  
  try {
    try {
      oracledb.initOracleClient();
    } catch (err) {
      // Pode falhar se já estiver inicializado
    }

    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado ao Oracle');

    console.log('\n👤 CRIANDO UTENTE DE TESTE: "Utente HiSi"');
    console.log('=' .repeat(50));

    // Começar transação
    await connection.execute('BEGIN');

    // 1. Definir dados do utente
    const proximoDoente = 366666; // Baseado na análise anterior
    const proximoEpisodio = 18300000; // Baseado na análise anterior
    
    const dadosUtente = {
      NUM_SEQUENCIAL: proximoDoente,
      NOME: 'Utente HiSi',
      SEXO: 'M',
      DTA_NASCIMENTO: new Date('1990-01-01'),
      DTA_REGISTO: new Date(),
      MOR_MORADA: 'Rua de Teste, 123',
      LOC_MORADA: 'Braga',
      COD_POSTAL: 9999-999,
      DES_POSTAL: 'Teste',
      TEL_MORADAV2: '211234567',
      ESTADO_CIVIL: 'S', // Solteiro
      NUM_PROCESSO: proximoDoente + 1000000 // Número de processo fictício
    };

    const dadosEpisodio = {
      EPISODIO: proximoEpisodio,
      MODULO: 'BLO',
      NUM_SEQUENCIAL: proximoDoente,
      DTA_EPISODIO: new Date(),
      HORA_EPISODIO: 1000, // 10:00
      COD_ESPECIALIDADE: '3', // Cirurgia Plástica (exemplo)
      DES_ESPECIALIDADE: 'CIRURGIA PLASTICA',
      NUM_ORDEM: 1
    };

    console.log('\n📋 DADOS DO UTENTE:');
    console.log(`   NUM_SEQUENCIAL: ${dadosUtente.NUM_SEQUENCIAL}`);
    console.log(`   NOME: ${dadosUtente.NOME}`);
    console.log(`   SEXO: ${dadosUtente.SEXO}`);
    console.log(`   DATA_NASCIMENTO: ${dadosUtente.DTA_NASCIMENTO.toLocaleDateString('pt-PT')}`);
    console.log(`   MORADA: ${dadosUtente.MOR_MORADA}, ${dadosUtente.LOC_MORADA}`);
    console.log(`   TELEFONE: ${dadosUtente.TEL_MORADAV2}`);

    console.log('\n🏥 DADOS DO EPISÓDIO:');
    console.log(`   EPISODIO: ${dadosEpisodio.EPISODIO}`);
    console.log(`   MODULO: ${dadosEpisodio.MODULO}`);
    console.log(`   ESPECIALIDADE: ${dadosEpisodio.DES_ESPECIALIDADE}`);
    console.log(`   DATA_EPISODIO: ${dadosEpisodio.DTA_EPISODIO.toLocaleDateString('pt-PT')}`);

    // 2. Verificar se já existe
    console.log('\n🔍 Verificando se utente já existe...');
    const verificaUtente = await connection.execute(
      `SELECT COUNT(*) as COUNT FROM PCE.PCEDOENTES WHERE NOME = :nome`,
      { nome: dadosUtente.NOME },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (verificaUtente.rows[0].COUNT > 0) {
      console.log('⚠️  Utente "Utente HiSi" já existe na base de dados!');
      
      // Buscar dados existentes
      const utenteExistente = await connection.execute(
        `SELECT d.NUM_SEQUENCIAL, d.NOME, e.EPISODIO, e.MODULO, e.DES_ESPECIALIDADE
         FROM PCE.PCEDOENTES d
         LEFT JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL AND e.MODULO = 'BLO'
         WHERE d.NOME = :nome`,
        { nome: dadosUtente.NOME },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (utenteExistente.rows && utenteExistente.rows.length > 0) {
        const utente = utenteExistente.rows[0];
        console.log(`📋 UTENTE EXISTENTE:`);
        console.log(`   NUM_SEQUENCIAL: ${utente.NUM_SEQUENCIAL}`);
        console.log(`   NOME: ${utente.NOME}`);
        if (utente.EPISODIO) {
          console.log(`   EPISODIO BLO: ${utente.EPISODIO}`);
          console.log(`   ESPECIALIDADE: ${utente.DES_ESPECIALIDADE}`);
        } else {
          console.log(`   ⚠️  Sem episódio BLO - será criado um novo episódio`);
          
          // Criar só episódio BLO para utente existente
          await connection.execute(
            `INSERT INTO PCE.PCEEPISODIOS (
              EPISODIO, MODULO, NUM_SEQUENCIAL, DTA_EPISODIO, HORA_EPISODIO,
              COD_ESPECIALIDADE, DES_ESPECIALIDADE, NUM_ORDEM
            ) VALUES (
              :episodio, :modulo, :num_sequencial, :dta_episodio, :hora_episodio,
              :cod_especialidade, :des_especialidade, :num_ordem
            )`,
            {
              episodio: dadosEpisodio.EPISODIO,
              modulo: dadosEpisodio.MODULO,
              num_sequencial: utente.NUM_SEQUENCIAL,
              dta_episodio: dadosEpisodio.DTA_EPISODIO,
              hora_episodio: dadosEpisodio.HORA_EPISODIO,
              cod_especialidade: dadosEpisodio.COD_ESPECIALIDADE,
              des_especialidade: dadosEpisodio.DES_ESPECIALIDADE,
              num_ordem: dadosEpisodio.NUM_ORDEM
            }
          );
          
          console.log(`✅ Episódio BLO criado: ${dadosEpisodio.EPISODIO}`);
        }
      }
      
      await connection.commit();
      console.log('\n✅ Utente de teste pronto para usar!');
      return;
    }

    // 3. Inserir utente na PCEDOENTES
    console.log('\n💾 Inserindo utente...');
    await connection.execute(
      `INSERT INTO PCE.PCEDOENTES (
        NUM_SEQUENCIAL, NOME, SEXO, DTA_NASCIMENTO, DTA_REGISTO,
        MOR_MORADA, LOC_MORADA, COD_POSTAL, DES_POSTAL, 
        TEL_MORADAV2, ESTADO_CIVIL, NUM_PROCESSO
      ) VALUES (
        :num_sequencial, :nome, :sexo, :dta_nascimento, :dta_registo,
        :mor_morada, :loc_morada, :cod_postal, :des_postal,
        :tel_moradav2, :estado_civil, :num_processo
      )`,
      {
        num_sequencial: dadosUtente.NUM_SEQUENCIAL,
        nome: dadosUtente.NOME,
        sexo: dadosUtente.SEXO,
        dta_nascimento: dadosUtente.DTA_NASCIMENTO,
        dta_registo: dadosUtente.DTA_REGISTO,
        mor_morada: dadosUtente.MOR_MORADA,
        loc_morada: dadosUtente.LOC_MORADA,
        cod_postal: dadosUtente.COD_POSTAL,
        des_postal: dadosUtente.DES_POSTAL,
        tel_moradav2: dadosUtente.TEL_MORADAV2,
        estado_civil: dadosUtente.ESTADO_CIVIL,
        num_processo: dadosUtente.NUM_PROCESSO
      }
    );

    console.log('✅ Utente inserido com sucesso!');

    // 4. Inserir episódio na PCEEPISODIOS
    console.log('\n💾 Inserindo episódio BLO...');
    await connection.execute(
      `INSERT INTO PCE.PCEEPISODIOS (
        EPISODIO, MODULO, NUM_SEQUENCIAL, DTA_EPISODIO, HORA_EPISODIO,
        COD_ESPECIALIDADE, DES_ESPECIALIDADE, NUM_ORDEM
      ) VALUES (
        :episodio, :modulo, :num_sequencial, :dta_episodio, :hora_episodio,
        :cod_especialidade, :des_especialidade, :num_ordem
      )`,
      {
        episodio: dadosEpisodio.EPISODIO,
        modulo: dadosEpisodio.MODULO,
        num_sequencial: dadosEpisodio.NUM_SEQUENCIAL,
        dta_episodio: dadosEpisodio.DTA_EPISODIO,
        hora_episodio: dadosEpisodio.HORA_EPISODIO,
        cod_especialidade: dadosEpisodio.COD_ESPECIALIDADE,
        des_especialidade: dadosEpisodio.DES_ESPECIALIDADE,
        num_ordem: dadosEpisodio.NUM_ORDEM
      }
    );

    console.log('✅ Episódio BLO inserido com sucesso!');

    // 5. Confirmar transação
    await connection.commit();
    console.log('\n🎉 TRANSAÇÃO CONFIRMADA!');

    // 6. Verificar criação
    console.log('\n🔍 Verificando criação...');
    const verificacao = await connection.execute(
      `SELECT 
         d.NUM_SEQUENCIAL, d.NOME, d.SEXO, d.DTA_NASCIMENTO,
         e.EPISODIO, e.MODULO, e.DES_ESPECIALIDADE, e.DTA_EPISODIO
       FROM PCE.PCEDOENTES d
       JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
       WHERE d.NOME = :nome AND e.MODULO = 'BLO'`,
      { nome: dadosUtente.NOME },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (verificacao.rows && verificacao.rows.length > 0) {
      const resultado = verificacao.rows[0];
      console.log('✅ CRIAÇÃO CONFIRMADA:');
      console.log(`   DOENTE: ${resultado.NUM_SEQUENCIAL} - ${resultado.NOME}`);
      console.log(`   EPISODIO: ${resultado.EPISODIO} (${resultado.MODULO})`);
      console.log(`   ESPECIALIDADE: ${resultado.DES_ESPECIALIDADE}`);
      console.log(`   DATA: ${resultado.DTA_EPISODIO}`);
      
      console.log('\n🚀 PRONTO PARA TESTAR PROTOCOLOS!');
      console.log(`   URL: http://10.21.101.246:3000/?modulo=CIR`);
      console.log(`   Procura por: "${dadosUtente.NOME}"`);
    }

  } catch (error) {
    console.error('\n❌ Erro ao criar utente:', error);
    
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

criarUtenteHiSi();