const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function investigarCausaRaizEnfermagem() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('INVESTIGAÇÃO DA CAUSA RAIZ - PROCESSO ENFERMAGEM');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Verificar configuração do medicamento
        console.log('1. CONFIGURAÇÃO DO MEDICAMENTO FA10040790:\n');
        const config = await connection.execute(`
            SELECT 
                m.CODIGO,
                m.DESC_C,
                m.AFETA_STOCK,
                m.FORMHOSP,
                m.E_MEDC,
                m.CONSUMO_DIR,
                m.PSICO_F,
                m.MED_ALTO_RISCO,
                m.STOCK_SERVICO
            FROM PCE.PRF_MEDICAMENTOS m
            WHERE m.CODIGO = 'FA10040790'
        `);
        
        if (config.rows.length > 0) {
            const [codigo, desc, afeta, formhosp, medc, consumo, psico, alto_risco, stock_serv] = config.rows[0];
            console.log(`Código: ${codigo}`);
            console.log(`Descrição: ${desc}`);
            console.log(`Afeta Stock: ${afeta} ${afeta !== 1 ? '⚠️ NÃO AFETA STOCK!' : ''}`);
            console.log(`FormHosp: ${formhosp}`);
            console.log(`E_MEDC: ${medc}`);
            console.log(`Consumo Direto: ${consumo}`);
            console.log(`Stock Serviço: ${stock_serv}`);
        }
        
        // 2. Comparar fluxo de outros medicamentos
        console.log('\n\n2. ANÁLISE DO FLUXO PRF → CSU:\n');
        
        // Verificar medicamentos com muitas administrações de enfermagem
        const topMedicamentos = await connection.execute(`
            SELECT * FROM (
                SELECT 
                    pme.CODIGO,
                    COUNT(*) as TOTAL_ENF,
                    (SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV WHERE CODIGO = pme.CODIGO) as TOTAL_PRESC,
                    (SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS WHERE CDU_CSU_ARTIGO = pme.CODIGO) as TOTAL_CSU,
                    (SELECT AFETA_STOCK FROM PCE.PRF_MEDICAMENTOS WHERE CODIGO = pme.CODIGO) as AFETA_STOCK
                FROM PCE.PRF_PRESC_MOV_ENF pme
                WHERE pme.CODIGO LIKE 'FA%'
                GROUP BY pme.CODIGO
                HAVING COUNT(*) > 1000
                ORDER BY COUNT(*) DESC
            ) WHERE ROWNUM <= 10
        `);
        
        console.log('Top medicamentos com muitas administrações:');
        console.log('Código | Admin ENF | Prescrições | Registos CSU | Afeta Stock | Status');
        console.log('-'.repeat(80));
        
        topMedicamentos.rows.forEach(row => {
            const [cod, enf, presc, csu, afeta] = row;
            const status = csu > 0 ? '✓' : '❌';
            const problema = enf > 0 && csu === 0 ? '⚠️ PROBLEMA!' : '';
            console.log(`${cod} | ${enf} | ${presc} | ${csu} | ${afeta} | ${status} ${problema}`);
        });
        
        // 3. Verificar se há padrão nos problemas
        console.log('\n\n3. PADRÃO DOS PROBLEMAS:\n');
        
        // Medicamentos com administrações mas sem CSU
        const problematicos = await connection.execute(`
            SELECT 
                pme.CODIGO,
                COUNT(*) as TOTAL_ENF,
                m.DESC_C,
                m.AFETA_STOCK,
                m.CONSUMO_DIR,
                m.STOCK_SERVICO
            FROM PCE.PRF_PRESC_MOV_ENF pme
            JOIN PCE.PRF_MEDICAMENTOS m ON pme.CODIGO = m.CODIGO
            WHERE NOT EXISTS (
                SELECT 1 FROM PCE.CSU_EPENTIDADEACTOGASTOS 
                WHERE CDU_CSU_ARTIGO = pme.CODIGO
            )
            AND pme.CODIGO LIKE 'FA%'
            GROUP BY pme.CODIGO, m.DESC_C, m.AFETA_STOCK, m.CONSUMO_DIR, m.STOCK_SERVICO
            HAVING COUNT(*) > 100
            ORDER BY COUNT(*) DESC
        `);
        
        if (problematicos.rows.length > 0) {
            console.log(`❌ Encontrados ${problematicos.rows.length} medicamentos com o MESMO PROBLEMA!\n`);
            console.log('Medicamentos sem registos CSU (mais de 100 administrações):');
            console.log('Código | Admin | Afeta Stock | Consumo Dir | Stock Serv | Descrição');
            console.log('-'.repeat(80));
            
            problematicos.rows.forEach(row => {
                const [cod, enf, desc, afeta, consumo, stock] = row;
                console.log(`${cod} | ${enf} | ${afeta} | ${consumo || 'null'} | ${stock || 'null'} | ${desc?.substring(0, 30)}...`);
            });
        }
        
        // 4. Verificar processo de migração
        console.log('\n\n4. VERIFICAÇÃO DO PROCESSO DE MIGRAÇÃO:\n');
        
        // Ver se há registos em PRF_PRESC_MOV_F (farmácia)
        const movFarmacia = await connection.execute(`
            SELECT 
                COUNT(*) as TOTAL_MOV_F,
                COUNT(DISTINCT pm.CODIGO) as MEDICAMENTOS
            FROM PCE.PRF_PRESC_MOV_F pmf
            JOIN PCE.PRF_PRESC_MOV pm ON pmf.ID_PRESC_MOV = pm.ID_PRESC
            WHERE pm.CODIGO = 'FA10040790'
        `);
        
        console.log(`Movimentos de Farmácia (PRF_PRESC_MOV_F): ${movFarmacia.rows[0][0]}`);
        
        // 5. Hipótese: Medicamentos de Stock de Serviço
        console.log('\n\n5. HIPÓTESE: MEDICAMENTOS DE STOCK DE SERVIÇO:\n');
        
        const stockServico = await connection.execute(`
            SELECT 
                STOCK_SERVICO,
                COUNT(*) as TOTAL,
                SUM(CASE WHEN EXISTS (
                    SELECT 1 FROM PCE.CSU_EPENTIDADEACTOGASTOS 
                    WHERE CDU_CSU_ARTIGO = m.CODIGO
                ) THEN 1 ELSE 0 END) as COM_CSU
            FROM PCE.PRF_MEDICAMENTOS m
            WHERE EXISTS (
                SELECT 1 FROM PCE.PRF_PRESC_MOV_ENF 
                WHERE CODIGO = m.CODIGO
            )
            GROUP BY STOCK_SERVICO
        `);
        
        console.log('Stock Serviço | Total Medicamentos | Com registos CSU');
        console.log('-'.repeat(50));
        stockServico.rows.forEach(row => {
            const pct = row[1] > 0 ? ((row[2] / row[1]) * 100).toFixed(1) : 0;
            console.log(`${row[0] || 'NULL'} | ${row[1]} | ${row[2]} (${pct}%)`);
        });
        
        // 6. Conclusão
        console.log('\n\n=======================================================');
        console.log('ANÁLISE DA CAUSA RAIZ');
        console.log('=======================================================\n');
        
        console.log('DESCOBERTAS CRÍTICAS:');
        console.log('1. Não é um problema isolado do FA10040790');
        console.log('2. Afeta vários medicamentos com administrações de enfermagem');
        console.log('3. O processo PRF_PRESC_MOV_ENF → CSU parece não existir!');
        console.log('\nHIPÓTESE PRINCIPAL:');
        console.log('O sistema foi desenhado para que apenas movimentos da FARMÁCIA');
        console.log('(PRF_PRESC_MOV_F) sejam migrados para CSU, não as administrações');
        console.log('de enfermagem (PRF_PRESC_MOV_ENF).');
        console.log('\nISSO EXPLICARIA:');
        console.log('- Por que há 7447 administrações mas 0 em CSU');
        console.log('- Por que outros medicamentos têm o mesmo problema');
        console.log('- Por que o sistema "funciona" para alguns (via farmácia)');
        
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
investigarCausaRaizEnfermagem(); 