# RELATÓRIO COMPLETO - INVESTIGAÇÃO FA10040790

## RESUMO EXECUTIVO

**Problema:** O artigo FA10040790 (Macrogol 10000 mg) não está a deduzir stock no sistema SCMVV, apesar das prescrições e administrações aparecerem corretas no sistema local.

**Descoberta Principal:** O artigo tem **7447 administrações de enfermagem** registadas mas **ZERO registos nas tabelas CSU**, indicando falha total no processo de integração PRF → CSU → SCMVV.

## FACTOS DESCOBERTOS

### 1. Presença do FA10040790 no Sistema

**ONDE ESTÁ:**

- `PRF_MEDICAMENTOS`: 1 registo (cadastro do medicamento)
- `PRF_PRESC_MOV`: 74 prescrições
- `PRF_PRESC_MOV_ENF`: **7447 administrações** ⚠️
- `ARTIGOCODBARRAS`: 3 registos
- `PRF_CHNM`: 9 registos

**ONDE NÃO ESTÁ:**

- `CSU_EPENTIDADEACTOGASTOS`: 0 registos ❌
- `CSU_DEFACTOSENTGASTOS`: 0 registos ❌
- Nenhuma tabela CSU contém este artigo

### 2. Episódio 18027051 Específico

- 2 prescrições em `PRF_PRESC_MOV`
- 0 registos em `CSU_EPENTIDADEACTOS`
- O episódio existe mas sem movimentos de stock associados

### 3. Comparação com Artigos que Funcionam

| Artigo | Prescrições PRF | Registos CSU | Status |
|--------|----------------|--------------|--------|
| FA10005405 | 5 | 3427 | ✓ Funciona |
| FA10040790 | 74 | 0 | ❌ Não funciona |

## DIAGNÓSTICO DO PROBLEMA

### Causa Raiz

O processo de integração entre os módulos PRF (Prescrição) e CSU (Consumos) está **completamente quebrado** para este artigo específico.

### Fluxo Normal (que deveria acontecer)

```mermaid
PRF_PRESC_MOV → Trigger/Job → CSU_EPENTIDADEACTOS + CSU_EPENTIDADEACTOGASTOS → Batch → SCMVV
```

### Fluxo Atual (o que está a acontecer)

```mermaid
PRF_PRESC_MOV → ❌ FALHA → (nada em CSU) → (nada em SCMVV)
```

## SOLUÇÃO IMEDIATA

### Comandos SQL para Corrigir Manualmente

Para o episódio 18027051 com 2 prescrições activas:

```sql
-- Inserir em CSU_EPENTIDADEACTOS
INSERT INTO PCE.CSU_EPENTIDADEACTOS (
    CDU_CSU_ID, EPISODIO, MODULO, CDU_CSU_DATA, CDU_CSU_EXPORTADO
) VALUES (
    49855, '18027051', 'INT', SYSDATE, 0
);

-- Inserir em CSU_EPENTIDADEACTOGASTOS  
INSERT INTO PCE.CSU_EPENTIDADEACTOGASTOS (
    CDU_CSU_EPISODIOENTIDADEACTOID, CDU_CSU_ARTIGO, CDU_CSU_QUANTIDADE
) VALUES (
    49855, 'FA10040790', 1
);

COMMIT;
```

**Nota:** Após inserção, o campo `CDU_CSU_EXPORTADO = 0` indica pendente. O processo batch deve processar e enviar para SCMVV.

## SOLUÇÃO DEFINITIVA

### Ações Necessárias

1. **Investigar Triggers**
   - Verificar se os triggers em `PRF_PRESC_MOV` estão activos
   - Confirmar se há regras que excluem o código FA10040790

2. **Verificar Configurações Especiais**
   - O artigo pode estar marcado como "não deduz stock"
   - Pode ser medicamento de investigação ou amostra

3. **Corrigir Processo de Integração**
   - Reactivar processo PRF → CSU para este artigo
   - Executar migração retroactiva das 7447 administrações

4. **Monitorizar**
   - Após correção, verificar se `CDU_CSU_EXPORTADO` muda para 2
   - Confirmar dedução no SCMVV

## IMPACTO

- **7447 administrações** sem dedução de stock
- **58 episódios** afectados  
- **Vários anos** de histórico sem controlo de stock
- Possível **desvio significativo** entre stock real e sistema

## RECOMENDAÇÕES

1. **Urgente:** Executar comandos SQL para episódio 18027051
2. **Crítico:** Investigar por que este artigo específico falha
3. **Importante:** Auditar outros artigos para verificar se há mais casos
4. **Preventivo:** Implementar alertas para detectar falhas PRF → CSU

## CONCLUSÃO

O problema do FA10040790 é uma **falha sistémica** no processo de integração, não um problema de API ou configuração do SCMVV. A solução requer intervenção manual imediata e correção do processo de integração a longo prazo.
