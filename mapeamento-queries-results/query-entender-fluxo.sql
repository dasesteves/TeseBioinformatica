-- =====================================================
-- ENTENDER O FLUXO REAL DO SISTEMA
-- =====================================================

-- ANÁLISE IMPORTANTE:
-- Parece que os campos CDU_CSU_TIPODOCSTK e CDU_CSU_SERIESTK
-- NÃO são preenchidos quando o sistema local regista os actos.
-- Estes campos provavelmente são para IMPORTAÇÃO do SCMVV,
-- não para EXPORTAÇÃO.

-- 1. VER ESTRUTURA COMPLETA DE UM REGISTO RECENTE
SELECT * FROM (
    SELECT 
        ea.*,
        eg.CDU_CSU_ARTIGO,
        eg.CDU_CSU_QUANTIDADE
    FROM PCE.CSU_EPENTIDADEACTOS ea
    LEFT JOIN PCE.CSU_EPENTIDADEACTOGASTOS eg 
        ON ea.CDU_CSU_ID = eg.CDU_CSU_EPISODIOENTIDADEACTOID
    WHERE ea.CDU_CSU_DATA >= SYSDATE - 7
    ORDER BY ea.CDU_CSU_DATA DESC
) t WHERE ROWNUM <= 5;

-- 2. ANALISAR PADRÃO DE EXPORTAÇÃO
SELECT 
    CDU_CSU_EXPORTADO,
    CASE 
        WHEN CDU_CSU_EXPORTADO = 0 THEN 'Pendente'
        WHEN CDU_CSU_EXPORTADO = 2 THEN 'Exportado'
        WHEN CDU_CSU_EXPORTADO = 9 THEN 'Erro'
        ELSE 'Outro'
    END AS STATUS,
    COUNT(*) AS TOTAL,
    MAX(CDU_CSU_DATA) AS ULTIMO_REGISTO
FROM PCE.CSU_EPENTIDADEACTOS
GROUP BY CDU_CSU_EXPORTADO
ORDER BY CDU_CSU_EXPORTADO;

-- 3. VER ERROS DE EXPORTAÇÃO RECENTES
SELECT * FROM (
    SELECT 
        CDU_CSU_ID,
        EPISODIO,
        CDU_CSU_DATA,
        ERRO,
        CDU_CSU_OBSERVACOES
    FROM PCE.CSU_EPENTIDADEACTOS
    WHERE CDU_CSU_EXPORTADO = 9 -- Erro
      AND ERRO IS NOT NULL
    ORDER BY CDU_CSU_DATA DESC
) t WHERE ROWNUM <= 10;

-- 4. CONCLUSÃO:
-- O sistema funciona assim:
-- 1. Sistema local regista acto em CSU_EPENTIDADEACTOS (sem série/tipo doc)
-- 2. Sistema marca CDU_CSU_EXPORTADO = 0 (pendente)
-- 3. Processo batch exporta para SCMVV via API
-- 4. Se sucesso: CDU_CSU_EXPORTADO = 2
-- 5. Se erro: CDU_CSU_EXPORTADO = 9 e preenche campo ERRO

-- SOLUÇÃO PARA O PROBLEMA:
-- A série e tipo de documento devem ser configurados no SCMVV,
-- não no sistema local. O sistema local apenas exporta os dados
-- do acto e dos artigos consumidos. 