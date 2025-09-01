const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function investigarAdministracoesEnfermagem() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('INVESTIGAÇÃO DAS 7447 ADMINISTRAÇÕES - FA10040790');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Estatísticas gerais
        console.log('1. ESTATÍSTICAS DAS ADMINISTRAÇÕES:\n');
        const stats = await connection.execute(`
            SELECT 
                COUNT(*) as TOTAL_ADM,
                COUNT(DISTINCT EPISODIO) as EPISODIOS,
                COUNT(DISTINCT ID_PRESC_MOV) as PRESCRICOES,
                MIN(DATA_ADM) as PRIMEIRA_ADM,
                MAX(DATA_ADM) as ULTIMA_ADM,
                SUM(QUANTIDADE) as QTD_TOTAL
            FROM PCE.PRF_PRESC_MOV_ENF
            WHERE CODIGO = 'FA10040790'
        `);
        
        const [total, episodios, prescricoes, primeira, ultima, qtdTotal] = stats.rows[0];
        console.log(`Total de administrações: ${total}`);
        console.log(`Episódios únicos: ${episodios}`);
        console.log(`Prescrições únicas: ${prescricoes}`);
        console.log(`Primeira administração: ${primeira}`);
        console.log(`Última administração: ${ultima}`);
        console.log(`Quantidade total administrada: ${qtdTotal}`);
        
        // 2. Administrações por ano
        console.log('\n\n2. ADMINISTRAÇÕES POR ANO:\n');
        const porAno = await connection.execute(`
            SELECT 
                TO_CHAR(DATA_ADM, 'YYYY') as ANO,
                COUNT(*) as TOTAL,
                COUNT(DISTINCT EPISODIO) as EPISODIOS
            FROM PCE.PRF_PRESC_MOV_ENF
            WHERE CODIGO = 'FA10040790'
            GROUP BY TO_CHAR(DATA_ADM, 'YYYY')
            ORDER BY ANO DESC
        `);
        
        console.log('Ano | Administrações | Episódios');
        console.log('-'.repeat(40));
        porAno.rows.forEach(row => {
            console.log(`${row[0]} | ${row[1]} | ${row[2]}`);
        });
        
        // 3. Episódio 18027051
        console.log('\n\n3. ADMINISTRAÇÕES DO EPISÓDIO 18027051:\n');
        const ep18027051 = await connection.execute(`
            SELECT 
                COUNT(*) as TOTAL,
                MIN(DATA_ADM) as PRIMEIRA,
                MAX(DATA_ADM) as ULTIMA
            FROM PCE.PRF_PRESC_MOV_ENF
            WHERE CODIGO = 'FA10040790'
              AND EPISODIO = '18027051'
        `);
        
        if (ep18027051.rows[0][0] > 0) {
            console.log(`Total de administrações: ${ep18027051.rows[0][0]}`);
            console.log(`Primeira: ${ep18027051.rows[0][1]}`);
            console.log(`Última: ${ep18027051.rows[0][2]}`);
            
            // Detalhes
            const detalhes = await connection.execute(`
                SELECT 
                    ID,
                    TO_CHAR(DATA_ADM, 'DD/MM/YYYY HH24:MI') as DATA,
                    ESTADO,
                    QUANTIDADE,
                    ID_USER_ADM
                FROM PCE.PRF_PRESC_MOV_ENF
                WHERE CODIGO = 'FA10040790'
                  AND EPISODIO = '18027051'
                ORDER BY DATA_ADM DESC
            `);
            
            console.log('\nÚltimas administrações:');
            detalhes.rows.slice(0, 5).forEach(row => {
                console.log(`ID: ${row[0]}, Data: ${row[1]}, Estado: ${row[2]}, Qtd: ${row[3]}, User: ${row[4]}`);
            });
        } else {
            console.log('Nenhuma administração encontrada para este episódio!');
        }
        
        // 4. Verificar se há processo de migração ENF -> CSU
        console.log('\n\n4. VERIFICAÇÃO DE TRIGGERS EM PRF_PRESC_MOV_ENF:\n');
        const triggers = await connection.execute(`
            SELECT TRIGGER_NAME, STATUS, TRIGGERING_EVENT
            FROM ALL_TRIGGERS
            WHERE TABLE_NAME = 'PRF_PRESC_MOV_ENF'
              AND OWNER = 'PCE'
        `);
        
        if (triggers.rows.length > 0) {
            console.log('Triggers encontrados:');
            triggers.rows.forEach(row => {
                console.log(`- ${row[0]} (${row[1]}) - ${row[2]}`);
            });
        } else {
            console.log('❌ Nenhum trigger encontrado!');
        }
        
        // 5. Comparar com outro medicamento
        console.log('\n\n5. COMPARAÇÃO COM FA10005405 (que funciona):\n');
        const comparacao = await connection.execute(`
            SELECT 
                CODIGO,
                COUNT(*) as ADM_ENF,
                (SELECT COUNT(*) FROM PCE.CSU_EPENTIDADEACTOGASTOS WHERE CDU_CSU_ARTIGO = CODIGO) as REG_CSU
            FROM PCE.PRF_PRESC_MOV_ENF
            WHERE CODIGO IN ('FA10040790', 'FA10005405')
            GROUP BY CODIGO
        `);
        
        console.log('Código | Administrações ENF | Registos CSU');
        console.log('-'.repeat(50));
        comparacao.rows.forEach(row => {
            const status = row[2] > 0 ? '✓' : '❌';
            console.log(`${row[0]} | ${row[1]} | ${row[2]} ${status}`);
        });
        
        // 6. Análise final
        console.log('\n\n=======================================================');
        console.log('ANÁLISE E CONCLUSÕES');
        console.log('=======================================================\n');
        
        console.log('FACTO CRÍTICO DESCOBERTO:');
        console.log(`- ${total} administrações de FA10040790 foram feitas`);
        console.log(`- Em ${episodios} episódios diferentes`);
        console.log(`- Durante ${porAno.rows.length} anos`);
        console.log('- MAS NUNCA houve dedução de stock!\n');
        
        console.log('POSSÍVEIS EXPLICAÇÕES:');
        console.log('1. Este medicamento está configurado para não deduzir stock');
        console.log('2. O processo de migração PRF_PRESC_MOV_ENF -> CSU está quebrado');
        console.log('3. Há alguma regra específica que bloqueia este código');
        console.log('4. É um medicamento de uso especial (investigacional, amostra, etc.)');
        
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
investigarAdministracoesEnfermagem(); 