const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function analisarFarmaciaCirurgia() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('ANÁLISE DETALHADA: FARMÁCIA ↔ CIRURGIA');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. ANÁLISE DOS MEDICAMENTOS NOS PROTOCOLOS CIRÚRGICOS
        console.log('1. MEDICAMENTOS REFERENCIADOS NOS PROTOCOLOS CIRÚRGICOS\n');
        
        const medicamentosProtocolos = await connection.execute(`
            SELECT 
                COD_PROT,
                DES_PROT,
                DOCS_LISTA,
                LISTA_SUSP,
                OBSERV
            FROM PRF_PROTOCOLOS
            WHERE (DOCS_LISTA IS NOT NULL OR LISTA_SUSP IS NOT NULL)
            AND UPPER(DES_PROT) LIKE '%CIRURG%' 
            OR UPPER(DES_PROT) LIKE '%DOR%'
            OR UPPER(DES_PROT) LIKE '%ANEST%'
            ORDER BY DES_PROT
        `);
        
        console.log('PROTOCOLOS COM MEDICAMENTOS:');
        console.log('-'.repeat(80));
        
        const codigosMedicamentos = new Set();
        
        medicamentosProtocolos.rows.forEach(row => {
            const [codProt, desProt, docsLista, listaSusp, obs] = row;
            console.log(`\n📋 ${codProt} - ${desProt}`);
            
            if (docsLista) {
                console.log(`  ✅ Medicamentos incluídos: ${docsLista}`);
                // Extrair códigos (assumindo formato separado por vírgulas)
                docsLista.split(',').forEach(codigo => {
                    const trimmed = codigo.trim();
                    if (trimmed) codigosMedicamentos.add(trimmed);
                });
            }
            
            if (listaSusp) {
                console.log(`  ❌ Medicamentos suspensos: ${listaSusp}`);
                // Extrair códigos suspensos também
                listaSusp.split(',').forEach(codigo => {
                    const trimmed = codigo.trim();
                    if (trimmed) codigosMedicamentos.add(trimmed);
                });
            }
            
            if (obs) {
                const obsShort = obs.length > 100 ? obs.substring(0, 100) + '...' : obs;
                console.log(`  📝 Observações: ${obsShort}`);
            }
        });
        
        console.log(`\n🔍 CÓDIGOS DE MEDICAMENTOS ÚNICOS ENCONTRADOS: ${codigosMedicamentos.size}`);
        
        // 2. VERIFICAR SE EXISTEM TABELAS DE MEDICAMENTOS
        console.log('\n\n2. VERIFICAÇÃO DE TABELAS DE MEDICAMENTOS\n');
        
        const tabelasMedicamentos = await connection.execute(`
            SELECT table_name 
            FROM user_tables 
            WHERE table_name LIKE '%MED%' 
               OR table_name LIKE '%FARM%'
               OR table_name LIKE '%ARTIGO%'
               OR table_name LIKE '%PRODUTO%'
            ORDER BY table_name
        `);
        
        console.log('TABELAS RELACIONADAS COM MEDICAMENTOS/FARMÁCIA:');
        tabelasMedicamentos.rows.forEach(row => {
            console.log(`• ${row[0]}`);
        });
        
        // 3. ANALISAR TABELA ARTIGOS (se existir)
        try {
            console.log('\n\n3. ANÁLISE DA TABELA ARTIGOS\n');
            
            const artigos = await connection.execute(`
                SELECT 
                    CODIGOARTIGO,
                    DESIGNACAO,
                    GRUPO,
                    SUBGRUPO,
                    UNIDADE,
                    ROWNUM
                FROM ARTIGOS
                WHERE ROWNUM <= 20
                ORDER BY DESIGNACAO
            `);
            
            console.log('PRIMEIROS 20 ARTIGOS (AMOSTRA):');
            console.log('Código | Designação | Grupo | Subgrupo | Unidade');
            console.log('-'.repeat(80));
            
            artigos.rows.forEach(row => {
                const [codigo, designacao, grupo, subgrupo, unidade] = row;
                console.log(`${codigo?.toString().padEnd(8) || ''} | ${designacao?.substring(0,25).padEnd(25) || ''} | ${grupo?.toString().padEnd(5) || ''} | ${subgrupo?.toString().padEnd(8) || ''} | ${unidade || ''}`);
            });
            
            // Tentar encontrar medicamentos dos protocolos na tabela ARTIGOS
            if (codigosMedicamentos.size > 0) {
                console.log('\n\n4. CORRESPONDÊNCIA MEDICAMENTOS PROTOCOLOS ↔ ARTIGOS\n');
                
                const codigosArray = Array.from(codigosMedicamentos).slice(0, 10); // Testar primeiros 10
                const placeholders = codigosArray.map((_, index) => `:codigo${index}`).join(',');
                const bindParams = {};
                codigosArray.forEach((codigo, index) => {
                    bindParams[`codigo${index}`] = codigo;
                });
                
                try {
                    const artigosProtocolo = await connection.execute(`
                        SELECT 
                            CODIGOARTIGO,
                            DESIGNACAO,
                            GRUPO,
                            SUBGRUPO,
                            UNIDADE
                        FROM ARTIGOS
                        WHERE CODIGOARTIGO IN (${placeholders})
                    `, bindParams);
                    
                    console.log('MEDICAMENTOS DOS PROTOCOLOS ENCONTRADOS EM ARTIGOS:');
                    console.log('Código | Designação | Grupo | Subgrupo');
                    console.log('-'.repeat(70));
                    
                    artigosProtocolo.rows.forEach(row => {
                        const [codigo, designacao, grupo, subgrupo, unidade] = row;
                        console.log(`${codigo?.toString().padEnd(8) || ''} | ${designacao?.substring(0,30).padEnd(30) || ''} | ${grupo?.toString().padEnd(5) || ''} | ${subgrupo?.toString().padEnd(8) || ''}`);
                    });
                    
                    if (artigosProtocolo.rows.length === 0) {
                        console.log('❌ Nenhum medicamento dos protocolos foi encontrado na tabela ARTIGOS');
                        console.log('💡 Os códigos podem usar nomenclatura diferente ou estar noutras tabelas');
                    }
                    
                } catch (err) {
                    console.log('⚠️ Erro ao pesquisar correspondências:', err.message);
                }
            }
            
        } catch (err) {
            console.log('⚠️ Tabela ARTIGOS não acessível:', err.message);
        }
        
        // 5. ANÁLISE DO MÓDULO FARMÁCIA
        console.log('\n\n5. ANÁLISE DO MÓDULO FARMÁCIA (FAR)\n');
        
        const farmaciaServicos = await connection.execute(`
            SELECT 
                IDSERV,
                DSERV,
                SERV_MODULO,
                UNIDADE,
                ESTADO,
                ARMAZEM
            FROM PRF_SERVICOS
            WHERE SERV_MODULO = 'FAR' OR UPPER(DSERV) LIKE '%FARM%'
            ORDER BY DSERV
        `);
        
        console.log('SERVIÇOS DO MÓDULO FARMÁCIA:');
        console.log('ID | Descrição | Módulo | Unidade | Estado | Armazém');
        console.log('-'.repeat(60));
        
        farmaciaServicos.rows.forEach(row => {
            const [id, desc, modulo, unidade, estado, armazem] = row;
            console.log(`${id?.padEnd(3) || ''} | ${desc?.substring(0,15).padEnd(15) || ''} | ${modulo?.padEnd(6) || ''} | ${unidade?.padEnd(7) || ''} | ${estado || ''} | ${armazem || ''}`);
        });
        
        // 6. ANÁLISE DE POSSÍVEIS RELAÇÕES EPISÓDIOS ↔ MEDICAMENTOS
        console.log('\n\n6. ANÁLISE DE TABELAS DE TRATAMENTOS/ACTOS\n');
        
        try {
            // Verificar estrutura da tabela CSU_DEFACTOS
            const defactos = await connection.execute(`
                SELECT 
                    EPISODIO,
                    MODULO,
                    DTA_REGISTO,
                    COD_ARTIGO,
                    QTD,
                    ROWNUM
                FROM PCE.CSU_DEFACTOS
                WHERE MODULO IN ('BLO', 'FAR')
                AND ROWNUM <= 10
                ORDER BY DTA_REGISTO DESC
            `);
            
            console.log('ÚLTIMOS REGISTOS DE ACTOS (BLO/FAR):');
            console.log('Episódio | Módulo | Data | Código Artigo | Qtd');
            console.log('-'.repeat(60));
            
            defactos.rows.forEach(row => {
                const [episodio, modulo, data, codArtigo, qtd] = row;
                const dataStr = data ? new Date(data).toLocaleDateString() : '';
                console.log(`${episodio?.toString().padEnd(10) || ''} | ${modulo?.padEnd(6) || ''} | ${dataStr.padEnd(10) || ''} | ${codArtigo?.toString().padEnd(12) || ''} | ${qtd || ''}`);
            });
            
        } catch (err) {
            console.log('⚠️ Erro ao aceder CSU_DEFACTOS:', err.message);
        }
        
        // 7. PADRÕES E RELAÇÕES IDENTIFICADAS
        console.log('\n\n7. PADRÕES E RELAÇÕES IDENTIFICADAS\n');
        
        // Contar protocolos por tipo
        const tiposProtocolos = await connection.execute(`
            SELECT 
                CASE 
                    WHEN UPPER(DES_PROT) LIKE '%DOR%' THEN 'CONTROLO_DOR'
                    WHEN UPPER(DES_PROT) LIKE '%ANEST%' THEN 'ANESTESIA'
                    WHEN UPPER(DES_PROT) LIKE '%CIRURG%' THEN 'CIRURGIA_GERAL'
                    WHEN UPPER(DES_PROT) LIKE '%ARTRO%' THEN 'ORTOPEDIA'
                    WHEN UPPER(DES_PROT) LIKE '%PLAST%' THEN 'PLASTICA'
                    ELSE 'OUTROS'
                END as TIPO_PROTOCOLO,
                COUNT(*) as QUANTIDADE,
                COUNT(CASE WHEN DOCS_LISTA IS NOT NULL THEN 1 END) as COM_MEDICAMENTOS
            FROM PRF_PROTOCOLOS
            WHERE ESTADO = 1
            GROUP BY 
                CASE 
                    WHEN UPPER(DES_PROT) LIKE '%DOR%' THEN 'CONTROLO_DOR'
                    WHEN UPPER(DES_PROT) LIKE '%ANEST%' THEN 'ANESTESIA'
                    WHEN UPPER(DES_PROT) LIKE '%CIRURG%' THEN 'CIRURGIA_GERAL'
                    WHEN UPPER(DES_PROT) LIKE '%ARTRO%' THEN 'ORTOPEDIA'
                    WHEN UPPER(DES_PROT) LIKE '%PLAST%' THEN 'PLASTICA'
                    ELSE 'OUTROS'
                END
            ORDER BY QUANTIDADE DESC
        `);
        
        console.log('DISTRIBUIÇÃO DE PROTOCOLOS POR TIPO:');
        console.log('Tipo | Quantidade | Com Medicamentos');
        console.log('-'.repeat(50));
        
        tiposProtocolos.rows.forEach(row => {
            const [tipo, quantidade, comMeds] = row;
            console.log(`${tipo?.padEnd(15) || ''} | ${quantidade?.toString().padEnd(10) || ''} | ${comMeds || 0}`);
        });
        
        console.log('\n=======================================================');
        console.log('CONCLUSÕES E OPORTUNIDADES');
        console.log('=======================================================\n');
        
        console.log('✅ DESCOBERTAS IMPORTANTES:');
        console.log('• Protocolos cirúrgicos têm medicamentos estruturados');
        console.log('• Códigos de medicamentos específicos para cada protocolo');
        console.log('• Sistema de medicamentos incluídos/suspensos');
        console.log('• Módulo FAR bem definido e separado');
        console.log('• Possível relação entre episódios BLO e medicamentos');
        
        console.log('\n🎯 OPORTUNIDADES DE INTEGRAÇÃO:');
        console.log('• Mostrar protocolos aplicáveis no módulo Cirurgia');
        console.log('• Alertas de medicamentos suspensos por protocolo');
        console.log('• Integração com registos farmacêuticos');
        console.log('• Sugestões automáticas de medicação pós-cirúrgica');
        console.log('• Dashboard de consumo farmacêutico por tipo cirurgia');
        
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
analisarFarmaciaCirurgia();