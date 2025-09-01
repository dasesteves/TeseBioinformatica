const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Configurações
const CONFIG = {
  BATCH_SIZE: 10,        // Processar 10 tabelas por vez
  SAMPLE_ROWS: 5,        // Número de linhas exemplo
  TIMEOUT_MS: 30000      // 30 segundos por operação
};

// Grupos de tabelas do sistema
const GRUPOS_TABELAS = {
  // Core do sistema CSU
  CSU: [
    'CSU_DEFACTOS',
    'CSU_DEFACTOSENTGASTOS', 
    'CSU_DEFACTOSENTIDADES',
    'CSU_EPENTIDADEACTOS',
    'CSU_EPENTIDADEACTOGASTOS',
    'CSU_SERVICOS',
    'CSU_TIPOSACTOS',
    'CSU_UNIDADES'
  ],
  
  // Tabelas MEDH - Base de dados de medicamentos
  MEDH: [
    'MEDH_MESTRE',
    'MEDH_MESTRE_V2',
    'MEDH_CARACTERIZACAO',
    'MEDH_CARACTERIZACAO_V2', 
    'MEDH_CARACTERIZACAO_V3',
    'MEDH_ATC',
    'MEDH_ATC_V2',
    'MEDH_GFT',
    'MEDH_GFT_V2',
    'MEDH_INTERACOES',
    'MEDH_INTERACOES_V2',
    'MEDH_VERSAO',
    'MEDH_FORMA_FARMACEUTICA',
    'MEDH_PRINCIPIO_ACTIVO',
    'MEDH_LABORATORIO',
    'MEDH_TITULAR_AIM',
    'MEDH_APRESENTACAO',
    'MEDH_COMPOSICAO',
    'MEDH_INDICACAO',
    'MEDH_CONTRA_INDICACAO'
  ],
  
  // Tabelas PRF - Prescrição e Farmácia
  PRF: [
    'PRF_MEDICAMENTOS',
    'PRF_PRINCIPIO_ATIVO',
    'PRF_VIAS',
    'PRF_FREQS',
    'PRF_HORARIOS_ADMINISTRACAO',
    'PRF_AGENDA_FARM',
    'PRF_MED_ZERO',
    'PRF_MED_INFO',
    'PRF_PRESC_MOV',
    'PRF_PRESC_MOV_F',
    'PRF_PRESC_MOV_FDET',
    'PRF_PRESC_FREQ',
    'PRF_PRESC_NOTAS',
    'PRF_PROTOCOLOS',
    'PRF_PROT_LIN',
    'PRF_INTERACOES',
    'PRF_INTER_JUSTIFICA',
    'PRF_ICD9_PROT',
    'PRF_UNID_DOSE',
    'PRF_VIAS_FREQS',
    'PRF_ERROS',
    'PRF_EPISODIOS',
    'PRF_CHNM',
    'PRF_DILUICOES',
    'PRF_COMPATIBILIDADES',
    'PRF_ESTABILIDADES'
  ],
  
  // Tabelas PCE - Episódios e Doentes
  PCE_CORE: [
    'PCEDOENTES',
    'PCEEPISODIOS',
    'PCEADMISSOES',
    'PCEINTERNADOS',
    'PCEURGADMI',
    'PCECAMAS',
    'PCE_AREAS',
    'PCE_ALERTAS',
    'UTENTE_BIO_ALERTAS'
  ],
  
  // Tabelas auxiliares e de gestão
  AUXILIAR: [
    'SERVICO',
    'UTILIZADORES',
    'ESPECIALIDADES',
    'MEDICOS',
    'ENFERMEIROS',
    'FARMACEUTICOS',
    'GRUPOS_FARMACOLOGICOS',
    'TIPOS_MOVIMENTO',
    'ARMAZENS',
    'LOTES',
    'FORNECEDORES'
  ],
  
  // Tabelas de exportação e integração
  INTEGRACAO: [
    'TDU_CSU_FACTURACAOACTOSSONHO',
    'TDU_CSU_FACTURACAOGASTOSSONHO',
    'TDU_CSU_EXPORTACAO_LOG',
    'INTERACOES_EPISODIOS'
  ],
  
  // Tabelas de stock e movimentos
  STOCK: [
    'STOCK_ACTUAL',
    'STOCK_LOTES',
    'MOVIMENTOS_STOCK',
    'INVENTARIOS',
    'REQUISICOES',
    'CONSUMOS',
    'TRANSFERENCIAS',
    'AJUSTES_STOCK'
  ],
  
  // Tabelas de validação e controlo
  VALIDACAO: [
    'VALIDACOES_FARMACIA',
    'ALERTAS_MEDICACAO',
    'INCOMPATIBILIDADES',
    'ALERGIAS_MEDICAMENTOS',
    'HISTORICO_PRESCRICOES',
    'AUDITORIA_MOVIMENTOS'
  ]
};

