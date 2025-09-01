const oracledb = require('oracledb');

// Config BD PCE (ajuste se necessário)
const dbConfig = {
  user: 'PCE',
  password: 'PCE',
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.21.105.16)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORCL)))'
};

// Tabelas MEDH mais prováveis e PRF alvo
const MEDH_TABLES = [
  'MEDH_MESTRE_V2',
  'MEDH_CARACTERIZACAO_V2',
  'MEDH_ATC_V2',
  'MEDH_GFT_V2',
  'MEDH_INTERACOES_V2'
];

const PRF_TABLE = 'PRF_MEDICAMENTOS';

// Heurística de colunas candidatas a ligação
const CANDIDATE_COL_PATTERNS = [
  'COD', 'CODIGO', 'COD_MED', 'COD_MEDH', 'ARTIGO', 'DCI', 'ATC',
  'NOME', 'DESIG', 'DESCR', 'DESIGNACAO', 'DESCRICAO'
];

function colunaCandidata(nome) {
  const upper = String(nome || '').toUpperCase();
  return CANDIDATE_COL_PATTERNS.some(p => upper.includes(p));
}

async function listarColunas(connection, owner, tableName) {
  const sql = `
    SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH
    FROM ALL_TAB_COLUMNS
    WHERE OWNER = :owner AND TABLE_NAME = :tableName
    ORDER BY COLUMN_ID`;
  const res = await connection.execute(sql, { owner, tableName }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
  return res.rows || [];
}

async function contarRegistos(connection, owner, table) {
  try {
    const sql = `SELECT COUNT(*) AS TOTAL FROM ${owner}.${table}`;
    const res = await connection.execute(sql, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return res.rows?.[0]?.TOTAL || 0;
  } catch (e) {
    return null;
  }
}

async function testarLigacao(connection, medhTable, medhCol, prfCol) {
  // Tentar medir interseção via igualdade de strings normalizadas
  const sql = `
    SELECT COUNT(*) AS MATCHES
    FROM (
      SELECT DISTINCT UPPER(TRIM(${medhCol})) AS V
      FROM ${medhTable}
      WHERE ${medhCol} IS NOT NULL AND ROWNUM <= 5000
    ) A
    INNER JOIN (
      SELECT DISTINCT UPPER(TRIM(${prfCol})) AS V
      FROM ${PRF_TABLE}
      WHERE ${prfCol} IS NOT NULL AND ROWNUM <= 5000
    ) B ON A.V = B.V`;
  try {
    const res = await connection.execute(sql, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const matches = res.rows?.[0]?.MATCHES || 0;
    return matches;
  } catch (e) {
    return -1; // inválido
  }
}

async function testarLigacaoNormalizada(connection, medhTable, medhCol, prfCol, tipo = 'ALNUM') {
  // Igualdade indireta: normalização por regex
  const expr = tipo === 'NUM'
    ? (s) => `REGEXP_REPLACE(${s}, '[^0-9]', '')`
    : (s) => `REGEXP_REPLACE(${s}, '[^A-Z0-9]', '')`;

  const sql = `
    SELECT COUNT(*) AS MATCHES
    FROM (
      SELECT DISTINCT ${expr(`UPPER(TRIM(${medhCol}))`)} AS V
      FROM ${medhTable}
      WHERE ${medhCol} IS NOT NULL AND ROWNUM <= 5000
    ) A
    INNER JOIN (
      SELECT DISTINCT ${expr(`UPPER(TRIM(${prfCol}))`)} AS V
      FROM ${PRF_TABLE}
      WHERE ${prfCol} IS NOT NULL AND ROWNUM <= 5000
    ) B ON A.V IS NOT NULL AND B.V IS NOT NULL AND A.V = B.V AND LENGTH(A.V) >= 3`;
  try {
    const res = await connection.execute(sql, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return res.rows?.[0]?.MATCHES || 0;
  } catch (e) {
    return -1;
  }
}

async function amostraValores(connection, tableFull, col, limit = 100) {
  const sql = `
    SELECT V FROM (
      SELECT DISTINCT ${col} AS V
      FROM ${tableFull}
      WHERE ${col} IS NOT NULL
        AND LENGTH(TRIM(${col})) BETWEEN 4 AND 60
    ) WHERE ROWNUM <= :limit`;
  const res = await connection.execute(sql, { limit }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
  return (res.rows || []).map(r => r.V).filter(Boolean);
}

async function contarLikes(connection, prfCol, valores, direcao = 'A_IN_B') {
  // Conta quantos valores de A aparecem em PRF via LIKE
  // direcao A_IN_B: PRF.{prfCol} LIKE %valor%
  let positivos = 0;
  for (const v of valores) {
    try {
      const res = await connection.execute(
        `SELECT CASE WHEN EXISTS (SELECT 1 FROM ${PRF_TABLE} WHERE ${prfCol} LIKE :pat) THEN 1 ELSE 0 END AS HIT FROM DUAL`,
        { pat: `%${v}%` },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if ((res.rows?.[0]?.HIT || 0) === 1) positivos++;
    } catch (_) {}
  }
  return { total: valores.length, positivos };
}

async function mapearRelacoesMEDH() {
  let connection;
  try {
    try { oracledb.initOracleClient(); } catch (_) {}
    connection = await oracledb.getConnection(dbConfig);

    console.log('=======================================================');
    console.log('MAPEAMENTO RELAÇÕES MEDH ↔ PRF_MEDICAMENTOS');
    console.log('=======================================================\n');

    // Colunas PRF
    const prfCols = await listarColunas(connection, 'PCE', PRF_TABLE);
    const prfCand = prfCols.filter(c => colunaCandidata(c.COLUMN_NAME)).map(c => c.COLUMN_NAME);
    const totalPRF = await contarRegistos(connection, 'PCE', PRF_TABLE);
    console.log(`PRF alvo: ${PRF_TABLE} (${totalPRF} registos)`);
    console.log(`Colunas PRF candidatas: ${prfCand.join(', ')}\n`);

    const relacoes = [];

    for (const tbl of MEDH_TABLES) {
      const total = await contarRegistos(connection, 'PCE', tbl);
      if (total === null) {
        console.log(`⚠️  Sem acesso a ${tbl}`);
        continue;
      }
      console.log(`🔎 ${tbl} (${total} registos)`);
      const cols = await listarColunas(connection, 'PCE', tbl);
      const medhCand = cols.filter(c => colunaCandidata(c.COLUMN_NAME)).map(c => c.COLUMN_NAME);
      console.log(`   Colunas candidatas: ${medhCand.join(', ') || '(nenhuma)'}`);

      const resultadosTbl = [];
      for (const mc of medhCand) {
        for (const pc of prfCand) {
          const matches = await testarLigacao(connection, `PCE.${tbl}`, mc, pc);
          if (matches > 0) {
            resultadosTbl.push({ medhCol: mc, prfCol: pc, matches });
            console.log(`   ✓ Possível ligação ${tbl}.${mc} ↔ ${PRF_TABLE}.${pc} (matches=${matches})`);
          }

          // Igualdade indireta (normalizações)
          const matchesAlnum = await testarLigacaoNormalizada(connection, `PCE.${tbl}`, mc, pc, 'ALNUM');
          if (matchesAlnum > 0) {
            resultadosTbl.push({ medhCol: `${mc}~alnum`, prfCol: pc, matches: matchesAlnum });
            console.log(`   ↪︎ (indireta) ${tbl}.${mc}~ALNUM ↔ ${PRF_TABLE}.${pc} (matches=${matchesAlnum})`);
          }
          const matchesNum = await testarLigacaoNormalizada(connection, `PCE.${tbl}`, mc, pc, 'NUM');
          if (matchesNum > 0) {
            resultadosTbl.push({ medhCol: `${mc}~num`, prfCol: pc, matches: matchesNum });
            console.log(`   ↪︎ (indireta) ${tbl}.${mc}~NUM ↔ ${PRF_TABLE}.${pc} (matches=${matchesNum})`);
          }
        }
      }

      resultadosTbl.sort((a, b) => b.matches - a.matches);
      relacoes.push({ tabelaMEDH: tbl, total, melhoresLigacoes: resultadosTbl.slice(0, 5) });
      console.log('');
    }

    console.log('\n=======================================================');
    console.log('RESUMO SUGERIDO');
    console.log('=======================================================');
    relacoes.forEach(r => {
      console.log(`\n${r.tabelaMEDH}:`);
      if (r.melhoresLigacoes.length === 0) {
        console.log('  (Sem ligações óbvias por igualdade direta)');
      } else {
        r.melhoresLigacoes.forEach(l => {
          console.log(`  ${r.tabelaMEDH}.${l.medhCol} ↔ ${PRF_TABLE}.${l.prfCol} (matches=${l.matches})`);
        });
      }
    });

    console.log('\n💡 Próximos passos:');
    console.log('- Validar manualmente a melhor chave (ex.: ATC, DCI, CODIGO interno)');
    console.log('- Se necessário, criar tabela de correspondência PRF↔MEDH persistida');
    console.log('- Integrar Autocomplete: buscar MEDH e unificar com PRF por chave escolhida');

  } catch (err) {
    console.error('❌ Erro no mapeamento:', err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
}

// Executar
mapearRelacoesMEDH();


