const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function analiseModulosCirurgia() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('ANÁLISE DETALHADA: MÓDULOS vs ESPECIALIDADES CIRÚRGICAS');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Relação entre módulo BLO e especialidades cirúrgicas
        console.log('1. MÓDULO BLO - DISTRIBUIÇÃO POR ESPECIALIDADES:\n');
        
        const bloEspecialidades = await connection.execute(`
            SELECT 
                COD_ESPECIALIDADE,
                DES_ESPECIALIDADE,
                COUNT(*) as TOTAL_EPISODIOS,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as PERCENTAGEM
            FROM PCE.PCEEPISODIOS
            WHERE MODULO = 'BLO'
            GROUP BY COD_ESPECIALIDADE, DES_ESPECIALIDADE
            ORDER BY COUNT(*) DESC
        `);
        
        console.log('Cód | Especialidade | Total | %');
        console.log('-'.repeat(70));
        bloEspecialidades.rows.slice(0, 15).forEach(row => {
            const esp = (row[1] || 'N/A').substring(0, 40);
            console.log(`${(row[0] || 'N/A').toString().padEnd(4)} | ${esp.padEnd(40)} | ${String(row[2]).padEnd(5)} | ${row[3]}%`);
        });
        
        // 2. Onde estão as especialidades cirúrgicas
        console.log('\n\n2. ONDE ESTÃO AS ESPECIALIDADES CIRÚRGICAS?\n');
        
        const cirurgiaDistribuicao = await connection.execute(`
            SELECT 
                MODULO,
                COUNT(*) as TOTAL,
                COUNT(DISTINCT COD_ESPECIALIDADE) as ESP_DIFERENTES
            FROM PCE.PCEEPISODIOS
            WHERE UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%'
               OR UPPER(DES_ESPECIALIDADE) LIKE '%ANEST%'
            GROUP BY MODULO
            ORDER BY COUNT(*) DESC
        `);
        
        console.log('Módulo | Episódios Cirúrgicos | Especialidades');
        console.log('-'.repeat(50));
        cirurgiaDistribuicao.rows.forEach(row => {
            console.log(`${(row[0] || 'N/A').padEnd(7)} | ${String(row[1]).padEnd(19)} | ${row[2]}`);
        });
        
        // 3. Top especialidades no módulo BLO vs outras cirúrgicas
        console.log('\n\n3. COMPARAÇÃO DETALHADA - BLO vs ESPECIALIDADES CIRÚRGICAS:\n');
        
        const comparacao = await connection.execute(`
            SELECT 
                'MODULO_BLO' as TIPO,
                DES_ESPECIALIDADE,
                COUNT(*) as TOTAL
            FROM PCE.PCEEPISODIOS
            WHERE MODULO = 'BLO'
            GROUP BY DES_ESPECIALIDADE
            
            UNION ALL
            
            SELECT 
                'ESP_CIRURGICA' as TIPO,
                DES_ESPECIALIDADE,
                COUNT(*) as TOTAL
            FROM PCE.PCEEPISODIOS
            WHERE UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%'
               OR UPPER(DES_ESPECIALIDADE) LIKE '%ANEST%'
            GROUP BY DES_ESPECIALIDADE
            
            ORDER BY TIPO, TOTAL DESC
        `);
        
        console.log('Especialidades no módulo BLO:');
        console.log('-'.repeat(60));
        let inBLO = true;
        comparacao.rows.forEach(row => {
            if (row[0] === 'ESP_CIRURGICA' && inBLO) {
                console.log('\nTodas as especialidades cirúrgicas (todos os módulos):');
                console.log('-'.repeat(60));
                inBLO = false;
            }
            if (row[0] === 'MODULO_BLO') {
                const esp = (row[1] || 'N/A').substring(0, 45);
                console.log(`${esp.padEnd(45)} | ${row[2]}`);
            } else if (!inBLO) {
                const esp = (row[1] || 'N/A').substring(0, 45);
                console.log(`${esp.padEnd(45)} | ${row[2]}`);
            }
        });
        
        // 4. Verificar se existe sobreposição
        console.log('\n\n4. SOBREPOSIÇÃO: ESPECIALIDADES CIRÚRGICAS NO MÓDULO BLO?\n');
        
        const sobreposicao = await connection.execute(`
            SELECT 
                DES_ESPECIALIDADE,
                COUNT(*) as TOTAL_BLO,
                (SELECT COUNT(*) 
                 FROM PCE.PCEEPISODIOS 
                 WHERE DES_ESPECIALIDADE = blo.DES_ESPECIALIDADE 
                   AND MODULO != 'BLO') as TOTAL_OUTROS_MODULOS
            FROM PCE.PCEEPISODIOS blo
            WHERE MODULO = 'BLO'
              AND (UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%'
                   OR UPPER(DES_ESPECIALIDADE) LIKE '%ANEST%')
            GROUP BY DES_ESPECIALIDADE
            ORDER BY COUNT(*) DESC
        `);
        
        if (sobreposicao.rows.length > 0) {
            console.log('Especialidades cirúrgicas que aparecem no BLO:');
            console.log('Especialidade | BLO | Outros Módulos');
            console.log('-'.repeat(70));
            sobreposicao.rows.forEach(row => {
                const esp = (row[0] || 'N/A').substring(0, 35);
                console.log(`${esp.padEnd(35)} | ${String(row[1]).padEnd(3)} | ${row[2]}`);
            });
        } else {
            console.log('❌ Nenhuma especialidade cirúrgica encontrada no módulo BLO');
        }
        
        // 5. Análise temporal
        console.log('\n\n5. ANÁLISE TEMPORAL - ÚLTIMOS EPISÓDIOS DE CADA TIPO:\n');
        
        const temporal = await connection.execute(`
            SELECT 
                'BLO' as ORIGEM,
                COUNT(*) as TOTAL_ULTIMO_MES,
                MAX(DTA_EPISODIO) as ULTIMO_EPISODIO
            FROM PCE.PCEEPISODIOS
            WHERE MODULO = 'BLO'
              AND DTA_EPISODIO >= TRUNC(SYSDATE) - 30
            
            UNION ALL
            
            SELECT 
                'CIRURGIA_ESP' as ORIGEM,
                COUNT(*) as TOTAL_ULTIMO_MES,
                MAX(DTA_EPISODIO) as ULTIMO_EPISODIO
            FROM PCE.PCEEPISODIOS
            WHERE (UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%'
                   OR UPPER(DES_ESPECIALIDADE) LIKE '%ANEST%')
              AND DTA_EPISODIO >= TRUNC(SYSDATE) - 30
        `);
        
        console.log('Origem | Último Mês | Último Episódio');
        console.log('-'.repeat(50));
        temporal.rows.forEach(row => {
            const data = row[2]?.toISOString()?.split('T')[0] || 'N/A';
            console.log(`${row[0].padEnd(11)} | ${String(row[1]).padEnd(10)} | ${data}`);
        });
        
        // 6. Investigar códigos de especialidade suspeitos
        console.log('\n\n6. CÓDIGOS DE ESPECIALIDADE DUPLICADOS/SUSPEITOS:\n');
        
        const duplicados = await connection.execute(`
            SELECT 
                COD_ESPECIALIDADE,
                COUNT(DISTINCT DES_ESPECIALIDADE) as DESC_DIFERENTES,
                LISTAGG(DES_ESPECIALIDADE, ' | ') WITHIN GROUP (ORDER BY DES_ESPECIALIDADE) as DESCRICOES
            FROM (
                SELECT DISTINCT COD_ESPECIALIDADE, DES_ESPECIALIDADE
                FROM PCE.PCEEPISODIOS
                WHERE COD_ESPECIALIDADE IS NOT NULL
                  AND (UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%'
                       OR UPPER(DES_ESPECIALIDADE) LIKE '%ANEST%')
            )
            GROUP BY COD_ESPECIALIDADE
            HAVING COUNT(DES_ESPECIALIDADE) > 1
            ORDER BY COUNT(DES_ESPECIALIDADE) DESC
        `);
        
        if (duplicados.rows.length > 0) {
            console.log('Códigos com múltiplas descrições:');
            console.log('Código | Descrições');
            console.log('-'.repeat(80));
            duplicados.rows.forEach(row => {
                console.log(`${row[0]} | ${row[2]}`);
            });
        } else {
            console.log('✅ Não há códigos de especialidade com descrições duplicadas');
        }
        
        // 7. Conclusão e recomendação
        console.log('\n\n=======================================================');
        console.log('CONCLUSÕES E RECOMENDAÇÕES');
        console.log('=======================================================\n');
        
        const totalBLO = bloEspecialidades.rows.reduce((sum, row) => sum + row[2], 0);
        const cirurgicasBLO = sobreposicao.rows.reduce((sum, row) => sum + row[1], 0);
        const percentagemCirurgica = cirurgicasBLO > 0 ? (cirurgicasBLO / totalBLO * 100).toFixed(2) : 0;
        
        console.log('📊 ANÁLISE DOS DADOS:');
        console.log(`- Módulo BLO tem ${totalBLO} episódios totais`);
        console.log(`- ${cirurgicasBLO} episódios são de especialidades cirúrgicas (${percentagemCirurgica}%)`);
        console.log(`- ${totalBLO - cirurgicasBLO} episódios são de outras especialidades`);
        
        console.log('\n🎯 RECOMENDAÇÃO PARA O MÓDULO:');
        if (percentagemCirurgica > 50) {
            console.log('✅ BLO = Bloco Operatório/Cirúrgico');
            console.log('   - Maioria são episódios de cirurgia');
            console.log('   - Usar módulo BLO para cirurgia faz sentido');
        } else {
            console.log('⚠️  BLO parece ser mais ambulatório que cirúrgico');
            console.log('   - Considerar filtrar por especialidades cirúrgicas');
            console.log('   - Ou criar módulo CIR específico');
        }
        
        console.log('\n📋 IMPLEMENTAÇÃO SUGERIDA:');
        console.log('1. Usar módulo BLO como base');
        console.log('2. Filtrar por especialidades cirúrgicas se necessário');
        console.log('3. Manter nome "Cirurgia" na interface (mais claro para utilizadores)');
        console.log('4. Backend pode usar BLO internamente');
        
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
analiseModulosCirurgia();