// Função para verificar se tabela existe
async function tabelaExiste(connection, tabela) {
  try {
    const result = await connection.execute(
      `SELECT COUNT(*) as EXISTE 
       FROM all_tables 
       WHERE table_name = :tabela 
         AND owner = 'PCE'`,
      { tabela }
    );
    return result.rows[0].EXISTE > 0;
  } catch (err) {
    return false;
  }
}

// Função para obter estrutura da tabela
async function obterEstrutura(connection, tabela) {
  const estrutura = {
    nome: tabela,
    existe: false,
    colunas: [],
    indices: [],
    constraints: [],
    totalRegistros: 0,
    amostraDados: [],
    relacionamentos: []
  };
  
  try {
    // Verificar se existe
    const existe = await tabelaExiste(connection, tabela);
    if (!existe) {
      return estrutura;
    }
    
    estrutura.existe = true;
    
    // 1. Obter colunas
    const colunasResult = await connection.execute(
      `SELECT 
        column_name,
        data_type,
        data_length,
        data_precision,
        data_scale,
        nullable,
        data_default
       FROM all_tab_columns
       WHERE table_name = :tabela 
         AND owner = 'PCE'
       ORDER BY column_id`,
      { tabela }
    );
    
    estrutura.colunas = colunasResult.rows.map(col => ({
      nome: col.COLUMN_NAME,
      tipo: col.DATA_TYPE,
      tamanho: col.DATA_LENGTH,
      precisao: col.DATA_PRECISION,
      escala: col.DATA_SCALE,
      nullable: col.NULLABLE === 'Y',
      default: col.DATA_DEFAULT
    }));
    
    // 2. Obter índices
    const indicesResult = await connection.execute(
      `SELECT DISTINCT
        i.index_name,
        i.uniqueness,
        LISTAGG(ic.column_name, ',') WITHIN GROUP (ORDER BY ic.column_position) as columns
       FROM all_indexes i
       JOIN all_ind_columns ic ON i.index_name = ic.index_name AND i.owner = ic.index_owner
       WHERE i.table_name = :tabela 
         AND i.owner = 'PCE'
       GROUP BY i.index_name, i.uniqueness`,
      { tabela }
    );
    
    estrutura.indices = indicesResult.rows.map(idx => ({
      nome: idx.INDEX_NAME,
      unico: idx.UNIQUENESS === 'UNIQUE',
      colunas: idx.COLUMNS.split(',')
    }));
    
    // 3. Obter constraints (chaves estrangeiras)
    const constraintsResult = await connection.execute(
      `SELECT 
        c.constraint_name,
        c.constraint_type,
        c.r_constraint_name,
        LISTAGG(cc.column_name, ',') WITHIN GROUP (ORDER BY cc.position) as columns,
        rc.table_name as ref_table,
        LISTAGG(rcc.column_name, ',') WITHIN GROUP (ORDER BY rcc.position) as ref_columns
       FROM all_constraints c
       JOIN all_cons_columns cc ON c.constraint_name = cc.constraint_name AND c.owner = cc.owner
       LEFT JOIN all_constraints rc ON c.r_constraint_name = rc.constraint_name
       LEFT JOIN all_cons_columns rcc ON rc.constraint_name = rcc.constraint_name AND rc.owner = rcc.owner
       WHERE c.table_name = :tabela 
         AND c.owner = 'PCE'
         AND c.constraint_type IN ('P', 'R', 'U')
       GROUP BY c.constraint_name, c.constraint_type, c.r_constraint_name, rc.table_name`,
      { tabela }
    );
    
    estrutura.constraints = constraintsResult.rows.map(con => ({
      nome: con.CONSTRAINT_NAME,
      tipo: con.CONSTRAINT_TYPE,
      colunas: con.COLUMNS.split(','),
      tabelaRef: con.REF_TABLE,
      colunasRef: con.REF_COLUMNS ? con.REF_COLUMNS.split(',') : []
    }));
    
    // 4. Contar registros
    try {
      const countResult = await connection.execute(
        `SELECT COUNT(*) as TOTAL FROM PCE.${tabela}`
      );
      estrutura.totalRegistros = countResult.rows[0].TOTAL;
    } catch (err) {
      console.log(`  ⚠️  Erro ao contar registros de ${tabela}: ${err.message}`);
    }
    
    // 5. Obter amostra de dados (apenas se houver registros)
    if (estrutura.totalRegistros > 0 && estrutura.totalRegistros < 1000000) { // Evitar tabelas muito grandes
      try {
        const sampleResult = await connection.execute(
          `SELECT * FROM PCE.${tabela} WHERE ROWNUM <= :limite`,
          { limite: CONFIG.SAMPLE_ROWS }
        );
        estrutura.amostraDados = sampleResult.rows;
      } catch (err) {
        console.log(`  ⚠️  Erro ao obter amostra de ${tabela}: ${err.message}`);
      }
    }
    
    // 6. Identificar relacionamentos através de nomes de colunas
    estrutura.relacionamentos = identificarRelacionamentos(estrutura.colunas, tabela);
    
  } catch (err) {
    console.error(`  ❌ Erro ao processar ${tabela}: ${err.message}`);
  }
  
  return estrutura;
}

