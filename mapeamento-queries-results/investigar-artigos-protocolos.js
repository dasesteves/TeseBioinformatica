const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function investigarArtigosProtocolos() {
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

    console.log('\n🔍 INVESTIGANDO ARTIGOS EM PROTOCOLOS CIRÚRGICOS:');
    console.log('=' .repeat(60));

    // 1. Analisar protocolos com artigos incluídos
    console.log('\n1. Protocolos com lista de artigos/medicamentos:');
    const protocolosComArtigos = await connection.execute(
      `SELECT COD_PROT, DES_PROT, DOCS_LISTA, LISTA_SUSP
       FROM PRF_PROTOCOLOS 
       WHERE ESTADO = 1 AND DOCS_LISTA IS NOT NULL
       ORDER BY COD_PROT`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`📋 Encontrados ${protocolosComArtigos.rows?.length || 0} protocolos com artigos:`);
    
    // Analisar códigos dos artigos
    const todosOsCodigos = new Set();
    const codigosPorProtocolo = [];

    if (protocolosComArtigos.rows) {
      protocolosComArtigos.rows.forEach((protocolo, index) => {
        console.log(`\n   ${index + 1}. ${protocolo.COD_PROT} - ${protocolo.DES_PROT}`);
        
        if (protocolo.DOCS_LISTA) {
          const codigos = protocolo.DOCS_LISTA.split(',').map(c => c.trim()).filter(c => c.length > 0);
          console.log(`      Artigos incluídos: ${codigos.join(', ')}`);
          
          codigos.forEach(codigo => todosOsCodigos.add(codigo));
          codigosPorProtocolo.push({
            protocolo: protocolo.COD_PROT,
            codigos: codigos
          });
        }
        
        if (protocolo.LISTA_SUSP) {
          const suspensos = protocolo.LISTA_SUSP.split(',').map(c => c.trim()).filter(c => c.length > 0);
          console.log(`      Artigos suspensos: ${suspensos.join(', ')}`);
        }
      });
    }

    console.log(`\n📊 Total de códigos únicos encontrados: ${todosOsCodigos.size}`);
    console.log('Códigos únicos:', Array.from(todosOsCodigos).sort());

    // 2. Verificar onde estes códigos existem
    if (todosOsCodigos.size > 0) {
      console.log('\n2. Verificando onde estes códigos existem na BD...');
      
      const codigosArray = Array.from(todosOsCodigos);
      const placeholders = codigosArray.map((_, index) => `:cod${index}`).join(',');
      const binds = {};
      codigosArray.forEach((codigo, index) => {
        binds[`cod${index}`] = codigo;
      });

      // Verificar em PRF_MEDICAMENTOS
      console.log('\n   📦 Verificando em PRF_MEDICAMENTOS:');
      const medicamentosEncontrados = await connection.execute(
        `SELECT CODIGO, DESC_C, STOCK_ATUAL, MED_ALTO_RISCO
         FROM PRF_MEDICAMENTOS 
         WHERE CODIGO IN (${placeholders})
         ORDER BY CODIGO`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      console.log(`   Encontrados ${medicamentosEncontrados.rows?.length || 0} medicamentos:`);
      if (medicamentosEncontrados.rows) {
        medicamentosEncontrados.rows.forEach(med => {
          console.log(`      ${med.CODIGO} - ${med.DESC_C} (Stock: ${med.STOCK_ATUAL}, Alto Risco: ${med.MED_ALTO_RISCO})`);
        });
      }

      // Verificar outras tabelas possíveis para artigos
      console.log('\n   🔍 Procurando outras tabelas com estes códigos...');
      
      // Verificar se existe tabela de artigos gerais
      try {
        const artigosGerais = await connection.execute(
          `SELECT TABLE_NAME FROM USER_TABLES WHERE TABLE_NAME LIKE '%ARTIG%' OR TABLE_NAME LIKE '%STOCK%' OR TABLE_NAME LIKE '%MATERIAL%'`,
          {},
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        console.log('   Tabelas relacionadas com artigos/stock encontradas:');
        if (artigosGerais.rows) {
          artigosGerais.rows.forEach(table => {
            console.log(`      - ${table.TABLE_NAME}`);
          });
        }
      } catch (error) {
        console.log('   Erro ao procurar tabelas de artigos:', error.message);
      }

      // 3. Analisar padrões nos códigos para entender categorias
      console.log('\n3. Analisando padrões nos códigos:');
      const padroesCodigos = {};
      codigosArray.forEach(codigo => {
        const prefixo = codigo.substring(0, 3);
        if (!padroesCodigos[prefixo]) {
          padroesCodigos[prefixo] = [];
        }
        padroesCodigos[prefixo].push(codigo);
      });

      console.log('   Padrões por prefixo:');
      Object.keys(padroesCodigos).sort().forEach(prefixo => {
        console.log(`      ${prefixo}*: ${padroesCodigos[prefixo].length} códigos - ${padroesCodigos[prefixo].slice(0, 3).join(', ')}${padroesCodigos[prefixo].length > 3 ? '...' : ''}`);
      });

      // 4. Verificar CSU_EPENTIDADEACTOGASTOS para ver que tipos de artigos são registados
      console.log('\n4. Verificando registos históricos em CSU_EPENTIDADEACTOGASTOS:');
      const gastosHistoricos = await connection.execute(
        `SELECT ARTIGO, COUNT(*) as FREQ
         FROM CSU_EPENTIDADEACTOGASTOS 
         WHERE ARTIGO IN (${placeholders})
         GROUP BY ARTIGO
         ORDER BY COUNT(*) DESC`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      console.log(`   Artigos já registados em gastos (${gastosHistoricos.rows?.length || 0}):`);
      if (gastosHistoricos.rows) {
        gastosHistoricos.rows.forEach(gasto => {
          console.log(`      ${gasto.ARTIGO}: ${gasto.FREQ} registos`);
        });
      }
    }

    console.log('\n✅ Investigação de artigos em protocolos concluída!');

  } catch (error) {
    console.error('\n❌ Erro durante a investigação:', error);
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

// Executar a investigação
investigarArtigosProtocolos();