const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function testeModuloCirurgia() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('TESTE DE QUERIES PARA MÓDULO DE CIRURGIA');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Verificar se existem episódios de cirurgia
        console.log('1. VERIFICANDO EPISÓDIOS DE CIRURGIA:\n');
        
        const episodiosCirurgia = await connection.execute(`
            SELECT 
                MODULO,
                COUNT(*) as TOTAL_EPISODIOS,
                MIN(DTA_EPISODIO) as PRIMEIRA_DATA,
                MAX(DTA_EPISODIO) as ULTIMA_DATA
            FROM PCE.PCEEPISODIOS
            WHERE MODULO IN ('CIR', 'BLO', 'CIRURGIA', 'BLOCO')
            GROUP BY MODULO
            ORDER BY TOTAL_EPISODIOS DESC
        `);
        
        if (episodiosCirurgia.rows.length > 0) {
            console.log('Módulos de cirurgia encontrados:');
            console.log('Módulo | Total | Primeira Data | Última Data');
            console.log('-'.repeat(60));
            episodiosCirurgia.rows.forEach(row => {
                console.log(`${row[0]} | ${row[1]} | ${row[2]?.toISOString()?.split('T')[0] || 'N/A'} | ${row[3]?.toISOString()?.split('T')[0] || 'N/A'}`);
            });
        } else {
            console.log('❌ Nenhum episódio com módulo CIR/BLO encontrado');
        }
        
        // 2. Verificar todos os módulos existentes
        console.log('\n\n2. TODOS OS MÓDULOS EXISTENTES:\n');
        
        const todosModulos = await connection.execute(`
            SELECT 
                MODULO,
                COUNT(*) as TOTAL_EPISODIOS,
                COUNT(DISTINCT NUM_SEQUENCIAL) as UTENTES_UNICOS
            FROM PCE.PCEEPISODIOS
            GROUP BY MODULO
            ORDER BY TOTAL_EPISODIOS DESC
        `);
        
        console.log('Módulo | Episódios | Utentes Únicos');
        console.log('-'.repeat(40));
        todosModulos.rows.forEach(row => {
            console.log(`${(row[0] || 'NULL').padEnd(7)} | ${String(row[1]).padEnd(9)} | ${row[2]}`);
        });
        
        // 3. Verificar especialidades relacionadas com cirurgia
        console.log('\n\n3. ESPECIALIDADES RELACIONADAS COM CIRURGIA:\n');
        
        const especialidadesCirurgia = await connection.execute(`
            SELECT DISTINCT 
                COD_ESPECIALIDADE,
                DES_ESPECIALIDADE,
                COUNT(*) as TOTAL_EPISODIOS
            FROM PCE.PCEEPISODIOS
            WHERE UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%'
               OR UPPER(DES_ESPECIALIDADE) LIKE '%BLOCO%'
               OR UPPER(DES_ESPECIALIDADE) LIKE '%ANEST%'
               OR UPPER(DES_ESPECIALIDADE) LIKE '%OPERATÓRIO%'
            GROUP BY COD_ESPECIALIDADE, DES_ESPECIALIDADE
            ORDER BY TOTAL_EPISODIOS DESC
        `);
        
        if (especialidadesCirurgia.rows.length > 0) {
            console.log('Cód | Especialidade | Total');
            console.log('-'.repeat(60));
            especialidadesCirurgia.rows.forEach(row => {
                console.log(`${(row[0] || 'N/A').padEnd(4)} | ${(row[1] || 'N/A').padEnd(40)} | ${row[2]}`);
            });
        } else {
            console.log('❌ Nenhuma especialidade relacionada com cirurgia encontrada');
        }
        
        // 4. Testar query parecida com a dos outros módulos
        console.log('\n\n4. TESTE DE QUERY PADRÃO PARA CIRURGIA (último mês):\n');
        
        const queryPadrao = await connection.execute(`
            SELECT EPISODIO,
                   doentes.NUM_SEQUENCIAL as NUM_SEQUENCIAL,
                   DTA_EPISODIO,
                   HORA_EPISODIO,
                   DES_ESPECIALIDADE,
                   COD_ESPECIALIDADE,
                   NUM_PROCESSO,
                   NOME,
                   (SELECT COUNT(*)
                    FROM CSU_EPENTIDADEACTOS C
                    WHERE C.EPISODIO = episodios.EPISODIO
                      and c.MODULO = episodios.MODULO) AS CSU_EPENTIDADEACTOS_COUNT
            FROM PCEEPISODIOS episodios
            INNER JOIN PCEDOENTES doentes ON episodios.NUM_SEQUENCIAL = doentes.NUM_SEQUENCIAL
            WHERE DTA_EPISODIO >= TRUNC(SYSDATE) - 30
              AND (MODULO IN ('CIR', 'BLO') 
                   OR UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%'
                   OR UPPER(DES_ESPECIALIDADE) LIKE '%BLOCO%')
            ORDER BY DTA_EPISODIO DESC, NOME
        `);
        
        console.log(`Encontrados ${queryPadrao.rows.length} episódios de cirurgia no último mês`);
        
        if (queryPadrao.rows.length > 0) {
            console.log('\nPrimeiros 5 episódios:');
            console.log('Episódio | Data | Utente | Especialidade | Tratamentos');
            console.log('-'.repeat(80));
            queryPadrao.rows.slice(0, 5).forEach(row => {
                const data = row[2]?.toISOString()?.split('T')[0] || 'N/A';
                const nome = (row[7] || '').substring(0, 20);
                const esp = (row[4] || '').substring(0, 15);
                console.log(`${row[0]} | ${data} | ${nome.padEnd(20)} | ${esp.padEnd(15)} | ${row[8]}`);
            });
        }
        
        // 5. Verificar se existe tabela específica de cirurgias
        console.log('\n\n5. VERIFICANDO TABELAS ESPECÍFICAS DE CIRURGIA:\n');
        
        const tabelasCirurgia = await connection.execute(`
            SELECT TABLE_NAME, NUM_ROWS
            FROM ALL_TABLES
            WHERE OWNER = 'PCE'
              AND (UPPER(TABLE_NAME) LIKE '%CIRURG%'
                   OR UPPER(TABLE_NAME) LIKE '%BLOCO%'
                   OR UPPER(TABLE_NAME) LIKE '%OPERATORIO%'
                   OR UPPER(TABLE_NAME) LIKE '%CIR%')
            ORDER BY TABLE_NAME
        `);
        
        if (tabelasCirurgia.rows.length > 0) {
            console.log('Tabelas relacionadas com cirurgia:');
            console.log('Tabela | Registros');
            console.log('-'.repeat(40));
            tabelasCirurgia.rows.forEach(row => {
                console.log(`${row[0]} | ${row[1] || 'N/A'}`);
            });
        } else {
            console.log('❌ Nenhuma tabela específica de cirurgia encontrada');
        }
        
        // 6. Verificar actos/tratamentos de cirurgia
        console.log('\n\n6. VERIFICANDO ACTOS DE CIRURGIA NO CSU:\n');
        
        const actosCirurgia = await connection.execute(`
            SELECT 
                CDU_CSU_CODIGO,
                CDU_CSU_DESCRICAO,
                COUNT(*) as TOTAL_USOS
            FROM PCE.CSU_DEFACTOS d
            LEFT JOIN PCE.CSU_EPENTIDADEACTOS a ON d.CDU_CSU_ID = a.CDU_CSU_ACTOID
            WHERE UPPER(CDU_CSU_DESCRICAO) LIKE '%CIRURG%'
               OR UPPER(CDU_CSU_DESCRICAO) LIKE '%BLOCO%'
               OR UPPER(CDU_CSU_DESCRICAO) LIKE '%OPERATÓRIO%'
               OR UPPER(CDU_CSU_DESCRICAO) LIKE '%ANEST%'
            GROUP BY CDU_CSU_CODIGO, CDU_CSU_DESCRICAO
            ORDER BY TOTAL_USOS DESC
        `);
        
        if (actosCirurgia.rows.length > 0) {
            console.log('Actos relacionados com cirurgia:');
            console.log('Código | Descrição | Usos');
            console.log('-'.repeat(80));
            actosCirurgia.rows.slice(0, 10).forEach(row => {
                const desc = (row[1] || '').substring(0, 50);
                console.log(`${(row[0] || 'N/A').padEnd(7)} | ${desc.padEnd(50)} | ${row[2]}`);
            });
        } else {
            console.log('❌ Nenhum acto relacionado com cirurgia encontrado');
        }
        
        // 7. Análise final e recomendações
        console.log('\n\n=======================================================');
        console.log('ANÁLISE E RECOMENDAÇÕES');
        console.log('=======================================================\n');
        
        const totalEpisodios = queryPadrao.rows.length;
        const temTabelas = tabelasCirurgia.rows.length > 0;
        const temActos = actosCirurgia.rows.length > 0;
        
        if (totalEpisodios > 0) {
            console.log('✅ EPISÓDIOS DE CIRURGIA ENCONTRADOS');
            console.log(`   - ${totalEpisodios} episódios no último mês`);
            console.log('   - Pode reutilizar a query padrão de PacientesList.tsx');
        } else {
            console.log('❌ NENHUM EPISÓDIO DE CIRURGIA ENCONTRADO');
            console.log('   - Verificar se existe módulo específico');
            console.log('   - Pode ser necessário criar dados de teste');
        }
        
        if (temTabelas) {
            console.log('\n✅ TABELAS ESPECÍFICAS ENCONTRADAS');
            console.log('   - Investigar estrutura para funcionalidades extras');
        }
        
        if (temActos) {
            console.log('\n✅ ACTOS DE CIRURGIA ENCONTRADOS');
            console.log('   - Sistema de tratamentos pode ser usado');
        }
        
        console.log('\n📋 PRÓXIMOS PASSOS RECOMENDADOS:');
        console.log('1. Adaptar query da API /api/pacientes para módulo CIR');
        console.log('2. Testar CirurgiaList.tsx com dados reais');
        console.log('3. Verificar se existem filtros específicos necessários');
        console.log('4. Adaptar Header.tsx para incluir filtros de cirurgia');
        
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
testeModuloCirurgia();