// Função para identificar possíveis relacionamentos
function identificarRelacionamentos(colunas, tabelaAtual) {
  const relacionamentos = [];
  const padroes = [
    { pattern: /^ID_?(.+)$/i, tipo: 'FK', destino: '$1' },
    { pattern: /^(.+)_ID$/i, tipo: 'FK', destino: '$1' },
    { pattern: /^COD_?(.+)$/i, tipo: 'REF', destino: '$1' },
    { pattern: /^EPISODIO$/i, tipo: 'FK', destino: 'PCEEPISODIOS' },
    { pattern: /^NUM_SEQUENCIAL$/i, tipo: 'FK', destino: 'PCEDOENTES' },
    { pattern: /^IDUTILIZADOR$/i, tipo: 'FK', destino: 'UTILIZADORES' },
    { pattern: /^CODIGO_ARTIGO$/i, tipo: 'FK', destino: 'PRF_MEDICAMENTOS' },
    { pattern: /^CDU_CSU_ACTOID$/i, tipo: 'FK', destino: 'CSU_DEFACTOS' }
  ];
  
  colunas.forEach(col => {
    padroes.forEach(padrao => {
      const match = col.nome.match(padrao.pattern);
      if (match) {
        const destino = padrao.destino.replace('$1', match[1] || '');
        if (destino && destino !== tabelaAtual) {
          relacionamentos.push({
            coluna: col.nome,
            tipo: padrao.tipo,
            tabelaDestino: destino
          });
        }
      }
    });
  });
  
  return relacionamentos;
}

