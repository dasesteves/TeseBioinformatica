const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

async function mapearTodasTabelasRelacionadas() {
  let connection;
  
  try {
    console.log('='.repeat(80));
    console.log('MAPEAMENTO COMPLETO DAS TABELAS DO SISTEMA REGISTO DE TRATAMENTOS');
    console.log('='.repeat(80));
    
    connection = await oracledb.getConnection(dbConfig);
    
    // 1. Buscar TODAS as tabelas relacionadas através de foreign keys e nomes
    console.log('\n1. BUSCANDO TODAS AS TABELAS RELACIONADAS...\n');
    
    const tabelasRelacionadasQuery = `
      SELECT DISTINCT owner, table_name 
      FROM (
        -- Tabelas com CSU no nome
        SELECT owner, table_name FROM all_tables 
        WHERE (table_name LIKE 'CSU%' OR table_name LIKE '%CSU%')
          AND owner IN ('PCE', 'SYSTEM', 'SYS')
        
        UNION
        
        -- Tabelas de artigos e medicamentos
        SELECT owner, table_name FROM all_tables 
        WHERE (table_name LIKE '%ARTIGO%' OR table_name LIKE '%MEDICAMENTO%' 
               OR table_name LIKE '%PRF_%' OR table_name LIKE '%MEDH_%')
          AND owner IN ('PCE', 'SYSTEM', 'SYS')
        
        UNION
        
        -- Tabelas de episódios e utentes
        SELECT owner, table_name FROM all_tables 
        WHERE (table_name LIKE '%EPISODIO%' OR table_name LIKE '%UTENTE%' 
               OR table_name LIKE 'PCE%')
          AND owner IN ('PCE', 'SYSTEM', 'SYS')
        
        UNION
        
        -- Tabelas de farmácia
        SELECT owner, table_name FROM all_tables 
        WHERE (table_name LIKE 'FAR%' OR table_name LIKE '%DISPENSA%' 
               OR table_name LIKE '%STOCK%' OR table_name LIKE '%MOVIMENTO%')
          AND owner IN ('PCE', 'SYSTEM', 'SYS')
        
        UNION
        
        -- Tabelas de utilizadores e serviços
        SELECT owner, table_name FROM all_tables 
        WHERE table_name IN ('UTILIZADORES', 'SERVICOS', 'ESPECIALIDADES', 
                            'PROFISSOES', 'AREAS')
          AND owner IN ('PCE', 'SYSTEM', 'SYS')
        
        UNION
        
        -- Tabelas relacionadas por foreign keys com CSU_EPENTIDADEACTOS
        SELECT DISTINCT r.owner, r.table_name
        FROM all_constraints c
        JOIN all_constraints r ON c.r_constraint_name = r.constraint_name
        WHERE c.table_name LIKE '%CSU%'
          AND c.constraint_type = 'R'
      )
      ORDER BY owner, table_name`;
    
    const tabelasResult = await connection.execute(tabelasRelacionadasQuery);
    
    const todasTabelas = [];
    if (tabelasResult.rows) {
      for (const [owner, table] of tabelasResult.rows) {
        todasTabelas.push({ owner, table });
        console.log(`  ${owner}.${table}`);
      }
    }
    
    console.log(`\nTotal de tabelas encontradas: ${todasTabelas.length}`);
    
    // 2. Mapear estrutura detalhada de cada tabela
    console.log('\n2. A MAPEAR ESTRUTURA DETALHADA DE CADA TABELA...\n');
    
    const resultadoCompleto = {};
    const erros = [];
    
    for (const { owner, table } of todasTabelas) {
      console.log(`\nProcessando ${owner}.${table}...`);
      
      try {
        // Buscar estrutura da tabela
        const estruturaResult = await connection.execute(
          `SELECT 
            column_name,
            data_type,
            data_length,
            data_precision,
            data_scale,
            nullable,
            data_default,
            column_id
          FROM all_tab_columns
          WHERE table_name = :tableName
            AND owner = :owner
          ORDER BY column_id`,
          { tableName: table, owner: owner }
        );
        
        // Buscar constraints
        const constraintsResult = await connection.execute(
          `SELECT 
            c.constraint_name,
            c.constraint_type,
            c.search_condition,
            cc.column_name,
            r.table_name as r_table_name,
            r.owner as r_owner
          FROM all_constraints c
          LEFT JOIN all_cons_columns cc 
            ON c.constraint_name = cc.constraint_name 
            AND c.owner = cc.owner
          LEFT JOIN all_constraints r 
            ON c.r_constraint_name = r.constraint_name
          WHERE c.table_name = :tableName
            AND c.owner = :owner
          ORDER BY c.constraint_type, cc.position`,
          { tableName: table, owner: owner }
        );
        
        // Buscar índices
        const indicesResult = await connection.execute(
          `SELECT 
            i.index_name,
            i.uniqueness,
            ic.column_name,
            ic.column_position
          FROM all_indexes i
          JOIN all_ind_columns ic 
            ON i.index_name = ic.index_name 
            AND i.owner = ic.index_owner
          WHERE i.table_name = :tableName
            AND i.owner = :owner
          ORDER BY i.index_name, ic.column_position`,
          { tableName: table, owner: owner }
        );
        
        // Processar resultados
        const colunas = estruturaResult.rows.map(row => ({
          nome: row[0],
          tipo: row[1],
          tamanho: row[2],
          precisao: row[3],
          escala: row[4],
          nullable: row[5] === 'Y',
          default: row[6],
          posicao: row[7]
        }));
        
        const constraints = {};
        constraintsResult.rows.forEach(row => {
          const [name, type, condition, column, rTable, rOwner] = row;
          if (!constraints[name]) {
            constraints[name] = {
              tipo: type,
              colunas: [],
              condicao: condition,
              tabelaRef: rTable ? `${rOwner}.${rTable}` : null
            };
          }
          if (column) {
            constraints[name].colunas.push(column);
          }
        });
        
        const indices = {};
        indicesResult.rows.forEach(row => {
          const [name, uniqueness, column, position] = row;
          if (!indices[name]) {
            indices[name] = {
              unico: uniqueness === 'UNIQUE',
              colunas: []
            };
          }
          indices[name].colunas[position - 1] = column;
        });
        
        // Contar registros (só para tabelas pequenas)
        let totalRegistros = null;
        try {
          const countResult = await connection.execute(
            `SELECT COUNT(*) as total FROM ${owner}.${table}`
          );
          totalRegistros = countResult.rows[0][0];
        } catch (err) {
          // Ignorar erro de contagem
        }
        
        resultadoCompleto[`${owner}.${table}`] = {
          owner,
          table,
          colunas,
          constraints: Object.keys(constraints).length > 0 ? constraints : null,
          indices: Object.keys(indices).length > 0 ? indices : null,
          totalRegistros
        };
        
        console.log(`  ✓ ${colunas.length} colunas, ${Object.keys(constraints).length} constraints, ${Object.keys(indices).length} índices`);
        
        // Salvar arquivo individual
        fs.writeFileSync(
          path.join(__dirname, `tabela_${owner}_${table}.json`),
          JSON.stringify(resultadoCompleto[`${owner}.${table}`], null, 2)
        );
        
      } catch (err) {
        console.log(`  ✗ Erro: ${err.message}`);
        erros.push({ tabela: `${owner}.${table}`, erro: err.message });
      }
    }
    
    // 3. Identificar relacionamentos entre tabelas
    console.log('\n3. IDENTIFICANDO RELACIONAMENTOS ENTRE TABELAS...\n');
    
    const relacionamentosResult = await connection.execute(
      `SELECT 
        c.owner || '.' || c.table_name as tabela_origem,
        cc.column_name as coluna_origem,
        r.owner || '.' || r.table_name as tabela_destino,
        rc.column_name as coluna_destino
      FROM all_constraints c
      JOIN all_cons_columns cc 
        ON c.constraint_name = cc.constraint_name 
        AND c.owner = cc.owner
      JOIN all_constraints r 
        ON c.r_constraint_name = r.constraint_name
      JOIN all_cons_columns rc 
        ON r.constraint_name = rc.constraint_name 
        AND r.owner = rc.owner
      WHERE c.constraint_type = 'R'
        AND (c.table_name LIKE '%CSU%' 
             OR r.table_name LIKE '%CSU%'
             OR c.table_name IN ('ARTIGOS', 'PRF_MEDICAMENTOS', 'UTILIZADORES')
             OR r.table_name IN ('ARTIGOS', 'PRF_MEDICAMENTOS', 'UTILIZADORES'))
      ORDER BY c.owner, c.table_name`
    );
    
    const relacionamentos = [];
    if (relacionamentosResult.rows) {
      relacionamentosResult.rows.forEach(row => {
        relacionamentos.push({
          origem: { tabela: row[0], coluna: row[1] },
          destino: { tabela: row[2], coluna: row[3] }
        });
      });
    }
    
    console.log(`Total de relacionamentos encontrados: ${relacionamentos.length}`);
    
    // 4. Salvar resultado final
    const resultadoFinal = {
      dataHora: new Date().toISOString(),
      totalTabelas: Object.keys(resultadoCompleto).length,
      tabelas: resultadoCompleto,
      relacionamentos,
      erros
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'MAPEAMENTO_COMPLETO_BD.json'),
      JSON.stringify(resultadoFinal, null, 2)
    );
    
    // 5. Gerar documentação markdown
    console.log('\n4. GERANDO DOCUMENTAÇÃO...\n');
    
    let markdown = `# Mapeamento Completo da Base de Dados
## Sistema Registo de Tratamentos

**Data:** ${new Date().toLocaleString('pt-PT')}
**Total de Tabelas:** ${Object.keys(resultadoCompleto).length}

## Índice de Tabelas

`;
    
    // Agrupar por categoria
    const categorias = {
      'Actos e Tratamentos': [],
      'Artigos e Medicamentos': [],
      'Episódios e Utentes': [],
      'Farmácia': [],
      'Sistema': [],
      'Outras': []
    };
    
    Object.keys(resultadoCompleto).forEach(key => {
      const tabela = resultadoCompleto[key];
      if (key.includes('CSU')) {
        categorias['Actos e Tratamentos'].push(key);
      } else if (key.includes('ARTIGO') || key.includes('MEDICAMENTO') || key.includes('PRF_') || key.includes('MEDH_')) {
        categorias['Artigos e Medicamentos'].push(key);
      } else if (key.includes('EPISODIO') || key.includes('UTENTE')) {
        categorias['Episódios e Utentes'].push(key);
      } else if (key.includes('FAR') || key.includes('DISPENSA')) {
        categorias['Farmácia'].push(key);
      } else if (key.includes('UTILIZADOR') || key.includes('SERVICO')) {
        categorias['Sistema'].push(key);
      } else {
        categorias['Outras'].push(key);
      }
    });
    
    Object.keys(categorias).forEach(cat => {
      if (categorias[cat].length > 0) {
        markdown += `\n### ${cat}\n`;
        categorias[cat].sort().forEach(tabela => {
          const info = resultadoCompleto[tabela];
          markdown += `- **${tabela}** (${info.colunas.length} colunas`;
          if (info.totalRegistros !== null) {
            markdown += `, ${info.totalRegistros} registros`;
          }
          markdown += `)\n`;
        });
      }
    });
    
    markdown += `\n## Relacionamentos Principais\n\n\`\`\`mermaid\ngraph TD\n`;
    
    const tabelasCSU = ['CSU_DEFACTOS', 'CSU_EPENTIDADEACTOS', 'CSU_EPENTIDADEACTOGASTOS', 'CSU_DEFACTOSENTGASTOS'];
    relacionamentos.forEach(rel => {
      const origemSimples = rel.origem.tabela.split('.')[1];
      const destinoSimples = rel.destino.tabela.split('.')[1];
      if (tabelasCSU.includes(origemSimples) || tabelasCSU.includes(destinoSimples)) {
        markdown += `    ${origemSimples} -->|${rel.origem.coluna}| ${destinoSimples}\n`;
      }
    });
    
    markdown += `\`\`\`\n`;
    
    fs.writeFileSync(
      path.join(__dirname, 'DOCUMENTACAO_BD_COMPLETA.md'),
      markdown
    );
    
    console.log('\n✓ Mapeamento completo salvo em:');
    console.log('  - queries-results/MAPEAMENTO_COMPLETO_BD.json');
    console.log('  - queries-results/DOCUMENTACAO_BD_COMPLETA.md');
    console.log('  - Arquivos individuais para cada tabela');
    
  } catch (err) {
    console.error('Erro fatal:', err);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✓ Conexão fechada');
    }
  }
}

mapearTodasTabelasRelacionadas(); 