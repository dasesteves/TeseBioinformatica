const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function solucaoManualFA10040790() {
    let connection;
    
    try {
        console.log('===============================================');
        console.log('SOLUÇÃO MANUAL - FA10040790');
        console.log('===============================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Primeiro vamos analisar um exemplo de como outros artigos são registados
        console.log('1. ANALISANDO ESTRUTURA DE REGISTOS EXISTENTES:\n');
        const exemplo = await connection.execute(`
            SELECT * FROM (
                SELECT 
                    ea.CDU_CSU_ID,
                    ea.EPISODIO,
                    ea.MODULO,
                    TO_CHAR(ea.CDU_CSU_DATA, 'DD/MM/YYYY HH24:MI:SS') as DATA_ACTO,
                    ea.CDU_CSU_SERVICO,
                    ea.CDU_CSU_EXPORTADO,
                    eg.CDU_CSU_ARTIGO,
                    eg.CDU_CSU_QUANTIDADE,
                    eg.CDU_CSU_PRECO
                FROM PCE.CSU_EPENTIDADEACTOS ea
                JOIN PCE.CSU_EPENTIDADEACTOGASTOS eg 
                    ON ea.CDU_CSU_ID = eg.CDU_CSU_EPISODIOENTIDADEACTOID
                WHERE eg.CDU_CSU_ARTIGO LIKE 'FA%'
                  AND ea.CDU_CSU_EXPORTADO = 2
                ORDER BY ea.CDU_CSU_DATA DESC
            ) WHERE ROWNUM <= 3
        `);
        
        console.log('Exemplos de registos correctos:');
        console.log('ID | Episódio | Módulo | Artigo | Qtd | Preço');
        console.log('-'.repeat(70));
        exemplo.rows.forEach(row => {
            console.log(`${row[0]} | ${row[1]} | ${row[2]} | ${row[6]} | ${row[7]} | ${row[8] || 0}`);
        });
        
        // 2. Buscar as prescrições do FA10040790 que precisam ser migradas
        console.log('\n\n2. PRESCRIÇÕES DO FA10040790 A MIGRAR:\n');
        const prescricoes = await connection.execute(`
            SELECT 
                pm.NUM_SEQUENCIAL,
                pm.EPISODIO,
                pm.MODULO,
                pm.DOSE as QUANTIDADE,
                pm.DESC_C,
                NVL(pm.DTA_ALT, pm.DTA_INI) as DATA_MOV,
                pm.ESTADO,
                pm.SERVICOID,
                med.PRECO
            FROM PCE.PRF_PRESC_MOV pm
            LEFT JOIN PCE.PRF_MEDICAMENTOS med ON pm.CODIGO = med.CODIGO
            WHERE pm.CODIGO = 'FA10040790'
              AND pm.ESTADO = 2  -- Apenas prescrições ativas/confirmadas
              AND pm.EPISODIO = '18027051'
            ORDER BY pm.NUM_SEQUENCIAL DESC
        `);
        
        if (prescricoes.rows.length === 0) {
            console.log('Nenhuma prescrição activa encontrada para episódio 18027051!');
            
            // Verificar todas as prescrições
            const todasPrescricoes = await connection.execute(`
                SELECT 
                    pm.NUM_SEQUENCIAL,
                    pm.EPISODIO,
                    pm.ESTADO,
                    TO_CHAR(NVL(pm.DTA_ALT, pm.DTA_INI), 'DD/MM/YYYY') as DATA
                FROM PCE.PRF_PRESC_MOV pm
                WHERE pm.CODIGO = 'FA10040790'
                  AND pm.EPISODIO = '18027051'
            `);
            
            console.log('\nTodas as prescrições do episódio 18027051:');
            todasPrescricoes.rows.forEach(row => {
                const estado = row[2] === 2 ? 'ACTIVA' : row[2] === 9 ? 'CANCELADA' : `ESTADO ${row[2]}`;
                console.log(`ID: ${row[0]}, Estado: ${estado}, Data: ${row[3]}`);
            });
            
            return;
        }
        
        console.log(`Encontradas ${prescricoes.rows.length} prescrições para migrar.`);
        console.log('\nDetalhes:');
        prescricoes.rows.forEach(row => {
            console.log(`ID: ${row[0]}, Episódio: ${row[1]}, Qtd: ${row[3]}, Preço: ${row[8] || 0}`);
        });
        
        // 3. Preparar inserção
        console.log('\n\n3. PREPARANDO INSERÇÃO MANUAL:\n');
        console.log('⚠️  ATENÇÃO: Este é um processo MANUAL de correção!');
        console.log('Vamos inserir os registos em CSU_EPENTIDADEACTOS e CSU_EPENTIDADEACTOGASTOS.\n');
        
        // Obter próximo ID
        const nextId = await connection.execute(`
            SELECT NVL(MAX(CDU_CSU_ID), 0) + 1 as NEXT_ID
            FROM PCE.CSU_EPENTIDADEACTOS
        `);
        const proximoId = nextId.rows[0][0];
        console.log(`Próximo ID disponível: ${proximoId}`);
        
        // Gerar comandos SQL
        console.log('\n\n4. COMANDOS SQL PARA EXECUTAR:\n');
        console.log('-- EXECUTAR ESTES COMANDOS MANUALMENTE APÓS VERIFICAÇÃO:\n');
        
        let idAtual = proximoId;
        prescricoes.rows.forEach(row => {
            const [numSeq, episodio, modulo, quantidade, descricao, dataMov, estado, servicoId, preco] = row;
            
            // Comando para CSU_EPENTIDADEACTOS
            console.log(`-- Prescrição ID: ${numSeq}`);
            console.log(`INSERT INTO PCE.CSU_EPENTIDADEACTOS (`);
            console.log(`    CDU_CSU_ID, EPISODIO, MODULO, CDU_CSU_DATA,`);
            console.log(`    CDU_CSU_SERVICO, CDU_CSU_EXPORTADO, CDU_CSU_TIPO`);
            console.log(`) VALUES (`);
            console.log(`    ${idAtual}, '${episodio}', '${modulo || 'INT'}', SYSDATE,`);
            console.log(`    '${servicoId || 'INT'}', 0, 'MED'`);
            console.log(`);`);
            console.log('');
            
            // Comando para CSU_EPENTIDADEACTOGASTOS
            console.log(`INSERT INTO PCE.CSU_EPENTIDADEACTOGASTOS (`);
            console.log(`    CDU_CSU_EPISODIOENTIDADEACTOID, CDU_CSU_ARTIGO,`);
            console.log(`    CDU_CSU_QUANTIDADE, CDU_CSU_PRECO`);
            console.log(`) VALUES (`);
            console.log(`    ${idAtual}, 'FA10040790',`);
            console.log(`    ${quantidade || 1}, ${preco || 0.35795}`);
            console.log(`);`);
            console.log('\n-- -------------------------------------------\n');
            
            idAtual++;
        });
        
        console.log('-- COMMIT;');
        console.log('\n\n⚠️  IMPORTANTE:');
        console.log('1. Revise os comandos antes de executar');
        console.log('2. Execute num ambiente de teste primeiro');
        console.log('3. Após inserir, o processo batch deve processar normalmente');
        console.log('4. Os registos devem ser exportados para SCMVV automaticamente');
        
        // 5. Alternativa: Script de inserção automática (comentado por segurança)
        console.log('\n\n5. SCRIPT DE INSERÇÃO AUTOMÁTICA:\n');
        console.log('Para executar automaticamente, descomente e execute o código abaixo:');
        console.log('/*');
        console.log('// DESCOMENTE APENAS SE TIVER CERTEZA!');
        console.log('const resultado = await connection.execute(`');
        console.log('    BEGIN');
        console.log('        -- Inserir registos');
        console.log('        COMMIT;');
        console.log('    END;');
        console.log('`);');
        console.log('*/');
        
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
solucaoManualFA10040790(); 