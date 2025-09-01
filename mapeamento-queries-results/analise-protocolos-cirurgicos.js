const oracledb = require('oracledb');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function analisarProtocolosCirurgicos() {
    let connection;
    
    try {
        console.log('=======================================================');
        console.log('ANÁLISE DETALHADA DE PROTOCOLOS CIRÚRGICOS E FARMÁCIA');
        console.log('=======================================================\n');
        
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. ANÁLISE DA TABELA PRF_PROTOCOLOS
        console.log('1. ANÁLISE DA TABELA PRF_PROTOCOLOS\n');
        
        const protocolos = await connection.execute(`
            SELECT 
                COD_PROT,
                DES_PROT as DESCRICAO_PROTOCOLO,
                DES_COMP as DESCRICAO_COMPLETA,
                ESTADO,
                IDSERV as ID_SERVICO,
                DOCS_LISTA,
                LISTA_SUSP,
                OBSERV as OBSERVACOES,
                DTA_REG as DATA_REGISTO,
                DIAS_BASE
            FROM PRF_PROTOCOLOS
            ORDER BY DES_PROT
        `);
        
        console.log('PROTOCOLOS CIRÚRGICOS ENCONTRADOS:\n');
        console.log('Código | Descrição | Serviço | Estado | Data Registo');
        console.log('-'.repeat(80));
        
        protocolos.rows.forEach(row => {
            const [cod, desc, descComp, estado, servico, docs, susp, obs, data, dias] = row;
            console.log(`${cod?.padEnd(8) || ''} | ${desc?.substring(0,35).padEnd(35) || ''} | ${servico?.padEnd(8) || ''} | ${estado || ''} | ${data ? new Date(data).toLocaleDateString() : ''}`);
            
            if (docs) {
                console.log(`  📋 Docs: ${docs}`);
            }
            if (susp) {
                console.log(`  💊 Medicamentos suspensos: ${susp}`);
            }
            if (obs) {
                console.log(`  📝 Observações: ${obs.substring(0, 100)}${obs.length > 100 ? '...' : ''}`);
            }
            console.log('');
        });
        
        // 2. ANÁLISE DA TABELA PRF_ICD9_PROT (Relação ICD9 com Protocolos)
        console.log('\n2. ANÁLISE DA RELAÇÃO ICD9 COM PROTOCOLOS\n');
        
        const icd9Protocols = await connection.execute(`
            SELECT 
                i.COD_ICD9,
                i.COD_PROT,
                p.DES_PROT,
                i.ESTADO,
                i.DTA_REG
            FROM PRF_ICD9_PROT i
            LEFT JOIN PRF_PROTOCOLOS p ON i.COD_PROT = p.COD_PROT
            ORDER BY i.COD_PROT
        `);
        
        console.log('RELAÇÕES ICD9 → PROTOCOLOS:\n');
        console.log('Código ICD9 | Código Protocolo | Descrição Protocolo | Estado');
        console.log('-'.repeat(80));
        
        icd9Protocols.rows.forEach(row => {
            const [icd9, codProt, desProt, estado, data] = row;
            console.log(`${icd9?.padEnd(12) || 'N/A'.padEnd(12)} | ${codProt?.padEnd(15) || ''} | ${desProt?.substring(0,25).padEnd(25) || ''} | ${estado || ''}`);
        });
        
        // 3. ANÁLISE DA TABELA PRF_SERVICOS (Serviços/Módulos)
        console.log('\n\n3. ANÁLISE DOS SERVIÇOS E MÓDULOS\n');
        
        const servicos = await connection.execute(`
            SELECT 
                IDSERV as ID_SERVICO,
                DSERV as DESCRICAO_SERVICO,
                SERV_MODULO as MODULO,
                UNIDADE,
                ESTADO,
                SSONHO,
                DIAS_INT as DIAS_INTERNAMENTO,
                ARMAZEM
            FROM PRF_SERVICOS
            WHERE ESTADO = 1
            ORDER BY SERV_MODULO, DSERV
        `);
        
        console.log('MAPEAMENTO SERVIÇOS → MÓDULOS:\n');
        console.log('ID Serviço | Descrição | Módulo | Unidade | Dias Int | Armazém');
        console.log('-'.repeat(80));
        
        const moduloGroups = {};
        servicos.rows.forEach(row => {
            const [idServ, descServ, modulo, unidade, estado, ssonho, diasInt, armazem] = row;
            console.log(`${idServ?.padEnd(10) || ''} | ${descServ?.substring(0,20).padEnd(20) || ''} | ${modulo?.padEnd(6) || ''} | ${unidade?.padEnd(7) || ''} | ${diasInt?.toString().padEnd(8) || ''} | ${armazem || ''}`);
            
            if (!moduloGroups[modulo]) {
                moduloGroups[modulo] = [];
            }
            moduloGroups[modulo].push({idServ, descServ, unidade, diasInt, armazem});
        });
        
        // 4. ANÁLISE DE RELAÇÕES ENTRE PROTOCOLOS E SERVIÇOS
        console.log('\n\n4. RELAÇÕES PROTOCOLOS ↔ SERVIÇOS\n');
        
        const protocoloServicos = await connection.execute(`
            SELECT 
                p.COD_PROT,
                p.DES_PROT,
                p.IDSERV,
                s.DSERV,
                s.SERV_MODULO,
                s.UNIDADE,
                p.ESTADO as ESTADO_PROTOCOLO
            FROM PRF_PROTOCOLOS p
            LEFT JOIN PRF_SERVICOS s ON p.IDSERV = s.IDSERV
            ORDER BY s.SERV_MODULO, p.DES_PROT
        `);
        
        console.log('PROTOCOLOS POR MÓDULO:\n');
        
        const protocolosPorModulo = {};
        protocoloServicos.rows.forEach(row => {
            const [codProt, desProt, idServ, descServ, modulo, unidade, estado] = row;
            const moduloKey = modulo || 'SEM_MODULO';
            
            if (!protocolosPorModulo[moduloKey]) {
                protocolosPorModulo[moduloKey] = [];
            }
            
            protocolosPorModulo[moduloKey].push({
                codProt, desProt, idServ, descServ, unidade, estado
            });
        });
        
        Object.keys(protocolosPorModulo).forEach(modulo => {
            console.log(`\n📋 MÓDULO: ${modulo}`);
            console.log('-'.repeat(50));
            protocolosPorModulo[modulo].forEach(p => {
                console.log(`  ${p.codProt} | ${p.desProt}`);
                console.log(`    ↳ Serviço: ${p.descServ} (${p.idServ})`);
                console.log(`    ↳ Unidade: ${p.unidade} | Estado: ${p.estado}`);
            });
        });
        
        // 5. ANÁLISE DOS MEDICAMENTOS NOS PROTOCOLOS
        console.log('\n\n5. ANÁLISE DE MEDICAMENTOS NOS PROTOCOLOS\n');
        
        const medicamentosProtocolos = await connection.execute(`
            SELECT 
                COD_PROT,
                DES_PROT,
                DOCS_LISTA,
                LISTA_SUSP
            FROM PRF_PROTOCOLOS
            WHERE DOCS_LISTA IS NOT NULL OR LISTA_SUSP IS NOT NULL
        `);
        
        console.log('MEDICAMENTOS ASSOCIADOS AOS PROTOCOLOS:\n');
        
        medicamentosProtocolos.rows.forEach(row => {
            const [codProt, desProt, docsLista, listaSusp] = row;
            console.log(`📋 ${codProt} - ${desProt}`);
            
            if (docsLista) {
                console.log(`  ✅ Medicamentos incluídos: ${docsLista}`);
            }
            
            if (listaSusp) {
                console.log(`  ❌ Medicamentos suspensos: ${listaSusp}`);
            }
            console.log('');
        });
        
        // 6. ESTATÍSTICAS GERAIS
        console.log('\n\n6. ESTATÍSTICAS GERAIS\n');
        
        const stats = await connection.execute(`
            SELECT 
                COUNT(*) as TOTAL_PROTOCOLOS,
                COUNT(CASE WHEN ESTADO = 1 THEN 1 END) as PROTOCOLOS_ATIVOS,
                COUNT(CASE WHEN DOCS_LISTA IS NOT NULL THEN 1 END) as COM_MEDICAMENTOS,
                COUNT(CASE WHEN LISTA_SUSP IS NOT NULL THEN 1 END) as COM_SUSPENSOES,
                COUNT(DISTINCT IDSERV) as SERVICOS_ENVOLVIDOS
            FROM PRF_PROTOCOLOS
        `);
        
        const [totalProt, ativos, comMeds, comSusp, servicosEnvolvidos] = stats.rows[0];
        
        console.log('RESUMO ESTATÍSTICO:');
        console.log(`• Total de protocolos: ${totalProt}`);
        console.log(`• Protocolos ativos: ${ativos}`);
        console.log(`• Com medicamentos: ${comMeds}`);
        console.log(`• Com suspensões: ${comSusp}`);
        console.log(`• Serviços envolvidos: ${servicosEnvolvidos}`);
        
        // 7. ANÁLISE ESPECÍFICA PARA CIRURGIA (BLO)
        console.log('\n\n7. ANÁLISE ESPECÍFICA PARA CIRURGIA (MÓDULO BLO)\n');
        
        const cirurgiaData = await connection.execute(`
            SELECT 
                s.IDSERV,
                s.DSERV,
                s.UNIDADE,
                s.DIAS_INT,
                s.ARMAZEM,
                COUNT(p.COD_PROT) as NUM_PROTOCOLOS
            FROM PRF_SERVICOS s
            LEFT JOIN PRF_PROTOCOLOS p ON s.IDSERV = p.IDSERV
            WHERE s.SERV_MODULO = 'BLO'
            GROUP BY s.IDSERV, s.DSERV, s.UNIDADE, s.DIAS_INT, s.ARMAZEM
            ORDER BY s.DSERV
        `);
        
        console.log('SERVIÇOS DO MÓDULO BLO (CIRURGIA):');
        console.log('ID | Descrição | Unidade | Dias | Armazém | Protocolos');
        console.log('-'.repeat(70));
        
        cirurgiaData.rows.forEach(row => {
            const [id, desc, unidade, dias, armazem, numProt] = row;
            console.log(`${id?.padEnd(3) || ''} | ${desc?.substring(0,15).padEnd(15) || ''} | ${unidade?.padEnd(7) || ''} | ${dias?.toString().padEnd(4) || ''} | ${armazem?.padEnd(7) || ''} | ${numProt || 0}`);
        });
        
        console.log('\n=======================================================');
        console.log('CONCLUSÕES DA ANÁLISE');
        console.log('=======================================================\n');
        
        console.log('✅ DESCOBERTAS IMPORTANTES:');
        console.log('1. Existem protocolos cirúrgicos estruturados na BD');
        console.log('2. Relação clara entre ICD9 e protocolos (PRF_ICD9_PROT)');
        console.log('3. Medicamentos integrados nos protocolos (incluir/suspender)');
        console.log('4. Mapeamento claro de serviços para módulos');
        console.log('5. Módulo BLO tem estrutura específica para cirurgia');
        
        console.log('\n🎯 OPORTUNIDADES DE ENRIQUECIMENTO:');
        console.log('• Integrar protocolos cirúrgicos no módulo CIR');
        console.log('• Mostrar medicamentos associados aos protocolos');
        console.log('• Filtrar por códigos ICD9 específicos');
        console.log('• Integração com sistema de farmácia (FAR)');
        console.log('• Alertas de medicamentos suspensos');
        
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
analisarProtocolosCirurgicos();