const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function debugFAMedicamentos() {
  let connection;
  
  try {
    try {
      oracledb.initOracleClient();
    } catch (err) {
      // Pode falhar se já estiver inicializado
    }

    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado ao Oracle');

    console.log('\n🔍 DEBUGANDO MEDICAMENTOS FA:');
    console.log('=' .repeat(60));

    const protocoloTeste = 'IDT189';
    
    // 1. Ver códigos em PRF_PROT_LIN para IDT189
    console.log(`\n1. Códigos em PRF_PROT_LIN para ${protocoloTeste}:`);
    const codigosQuery = await connection.execute(
      `SELECT COD_MED, DOSE, ESTADO FROM PRF_PROT_LIN WHERE COD_PROT = :codigo ORDER BY PR_ORDEM`,
      { codigo: protocoloTeste },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`   Total de linhas: ${codigosQuery.rows.length}`);
    codigosQuery.rows.forEach((linha, index) => {
      console.log(`   ${index + 1}. ${linha.COD_MED} (Dose: ${linha.DOSE}, Estado: ${linha.ESTADO})`);
    });

    // 2. Verificar se os códigos FA existem em PRF_MEDICAMENTOS
    console.log(`\n2. Verificando códigos FA em PRF_MEDICAMENTOS:`);
    const codigosFa = codigosQuery.rows.filter(linha => linha.COD_MED && linha.COD_MED.startsWith('FA'));
    
    for (const linha of codigosFa) {
      const medicamento = await connection.execute(
        `SELECT CODIGO, DESC_C, STOCK_ATUAL, MED_ALTO_RISCO FROM PRF_MEDICAMENTOS WHERE CODIGO = :codigo`,
        { codigo: linha.COD_MED },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (medicamento.rows && medicamento.rows.length > 0) {
        const med = medicamento.rows[0];
        console.log(`   ✅ ${linha.COD_MED}: "${med.DESC_C}" (Stock: ${med.STOCK_ATUAL})`);
      } else {
        console.log(`   ❌ ${linha.COD_MED}: NÃO ENCONTRADO`);
      }
    }

    // 3. Testar query exata da API com aliases
    console.log(`\n3. Testando query da API com aliases:`);
    const queryAPI = await connection.execute(
      `SELECT 
         pl.COD_MED as "COD_MED",
         pl.DOSE as "DOSE",
         pl.UNID_DOSE as "UNID_DOSE",
         m.DESC_C as "DESCRICAO_MED",
         m.STOCK_ATUAL as "STOCK_ATUAL",
         m.MED_ALTO_RISCO as "MED_ALTO_RISCO"
       FROM PRF_PROT_LIN pl
       LEFT JOIN PRF_MEDICAMENTOS m ON pl.COD_MED = m.CODIGO
       WHERE pl.COD_PROT = :codigo AND pl.ESTADO = 1
       ORDER BY pl.PR_ORDEM`,
      { codigo: protocoloTeste },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`   Total retornado: ${queryAPI.rows.length}`);
    queryAPI.rows.forEach((linha, index) => {
      console.log(`\n   ${index + 1}.`);
      console.log(`      COD_MED: "${linha.COD_MED}"`);
      console.log(`      DESCRICAO_MED: "${linha.DESCRICAO_MED}"`);
      console.log(`      DOSE: "${linha.DOSE}"`);
      console.log(`      STOCK_ATUAL: "${linha.STOCK_ATUAL}"`);
      console.log(`      Tipos de dados: COD_MED=${typeof linha.COD_MED}, DESC=${typeof linha.DESCRICAO_MED}`);
    });

    // 4. Verificar estrutura de um objeto retornado
    console.log(`\n4. Estrutura da primeira linha:`);
    if (queryAPI.rows && queryAPI.rows.length > 0) {
      console.log('   Chaves:', Object.keys(queryAPI.rows[0]));
      console.log('   Valores:', Object.values(queryAPI.rows[0]));
      console.log('   JSON:', JSON.stringify(queryAPI.rows[0], null, 2));
    }

    console.log('\n✅ Debug concluído!');

  } catch (error) {
    console.error('\n❌ Erro durante o debug:', error);
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

debugFAMedicamentos();