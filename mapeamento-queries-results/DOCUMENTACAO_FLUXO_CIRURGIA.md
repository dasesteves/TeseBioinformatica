# Documentação Completa - Fluxo de Episódios para Cirurgia

## 🎯 **Modelo de Negócio Confirmado**

### **Descoberta Principal**

O módulo BLO não é "Ambulatório" como inicialmente pensado, mas sim **"Bloco Operatório"** - o local onde se executam as cirurgias após transição de outros módulos.

## 📋 **Fluxo Documentado com Dados Reais**

### **1. Fluxo Principal: CONSULTA → BLOCO**

```mermaid
graph LR
    CON[CON: Consulta<br/>Avaliação inicial] --> BLO[BLO: Bloco Operatório<br/>Execução cirúrgica]
```

**Dados confirmados:**

- **258 processos CON→BLO** nos últimos 3 meses
- **Tempo médio por especialidade:**
  - Oftalmologia: 55.7 dias
  - Ortopedia: 45.5 dias  
  - Cirurgia Plástica: 43.2 dias
  - Neurocirurgia: 40 dias
  - Cirurgia Pediátrica: 23.5 dias (mais rápida)

### **2. Fluxo Internamento: INTERNAMENTO → BLOCO**

```mermaid
graph LR
    INT[INT: Internamento<br/>Preparação pré-operatória] --> BLO[BLO: Bloco Operatório<br/>Cirurgia durante internamento]
```

**Dados confirmados:**

- **200 transições INT→BLO** no último mês
- **Transição no mesmo dia (0 dias)** - cirurgia durante internamento
- Padrão típico: `CIRURGIA 1` (INT) → Especialidade específica (BLO)

### **3. Fluxo de Urgência**

```mermaid
graph LR
    URG[URG: Urgência<br/>Casos críticos] --> BLO[BLO: Bloco Operatório<br/>Cirurgia urgente]
```

**Dados observados:**

- Casos menos frequentes mas existem
- Múltiplos módulos no mesmo dia confirmam urgências que vão para bloco

## 📊 **Estatísticas Importantes**

### **Distribuição de Especialidades no BLO**

| Especialidade | % do BLO | Tipo |
|---------------|----------|------|
| Oftalmologia | 27.26% | Cirúrgica |
| Cirurgia Geral | 20.82% | **Cirúrgica** |
| Ortopedia | 18.09% | Cirúrgica |
| Cirurgia Plástica | 7.24% | **Cirúrgica** |
| Cirurgia Vascular | 5.76% | **Cirúrgica** |
| Neurocirurgia | 4.11% | **Cirúrgica** |

**Resultado:** 38.14% são especialidades explicitamente cirúrgicas + outras que fazem cirurgias = **~80% são cirúrgicas**

### **Validação do Fluxo**

- ✅ **92.1%** dos episódios BLO têm episódio anterior (CON/INT/URG)
- ✅ **7.9%** são "órfãos" (provavelmente casos diretos ou externos)
- ✅ **28 casos** de múltiplos módulos no mesmo dia (confirmam transições)

## 🎯 **Implicações para Implementação**

### **1. Módulo CIR = Módulo BLO**

```typescript
// Na prática:
// modulo=CIR → usar dados do módulo BLO na base de dados
const modulo = searchParams.get("modulo") === "CIR" ? "BLO" : searchParams.get("modulo");
```

### **2. Nomenclatura Correta**

- **Interface:** "Cirurgia" (mais claro para utilizadores)
- **Backend:** Módulo BLO (correto na base de dados)
- **Contexto:** Bloco Operatório / Sala de Cirurgia

### **3. Funcionalidades Específicas Possíveis**

#### **A. Mostrar Histórico de Transição**

```sql
-- Mostrar episódio anterior que levou à cirurgia
SELECT 
    blo.*,
    anterior.MODULO as MODULO_ORIGEM,
    anterior.EPISODIO as EPISODIO_ORIGEM,
    anterior.DTA_EPISODIO as DATA_ORIGEM
FROM PCEEPISODIOS blo
LEFT JOIN PCEEPISODIOS anterior ON blo.NUM_SEQUENCIAL = anterior.NUM_SEQUENCIAL
    AND anterior.DTA_EPISODIO < blo.DTA_EPISODIO
    AND anterior.DTA_EPISODIO >= blo.DTA_EPISODIO - 365
WHERE blo.MODULO = 'BLO'
```

#### **B. Filtros Específicos de Cirurgia**

- Filtrar apenas especialidades cirúrgicas
- Mostrar tempo de espera (CON → BLO)
- Separar por tipo de cirurgia (urgente vs programada)

#### **C. Métricas Específicas**

- Tempo médio CON → BLO por especialidade
- Volume de cirurgias por especialidade
- Taxa de "órfãos" (cirurgias sem consulta prévia)

## 📋 **Estratégia de Implementação Recomendada**

### **Fase 1: Implementação Básica**

1. ✅ Usar módulo BLO como base
2. ✅ Manter interface "Cirurgia"
3. ✅ Reutilizar query padrão dos outros módulos
4. ✅ Aplicar filtros básicos se necessário

### **Fase 2: Funcionalidades Específicas** (Futuro)

1. Mostrar histórico de transição
2. Métricas de tempo de espera
3. Filtros por tipo de cirurgia
4. Dashboard específico de bloco operatório

## 🔧 **Query Recomendada para API**

```sql
-- Query base (igual aos outros módulos)
SELECT EPISODIO,
       doentes.NUM_SEQUENCIAL as NUM_SEQUENCIAL,
       DTA_EPISODIO,
       HORA_EPISODIO,
       DES_ESPECIALIDADE,
       COD_ESPECIALIDADE,
       NUM_PROCESSO,
       NOME,
       (SELECT COUNT(*)
        FROM CSU_EPENTIDADEACTOS C
        WHERE C.EPISODIO = episodios.EPISODIO
          and c.MODULO = episodios.MODULO) AS CSU_EPENTIDADEACTOS_COUNT
FROM PCEEPISODIOS episodios
INNER JOIN PCEDOENTES doentes ON episodios.NUM_SEQUENCIAL = doentes.NUM_SEQUENCIAL
WHERE DTA_EPISODIO = to_date(:data, 'YYYY-MM-DD')
  AND MODULO = 'BLO'  -- CIR mapeado para BLO
ORDER BY NOME
```

## ✅ **Conclusão**

**O fluxo está confirmado e documentado:**

- BLO = Bloco Operatório (não Ambulatório)
- Módulo CIR deve usar dados do BLO
- Transições CON→BLO e INT→BLO são padrão
- 92% dos episódios BLO têm origem em outros módulos
- Implementação pode ser simples inicialmente e evoluir

**A tua intuição sobre a nomenclatura estava correta!** 🎯