// Função principal
async function mapearTodasTabelas() {
  let connection;
  
  try {
    console.log('='.repeat(80));
    console.log('MAPEAMENTO COMPLETO DO SISTEMA DE REGISTO DE TRATAMENTOS');
    console.log('='.repeat(80));
    console.log(`\nConectando à base de dados...`);
    
    connection = await oracledb.getConnection(dbConfig);
    console.log('✓ Conectado com sucesso\n');
    
    const resultadoGeral = {
      timestamp: new Date().toISOString(),
      grupos: {},
      estatisticas: {
        totalTabelas: 0,
        tabelasExistentes: 0,
        tabelasInexistentes: 0,
        totalRegistros: 0,
        tabelasComDados: 0,
        tabelasVazias: 0
      },
      relacionamentosIdentificados: []
    };
    
    // Processar cada grupo
    for (const [grupo, tabelas] of Object.entries(GRUPOS_TABELAS)) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`GRUPO: ${grupo}`);
      console.log('='.repeat(50));
      
      resultadoGeral.grupos[grupo] = {
        tabelas: [],
        estatisticas: {
          total: tabelas.length,
          existentes: 0,
          comDados: 0
        }
      };
      
      // Processar tabelas em lotes
      for (let i = 0; i < tabelas.length; i += CONFIG.BATCH_SIZE) {
        const lote = tabelas.slice(i, i + CONFIG.BATCH_SIZE);
        console.log(`\nProcessando lote ${Math.floor(i/CONFIG.BATCH_SIZE) + 1}/${Math.ceil(tabelas.length/CONFIG.BATCH_SIZE)}...`);
        
        const promessas = lote.map(async tabela => {
          console.log(`  📋 Mapeando ${tabela}...`);
          const estrutura = await obterEstrutura(connection, tabela);
          
          if (estrutura.existe) {
            resultadoGeral.grupos[grupo].estatisticas.existentes++;
            resultadoGeral.estatisticas.tabelasExistentes++;
            
            if (estrutura.totalRegistros > 0) {
              resultadoGeral.grupos[grupo].estatisticas.comDados++;
              resultadoGeral.estatisticas.tabelasComDados++;
              resultadoGeral.estatisticas.totalRegistros += estrutura.totalRegistros;
            } else {
              resultadoGeral.estatisticas.tabelasVazias++;
            }
            
            // Salvar arquivo individual
            const nomeArquivo = `tabela_PCE_${tabela}_COMPLETA.json`;
            fs.writeFileSync(
              path.join(__dirname, nomeArquivo),
              JSON.stringify(estrutura, null, 2)
            );
            console.log(`    ✓ ${tabela}: ${estrutura.totalRegistros} registros, ${estrutura.colunas.length} colunas`);
          } else {
            resultadoGeral.estatisticas.tabelasInexistentes++;
            console.log(`    ❌ ${tabela}: Não existe`);
          }
          
          return estrutura;
        });
        
        const estruturasLote = await Promise.all(promessas);
        resultadoGeral.grupos[grupo].tabelas.push(...estruturasLote);
      }
      
      // Resumo do grupo
      console.log(`\nResumo ${grupo}:`);
      console.log(`  - Total: ${resultadoGeral.grupos[grupo].estatisticas.total}`);
      console.log(`  - Existentes: ${resultadoGeral.grupos[grupo].estatisticas.existentes}`);
      console.log(`  - Com dados: ${resultadoGeral.grupos[grupo].estatisticas.comDados}`);
    }
    
    // Identificar todos os relacionamentos
    console.log('\n\nIDENTIFICANDO RELACIONAMENTOS...');
    for (const grupo of Object.values(resultadoGeral.grupos)) {
      for (const tabela of grupo.tabelas) {
        if (tabela.existe && tabela.relacionamentos.length > 0) {
          tabela.relacionamentos.forEach(rel => {
            resultadoGeral.relacionamentosIdentificados.push({
              origem: tabela.nome,
              ...rel
            });
          });
        }
      }
    }
    
    // Estatísticas finais
    resultadoGeral.estatisticas.totalTabelas = Object.values(GRUPOS_TABELAS).flat().length;
    
    // Salvar resultado geral
    fs.writeFileSync(
      path.join(__dirname, 'MAPEAMENTO_SISTEMA_COMPLETO.json'),
      JSON.stringify(resultadoGeral, null, 2)
    );
    
    // Gerar documentação markdown
    gerarDocumentacaoMarkdown(resultadoGeral);
    
    // Resumo final
    console.log('\n\n' + '='.repeat(80));
    console.log('RESUMO FINAL');
    console.log('='.repeat(80));
    console.log(`Total de tabelas verificadas: ${resultadoGeral.estatisticas.totalTabelas}`);
    console.log(`Tabelas existentes: ${resultadoGeral.estatisticas.tabelasExistentes}`);
    console.log(`Tabelas inexistentes: ${resultadoGeral.estatisticas.tabelasInexistentes}`);
    console.log(`Tabelas com dados: ${resultadoGeral.estatisticas.tabelasComDados}`);
    console.log(`Tabelas vazias: ${resultadoGeral.estatisticas.tabelasVazias}`);
    console.log(`Total de registros: ${resultadoGeral.estatisticas.totalRegistros.toLocaleString()}`);
    console.log(`Relacionamentos identificados: ${resultadoGeral.relacionamentosIdentificados.length}`);
    
    console.log('\n✓ Mapeamento completo salvo em MAPEAMENTO_SISTEMA_COMPLETO.json');
    console.log('✓ Documentação gerada em DOCUMENTACAO_SISTEMA_COMPLETO.md');
    
  } catch (err) {
    console.error('\nErro fatal:', err);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✓ Conexão fechada');
    }
  }
}

