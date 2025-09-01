const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function analisarDoentesExistentes() {
  let connection;
  
  try {
    try {
      oracledb.initOracleClient();
    } catch (err) {
      // Pode falhar se já estiver inicializado
    }

    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado ao Oracle');

    console.log('\n🔍 ANÁLISE DE DOENTES EXISTENTES NO MÓDULO BLO:');
    console.log('=' .repeat(60));

    // 1. Buscar doentes existentes no BLO com mais detalhes
    console.log('\n1. DOENTES NO MÓDULO BLO (últimos 10):');
    const doentesExistentes = await connection.execute(
      `SELECT 
         d.NUM_SEQUENCIAL, d.NOME, d.SEXO, d.DTA_NASCIMENTO, d.DTA_REGISTO,
         e.EPISODIO, e.MODULO, e.DES_ESPECIALIDADE, e.COD_ESPECIALIDADE, 
         e.DTA_EPISODIO, e.HORA_EPISODIO, e.NUM_ORDEM
       FROM PCE.PCEDOENTES d
       JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
       WHERE e.MODULO = 'BLO'
       AND ROWNUM <= 10
       ORDER BY e.DTA_EPISODIO DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    doentesExistentes.rows.forEach((doente, index) => {
      console.log(`\n   Doente ${index + 1}:`);
      console.log(`     NUM_SEQUENCIAL: ${doente.NUM_SEQUENCIAL}`);
      console.log(`     NOME: ${doente.NOME}`);
      console.log(`     EPISODIO: ${doente.EPISODIO}`);
      console.log(`     ESPECIALIDADE: ${doente.DES_ESPECIALIDADE} (${doente.COD_ESPECIALIDADE})`);
      console.log(`     DTA_EPISODIO: ${doente.DTA_EPISODIO}`);
      console.log(`     HORA_EPISODIO: ${doente.HORA_EPISODIO}`);
    });

    // 2. Verificar se já existe "Utente HiSi"
    console.log('\n2. VERIFICAR SE "UTENTE HISI" JÁ EXISTE:');
    const verificaHiSi = await connection.execute(
      `SELECT 
         d.NUM_SEQUENCIAL, d.NOME, 
         e.EPISODIO, e.MODULO, e.DES_ESPECIALIDADE, e.DTA_EPISODIO
       FROM PCE.PCEDOENTES d
       LEFT JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
       WHERE UPPER(d.NOME) LIKE '%HISI%' OR UPPER(d.NOME) LIKE '%UTENTE%'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (verificaHiSi.rows && verificaHiSi.rows.length > 0) {
      console.log('   ✅ Encontrados utentes de teste existentes:');
      verificaHiSi.rows.forEach((utente, index) => {
        console.log(`   ${index + 1}. ${utente.NOME} (${utente.NUM_SEQUENCIAL})`);
        if (utente.EPISODIO) {
          console.log(`      Episódio ${utente.MODULO}: ${utente.EPISODIO} - ${utente.DES_ESPECIALIDADE}`);
        }
      });
    } else {
      console.log('   ❌ Nenhum utente de teste encontrado');
    }

    // 3. Escolher um doente BLO para modificar
    console.log('\n3. ESCOLHENDO MELHOR CANDIDATO PARA MODIFICAR:');
    const candidatos = await connection.execute(
      `SELECT 
         d.NUM_SEQUENCIAL, d.NOME, d.SEXO, d.DTA_NASCIMENTO,
         e.EPISODIO, e.DES_ESPECIALIDADE, e.COD_ESPECIALIDADE, 
         e.DTA_EPISODIO, e.HORA_EPISODIO
       FROM PCE.PCEDOENTES d
       JOIN PCE.PCEEPISODIOS e ON d.NUM_SEQUENCIAL = e.NUM_SEQUENCIAL
       WHERE e.MODULO = 'BLO'
       AND (UPPER(e.DES_ESPECIALIDADE) LIKE '%CIRURG%' OR UPPER(e.DES_ESPECIALIDADE) LIKE '%ANEST%')
       AND ROWNUM <= 5
       ORDER BY e.DTA_EPISODIO DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (candidatos.rows && candidatos.rows.length > 0) {
      console.log('   ✅ Candidatos para modificar (especialidades cirúrgicas):');
      candidatos.rows.forEach((candidato, index) => {
        console.log(`\n   Candidato ${index + 1}:`);
        console.log(`     NUM_SEQUENCIAL: ${candidato.NUM_SEQUENCIAL}`);
        console.log(`     NOME: ${candidato.NOME}`);
        console.log(`     EPISODIO: ${candidato.EPISODIO}`);
        console.log(`     ESPECIALIDADE: ${candidato.DES_ESPECIALIDADE}`);
        console.log(`     DTA_EPISODIO: ${candidato.DTA_EPISODIO}`);
      });

      // Escolher o primeiro candidato
      const escolhido = candidatos.rows[0];
      console.log(`\n   🎯 ESCOLHIDO: ${escolhido.NOME} (${escolhido.NUM_SEQUENCIAL})`);

      // 4. Analisar que campos precisamos atualizar
      console.log('\n4. ANÁLISE DOS CAMPOS A ATUALIZAR:');
      
      // Ver todos os campos do doente escolhido
      const detalhesDoente = await connection.execute(
        `SELECT * FROM PCE.PCEDOENTES WHERE NUM_SEQUENCIAL = :num_seq`,
        { num_seq: escolhido.NUM_SEQUENCIAL },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const detalhesEpisodio = await connection.execute(
        `SELECT * FROM PCE.PCEEPISODIOS WHERE EPISODIO = :episodio`,
        { episodio: escolhido.EPISODIO },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      console.log('\n   📋 DADOS ATUAIS DO DOENTE:');
      if (detalhesDoente.rows && detalhesDoente.rows.length > 0) {
        const doente = detalhesDoente.rows[0];
        Object.keys(doente).forEach(campo => {
          if (doente[campo] !== null) {
            console.log(`     ${campo}: ${doente[campo]}`);
          }
        });
      }

      console.log('\n   🏥 DADOS ATUAIS DO EPISÓDIO:');
      if (detalhesEpisodio.rows && detalhesEpisodio.rows.length > 0) {
        const episodio = detalhesEpisodio.rows[0];
        Object.keys(episodio).forEach(campo => {
          if (episodio[campo] !== null) {
            console.log(`     ${campo}: ${episodio[campo]}`);
          }
        });
      }

      // 5. Mostrar script de atualização
      console.log('\n5. 🔧 SCRIPT DE ATUALIZAÇÃO SUGERIDO:');
      const hoje = new Date();
      const hojeFormatada = hoje.toISOString().split('T')[0];
      
      console.log(`\n   -- Atualizar nome do doente para "Utente HiSi"`);
      console.log(`   UPDATE PCE.PCEDOENTES SET NOME = 'Utente HiSi' WHERE NUM_SEQUENCIAL = ${escolhido.NUM_SEQUENCIAL};`);
      
      console.log(`\n   -- Atualizar data do episódio para hoje`);
      console.log(`   UPDATE PCE.PCEEPISODIOS SET DTA_EPISODIO = TO_DATE('${hojeFormatada}', 'YYYY-MM-DD') WHERE EPISODIO = ${escolhido.EPISODIO};`);
      
      console.log(`\n   -- Commit das alterações`);
      console.log(`   COMMIT;`);

      // 6. Verificar que tabelas têm este episódio
      console.log('\n6. 📊 VERIFICAR ONDE MAIS ESTE EPISÓDIO APARECE:');
      
      // Verificar CSU_EPENTIDADEACTOS
      const actosCount = await connection.execute(
        `SELECT COUNT(*) as COUNT FROM CSU_EPENTIDADEACTOS WHERE EPISODIO = :episodio`,
        { episodio: escolhido.EPISODIO },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      console.log(`   CSU_EPENTIDADEACTOS: ${actosCount.rows[0].COUNT} registos`);

      if (actosCount.rows[0].COUNT > 0) {
        const actos = await connection.execute(
          `SELECT CDU_CSU_ACTOID, DESCRICAO, DATA_REGISTO, ERRO 
           FROM CSU_EPENTIDADEACTOS 
           WHERE EPISODIO = :episodio 
           AND ROWNUM <= 3`,
          { episodio: escolhido.EPISODIO },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log('   Exemplos de actos:');
        actos.rows.forEach((acto, index) => {
          console.log(`     ${index + 1}. ${acto.CDU_CSU_ACTOID} - ${acto.DESCRICAO}`);
        });
      }

    } else {
      console.log('   ❌ Nenhum candidato encontrado em especialidades cirúrgicas');
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

analisarDoentesExistentes();