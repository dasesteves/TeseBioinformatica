const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function verificacaoFinalFA10040790() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('VERIFICAÇÃO FINAL E COMPLETA - FA10040790');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. CSU_EPENTIDADEACTOGASTOS - verificação principal
        console.log('1. VERIFICAÇÃO PRINCIPAL - CSU_EPENTIDADEACTOGASTOS:\n');
        const epGastos = await connection.execute(`
            SELECT COUNT(*) as TOTAL
            FROM PCE.CSU_EPENTIDADEACTOGASTOS 
            WHERE CDU_CSU_ARTIGO = :codigo
        `, { codigo: 'FA10040790' });
        
        const totalEpGastos = epGastos.rows[0][0];
        console.log(`Registos encontrados: ${totalEpGastos}`);
        
        if (totalEpGastos === 0) {
            console.log('❌ CONFIRMADO: FA10040790 NÃO está em CSU_EPENTIDADEACTOGASTOS!\n');
            
            // Verificar se há outros artigos FA para comparação
            const outrosFA = await connection.execute(`
                SELECT CDU_CSU_ARTIGO, COUNT(*) as TOTAL
                FROM PCE.CSU_EPENTIDADEACTOGASTOS
                WHERE CDU_CSU_ARTIGO LIKE 'FA%'
                  AND ROWNUM <= 5
                GROUP BY CDU_CSU_ARTIGO
                ORDER BY COUNT(*) DESC
            `);
            
            console.log('Exemplos de outros artigos FA que ESTÃO na tabela:');
            outrosFA.rows.forEach(row => {
                console.log(`  ${row[0]}: ${row[1]} registos`);
            });
        }
        
        // 2. Verificar PRF_PRESC_MOV
        console.log('\n\n2. VERIFICAÇÃO EM PRF_PRESC_MOV:\n');
        const prescricoes = await connection.execute(`
            SELECT 
                COUNT(*) as TOTAL,
                COUNT(DISTINCT EPISODIO) as EPISODIOS,
                SUM(CASE WHEN EPISODIO = '18027051' THEN 1 ELSE 0 END) as EP_18027051
            FROM PCE.PRF_PRESC_MOV 
            WHERE CODIGO = 'FA10040790'
        `);
        
        const [totalPresc, totalEp, totalEp18027051] = prescricoes.rows[0];
        console.log(`Total prescrições: ${totalPresc}`);
        console.log(`Episódios únicos: ${totalEp}`);
        console.log(`Prescrições do episódio 18027051: ${totalEp18027051}`);
        
        // 3. Verificar CSU_DEFACTOSENTGASTOS
        console.log('\n\n3. VERIFICAÇÃO EM CSU_DEFACTOSENTGASTOS:\n');
        const defGastos = await connection.execute(`
            SELECT COUNT(*) FROM PCE.CSU_DEFACTOSENTGASTOS 
            WHERE CDU_CSU_ARTIGO = :codigo
        `, { codigo: 'FA10040790' });
        console.log(`Registos encontrados: ${defGastos.rows[0][0]}`);
        
        // 4. Busca em PRF_MEDICAMENTOS
        console.log('\n\n4. VERIFICAÇÃO EM PRF_MEDICAMENTOS:\n');
        const medicamento = await connection.execute(`
            SELECT CODIGO, DESC_C, STOCK_ATUAL, AFETA_STOCK
            FROM PCE.PRF_MEDICAMENTOS
            WHERE CODIGO = 'FA10040790'
        `);
        
        if (medicamento.rows.length > 0) {
            const [cod, desc, stock, afeta] = medicamento.rows[0];
            console.log(`✓ Encontrado em PRF_MEDICAMENTOS:`);
            console.log(`  Código: ${cod}`);
            console.log(`  Descrição: ${desc}`);
            console.log(`  Stock Atual: ${stock}`);
            console.log(`  Afeta Stock: ${afeta}`);
        }
        
        // 5. Verificar episódio 18027051
        console.log('\n\n5. VERIFICAÇÃO DO EPISÓDIO 18027051:\n');
        
        // Em CSU_EPENTIDADEACTOS
        const epActos = await connection.execute(`
            SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOS
            WHERE EPISODIO = '18027051'
        `);
        console.log(`Registos em CSU_EPENTIDADEACTOS: ${epActos.rows[0][0]}`);
        
        // Verificar IDs deste episódio
        if (epActos.rows[0][0] > 0) {
            const idsEpisodio = await connection.execute(`
                SELECT CDU_CSU_ID
                FROM PCE.CSU_EPENTIDADEACTOS
                WHERE EPISODIO = '18027051'
                AND ROWNUM <= 10
            `);
            
            console.log('\nVerificando medicamentos para IDs do episódio:');
            let temMedicamentos = false;
            for (const [id] of idsEpisodio.rows) {
                const meds = await connection.execute(`
                    SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS
                    WHERE CDU_CSU_EPISODIOENTIDADEACTOID = :id
                `, { id });
                
                if (meds.rows[0][0] > 0) {
                    console.log(`  ID ${id}: ${meds.rows[0][0]} medicamentos`);
                    temMedicamentos = true;
                    
                    // Ver quais medicamentos
                    const quaisMeds = await connection.execute(`
                        SELECT CDU_CSU_ARTIGO
                        FROM PCE.CSU_EPENTIDADEACTOGASTOS
                        WHERE CDU_CSU_EPISODIOENTIDADEACTOID = :id
                        AND ROWNUM <= 3
                    `, { id });
                    
                    quaisMeds.rows.forEach(med => {
                        console.log(`    - ${med[0]}`);
                    });
                }
            }
            
            if (!temMedicamentos) {
                console.log('  ❌ Nenhum dos IDs tem medicamentos associados!');
            }
        }
        
        // 6. Busca final em TODAS as tabelas
        console.log('\n\n6. BUSCA EXAUSTIVA EM TODAS AS TABELAS:\n');
        console.log('Procurando FA10040790 em QUALQUER tabela...\n');
        
        const todasTabelas = await connection.execute(`
            SELECT TABLE_NAME, COLUMN_NAME
            FROM ALL_TAB_COLUMNS
            WHERE OWNER = 'PCE'
              AND DATA_TYPE IN ('VARCHAR2', 'NVARCHAR2', 'CHAR')
              AND (
                COLUMN_NAME LIKE '%CODIGO%' 
                OR COLUMN_NAME LIKE '%ARTIGO%'
                OR COLUMN_NAME = 'CODIGO'
              )
        `);
        
        let encontradoAlgures = false;
        const tabelasOndeEsta = [];
        
        for (const [tabela, coluna] of todasTabelas.rows) {
            try {
                const check = await connection.execute(
                    `SELECT COUNT(*) FROM PCE.${tabela} WHERE ${coluna} = :codigo AND ROWNUM = 1`,
                    { codigo: 'FA10040790' }
                );
                
                if (check.rows[0][0] > 0) {
                    // Contar total
                    const total = await connection.execute(
                        `SELECT COUNT(*) FROM PCE.${tabela} WHERE ${coluna} = :codigo`,
                        { codigo: 'FA10040790' }
                    );
                    tabelasOndeEsta.push(`${tabela}.${coluna}: ${total.rows[0][0]} registos`);
                    encontradoAlgures = true;
                }
            } catch (err) {
                // Ignorar erros
            }
        }
        
        if (encontradoAlgures) {
            console.log('✓ FA10040790 ENCONTRADO nas seguintes tabelas:');
            tabelasOndeEsta.forEach(tab => console.log(`  - ${tab}`));
        } else {
            console.log('✗ FA10040790 não encontrado em NENHUMA tabela!');
        }
        
        // 7. CONCLUSÃO
        console.log('\n\n=======================================================');
        console.log('CONCLUSÃO FINAL');
        console.log('=======================================================\n');
        
        console.log('RESUMO DOS FACTOS:');
        console.log(`1. PRF_PRESC_MOV tem ${totalPresc} prescrições do FA10040790`);
        console.log(`2. CSU_EPENTIDADEACTOGASTOS tem ${totalEpGastos} registos do FA10040790`);
        console.log(`3. Episódio 18027051 tem ${totalEp18027051} prescrições em PRF`);
        console.log(`4. Episódio 18027051 tem ${epActos.rows[0][0]} registos em CSU_EPENTIDADEACTOS`);
        
        if (totalPresc > 0 && totalEpGastos === 0) {
            console.log('\n❌ PROBLEMA CONFIRMADO:');
            console.log('As prescrições existem em PRF mas NÃO foram migradas para CSU!');
            console.log('O processo de integração PRF → CSU falhou para este artigo.');
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
verificacaoFinalFA10040790(); 