const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function investigarSiglasDTMED() {
    let connection;

    try {
        console.log('=======================================================');
        console.log('INVESTIGAÇÃO DAS SIGLAS DTMED (MD e MS)');
        console.log('=======================================================\n');

        connection = await oracledb.getConnection(dbConfig);

        // 1. Investigar MD
        console.log('1. MEDICAMENTOS MAIS COMUNS COM DTMED = \'MD\':\n');
        const medicamentosMD = await connection.execute(`
            SELECT CODIGO, DESC_C, TOTAL FROM (
                SELECT
                    pm.CODIGO,
                    med.DESC_C,
                    COUNT(*) as TOTAL
                FROM
                    pce.prf_presc_mov pm
                LEFT JOIN
                    pce.prf_medicamentos med ON pm.CODIGO = med.CODIGO
                WHERE
                    pm.DTMED = 'MD'
                GROUP BY
                    pm.CODIGO, med.DESC_C
                ORDER BY
                    TOTAL DESC
            ) WHERE ROWNUM <= 20
        `);

        console.log('Código      | Total | Descrição');
        console.log('-'.repeat(80));
        if (medicamentosMD.rows.length > 0) {
            medicamentosMD.rows.forEach(row => {
                const [codigo, desc, total] = row;
                console.log(`${String(codigo || 'N/A').padEnd(12)}| ${String(total).padEnd(6)}| ${desc || 'N/A'}`);
            });
        } else {
            console.log('Nenhum medicamento encontrado para DTMED = \'MD\'.');
        }


        // 2. Investigar MS
        console.log('\n\n2. MEDICAMENTOS MAIS COMUNS COM DTMED = \'MS\':\n');
        const medicamentosMS = await connection.execute(`
            SELECT CODIGO, DESC_C, TOTAL FROM (
                SELECT
                    pm.CODIGO,
                    med.DESC_C,
                    COUNT(*) as TOTAL
                FROM
                    pce.prf_presc_mov pm
                LEFT JOIN
                    pce.prf_medicamentos med ON pm.CODIGO = med.CODIGO
                WHERE
                    pm.DTMED = 'MS'
                GROUP BY
                    pm.CODIGO, med.DESC_C
                ORDER BY
                    TOTAL DESC
            ) WHERE ROWNUM <= 20
        `);

        console.log('Código      | Total | Descrição');
        console.log('-'.repeat(80));
        if (medicamentosMS.rows.length > 0) {
            medicamentosMS.rows.forEach(row => {
                const [codigo, desc, total] = row;
                console.log(`${String(codigo || 'N/A').padEnd(12)}| ${String(total).padEnd(6)}| ${desc || 'N/A'}`);
            });
        } else {
            console.log('Nenhum medicamento encontrado para DTMED = \'MS\'.');
        }

        console.log('\n\n=======================================================');
        console.log('PRÓXIMOS PASSOS SUGERIDOS:');
        console.log('=======================================================\n');
        console.log('1. Analisar os nomes e tipos dos medicamentos listados.');
        console.log('2. Verificar se os códigos correspondem a medicamentos especiais, suplementos, ou itens não farmacêuticos.');
        console.log('3. Com base nos resultados, podemos aprofundar a análise verificando outros campos (e.g., `AFETA_STOCK`, `CONSUMO_DIR`) para esses medicamentos.');


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
investigarSiglasDTMED(); 