// Função para gerar documentação Markdown
function gerarDocumentacaoMarkdown(resultado) {
  let md = `# Documentação Completa do Sistema de Registo de Tratamentos

Gerado em: ${resultado.timestamp}

## Resumo Geral

- **Total de tabelas verificadas**: ${resultado.estatisticas.totalTabelas}
- **Tabelas existentes**: ${resultado.estatisticas.tabelasExistentes}
- **Tabelas com dados**: ${resultado.estatisticas.tabelasComDados}
- **Total de registros**: ${resultado.estatisticas.totalRegistros.toLocaleString()}

## Estrutura por Grupos

`;

  for (const [grupo, dados] of Object.entries(resultado.grupos)) {
    md += `### ${grupo}\n\n`;
    md += `**${dados.estatisticas.existentes}** tabelas existentes de **${dados.estatisticas.total}** verificadas\n\n`;
    
    // Tabelas existentes
    const existentes = dados.tabelas.filter(t => t.existe);
    if (existentes.length > 0) {
      md += `| Tabela | Registros | Colunas | Índices | Constraints |\n`;
      md += `|--------|-----------|---------|---------|-------------|\n`;
      
      existentes.forEach(tabela => {
        md += `| ${tabela.nome} | ${tabela.totalRegistros.toLocaleString()} | ${tabela.colunas.length} | ${tabela.indices.length} | ${tabela.constraints.length} |\n`;
      });
      md += '\n';
    }
    
    // Tabelas inexistentes
    const inexistentes = dados.tabelas.filter(t => !t.existe);
    if (inexistentes.length > 0) {
      md += `**Tabelas não encontradas**: ${inexistentes.map(t => t.nome).join(', ')}\n\n`;
    }
  }

  // Relacionamentos
  md += `## Relacionamentos Identificados\n\n`;
  md += `Total: ${resultado.relacionamentosIdentificados.length} relacionamentos\n\n`;
  
  if (resultado.relacionamentosIdentificados.length > 0) {
    md += `| Origem | Coluna | Tipo | Destino |\n`;
    md += `|--------|--------|------|----------|\n`;
    
    resultado.relacionamentosIdentificados
      .sort((a, b) => a.origem.localeCompare(b.origem))
      .forEach(rel => {
        md += `| ${rel.origem} | ${rel.coluna} | ${rel.tipo} | ${rel.tabelaDestino} |\n`;
      });
  }
  
  fs.writeFileSync(
    path.join(__dirname, 'DOCUMENTACAO_SISTEMA_COMPLETO.md'),
    md
  );
}

// Executar
mapearTodasTabelas(); 