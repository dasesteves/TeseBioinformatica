const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function solucaoPraticaFA10040790() {
    let connection;
    
    try {
        console.log('===============================================');
        console.log('SOLUÇÃO PRÁTICA - FA10040790');
        console.log('===============================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Verificar estrutura real da tabela
        console.log('1. ESTRUTURA DA TABELA CSU_EPENTIDADEACTOGASTOS:\n');
        const estrutura = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM ALL_TAB_COLUMNS 
            WHERE TABLE_NAME = 'CSU_EPENTIDADEACTOGASTOS' 
              AND OWNER = 'PCE'
            ORDER BY COLUMN_ID
        `);
        
        console.log('Colunas disponíveis:');
        estrutura.rows.forEach(row => console.log(`- ${row[0]}`));
        
        // 2. Ver exemplo de registo existente
        console.log('\n\n2. EXEMPLO DE REGISTO EXISTENTE:\n');
        const exemplo = await connection.execute(`
            SELECT * FROM (
                SELECT 
                    eg.CDU_CSU_EPISODIOENTIDADEACTOID,
                    eg.CDU_CSU_ARTIGO,
                    eg.CDU_CSU_QUANTIDADE,
                    ea.EPISODIO,
                    ea.MODULO,
                    ea.CDU_CSU_EXPORTADO
                FROM PCE.CSU_EPENTIDADEACTOGASTOS eg
                JOIN PCE.CSU_EPENTIDADEACTOS ea 
                    ON eg.CDU_CSU_EPISODIOENTIDADEACTOID = ea.CDU_CSU_ID
                WHERE eg.CDU_CSU_ARTIGO LIKE 'FA%'
                ORDER BY ea.CDU_CSU_DATA DESC
            ) WHERE ROWNUM = 1
        `);
        
        if (exemplo.rows.length > 0) {
            const [id, artigo, qtd, episodio, modulo, exportado] = exemplo.rows[0];
            console.log(`ID: ${id}`);
            console.log(`Artigo: ${artigo}`);
            console.log(`Quantidade: ${qtd}`);
            console.log(`Episódio: ${episodio}`);
            console.log(`Módulo: ${modulo}`);
            console.log(`Exportado: ${exportado}`);
        }
        
        // 3. Buscar prescrições do FA10040790 para episódio 18027051
        console.log('\n\n3. PRESCRIÇÕES DO FA10040790 (EPISÓDIO 18027051):\n');
        const prescricoes = await connection.execute(`
            SELECT 
                NUM_SEQUENCIAL,
                EPISODIO,
                MODULO,
                DOSE,
                ESTADO,
                TO_CHAR(NVL(DTA_ALT, DTA_INI), 'DD/MM/YYYY HH24:MI') as DATA
            FROM PCE.PRF_PRESC_MOV
            WHERE CODIGO = 'FA10040790'
              AND EPISODIO = '18027051'
            ORDER BY NUM_SEQUENCIAL DESC
        `);
        
        if (prescricoes.rows.length === 0) {
            console.log('Nenhuma prescrição encontrada!');
            return;
        }
        
        console.log(`Encontradas ${prescricoes.rows.length} prescrições:`);
        prescricoes.rows.forEach(row => {
            const [id, ep, mod, dose, estado, data] = row;
            const estadoDesc = estado === 2 ? 'ACTIVA' : estado === 9 ? 'CANCELADA' : `ESTADO ${estado}`;
            console.log(`\nID: ${id}`);
            console.log(`Estado: ${estadoDesc}`);
            console.log(`Dose: ${dose || 1}`);
            console.log(`Data: ${data}`);
        });
        
        // 4. Obter próximo ID
        const nextId = await connection.execute(`
            SELECT NVL(MAX(CDU_CSU_ID), 0) + 1 as NEXT_ID
            FROM PCE.CSU_EPENTIDADEACTOS
        `);
        const proximoId = nextId.rows[0][0];
        
        // 5. Gerar comandos SQL
        console.log('\n\n4. COMANDOS SQL PARA INSERIR:\n');
        console.log('-- ⚠️ REVISE ANTES DE EXECUTAR!\n');
        
        let idAtual = proximoId;
        prescricoes.rows.forEach(row => {
            const [numSeq, episodio, modulo, dose, estado, data] = row;
            
            // Apenas prescrições activas
            if (estado === 2) {
                console.log(`-- Prescrição ${numSeq}`);
                console.log(`INSERT INTO PCE.CSU_EPENTIDADEACTOS (CDU_CSU_ID, EPISODIO, MODULO, CDU_CSU_DATA, CDU_CSU_SERVICO, CDU_CSU_EXPORTADO)`);
                console.log(`VALUES (${idAtual}, '${episodio}', '${modulo || 'INT'}', SYSDATE, 'INT', 0);`);
                console.log('');
                console.log(`INSERT INTO PCE.CSU_EPENTIDADEACTOGASTOS (CDU_CSU_EPISODIOENTIDADEACTOID, CDU_CSU_ARTIGO, CDU_CSU_QUANTIDADE)`);
                console.log(`VALUES (${idAtual}, 'FA10040790', ${dose || 1});`);
                console.log('\n-- -------------------------------------------\n');
                idAtual++;
            }
        });
        
        console.log('-- COMMIT;\n');
        
        // 6. Resumo final
        console.log('\n===============================================');
        console.log('RESUMO E PRÓXIMOS PASSOS');
        console.log('===============================================\n');
        console.log('1. PROBLEMA IDENTIFICADO:');
        console.log('   - FA10040790 tem prescrições em PRF_PRESC_MOV');
        console.log('   - MAS não tem registos em CSU_EPENTIDADEACTOGASTOS');
        console.log('   - O processo de integração falhou para este artigo\n');
        
        console.log('2. SOLUÇÃO:');
        console.log('   - Execute os comandos SQL acima para inserir os registos');
        console.log('   - Após inserção, CDU_CSU_EXPORTADO = 0 (pendente)');
        console.log('   - O processo batch deve processar e exportar para SCMVV\n');
        
        console.log('3. VERIFICAÇÃO:');
        console.log('   - Após executar, verifique se CDU_CSU_EXPORTADO mudou para 2');
        console.log('   - Se continuar 0, o batch não está rodando');
        console.log('   - Se mudar para 9, houve erro na exportação\n');
        
        console.log('4. SOLUÇÃO DEFINITIVA:');
        console.log('   - Investigar por que o processo PRF->CSU falhou');
        console.log('   - Pode ser trigger desativado ou job parado');
        console.log('   - Corrigir para evitar problemas futuros');
        
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
solucaoPraticaFA10040790(); 