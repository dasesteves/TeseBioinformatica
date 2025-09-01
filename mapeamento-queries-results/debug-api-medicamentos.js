const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function debugAPIMedicamentos() {
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

    console.log('\n🔍 DEBUGANDO API DE MEDICAMENTOS:');
    console.log('=' .repeat(60));

    const protocoloTeste = 'IDT189'; // Sabemos que tem 5 linhas
    
    // 1. Testar query exata da API
    console.log(`\n1. Testando protocolo ${protocoloTeste} - Query da API:`);
    
    const linhasProtocoloQuery = await connection.execute(
      `SELECT 
         pl.COD_MED,
         pl.DOSE,
         pl.UNID_DOSE,
         pl.DURACAO,
         pl.UNID_DURA,
         pl.OBSERV,
         pl.SOS,
         pl.TURNO_T,
         pl.TIPO_ADM,
         pl.PR_ORDEM,
         pl.ESTADO,
         -- Buscar informações do medicamento se existir
         m.DESC_C as DESCRICAO_MED,
         m.STOCK_ATUAL,
         m.MED_ALTO_RISCO,
         m.AFETA_STOCK
       FROM PRF_PROT_LIN pl
       LEFT JOIN PRF_MEDICAMENTOS m ON pl.COD_MED = m.CODIGO
       WHERE pl.COD_PROT = :codigo AND pl.ESTADO = 1
       ORDER BY pl.PR_ORDEM`,
      { codigo: protocoloTeste },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`📦 Encontradas ${linhasProtocoloQuery.rows?.length || 0} linhas:`);
    
    if (linhasProtocoloQuery.rows && linhasProtocoloQuery.rows.length > 0) {
      linhasProtocoloQuery.rows.forEach((linha, index) => {
        console.log(`\n   ${index + 1}. ${linha.COD_MED} - ${linha.DESCRICAO_MED || 'SEM DESCRIÇÃO'}`);
        console.log(`      Dose: ${linha.DOSE} ${linha.UNID_DOSE}`);
        console.log(`      Duração: ${linha.DURACAO} ${linha.UNID_DURA}`);
        console.log(`      SOS: ${linha.SOS === 1 ? 'Sim' : 'Não'}`);
        console.log(`      Stock: ${linha.STOCK_ATUAL || 'N/A'}`);
        console.log(`      Alto Risco: ${linha.MED_ALTO_RISCO || 'N/A'}`);
        console.log(`      Observações: ${linha.OBSERV || 'N/A'}`);
        console.log(`      Estado: ${linha.ESTADO}`);
      });
    }

    // 2. Testar protocolo original do PRF_PROTOCOLOS
    console.log(`\n2. Dados do protocolo ${protocoloTeste} em PRF_PROTOCOLOS:`);
    const protocoloInfo = await connection.execute(
      `SELECT COD_PROT, DES_PROT, DES_COMP, DOCS_LISTA, LISTA_SUSP, OBSERV, ESTADO
       FROM PRF_PROTOCOLOS 
       WHERE COD_PROT = :codigo`,
      { codigo: protocoloTeste },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (protocoloInfo.rows && protocoloInfo.rows.length > 0) {
      const protocolo = protocoloInfo.rows[0];
      console.log(`   Código: ${protocolo.COD_PROT}`);
      console.log(`   Descrição: ${protocolo.DES_PROT}`);
      console.log(`   Estado: ${protocolo.ESTADO}`);
      console.log(`   DOCS_LISTA: ${protocolo.DOCS_LISTA || 'VAZIO'}`);
      console.log(`   LISTA_SUSP: ${protocolo.LISTA_SUSP || 'VAZIO'}`);
    }

    // 3. Verificar se os códigos de COD_MED existem em PRF_MEDICAMENTOS
    console.log(`\n3. Verificando códigos em PRF_MEDICAMENTOS:`);
    if (linhasProtocoloQuery.rows && linhasProtocoloQuery.rows.length > 0) {
      for (const linha of linhasProtocoloQuery.rows) {
        const medicamento = await connection.execute(
          `SELECT CODIGO, DESC_C, STOCK_ATUAL, MED_ALTO_RISCO
           FROM PRF_MEDICAMENTOS 
           WHERE CODIGO = :codigo`,
          { codigo: linha.COD_MED },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (medicamento.rows && medicamento.rows.length > 0) {
          console.log(`   ✅ ${linha.COD_MED}: ${medicamento.rows[0].DESC_C}`);
        } else {
          console.log(`   ❌ ${linha.COD_MED}: NÃO ENCONTRADO em PRF_MEDICAMENTOS`);
          
          // Verificar se pode ser um código de artigo diferente
          // Verificar padrão do código
          const prefixo = linha.COD_MED.substring(0, 3);
          console.log(`      Prefixo: ${prefixo}`);
        }
      }
    }

    // 4. Simular processamento da API
    console.log(`\n4. Simulando processamento da API:`);
    const medicamentosProcessados = (linhasProtocoloQuery.rows || []).map((linha) => ({
      codigo: linha.COD_MED,
      descricao: linha.DESCRICAO_MED || `Artigo ${linha.COD_MED}`,
      quantidade: linha.DOSE || 1,
      unidade: linha.UNID_DOSE || 'un',
      stock: linha.STOCK_ATUAL,
      altoRisco: linha.MED_ALTO_RISCO === 1 || linha.MED_ALTO_RISCO === '1' || linha.MED_ALTO_RISCO === 'True',
      afetaStock: linha.AFETA_STOCK === 1 || linha.AFETA_STOCK === '1',
      isChecked: true,
      observacoes: linha.OBSERV,
      duracao: linha.DURACAO,
      unidadeDuracao: linha.UNID_DURA,
      sos: linha.SOS === 1,
      horarios: linha.TURNO_T,
      tipoAdministracao: linha.TIPO_ADM,
      ordem: linha.PR_ORDEM,
      isMedicamento: !!linha.DESCRICAO_MED
    }));

    console.log(`📋 Resultado processado (${medicamentosProcessados.length} itens):`);
    console.log(JSON.stringify(medicamentosProcessados, null, 2));

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

// Executar o debug
debugAPIMedicamentos();