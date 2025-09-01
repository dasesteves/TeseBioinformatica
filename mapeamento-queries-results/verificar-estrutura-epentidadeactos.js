const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function verificarEstrutura() {
    let connection;
    
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        console.log('ESTRUTURA DA TABELA CSU_EPENTIDADEACTOS:');
        console.log('='.repeat(50));
        
        const estrutura = await connection.execute(`
            SELECT column_name, data_type, data_length, nullable
            FROM user_tab_columns 
            WHERE table_name = 'CSU_EPENTIDADEACTOS'
            ORDER BY column_id
        `);
        
        console.log('Coluna | Tipo | Tamanho | Nullable');
        console.log('-'.repeat(50));
        estrutura.rows.forEach(row => {
            const [coluna, tipo, tamanho, nullable] = row;
            console.log(`${coluna.padEnd(25)} | ${tipo.padEnd(10)} | ${tamanho?.toString().padEnd(7) || ''} | ${nullable}`);
        });
        
        console.log('\n\nAMOSTRA DE DADOS (BLO):');
        console.log('='.repeat(50));
        
        const amostra = await connection.execute(`
            SELECT 
                EPISODIO,
                MODULO,
                COD_ARTIGO,
                QTD,
                DTA_REGISTO,
                ROWNUM
            FROM PCE.CSU_EPENTIDADEACTOS 
            WHERE MODULO = 'BLO'
            AND ROWNUM <= 5
            ORDER BY DTA_REGISTO DESC
        `);
        
        console.log('Episódio | Módulo | Cód Artigo | Qtd | Data Registo');
        console.log('-'.repeat(60));
        
        amostra.rows.forEach(row => {
            const [episodio, modulo, codArtigo, qtd, dataReg] = row;
            const dataStr = dataReg ? new Date(dataReg).toLocaleDateString() : '';
            console.log(`${episodio?.toString().padEnd(10) || ''} | ${modulo?.padEnd(6) || ''} | ${codArtigo?.toString().padEnd(10) || ''} | ${qtd?.toString().padEnd(3) || ''} | ${dataStr}`);
        });
        
        console.log('\n\nESTATÍSTICAS POR MÓDULO:');
        console.log('='.repeat(50));
        
        const stats = await connection.execute(`
            SELECT 
                MODULO,
                COUNT(*) as TOTAL_REGISTOS,
                COUNT(DISTINCT EPISODIO) as EPISODIOS_UNICOS,
                COUNT(DISTINCT COD_ARTIGO) as ARTIGOS_UNICOS
            FROM PCE.CSU_EPENTIDADEACTOS
            GROUP BY MODULO
            ORDER BY COUNT(*) DESC
        `);
        
        console.log('Módulo | Total | Episódios | Artigos');
        console.log('-'.repeat(40));
        stats.rows.forEach(row => {
            const [modulo, total, episodios, artigos] = row;
            console.log(`${modulo?.padEnd(6) || ''} | ${total?.toString().padEnd(5) || ''} | ${episodios?.toString().padEnd(9) || ''} | ${artigos?.toString().padEnd(7) || ''}`);
        });
        
    } catch (err) {
        console.error('Erro:', err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

verificarEstrutura();