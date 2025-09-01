const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

const MODULO_MAP = {
    'URG': 'Urgência',
    'INT': 'Internamento',
    'CON': 'Consulta',
    'HD': 'Hospital Dia',
    'BLO': 'Bloco Operatório'
};

async function analisarContextoDTMED() {
    let connection;

    try {
        console.log('=======================================================');
        console.log('ANÁLISE DE CONTEXTO PARA SIGLAS DTMED (MD e MS)');
        console.log('=======================================================\n');

        connection = await oracledb.getConnection(dbConfig);

        // 1. Investigar MD
        console.log('1. CONTEXTO PARA DTMED = \'MD\' (MEDICAÇÃO DOMICILIAR?)\n');
        
        console.log('Distribuição por Módulo:');
        const moduloMD = await connection.execute(`
            SELECT MODULO, COUNT(*) as TOTAL 
            FROM pce.prf_presc_mov 
            WHERE DTMED = 'MD' 
            GROUP BY MODULO 
            ORDER BY TOTAL DESC
        `);
        console.log('Módulo      | Total   | Descrição');
        console.log('-'.repeat(50));
        if (moduloMD.rows.length > 0) {
            moduloMD.rows.forEach(row => {
                const [modulo, total] = row;
                console.log(`${String(modulo || 'N/A').padEnd(12)}| ${String(total).padEnd(8)}| ${MODULO_MAP[modulo] || 'Não Mapeado'}`);
            });
        } else {
            console.log('Nenhum dado de módulo encontrado para DTMED = \'MD\'.');
        }

        console.log('\nDistribuição por Estado:');
        const estadoMD = await connection.execute(`
            SELECT ESTADO, COUNT(*) as TOTAL 
            FROM pce.prf_presc_mov 
            WHERE DTMED = 'MD' 
            GROUP BY ESTADO 
            ORDER BY TOTAL DESC
        `);
        console.log('Estado      | Total');
        console.log('-'.repeat(25));
        if (estadoMD.rows.length > 0) {
            estadoMD.rows.forEach(row => {
                const [estado, total] = row;
                console.log(`${String(estado || 'N/A').padEnd(12)}| ${total}`);
            });
        } else {
            console.log('Nenhum dado de estado encontrado para DTMED = \'MD\'.');
        }

        // 2. Investigar MS
        console.log('\n\n2. CONTEXTO PARA DTMED = \'MS\' (MEDICAÇÃO DE SERVIÇO/SALA?)\n');
        
        console.log('Distribuição por Módulo:');
        const moduloMS = await connection.execute(`
            SELECT MODULO, COUNT(*) as TOTAL 
            FROM pce.prf_presc_mov 
            WHERE DTMED = 'MS' 
            GROUP BY MODULO 
            ORDER BY TOTAL DESC
        `);
        console.log('Módulo      | Total   | Descrição');
        console.log('-'.repeat(50));
        if (moduloMS.rows.length > 0) {
            moduloMS.rows.forEach(row => {
                const [modulo, total] = row;
                console.log(`${String(modulo || 'N/A').padEnd(12)}| ${String(total).padEnd(8)}| ${MODULO_MAP[modulo] || 'Não Mapeado'}`);
            });
        } else {
            console.log('Nenhum dado de módulo encontrado para DTMED = \'MS\'.');
        }

        console.log('\nDistribuição por Estado:');
        const estadoMS = await connection.execute(`
            SELECT ESTADO, COUNT(*) as TOTAL 
            FROM pce.prf_presc_mov 
            WHERE DTMED = 'MS' 
            GROUP BY ESTADO 
            ORDER BY TOTAL DESC
        `);
        console.log('Estado      | Total');
        console.log('-'.repeat(25));
        if (estadoMS.rows.length > 0) {
            estadoMS.rows.forEach(row => {
                const [estado, total] = row;
                console.log(`${String(estado || 'N/A').padEnd(12)}| ${total}`);
            });
        } else {
            console.log('Nenhum dado de estado encontrado para DTMED = \'MS\'.');
        }


        console.log('\n\n=======================================================');
        console.log('ANÁLISE E PRÓXIMOS PASSOS');
        console.log('=======================================================\n');
        console.log('MD: Se o módulo predominante for "Consulta" (CON) ou "Urgência" (URG), reforça a ideia de Medicação Domiciliar.');
        console.log('MS: Se o módulo predominante for "Bloco Operatório" (BLO) ou "Internamento" (INT), reforça a ideia de medicação de serviço ou para procedimentos.');
        console.log('\nPor favor, execute este script e partilhe os resultados para continuarmos a investigação.');


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
analisarContextoDTMED(); 