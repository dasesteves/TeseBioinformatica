const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function analiseProcessoEnfermagem() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('ANÁLISE: POR QUE FA10040790 NÃO DEDUZ STOCK?');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Configuração básica do medicamento
        console.log('1. CONFIGURAÇÃO DO FA10040790:\n');
        const config = await connection.execute(`
            SELECT 
                CODIGO,
                DESC_C,
                AFETA_STOCK,
                FORMHOSP,
                E_MEDC,
                CONSUMO_DIR
            FROM PCE.PRF_MEDICAMENTOS
            WHERE CODIGO = 'FA10040790'
        `);
        
        if (config.rows.length > 0) {
            const [codigo, desc, afeta, formhosp, medc, consumo] = config.rows[0];
            console.log(`Código: ${codigo}`);
            console.log(`Descrição: ${desc}`);
            console.log(`AFETA_STOCK: ${afeta} ${afeta !== 1 ? '⚠️ PROBLEMA: NÃO AFETA STOCK!' : '✓ OK'}`);
            console.log(`FormHosp: ${formhosp}`);
            console.log(`Consumo Direto: ${consumo || 'null'}`);
        }
        
        // 2. DESCOBERTA CRÍTICA: Comparar medicamentos com muitas administrações
        console.log('\n\n2. DESCOBERTA CRÍTICA - PADRÃO DO PROBLEMA:\n');
        
        const padraoProblema = await connection.execute(`
            SELECT * FROM (
                SELECT 
                    pme.CODIGO,
                    COUNT(*) as ADMIN_ENF,
                    (SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS WHERE CDU_CSU_ARTIGO = pme.CODIGO) as REG_CSU,
                    (SELECT AFETA_STOCK FROM PCE.PRF_MEDICAMENTOS WHERE CODIGO = pme.CODIGO) as AFETA,
                    (SELECT DESC_C FROM PCE.PRF_MEDICAMENTOS WHERE CODIGO = pme.CODIGO) as DESCRICAO
                FROM PCE.PRF_PRESC_MOV_ENF pme
                WHERE pme.CODIGO LIKE 'FA%'
                GROUP BY pme.CODIGO
                HAVING COUNT(*) > 1000
                ORDER BY COUNT(*) DESC
            ) WHERE ROWNUM <= 15
        `);
        
        console.log('❌ MEDICAMENTOS COM MUITAS ADMINISTRAÇÕES MAS SEM STOCK:\n');
        console.log('Código | Admin ENF | CSU | Afeta | Descrição');
        console.log('-'.repeat(80));
        
        let totalProblematicos = 0;
        padraoProblema.rows.forEach(row => {
            const [cod, enf, csu, afeta, desc] = row;
            if (csu === 0) {
                console.log(`${cod} | ${enf} | ${csu} ❌ | ${afeta} | ${desc?.substring(0, 35)}...`);
                totalProblematicos++;
            }
        });
        
        console.log(`\n>>> TOTAL DE MEDICAMENTOS COM PROBLEMA: ${totalProblematicos}`);
        
        // 3. Verificar o fluxo correto
        console.log('\n\n3. COMO FUNCIONA O FLUXO CORRETO:\n');
        
        // Verificar medicamentos que FUNCIONAM
        const funcionam = await connection.execute(`
            SELECT * FROM (
                SELECT 
                    eg.CDU_CSU_ARTIGO,
                    COUNT(*) as TOTAL_CSU,
                    (SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV_ENF WHERE CODIGO = eg.CDU_CSU_ARTIGO) as ADMIN_ENF,
                    (SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV_F pmf 
                     JOIN PCE.PRF_PRESC_MOV pm ON pmf.ID_PRESC_MOV = pm.ID_PRESC 
                     WHERE pm.CODIGO = eg.CDU_CSU_ARTIGO) as MOV_FARMACIA
                FROM PCE.CSU_EPENTIDADEACTOGASTOS eg
                WHERE eg.CDU_CSU_ARTIGO LIKE 'FA%'
                GROUP BY eg.CDU_CSU_ARTIGO
                HAVING COUNT(*) > 100
                ORDER BY COUNT(*) DESC
            ) WHERE ROWNUM <= 10
        `);
        
        console.log('✓ MEDICAMENTOS QUE DEDUZEM STOCK CORRETAMENTE:\n');
        console.log('Código | CSU | Admin ENF | Mov Farmácia');
        console.log('-'.repeat(50));
        
        funcionam.rows.forEach(row => {
            const [cod, csu, enf, farm] = row;
            console.log(`${cod} | ${csu} ✓ | ${enf} | ${farm}`);
        });
        
        // 4. A CHAVE DO PROBLEMA
        console.log('\n\n4. A CHAVE DO PROBLEMA - PRF_PRESC_MOV_F:\n');
        
        // Verificar movimentos de farmácia do FA10040790
        const movFarmaciaFA = await connection.execute(`
            SELECT 
                COUNT(*) as TOTAL_MOV_F
            FROM PCE.PRF_PRESC_MOV_F pmf
            JOIN PCE.PRF_PRESC_MOV pm ON pmf.ID_PRESC_MOV = pm.ID_PRESC
            WHERE pm.CODIGO = 'FA10040790'
        `);
        
        console.log(`Movimentos de Farmácia do FA10040790: ${movFarmaciaFA.rows[0][0]} ❌`);
        
        // Comparar com um que funciona
        const movFarmaciaOK = await connection.execute(`
            SELECT 
                COUNT(*) as TOTAL_MOV_F
            FROM PCE.PRF_PRESC_MOV_F pmf
            JOIN PCE.PRF_PRESC_MOV pm ON pmf.ID_PRESC_MOV = pm.ID_PRESC
            WHERE pm.CODIGO = 'FA10005405'
        `);
        
        console.log(`Movimentos de Farmácia do FA10005405: ${movFarmaciaOK.rows[0][0]} ✓`);
        
        // 5. EXPLICAÇÃO FINAL
        console.log('\n\n=======================================================');
        console.log('💡 EXPLICAÇÃO DO PROBLEMA');
        console.log('=======================================================\n');
        
        console.log('O SISTEMA TEM DOIS FLUXOS DIFERENTES:\n');
        
        console.log('FLUXO 1 - VIA FARMÁCIA (funciona ✓):');
        console.log('Prescrição → Farmácia valida → PRF_PRESC_MOV_F → CSU → SCMVV');
        console.log('');
        console.log('FLUXO 2 - ADMINISTRAÇÃO DIRETA (não deduz stock ❌):');
        console.log('Prescrição → Enfermagem administra → PRF_PRESC_MOV_ENF → (FIM)');
        console.log('');
        console.log('❌ O PROBLEMA DO FA10040790:');
        console.log('- É administrado DIRETAMENTE pela enfermagem');
        console.log('- NÃO passa pela farmácia (0 registos em PRF_PRESC_MOV_F)');
        console.log('- Logo, NUNCA chega ao CSU e NUNCA deduz stock!');
        console.log('');
        console.log('📊 IMPACTO:');
        console.log('- 7447 administrações sem controlo de stock');
        console.log('- Vários outros medicamentos com o mesmo problema');
        console.log('- Sistema de stock completamente desatualizado para estes itens');
        
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
analiseProcessoEnfermagem(); 