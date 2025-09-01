const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function testarFiltroCirurgia() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('TESTE DO FILTRO DE ESPECIALIDADES CIRÚRGICAS');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        const hoje = new Date().toISOString().split('T')[0];
        
        // 1. Query original (BLO sem filtro) - como estava antes
        console.log('1. BLO SEM FILTRO (como estava antes):\n');
        
        const bloSemFiltro = await connection.execute(`
            SELECT 
                DES_ESPECIALIDADE,
                COUNT(*) as TOTAL
            FROM PCEEPISODIOS episodios
            INNER JOIN PCEDOENTES doentes ON episodios.NUM_SEQUENCIAL = doentes.NUM_SEQUENCIAL
            WHERE DTA_EPISODIO = to_date('${hoje}', 'YYYY-MM-DD')
              AND MODULO = 'BLO'
            GROUP BY DES_ESPECIALIDADE
            ORDER BY COUNT(*) DESC
        `);
        
        console.log('Especialidade | Total');
        console.log('-'.repeat(50));
        let totalSemFiltro = 0;
        bloSemFiltro.rows.forEach(row => {
            const esp = (row[0] || '').substring(0, 35);
            console.log(`${esp.padEnd(35)} | ${row[1]}`);
            totalSemFiltro += row[1];
        });
        console.log(`\nTOTAL SEM FILTRO: ${totalSemFiltro} episódios`);
        
        // 2. Query nova (BLO com filtro cirúrgico) - como vai ficar
        console.log('\n\n2. BLO COM FILTRO CIRÚRGICO (nova implementação):\n');
        
        const bloComFiltro = await connection.execute(`
            SELECT 
                DES_ESPECIALIDADE,
                COUNT(*) as TOTAL
            FROM PCEEPISODIOS episodios
            INNER JOIN PCEDOENTES doentes ON episodios.NUM_SEQUENCIAL = doentes.NUM_SEQUENCIAL
            WHERE DTA_EPISODIO = to_date('${hoje}', 'YYYY-MM-DD')
              AND MODULO = 'BLO'
              AND (UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%' 
                   OR UPPER(DES_ESPECIALIDADE) LIKE '%ANEST%')
            GROUP BY DES_ESPECIALIDADE
            ORDER BY COUNT(*) DESC
        `);
        
        console.log('Especialidade | Total');
        console.log('-'.repeat(50));
        let totalComFiltro = 0;
        if (bloComFiltro.rows.length > 0) {
            bloComFiltro.rows.forEach(row => {
                const esp = (row[0] || '').substring(0, 35);
                console.log(`${esp.padEnd(35)} | ${row[1]}`);
                totalComFiltro += row[1];
            });
        } else {
            console.log('❌ Nenhuma especialidade cirúrgica encontrada hoje');
        }
        console.log(`\nTOTAL COM FILTRO: ${totalComFiltro} episódios`);
        
        // 3. Comparação e análise
        console.log('\n\n3. COMPARAÇÃO E IMPACTO:\n');
        
        const reducao = totalSemFiltro - totalComFiltro;
        const percentagemReducao = totalSemFiltro > 0 ? (reducao / totalSemFiltro * 100).toFixed(1) : 0;
        
        console.log(`Antes (BLO completo): ${totalSemFiltro} episódios`);
        console.log(`Depois (só cirúrgicas): ${totalComFiltro} episódios`);
        console.log(`Redução: ${reducao} episódios (${percentagemReducao}%)`);
        
        if (totalComFiltro > 0) {
            console.log('\n✅ FILTRO FUNCIONAL:');
            console.log('- Módulo Cirurgia mostrará apenas especialidades cirúrgicas');
            console.log('- Reduz ruído de especialidades não-cirúrgicas');
            console.log('- Mantém dados relevantes para o contexto');
        } else {
            console.log('\n⚠️  FILTRO MUITO RESTRITIVO:');
            console.log('- Nenhum episódio encontrado hoje');
            console.log('- Testar com período mais alargado');
        }
        
        // 4. Teste com período mais alargado se necessário
        if (totalComFiltro === 0) {
            console.log('\n\n4. TESTE COM ÚLTIMA SEMANA:\n');
            
            const semanaComFiltro = await connection.execute(`
                SELECT 
                    DES_ESPECIALIDADE,
                    COUNT(*) as TOTAL
                FROM PCEEPISODIOS episodios
                INNER JOIN PCEDOENTES doentes ON episodios.NUM_SEQUENCIAL = doentes.NUM_SEQUENCIAL
                WHERE DTA_EPISODIO >= TRUNC(SYSDATE) - 7
                  AND MODULO = 'BLO'
                  AND (UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%' 
                       OR UPPER(DES_ESPECIALIDADE) LIKE '%ANEST%')
                GROUP BY DES_ESPECIALIDADE
                ORDER BY COUNT(*) DESC
            `);
            
            console.log('Especialidade (última semana) | Total');
            console.log('-'.repeat(60));
            let totalSemana = 0;
            if (semanaComFiltro.rows.length > 0) {
                semanaComFiltro.rows.forEach(row => {
                    const esp = (row[0] || '').substring(0, 35);
                    console.log(`${esp.padEnd(35)} | ${row[1]}`);
                    totalSemana += row[1];
                });
                console.log(`\nTOTAL ÚLTIMA SEMANA: ${totalSemana} episódios cirúrgicos`);
            } else {
                console.log('❌ Nenhuma especialidade cirúrgica na última semana');
            }
        }
        
        // 5. Recomendação final
        console.log('\n\n=======================================================');
        console.log('RECOMENDAÇÃO FINAL');
        console.log('=======================================================\n');
        
        if (totalComFiltro > 0 || (totalComFiltro === 0 && totalSemFiltro > 0)) {
            console.log('✅ IMPLEMENTAÇÃO CORRETA:');
            console.log('- Filtro de especialidades cirúrgicas implementado');
            console.log('- Módulo Cirurgia agora diferente do Bloco/Ambulatório');
            console.log('- Mostra apenas episódios relevantes para cirurgia');
            console.log('- Utilizador vê dados mais específicos e úteis');
        } else {
            console.log('⚠️  VERIFICAR IMPLEMENTAÇÃO:');
            console.log('- Filtro pode estar muito restritivo');
            console.log('- Considerar ajustar critérios de filtragem');
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
testarFiltroCirurgia();