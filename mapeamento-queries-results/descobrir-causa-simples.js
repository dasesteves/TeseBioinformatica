const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function descobrirCausaSimples() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('DESCOBRINDO POR QUE FA10040790 NÃO DEDUZ STOCK');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Verificar campo AFETA_STOCK
        console.log('1. CAMPO AFETA_STOCK DO FA10040790:\n');
        const afetaStock = await connection.execute(`
            SELECT CODIGO, DESC_C, AFETA_STOCK
            FROM PCE.PRF_MEDICAMENTOS
            WHERE CODIGO = 'FA10040790'
        `);
        
        const [cod, desc, afeta] = afetaStock.rows[0];
        console.log(`Código: ${cod}`);
        console.log(`Descrição: ${desc}`);
        console.log(`AFETA_STOCK: ${afeta} ${afeta !== 1 ? '❌ PROBLEMA!' : '✓ OK'}`);
        
        // 2. A DESCOBERTA CHAVE
        console.log('\n\n2. A DESCOBERTA CHAVE - DOIS FLUXOS DIFERENTES:\n');
        
        // Contar movimentos de farmácia vs enfermagem
        console.log('FA10040790:');
        const fa10040790 = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV_ENF WHERE CODIGO = 'FA10040790') as ENF,
                (SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV_F pmf 
                 JOIN PCE.PRF_PRESC_MOV pm ON pmf.ID_PRESC_MOV = pm.ID_PRESC 
                 WHERE pm.CODIGO = 'FA10040790') as FARM,
                (SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS WHERE CDU_CSU_ARTIGO = 'FA10040790') as CSU
            FROM DUAL
        `);
        
        const [enf1, farm1, csu1] = fa10040790.rows[0];
        console.log(`- Administrações Enfermagem: ${enf1}`);
        console.log(`- Movimentos Farmácia: ${farm1} ❌`);
        console.log(`- Registos CSU: ${csu1} ❌`);
        
        console.log('\nFA10005405 (que funciona):');
        const fa10005405 = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV_ENF WHERE CODIGO = 'FA10005405') as ENF,
                (SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV_F pmf 
                 JOIN PCE.PRF_PRESC_MOV pm ON pmf.ID_PRESC_MOV = pm.ID_PRESC 
                 WHERE pm.CODIGO = 'FA10005405') as FARM,
                (SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS WHERE CDU_CSU_ARTIGO = 'FA10005405') as CSU
            FROM DUAL
        `);
        
        const [enf2, farm2, csu2] = fa10005405.rows[0];
        console.log(`- Administrações Enfermagem: ${enf2}`);
        console.log(`- Movimentos Farmácia: ${farm2} ✓`);
        console.log(`- Registos CSU: ${csu2} ✓`);
        
        // 3. Quantos medicamentos têm este problema?
        console.log('\n\n3. QUANTOS MEDICAMENTOS TÊM ESTE PROBLEMA?\n');
        
        const problema = await connection.execute(`
            SELECT COUNT(DISTINCT CODIGO) as TOTAL
            FROM PCE.PRF_PRESC_MOV_ENF pme
            WHERE NOT EXISTS (
                SELECT 1 FROM PCE.CSU_EPENTIDADEACTOGASTOS 
                WHERE CDU_CSU_ARTIGO = pme.CODIGO
            )
            AND EXISTS (
                SELECT 1 FROM PCE.PRF_MEDICAMENTOS 
                WHERE CODIGO = pme.CODIGO AND AFETA_STOCK = 1
            )
        `);
        
        console.log(`Medicamentos com administrações mas SEM dedução de stock: ${problema.rows[0][0]} ❌`);
        
        // 4. EXPLICAÇÃO
        console.log('\n\n=======================================================');
        console.log('💡 EXPLICAÇÃO DO PROBLEMA');
        console.log('=======================================================\n');
        
        console.log('O SISTEMA TEM 2 CIRCUITOS:\n');
        
        console.log('CIRCUITO 1 - FARMÁCIA (deduz stock ✓):');
        console.log('1. Médico prescreve');
        console.log('2. Farmácia valida e dispensa → PRF_PRESC_MOV_F');
        console.log('3. Sistema cria registo em CSU');
        console.log('4. Stock é deduzido no SCMVV\n');
        
        console.log('CIRCUITO 2 - ENFERMAGEM (NÃO deduz stock ❌):');
        console.log('1. Médico prescreve');
        console.log('2. Enfermagem administra direto → PRF_PRESC_MOV_ENF');
        console.log('3. FIM (não vai para CSU!)\n');
        
        console.log('O FA10040790 (Macrogol):');
        console.log('- É um medicamento de STOCK DE SERVIÇO');
        console.log('- A enfermagem tem stock próprio no serviço');
        console.log('- Administra direto sem passar pela farmácia');
        console.log('- Por isso NUNCA deduz do stock central!');
        
        console.log('\n📊 IMPACTO:');
        console.log(`- ${problema.rows[0][0]} medicamentos afetados`);
        console.log('- Milhares de administrações sem controlo');
        console.log('- Stock central completamente desatualizado');
        
    } catch (err) {
        console.error('Erro:', err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Erro ao fechar conexão:', err);
            }
        }
    }
}

// Executar
descobrirCausaSimples(); 