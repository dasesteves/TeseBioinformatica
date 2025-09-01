const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function analisarFluxoEpisodiosCirurgia() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('ANÁLISE DO FLUXO DE EPISÓDIOS - TRANSIÇÃO PARA CIRURGIA');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Verificar se existem episódios do mesmo paciente em diferentes módulos
        console.log('1. PACIENTES COM EPISÓDIOS EM MÚLTIPLOS MÓDULOS (MESMO DIA):\n');
        
        const multiModulos = await connection.execute(`
            SELECT 
                p1.NUM_SEQUENCIAL,
                d.NOME,
                p1.DTA_EPISODIO,
                COUNT(DISTINCT p1.MODULO) as MODULOS_DIFERENTES,
                LISTAGG(p1.MODULO || ':' || p1.EPISODIO, ' | ') WITHIN GROUP (ORDER BY p1.MODULO) as EPISODIOS_DETALHES
            FROM PCE.PCEEPISODIOS p1
            INNER JOIN PCE.PCEDOENTES d ON p1.NUM_SEQUENCIAL = d.NUM_SEQUENCIAL
            WHERE p1.DTA_EPISODIO >= TRUNC(SYSDATE) - 7
              AND EXISTS (
                  SELECT 1 FROM PCE.PCEEPISODIOS p2 
                  WHERE p2.NUM_SEQUENCIAL = p1.NUM_SEQUENCIAL 
                    AND p2.DTA_EPISODIO = p1.DTA_EPISODIO
                    AND p2.MODULO != p1.MODULO
              )
            GROUP BY p1.NUM_SEQUENCIAL, d.NOME, p1.DTA_EPISODIO
            HAVING COUNT(DISTINCT p1.MODULO) > 1
            ORDER BY COUNT(DISTINCT p1.MODULO) DESC, p1.DTA_EPISODIO DESC
        `);
        
        console.log(`Encontrados ${multiModulos.rows.length} pacientes com múltiplos módulos no mesmo dia (última semana)`);
        if (multiModulos.rows.length > 0) {
            console.log('\nPrimeiros 10 casos:');
            console.log('Paciente | Data | Módulos | Detalhes');
            console.log('-'.repeat(120));
            multiModulos.rows.slice(0, 10).forEach(row => {
                const nome = (row[1] || '').substring(0, 20);
                const data = row[2]?.toISOString()?.split('T')[0] || 'N/A';
                console.log(`${nome.padEnd(20)} | ${data} | ${row[3]} | ${row[4]}`);
            });
        }
        
        // 2. Verificar sequência temporal específica INT → BLO
        console.log('\n\n2. SEQUÊNCIA INT → BLO (MESMO PACIENTE, DIAS CONSECUTIVOS):\n');
        
        const sequenciaINTBLO = await connection.execute(`
            SELECT 
                i.NUM_SEQUENCIAL,
                d.NOME,
                i.EPISODIO as EPISODIO_INT,
                i.DTA_EPISODIO as DATA_INT,
                i.DES_ESPECIALIDADE as ESP_INT,
                b.EPISODIO as EPISODIO_BLO,
                b.DTA_EPISODIO as DATA_BLO,
                b.DES_ESPECIALIDADE as ESP_BLO,
                (b.DTA_EPISODIO - i.DTA_EPISODIO) as DIAS_DIFERENCA
            FROM PCE.PCEEPISODIOS i
            INNER JOIN PCE.PCEEPISODIOS b ON i.NUM_SEQUENCIAL = b.NUM_SEQUENCIAL
            INNER JOIN PCE.PCEDOENTES d ON i.NUM_SEQUENCIAL = d.NUM_SEQUENCIAL
            WHERE i.MODULO = 'INT'
              AND b.MODULO = 'BLO'
              AND b.DTA_EPISODIO >= i.DTA_EPISODIO
              AND b.DTA_EPISODIO <= i.DTA_EPISODIO + 7
              AND i.DTA_EPISODIO >= TRUNC(SYSDATE) - 30
              AND (UPPER(i.DES_ESPECIALIDADE) LIKE '%CIRURG%' 
                   OR UPPER(b.DES_ESPECIALIDADE) LIKE '%CIRURG%')
            ORDER BY i.DTA_EPISODIO DESC
        `);
        
        console.log(`Encontradas ${sequenciaINTBLO.rows.length} transições INT→BLO no último mês`);
        if (sequenciaINTBLO.rows.length > 0) {
            console.log('\nPrimeiros 10 casos:');
            console.log('Paciente | INT→BLO | Dias | Especialidade INT | Especialidade BLO');
            console.log('-'.repeat(100));
            sequenciaINTBLO.rows.slice(0, 10).forEach(row => {
                const nome = (row[1] || '').substring(0, 15);
                const dataInt = row[3]?.toISOString()?.split('T')[0] || 'N/A';
                const dataBlo = row[6]?.toISOString()?.split('T')[0] || 'N/A';
                const espInt = (row[4] || '').substring(0, 15);
                const espBlo = (row[7] || '').substring(0, 15);
                console.log(`${nome.padEnd(15)} | ${dataInt}→${dataBlo} | ${row[8]} | ${espInt.padEnd(15)} | ${espBlo.padEnd(15)}`);
            });
        }
        
        // 3. Verificar sequência CON → BLO (consultas que vão para cirurgia)
        console.log('\n\n3. SEQUÊNCIA CON → BLO (CONSULTAS → CIRURGIA):\n');
        
        const sequenciaCONBLO = await connection.execute(`
            SELECT 
                c.NUM_SEQUENCIAL,
                d.NOME,
                c.DES_ESPECIALIDADE,
                COUNT(*) as OCORRENCIAS,
                MIN(c.DTA_EPISODIO) as PRIMEIRA_CONSULTA,
                MAX(b.DTA_EPISODIO) as ULTIMA_CIRURGIA,
                MAX(b.DTA_EPISODIO) - MIN(c.DTA_EPISODIO) as DIAS_PROCESSO
            FROM PCE.PCEEPISODIOS c
            INNER JOIN PCE.PCEEPISODIOS b ON c.NUM_SEQUENCIAL = b.NUM_SEQUENCIAL
            INNER JOIN PCE.PCEDOENTES d ON c.NUM_SEQUENCIAL = d.NUM_SEQUENCIAL
            WHERE c.MODULO = 'CON'
              AND b.MODULO = 'BLO'
              AND b.DTA_EPISODIO >= c.DTA_EPISODIO
              AND b.DTA_EPISODIO <= c.DTA_EPISODIO + 365
              AND c.DTA_EPISODIO >= TRUNC(SYSDATE) - 90
              AND c.DES_ESPECIALIDADE = b.DES_ESPECIALIDADE
              AND (UPPER(c.DES_ESPECIALIDADE) LIKE '%CIRURG%' 
                   OR UPPER(c.DES_ESPECIALIDADE) LIKE '%OFTALM%'
                   OR UPPER(c.DES_ESPECIALIDADE) LIKE '%ORTOP%')
            GROUP BY c.NUM_SEQUENCIAL, d.NOME, c.DES_ESPECIALIDADE
            HAVING COUNT(*) >= 1
            ORDER BY PRIMEIRA_CONSULTA DESC
        `);
        
        console.log(`Encontrados ${sequenciaCONBLO.rows.length} processos CON→BLO nos últimos 3 meses`);
        if (sequenciaCONBLO.rows.length > 0) {
            console.log('\nPrimeiros 10 casos:');
            console.log('Paciente | Especialidade | Consultas | Primeira→Última | Dias');
            console.log('-'.repeat(90));
            sequenciaCONBLO.rows.slice(0, 10).forEach(row => {
                const nome = (row[1] || '').substring(0, 15);
                const esp = (row[2] || '').substring(0, 20);
                const primeira = row[4]?.toISOString()?.split('T')[0] || 'N/A';
                const ultima = row[5]?.toISOString()?.split('T')[0] || 'N/A';
                console.log(`${nome.padEnd(15)} | ${esp.padEnd(20)} | ${row[3]} | ${primeira}→${ultima} | ${row[6]}`);
            });
        }
        
        // 4. Análise das especialidades que mais transitam para BLO
        console.log('\n\n4. ESPECIALIDADES QUE MAIS TRANSITAM PARA BLO:\n');
        
        const especialidadesTransicao = await connection.execute(`
            SELECT 
                origem.MODULO as MODULO_ORIGEM,
                origem.DES_ESPECIALIDADE,
                COUNT(DISTINCT origem.NUM_SEQUENCIAL) as PACIENTES_UNICOS,
                COUNT(*) as TOTAL_TRANSICOES,
                ROUND(AVG(blo.DTA_EPISODIO - origem.DTA_EPISODIO), 1) as DIAS_MEDIO_TRANSICAO
            FROM PCE.PCEEPISODIOS origem
            INNER JOIN PCE.PCEEPISODIOS blo ON origem.NUM_SEQUENCIAL = blo.NUM_SEQUENCIAL
            WHERE origem.MODULO IN ('CON', 'INT', 'URG')
              AND blo.MODULO = 'BLO'
              AND blo.DTA_EPISODIO >= origem.DTA_EPISODIO
              AND blo.DTA_EPISODIO <= origem.DTA_EPISODIO + 365
              AND origem.DTA_EPISODIO >= TRUNC(SYSDATE) - 180
              AND origem.DES_ESPECIALIDADE = blo.DES_ESPECIALIDADE
            GROUP BY origem.MODULO, origem.DES_ESPECIALIDADE
            HAVING COUNT(*) >= 5
            ORDER BY COUNT(*) DESC
        `);
        
        console.log('Módulo | Especialidade | Pacientes | Transições | Dias Médios');
        console.log('-'.repeat(80));
        especialidadesTransicao.rows.slice(0, 15).forEach(row => {
            const esp = (row[1] || '').substring(0, 25);
            console.log(`${row[0].padEnd(7)} | ${esp.padEnd(25)} | ${String(row[2]).padEnd(9)} | ${String(row[3]).padEnd(10)} | ${row[4]}`);
        });
        
        // 5. Verificar padrão temporal dos episódios BLO
        console.log('\n\n5. PADRÃO TEMPORAL DOS EPISÓDIOS BLO:\n');
        
        const padraoTemporal = await connection.execute(`
            SELECT 
                TO_CHAR(DTA_EPISODIO, 'HH24') as HORA,
                COUNT(*) as TOTAL_EPISODIOS,
                COUNT(CASE WHEN UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%' THEN 1 END) as CIRURGICOS,
                ROUND(COUNT(CASE WHEN UPPER(DES_ESPECIALIDADE) LIKE '%CIRURG%' THEN 1 END) * 100.0 / COUNT(*), 1) as PERC_CIRURGICOS
            FROM PCE.PCEEPISODIOS
            WHERE MODULO = 'BLO'
              AND DTA_EPISODIO >= TRUNC(SYSDATE) - 30
            GROUP BY TO_CHAR(DTA_EPISODIO, 'HH24')
            ORDER BY TO_CHAR(DTA_EPISODIO, 'HH24')
        `);
        
        console.log('Hora | Total BLO | Cirúrgicos | % Cirúrgicos');
        console.log('-'.repeat(50));
        padraoTemporal.rows.forEach(row => {
            console.log(`${row[0].padEnd(5)} | ${String(row[1]).padEnd(9)} | ${String(row[2]).padEnd(10)} | ${row[3]}%`);
        });
        
        // 6. Verificar se existem episódios BLO "órfãos" (sem episódio anterior)
        console.log('\n\n6. EPISÓDIOS BLO "ÓRFÃOS" (SEM EPISÓDIO ANTERIOR):\n');
        
        const bloOrfaos = await connection.execute(`
            SELECT 
                COUNT(*) as TOTAL_BLO,
                COUNT(CASE WHEN anterior.EPISODIO IS NULL THEN 1 END) as BLO_ORFAOS,
                ROUND(COUNT(CASE WHEN anterior.EPISODIO IS NULL THEN 1 END) * 100.0 / COUNT(*), 1) as PERC_ORFAOS
            FROM PCE.PCEEPISODIOS blo
            LEFT JOIN PCE.PCEEPISODIOS anterior ON blo.NUM_SEQUENCIAL = anterior.NUM_SEQUENCIAL
                AND anterior.DTA_EPISODIO < blo.DTA_EPISODIO
                AND anterior.DTA_EPISODIO >= blo.DTA_EPISODIO - 365
                AND anterior.MODULO IN ('CON', 'INT', 'URG')
            WHERE blo.MODULO = 'BLO'
              AND blo.DTA_EPISODIO >= TRUNC(SYSDATE) - 30
        `);
        
        console.log('Total BLO | BLO Órfãos | % Órfãos');
        console.log('-'.repeat(40));
        bloOrfaos.rows.forEach(row => {
            console.log(`${String(row[0]).padEnd(10)} | ${String(row[1]).padEnd(10)} | ${row[2]}%`);
        });
        
        // 7. Conclusões e recomendações
        console.log('\n\n=======================================================');
        console.log('CONCLUSÕES E DOCUMENTAÇÃO DO FLUXO');
        console.log('=======================================================\n');
        
        const totalTransicoesINT = sequenciaINTBLO.rows.length;
        const totalTransicoesCON = sequenciaCONBLO.rows.length;
        const totalMultiModulos = multiModulos.rows.length;
        
        console.log('📋 FLUXO DOCUMENTADO:');
        console.log(`✅ Transições INT→BLO: ${totalTransicoesINT} casos no último mês`);
        console.log(`✅ Processos CON→BLO: ${totalTransicoesCON} casos nos últimos 3 meses`);
        console.log(`✅ Múltiplos módulos no mesmo dia: ${totalMultiModulos} casos na última semana`);
        
        if (bloOrfaos.rows.length > 0) {
            console.log(`📊 ${bloOrfaos.rows[0][2]}% dos episódios BLO são "órfãos" (sem episódio anterior)`);
        }
        
        console.log('\n🎯 MODELO DE NEGÓCIO CONFIRMADO:');
        console.log('1. CONSULTA (CON) → avaliação → agendamento cirúrgico');
        console.log('2. INTERNAMENTO (INT) → preparação → BLOCO (BLO) para cirurgia');
        console.log('3. URGÊNCIA (URG) → casos urgentes → BLOCO (BLO) se necessário');
        console.log('4. BLOCO (BLO) = módulo de execução de procedimentos/cirurgias');
        
        console.log('\n📋 IMPLEMENTAÇÃO RECOMENDADA:');
        if (totalTransicoesINT > 0 || totalTransicoesCON > 0) {
            console.log('✅ CONFIRMA-SE: BLO é módulo de execução de cirurgias');
            console.log('✅ Módulo CIR deve usar dados do BLO');
            console.log('✅ Filtrar por especialidades cirúrgicas é opcional mas recomendado');
            console.log('✅ Considerar mostrar histórico de transição (CON/INT → BLO)');
        } else {
            console.log('⚠️  Padrão de transição não confirmado nos dados recentes');
            console.log('⚠️  Verificar com período mais alargado');
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
analisarFluxoEpisodiosCirurgia();