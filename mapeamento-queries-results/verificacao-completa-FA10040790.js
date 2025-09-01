const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function verificacaoCompletaFA10040790() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('VERIFICAÇÃO COMPLETA - FA10040790 EM TODAS TABELAS CSU');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. CSU_EPENTIDADEACTOGASTOS - verificação dupla
        console.log('1. CSU_EPENTIDADEACTOGASTOS:\n');
        
        // Verificar por código direto
        const epGastos1 = await connection.execute(`
            SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS 
            WHERE CDU_CSU_ARTIGO = :codigo
        `, { codigo: 'FA10040790' });
        console.log(`- Registos com CDU_CSU_ARTIGO = 'FA10040790': ${epGastos1.rows[0][0]}`);
        
        // Verificar por LIKE para garantir
        const epGastos2 = await connection.execute(`
            SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS 
            WHERE CDU_CSU_ARTIGO LIKE '%FA10040790%'
        `);
        console.log(`- Registos com CDU_CSU_ARTIGO LIKE '%FA10040790%': ${epGastos2.rows[0][0]}`);
        
        // 2. CSU_DEFACTOSENTGASTOS
        console.log('\n2. CSU_DEFACTOSENTGASTOS:\n');
        const defGastos = await connection.execute(`
            SELECT COUNT(*) FROM PCE.CSU_DEFACTOSENTGASTOS 
            WHERE CDU_CSU_ARTIGO = :codigo
        `, { codigo: 'FA10040790' });
        console.log(`- Registos encontrados: ${defGastos.rows[0][0]}`);
        
        if (defGastos.rows[0][0] > 0) {
            console.log('\nDetalhes dos registos:');
            const detalhes = await connection.execute(`
                SELECT * FROM (
                    SELECT 
                        CDU_CSU_ID,
                        CDU_CSU_ARTIGO,
                        DESCRICAO,
                        CDU_CSU_QTDSUGERIDA
                    FROM PCE.CSU_DEFACTOSENTGASTOS
                    WHERE CDU_CSU_ARTIGO = :codigo
                ) WHERE ROWNUM <= 5
            `, { codigo: 'FA10040790' });
            
            detalhes.rows.forEach(row => {
                console.log(`  ID: ${row[0]}, Qtd: ${row[3]}, Desc: ${row[2]}`);
            });
        }
        
        // 3. Verificar episódio 18027051 em CSU_EPENTIDADEACTOS
        console.log('\n3. EPISÓDIO 18027051 EM CSU_EPENTIDADEACTOS:\n');
        const epActos = await connection.execute(`
            SELECT 
                CDU_CSU_ID,
                EPISODIO,
                MODULO,
                TO_CHAR(CDU_CSU_DATA, 'DD/MM/YYYY HH24:MI') as DATA,
                CDU_CSU_EXPORTADO,
                CDU_CSU_SERVICO
            FROM PCE.CSU_EPENTIDADEACTOS
            WHERE EPISODIO = '18027051'
            ORDER BY CDU_CSU_DATA DESC
        `);
        
        console.log(`- Total de registos: ${epActos.rows.length}`);
        if (epActos.rows.length > 0) {
            console.log('\nÚltimos registos:');
            epActos.rows.slice(0, 5).forEach(row => {
                const status = row[4] === 0 ? 'PEND' : row[4] === 2 ? 'OK' : row[4] === 9 ? 'ERRO' : row[4];
                console.log(`  ID: ${row[0]}, Data: ${row[3]}, Status: ${status}, Serviço: ${row[5]}`);
            });
            
            // Verificar se algum desses IDs tem medicamentos
            console.log('\nVerificando medicamentos nestes registos:');
            for (const row of epActos.rows.slice(0, 3)) {
                const meds = await connection.execute(`
                    SELECT CDU_CSU_ARTIGO, CDU_CSU_QUANTIDADE
                    FROM PCE.CSU_EPENTIDADEACTOGASTOS
                    WHERE CDU_CSU_EPISODIOENTIDADEACTOID = :id
                `, { id: row[0] });
                
                if (meds.rows.length > 0) {
                    console.log(`  ID ${row[0]} tem ${meds.rows.length} medicamentos:`);
                    meds.rows.forEach(med => {
                        console.log(`    - ${med[0]} (Qtd: ${med[1]})`);
                    });
                }
            }
        }
        
        // 4. Buscar em TODAS as tabelas com campo ARTIGO
        console.log('\n4. BUSCA EXAUSTIVA EM TODAS AS TABELAS:\n');
        const tabelasArtigo = await connection.execute(`
            SELECT DISTINCT TABLE_NAME, COLUMN_NAME
            FROM ALL_TAB_COLUMNS
            WHERE OWNER = 'PCE'
              AND (
                COLUMN_NAME LIKE '%ARTIGO%'
                OR COLUMN_NAME LIKE '%CODIGO%'
                OR COLUMN_NAME = 'CODIGO'
              )
              AND DATA_TYPE IN ('VARCHAR2', 'NVARCHAR2', 'CHAR')
            ORDER BY TABLE_NAME
        `);
        
        let encontrado = false;
        for (const [tabela, coluna] of tabelasArtigo.rows) {
            try {
                const result = await connection.execute(
                    `SELECT COUNT(*) FROM PCE.${tabela} WHERE ${coluna} = :codigo`,
                    { codigo: 'FA10040790' }
                );
                
                if (result.rows[0][0] > 0) {
                    console.log(`✓ ENCONTRADO em ${tabela}.${coluna}: ${result.rows[0][0]} registos`);
                    encontrado = true;
                }
            } catch (err) {
                // Ignorar erros
            }
        }
        
        if (!encontrado) {
            console.log('✗ FA10040790 não foi encontrado em nenhuma outra tabela!');
        }
        
        // 5. Verificar relação PRF -> CSU
        console.log('\n5. VERIFICAÇÃO DA INTEGRAÇÃO PRF -> CSU:\n');
        
        // Ver quantas prescrições existem
        const prescPRF = await connection.execute(`
            SELECT COUNT(*) FROM PCE.PRF_PRESC_MOV WHERE CODIGO = 'FA10040790'
        `);
        console.log(`Prescrições em PRF_PRESC_MOV: ${prescPRF.rows[0][0]}`);
        
        // Ver quantos registos CSU existem
        const regCSU = await connection.execute(`
            SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS WHERE CDU_CSU_ARTIGO = 'FA10040790'
        `);
        console.log(`Registos em CSU_EPENTIDADEACTOGASTOS: ${regCSU.rows[0][0]}`);
        
        if (prescPRF.rows[0][0] > 0 && regCSU.rows[0][0] === 0) {
            console.log('\n❌ PROBLEMA CONFIRMADO: Prescrições existem mas não foram migradas para CSU!');
        }
        
        // 6. Verificar campos especiais
        console.log('\n6. VERIFICAÇÃO DE CAMPOS ESPECIAIS:\n');
        
        // Verificar se existem registos órfãos
        const orfaos = await connection.execute(`
            SELECT COUNT(*)
            FROM PCE.CSU_EPENTIDADEACTOS ea
            WHERE NOT EXISTS (
                SELECT 1 
                FROM PCE.CSU_EPENTIDADEACTOGASTOS eg
                WHERE eg.CDU_CSU_EPISODIOENTIDADEACTOID = ea.CDU_CSU_ID
            )
            AND ea.EPISODIO = '18027051'
        `);
        console.log(`Registos órfãos do episódio 18027051: ${orfaos.rows[0][0]}`);
        
        console.log('\n=======================================================');
        console.log('CONCLUSÃO FINAL');
        console.log('=======================================================\n');
        
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
verificacaoCompletaFA10040790(); 