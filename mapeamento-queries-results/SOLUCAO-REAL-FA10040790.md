# SOLUÇÃO REAL - Problema de Baixa FA10040790

## 🎯 Diagnóstico Correto

Após análise detalhada, descobrimos que:

1. **O artigo FA10040790 EXISTE no SCMVV** ✅
2. **As séries NÃO são configuradas no sistema local** ❌
3. **O problema está na configuração do PROCESSO DE EXPORTAÇÃO**

## 📌 Como o Sistema Realmente Funciona

```schema
Sistema Local (PCE)          →    Processo Batch    →    Sistema Externo (SCMVV)
     ↓                                  ↓                          ↓
Regista acto                    Lê pendentes              Cria documento stock
(sem série)                     Envia via API             (com série configurada)
```

## ✅ Solução Imediata

### 1. Verificar se há registos pendentes de exportação

```sql
SELECT COUNT(*) AS PENDENTES
FROM PCE.CSU_EPENTIDADEACTOS
WHERE CDU_CSU_EXPORTADO = 0;
```

### 2. Verificar se há erros de exportação

```sql
SELECT * FROM (
    SELECT 
        CDU_CSU_ID,
        EPISODIO,
        TO_CHAR(CDU_CSU_DATA, 'DD/MM/YYYY HH24:MI') AS DATA,
        ERRO
    FROM PCE.CSU_EPENTIDADEACTOS
    WHERE CDU_CSU_EXPORTADO = 9
      AND CDU_CSU_DATA >= SYSDATE - 30
    ORDER BY CDU_CSU_DATA DESC
) WHERE ROWNUM <= 10;
```

### 3. Verificar se o artigo tem movimentos pendentes

```sql
SELECT 
    ea.CDU_CSU_ID,
    ea.EPISODIO,
    TO_CHAR(ea.CDU_CSU_DATA, 'DD/MM/YYYY') AS DATA,
    ea.CDU_CSU_EXPORTADO AS STATUS_EXPORT,
    eg.CDU_CSU_ARTIGO,
    eg.CDU_CSU_QUANTIDADE
FROM PCE.CSU_EPENTIDADEACTOS ea
JOIN PCE.CSU_EPENTIDADEACTOGASTOS eg 
    ON ea.CDU_CSU_ID = eg.CDU_CSU_EPISODIOENTIDADEACTOID
WHERE eg.CDU_CSU_ARTIGO = 'FA10040790'
  AND ea.CDU_CSU_EXPORTADO IN (0, 9) -- Pendente ou Erro
ORDER BY ea.CDU_CSU_DATA DESC;
```

## 🔧 Ações Necessárias

### 1. **Verificar o Processo Batch**

- O processo que exporta do PCE para SCMVV pode estar parado
- Verificar logs do processo de integração
- Confirmar se está a correr regularmente

### 2. **No Sistema SCMVV**

- Verificar se há configuração de série padrão para consumos internos
- Confirmar se o processo de importação está ativo
- Verificar logs de importação

### 3. **Forçar Reprocessamento** (se necessário)

```sql
-- Marcar registos com erro para reprocessar
UPDATE PCE.CSU_EPENTIDADEACTOS
SET CDU_CSU_EXPORTADO = 0,
    ERRO = NULL
WHERE CDU_CSU_EXPORTADO = 9
  AND CDU_CSU_ID IN (
    SELECT ea.CDU_CSU_ID
    FROM PCE.CSU_EPENTIDADEACTOS ea
    JOIN PCE.CSU_EPENTIDADEACTOGASTOS eg 
        ON ea.CDU_CSU_ID = eg.CDU_CSU_EPISODIOENTIDADEACTOID
    WHERE eg.CDU_CSU_ARTIGO = 'FA10040790'
  );
```

## 📞 Contactos Necessários

1. **Equipa de Integração/Interfaces**
   - Verificar estado do processo batch PCE → SCMVV
   - Confirmar frequência de execução
   - Ver logs de erros

2. **Administrador SCMVV**
   - Confirmar configuração de séries para consumos internos
   - Verificar se processo de importação está ativo

## 💡 Resumo

**O problema NÃO é falta de série no sistema local.**

O sistema local não precisa de série - ele apenas regista o consumo e marca para exportação. O processo de integração é que está falhando ou o SCMVV não está configurado para processar estes consumos.

**Próximo passo:** Verificar com a equipa de integração se o processo batch está a funcionar.
