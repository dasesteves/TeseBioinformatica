const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function diagnosticoCompletoFA10040790() {
    let connection;
    
    try {
        console.log('===============================================');
        console.log('DIAGNÓSTICO COMPLETO - FA10040790');
        console.log('===============================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Verificar existência nas tabelas PRF
        console.log('1. VERIFICANDO PRESCRIÇÕES EM PRF_PRESC_MOV:\n');
        const prescricoesPRF = await connection.execute(`
            SELECT 
                COUNT(*) as TOTAL,
                COUNT(DISTINCT EPISODIO) as EPISODIOS_UNICOS,
                MIN(NUM_SEQUENCIAL) as PRIMEIRO_ID,
                MAX(NUM_SEQUENCIAL) as ULTIMO_ID
            FROM PCE.PRF_PRESC_MOV
            WHERE CODIGO = 'FA10040790'
        `);
        
        const [total, episodios, primeiro, ultimo] = prescricoesPRF.rows[0];
        console.log(`Total de prescrições: ${total}`);
        console.log(`Episódios únicos: ${episodios}`);
        console.log(`Primeiro ID: ${primeiro}`);
        console.log(`Último ID: ${ultimo}`);
        
        // 2. Verificar se existe algum registo para episódio 18027051
        const ep18027051 = await connection.execute(`
            SELECT COUNT(*) 
            FROM PCE.PRF_PRESC_MOV
            WHERE CODIGO = 'FA10040790' 
              AND EPISODIO = '18027051'
        `);
        console.log(`\nPrescrições para episódio 18027051: ${ep18027051.rows[0][0]}`);
        
        // 3. Verificar registos nas tabelas CSU
        console.log('\n\n2. VERIFICANDO REGISTOS EM CSU_EPENTIDADEACTOGASTOS:\n');
        const registosCSU = await connection.execute(`
            SELECT COUNT(*) as TOTAL
            FROM PCE.CSU_EPENTIDADEACTOGASTOS
            WHERE CDU_CSU_ARTIGO = 'FA10040790'
        `);
        console.log(`Total em CSU_EPENTIDADEACTOGASTOS: ${registosCSU.rows[0][0]} ⚠️`);
        
        // 4. Comparar com artigo que funciona
        console.log('\n\n3. COMPARANDO COM ARTIGO QUE FUNCIONA (FA10005405):\n');
        const comparacao = await connection.execute(`
            SELECT 
                'FA10005405' as ARTIGO,
                (SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV WHERE CODIGO = 'FA10005405') as PRF_PRESC_MOV,
                (SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS WHERE CDU_CSU_ARTIGO = 'FA10005405') as CSU_GASTOS
            FROM DUAL
            UNION ALL
            SELECT 
                'FA10040790' as ARTIGO,
                (SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV WHERE CODIGO = 'FA10040790') as PRF_PRESC_MOV,
                (SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS WHERE CDU_CSU_ARTIGO = 'FA10040790') as CSU_GASTOS
            FROM DUAL
        `);
        
        console.log('Artigo | PRF_PRESC_MOV | CSU_GASTOS');
        console.log('-'.repeat(50));
        comparacao.rows.forEach(row => {
            const status = row[2] === 0 ? '❌ PROBLEMA!' : '✓';
            console.log(`${row[0]} | ${row[1]} | ${row[2]} ${status}`);
        });
        
        // 5. Verificar últimas prescrições
        console.log('\n\n4. ÚLTIMAS PRESCRIÇÕES DO FA10040790:\n');
        const ultimasPrescricoes = await connection.execute(`
            SELECT * FROM (
                SELECT 
                    NUM_SEQUENCIAL,
                    EPISODIO,
                    MODULO,
                    ESTADO,
                    TO_CHAR(DTA_INI, 'DD/MM/YYYY') as DATA_INICIO
                FROM PCE.PRF_PRESC_MOV
                WHERE CODIGO = 'FA10040790'
                ORDER BY NUM_SEQUENCIAL DESC
            ) WHERE ROWNUM <= 5
        `);
        
        if (ultimasPrescricoes.rows.length > 0) {
            console.log('ID | Episódio | Módulo | Estado | Data');
            console.log('-'.repeat(60));
            ultimasPrescricoes.rows.forEach(row => {
                console.log(`${row[0]} | ${row[1]} | ${row[2] || 'N/A'} | ${row[3]} | ${row[4] || 'N/A'}`);
            });
        }
        
        // 6. Verificar triggers
        console.log('\n\n5. VERIFICANDO TRIGGERS NAS TABELAS PRF:\n');
        const triggers = await connection.execute(`
            SELECT 
                TRIGGER_NAME,
                TABLE_NAME,
                TRIGGERING_EVENT,
                STATUS
            FROM ALL_TRIGGERS
            WHERE TABLE_NAME LIKE 'PRF_PRESC_MOV%'
              AND OWNER = 'PCE'
        `);
        
        if (triggers.rows.length > 0) {
            console.log('Triggers encontrados:');
            triggers.rows.forEach(row => {
                const status = row[3] === 'ENABLED' ? '✓' : '❌';
                console.log(`${status} ${row[0]} em ${row[1]} (${row[2]})`);
            });
        } else {
            console.log('❌ Nenhum trigger encontrado! Pode ser o problema!');
        }
        
        // 7. Verificar campos CDU_CSU nas tabelas PRF
        console.log('\n\n6. VERIFICANDO CAMPOS CDU_CSU EM PRF_PRESC_MOV:\n');
        const camposCDU = await connection.execute(`
            SELECT COLUMN_NAME
            FROM ALL_TAB_COLUMNS
            WHERE TABLE_NAME = 'PRF_PRESC_MOV'
              AND OWNER = 'PCE'
              AND COLUMN_NAME LIKE 'CDU_CSU%'
        `);
        
        if (camposCDU.rows.length > 0) {
            console.log('Campos CDU_CSU encontrados:');
            camposCDU.rows.forEach(row => {
                console.log(`- ${row[0]}`);
            });
            
            // Verificar se há algum campo de exportação
            const exportacao = await connection.execute(`
                SELECT 
                    CDU_CSU_EXPORTADO,
                    COUNT(*) as TOTAL
                FROM PCE.PRF_PRESC_MOV
                WHERE CODIGO = 'FA10040790'
                GROUP BY CDU_CSU_EXPORTADO
            `);
            
            if (exportacao.rows.length > 0) {
                console.log('\nStatus de exportação:');
                exportacao.rows.forEach(row => {
                    const status = row[0] === 0 ? 'PENDENTE' : row[0] === 2 ? 'EXPORTADO' : row[0] === 9 ? 'ERRO' : row[0];
                    console.log(`- ${status}: ${row[1]} registos`);
                });
            }
        } else {
            console.log('❌ Nenhum campo CDU_CSU encontrado em PRF_PRESC_MOV!');
            console.log('Isso pode explicar por que não há integração!');
        }
        
        // 8. Análise Final
        console.log('\n\n===============================================');
        console.log('CONCLUSÃO DO DIAGNÓSTICO');
        console.log('===============================================\n');
        
        if (total > 0 && registosCSU.rows[0][0] === 0) {
            console.log('❌ PROBLEMA CONFIRMADO:');
            console.log(`- ${total} prescrições em PRF_PRESC_MOV`);
            console.log('- 0 registos em CSU_EPENTIDADEACTOGASTOS');
            console.log('\nO PROCESSO DE INTEGRAÇÃO NÃO ESTÁ FUNCIONANDO PARA ESTE ARTIGO!');
            console.log('\nPOSSÍVEIS SOLUÇÕES:');
            console.log('1. Inserir manualmente os registos em CSU_EPENTIDADEACTOGASTOS');
            console.log('2. Executar processo/job de migração manualmente');
            console.log('3. Verificar se há algum bloqueio específico para este código');
            console.log('4. Corrigir trigger/processo que deveria fazer a cópia');
        }
        
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
diagnosticoCompletoFA10040790(); 