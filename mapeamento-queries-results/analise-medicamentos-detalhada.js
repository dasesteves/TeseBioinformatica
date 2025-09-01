const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function analisarMedicamentosDetalhada() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('ANÁLISE DETALHADA DO SISTEMA DE MEDICAMENTOS');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. ANÁLISE DA TABELA PRF_MEDICAMENTOS
        console.log('1. ANÁLISE DA TABELA PRF_MEDICAMENTOS\n');
        
        // Primeiro, vamos ver a estrutura
        const estruturaMeds = await connection.execute(`
            SELECT column_name, data_type, data_length, nullable
            FROM user_tab_columns 
            WHERE table_name = 'PRF_MEDICAMENTOS'
            ORDER BY column_id
        `);
        
        console.log('ESTRUTURA DA TABELA PRF_MEDICAMENTOS:');
        console.log('Coluna | Tipo | Tamanho | Nullable');
        console.log('-'.repeat(50));
        estruturaMeds.rows.forEach(row => {
            const [coluna, tipo, tamanho, nullable] = row;
            console.log(`${coluna.padEnd(20)} | ${tipo.padEnd(10)} | ${tamanho?.toString().padEnd(7) || ''} | ${nullable}`);
        });
        
        // Amostra de dados
        const amostraMeds = await connection.execute(`
            SELECT * FROM (
                SELECT * FROM PRF_MEDICAMENTOS 
                ORDER BY ROWNUM
            ) WHERE ROWNUM <= 10
        `);
        
        console.log('\n\nAMOSTRA DE MEDICAMENTOS:');
        console.log('-'.repeat(80));
        if (amostraMeds.rows.length > 0) {
            // Imprimir cabeçalhos
            const colunas = amostraMeds.metaData.map(col => col.name);
            console.log(colunas.join(' | '));
            console.log('-'.repeat(80));
            
            amostraMeds.rows.slice(0, 5).forEach(row => {
                const valores = row.map(val => {
                    if (val === null) return 'NULL';
                    if (typeof val === 'string') return val.substring(0, 15);
                    return val.toString().substring(0, 15);
                });
                console.log(valores.join(' | '));
            });
        }
        
        // 2. ANÁLISE DE TABELAS MEDH_ (Sistema MEDH)
        console.log('\n\n2. ANÁLISE DO SISTEMA MEDH (Base de Dados de Medicamentos)\n');
        
        try {
            const medh_mestre = await connection.execute(`
                SELECT * FROM (
                    SELECT * FROM MEDH_MESTRE_V2 
                    ORDER BY ROWNUM
                ) WHERE ROWNUM <= 5
            `);
            
            console.log('ESTRUTURA MEDH_MESTRE_V2 (Amostra):');
            if (medh_mestre.metaData) {
                const colunas = medh_mestre.metaData.map(col => col.name);
                console.log('Colunas:', colunas.join(', '));
                
                if (medh_mestre.rows.length > 0) {
                    console.log('\nPrimeiro registo:');
                    medh_mestre.rows[0].forEach((val, index) => {
                        const coluna = medh_mestre.metaData[index].name;
                        const valor = val === null ? 'NULL' : (typeof val === 'string' ? val.substring(0, 50) : val.toString());
                        console.log(`  ${coluna}: ${valor}`);
                    });
                }
            }
            
        } catch (err) {
            console.log('⚠️ Erro ao aceder MEDH_MESTRE_V2:', err.message);
        }
        
        // 3. ANÁLISE DE CÓDIGOS DOS PROTOCOLOS vs MEDICAMENTOS
        console.log('\n\n3. CORRESPONDÊNCIA CÓDIGOS PROTOCOLOS ↔ MEDICAMENTOS\n');
        
        // Primeiro obter códigos dos protocolos
        const codigosProtocolos = await connection.execute(`
            SELECT 
                COD_PROT,
                DES_PROT,
                DOCS_LISTA
            FROM PRF_PROTOCOLOS
            WHERE DOCS_LISTA IS NOT NULL
        `);
        
        console.log('CÓDIGOS DE MEDICAMENTOS NOS PROTOCOLOS:');
        console.log('-'.repeat(60));
        
        const todosCodigos = new Set();
        codigosProtocolos.rows.forEach(row => {
            const [codProt, desProt, docsLista] = row;
            console.log(`${codProt}: ${desProt}`);
            console.log(`  Códigos: ${docsLista}`);
            
            // Extrair códigos individuais
            if (docsLista) {
                docsLista.split(',').forEach(codigo => {
                    const trimmed = codigo.trim();
                    if (trimmed) todosCodigos.add(trimmed);
                });
            }
        });
        
        console.log(`\nTOTAL DE CÓDIGOS ÚNICOS: ${todosCodigos.size}`);
        console.log('Códigos:', Array.from(todosCodigos).join(', '));
        
        // 4. VERIFICAR SE OS CÓDIGOS EXISTEM EM PRF_MEDICAMENTOS
        console.log('\n\n4. VERIFICAÇÃO DOS CÓDIGOS EM PRF_MEDICAMENTOS\n');
        
        if (todosCodigos.size > 0) {
            // Testar alguns códigos
            const codigosArray = Array.from(todosCodigos).slice(0, 5);
            
            for (const codigo of codigosArray) {
                try {
                    const resultado = await connection.execute(`
                        SELECT COUNT(*) as EXISTE 
                        FROM PRF_MEDICAMENTOS 
                        WHERE UPPER(TRIM(CODIGO)) = UPPER(:codigo)
                           OR UPPER(TRIM(DESIGNACAO)) LIKE UPPER('%' || :codigo || '%')
                    `, { codigo: codigo });
                    
                    const existe = resultado.rows[0][0];
                    console.log(`Código ${codigo}: ${existe > 0 ? '✅ Encontrado' : '❌ Não encontrado'}`);
                    
                } catch (err) {
                    console.log(`Código ${codigo}: ⚠️ Erro na pesquisa`);
                }
            }
        }
        
        // 5. ANÁLISE DAS RELAÇÕES COM EPISÓDIOS
        console.log('\n\n5. ANÁLISE DE MEDICAMENTOS EM EPISÓDIOS\n');
        
        try {
            // Verificar se há relação entre medicamentos e episódios
            const medicamentosEpisodios = await connection.execute(`
                SELECT 
                    e.EPISODIO,
                    e.MODULO,
                    e.DTA_EPISODIO,
                    e.DES_ESPECIALIDADE,
                    COUNT(d.COD_ARTIGO) as NUM_MEDICAMENTOS
                FROM PCE.PCEEPISODIOS e
                LEFT JOIN PCE.CSU_DEFACTOS d ON e.EPISODIO = d.EPISODIO AND e.MODULO = d.MODULO
                WHERE e.MODULO IN ('BLO', 'FAR')
                  AND e.DTA_EPISODIO >= TRUNC(SYSDATE) - 30
                GROUP BY e.EPISODIO, e.MODULO, e.DTA_EPISODIO, e.DES_ESPECIALIDADE
                HAVING COUNT(d.COD_ARTIGO) > 0
                ORDER BY e.DTA_EPISODIO DESC
            `);
            
            console.log('EPISÓDIOS COM MEDICAMENTOS (ÚLTIMOS 30 DIAS):');
            console.log('Episódio | Módulo | Data | Especialidade | Nº Meds');
            console.log('-'.repeat(70));
            
            medicamentosEpisodios.rows.slice(0, 10).forEach(row => {
                const [episodio, modulo, data, especialidade, numMeds] = row;
                const dataStr = data ? new Date(data).toLocaleDateString() : '';
                console.log(`${episodio?.toString().padEnd(10) || ''} | ${modulo?.padEnd(6) || ''} | ${dataStr.padEnd(10) || ''} | ${especialidade?.substring(0,15).padEnd(15) || ''} | ${numMeds || 0}`);
            });
            
        } catch (err) {
            console.log('⚠️ Erro ao analisar episódios com medicamentos:', err.message);
        }
        
        // 6. ANÁLISE DAS ESPECIALIDADES CIRÚRGICAS COM MEDICAMENTOS
        console.log('\n\n6. ESPECIALIDADES CIRÚRGICAS COM MEDICAMENTOS\n');
        
        try {
            const especialidadesMeds = await connection.execute(`
                SELECT 
                    e.DES_ESPECIALIDADE,
                    COUNT(DISTINCT e.EPISODIO) as NUM_EPISODIOS,
                    COUNT(d.COD_ARTIGO) as TOTAL_MEDICAMENTOS,
                    AVG(d.QTD) as QTD_MEDIA
                FROM PCE.PCEEPISODIOS e
                INNER JOIN PCE.CSU_DEFACTOS d ON e.EPISODIO = d.EPISODIO AND e.MODULO = d.MODULO
                WHERE e.MODULO = 'BLO'
                  AND (UPPER(e.DES_ESPECIALIDADE) LIKE '%CIRURG%' 
                       OR UPPER(e.DES_ESPECIALIDADE) LIKE '%ANEST%')
                  AND e.DTA_EPISODIO >= TRUNC(SYSDATE) - 90
                GROUP BY e.DES_ESPECIALIDADE
                ORDER BY COUNT(DISTINCT e.EPISODIO) DESC
            `);
            
            console.log('MEDICAMENTOS POR ESPECIALIDADE CIRÚRGICA (90 DIAS):');
            console.log('Especialidade | Episódios | Total Meds | Qtd Média');
            console.log('-'.repeat(70));
            
            especialidadesMeds.rows.forEach(row => {
                const [especialidade, numEpisodios, totalMeds, qtdMedia] = row;
                const qtdStr = qtdMedia ? qtdMedia.toFixed(1) : '0';
                console.log(`${especialidade?.substring(0,20).padEnd(20) || ''} | ${numEpisodios?.toString().padEnd(9) || ''} | ${totalMeds?.toString().padEnd(10) || ''} | ${qtdStr}`);
            });
            
        } catch (err) {
            console.log('⚠️ Erro ao analisar especialidades:', err.message);
        }
        
        // 7. ESTATÍSTICAS FINAIS
        console.log('\n\n7. ESTATÍSTICAS DO SISTEMA DE MEDICAMENTOS\n');
        
        try {
            const estatisticas = await connection.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM PRF_MEDICAMENTOS) as TOTAL_MEDICAMENTOS,
                    (SELECT COUNT(*) FROM PRF_PROTOCOLOS WHERE DOCS_LISTA IS NOT NULL) as PROTOCOLOS_COM_MEDS,
                    (SELECT COUNT(DISTINCT COD_ARTIGO) FROM PCE.CSU_DEFACTOS WHERE MODULO = 'BLO') as ARTIGOS_BLO,
                    (SELECT COUNT(DISTINCT COD_ARTIGO) FROM PCE.CSU_DEFACTOS WHERE MODULO = 'FAR') as ARTIGOS_FAR
                FROM DUAL
            `);
            
            const [totalMeds, protocolosMeds, artigosBlo, artigosFar] = estatisticas.rows[0];
            
            console.log('RESUMO ESTATÍSTICO:');
            console.log(`• Total de medicamentos cadastrados: ${totalMeds || 'N/A'}`);
            console.log(`• Protocolos com medicamentos: ${protocolosMeds || 'N/A'}`);
            console.log(`• Artigos únicos usados em BLO: ${artigosBlo || 'N/A'}`);
            console.log(`• Artigos únicos usados em FAR: ${artigosFar || 'N/A'}`);
            
        } catch (err) {
            console.log('⚠️ Erro ao calcular estatísticas:', err.message);
        }
        
        console.log('\n=======================================================');
        console.log('CONCLUSÕES TÉCNICAS');
        console.log('=======================================================\n');
        
        console.log('✅ ARQUITETURA IDENTIFICADA:');
        console.log('• PRF_PROTOCOLOS: Protocolos cirúrgicos com medicamentos');
        console.log('• PRF_MEDICAMENTOS: Catálogo principal de medicamentos');
        console.log('• MEDH_*: Base de dados externa de medicamentos (INFARMED?)');
        console.log('• CSU_DEFACTOS: Registos de consumo/aplicação');
        console.log('• Relação clara entre episódios BLO e medicamentos');
        
        console.log('\n🎯 OPORTUNIDADES TÉCNICAS:');
        console.log('• Integrar protocolos no módulo Cirurgia');
        console.log('• API para buscar medicamentos por episódio');
        console.log('• Dashboard de consumo farmacêutico por especialidade');
        console.log('• Alertas automáticos baseados em protocolos');
        console.log('• Integração MEDH para validação de medicamentos');
        
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
analisarMedicamentosDetalhada();