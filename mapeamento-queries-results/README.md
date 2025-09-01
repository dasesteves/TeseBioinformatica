# Mapeamento da Base de Dados PCE - ✅ COMPLETO

Esta pasta contém o mapeamento **COMPLETO** da base de dados PCE utilizada pelo sistema de Registo de Tratamentos.

## 📊 Estado Atual do Mapeamento

🎉 **MAPEAMENTO 100% COMPLETO** - Todas as tabelas PCE foram mapeadas!

### Estatísticas Finais

- **123 tabelas PCE** completamente mapeadas
- **22.043.715 registros** catalogados
- **1.039 colunas** documentadas
- **79 tabelas com dados** ativos
- **44 tabelas vazias** (estrutura documentada)

### Tabelas Mais Relevantes

1. **PRF_PRESC_MOV_LOG** - 6.993.208 registros (logs de movimentos de prescrições)
2. **PRF_PRESC_MOV_ENF** - 5.034.916 registros (movimentos de enfermagem)
3. **PRF_PRESC_ENF_CONTROL** - 4.746.804 registros (controlo de enfermagem)
4. **PRF_PRESC_MOV_FDET** - 2.003.690 registros (detalhes farmácia)
5. **PCEEPISODIOS** - 1.190.848 registros (episódios clínicos)
6. **PCEURGADMI** - 253.796 registros (urgências e admissões)

## 📋 Conteúdo

### 1. Scripts de Mapeamento

- **`mapear-sistema-completo.js`** - Script abrangente para mapear TODAS as tabelas do sistema incluindo MEDH
- **`mapear-tabelas-pce-faltantes.js`** - Script otimizado para completar tabelas PCE em falta
- **`descobrir-todas-tabelas-bd.js`** - Script para descobrir tabelas em todos os schemas
- **`verificar-mapeamento-completo.js`** - Script de verificação do estado final
- **`buscar-todas-tabelas-relacionadas.js`** - Script para descobrir e mapear novas tabelas automaticamente
- **`test-critical-queries.js`** - Script otimizado para testar queries críticas com timeout e controlo de performance
- **`test-queries-sistema.js`** - Script para testar as queries reais usadas pelo sistema em produção

### 2. Documentação Principal

- **`DOCUMENTACAO_BD_COMPLETA.md`** - Documentação completa de todas as tabelas
- **`MAPEAMENTO_COMPLETO_BD.json`** - JSON com estrutura completa de todas as tabelas (227 KB)
- **`REFERENCIA_RAPIDA_PCE.md`** - Guia de referência rápida com queries essenciais
- **`VERIFICACAO_MAPEAMENTO_FINAL.json`** - Relatório final do estado do mapeamento
- **`INDICE_GERAL.json`** - Índice estruturado para navegação programática

### 3. Tabelas Mapeadas Individualmente

Cada uma das **123 tabelas PCE** tem seu arquivo JSON individual com estrutura completa:

#### Tabelas Principais do Sistema

- `tabela_PCE_PCEEPISODIOS.json` - Episódios clínicos
- `tabela_PCE_PCEURGADMI.json` - Urgências e admissões
- `tabela_PCE_CSU_DEFACTOS.json` - Catálogo de actos médicos
- `tabela_PCE_CSU_EPENTIDADEACTOS.json` - Actos registados
- `tabela_PCE_CSU_EPENTIDADEACTOGASTOS.json` - Artigos consumidos

#### Tabelas de Prescrições e Farmácia

- `tabela_PCE_PRF_MEDICAMENTOS.json` - Base de medicamentos
- `tabela_PCE_PRF_PRESC_MOV_*.json` - Movimentos de prescrições (múltiplas variantes)
- `tabela_PCE_PRF_VIAS.json` - Vias de administração
- `tabela_PCE_PRF_PROTOCOLOS.json` - Protocolos terapêuticos

#### Tabelas MEDH (Base de Medicamentos)

- `tabela_PCE_MEDH_MESTRE.json` - Dados principais de medicamentos
- `tabela_PCE_MEDH_CARACTERIZACAO.json` - Caracterização de medicamentos
- `tabela_PCE_MEDH_ATC.json` - Códigos ATC
- `tabela_PCE_MEDH_INTERACOES.json` - Interações medicamentosas

#### E muitas outras

### 4. Scripts de Análise e Testes

- `TESTE_QUERIES_CRITICAS_OTIMIZADO.json` - Resultados do teste de queries críticas
- `TESTE_QUERIES_SISTEMA.json` - Resultados do teste de queries do sistema
- `TODAS_TABELAS_RELACIONADAS.json` - Índice completo de todas as tabelas

## 📊 Como Usar

### 1. Para verificar o estado atual

```bash
node verificar-mapeamento-completo.js
```

### 2. Para testar queries críticas

```bash
node test-critical-queries.js
```

### 3. Para testar queries do sistema

```bash
node test-queries-sistema.js
```

### 4. Para mapear novas tabelas (se descobertas)

```bash
node mapear-tabelas-pce-faltantes.js
```

## 🔍 Navegação dos Dados

### Por Estrutura JSON

```javascript
// Carregar estrutura de uma tabela específica
const tabela = require('./tabela_PCE_PCEEPISODIOS.json');
console.log(`Tabela: ${tabela.table}`);
console.log(`Registros: ${tabela.totalRegistros}`);
console.log(`Colunas: ${tabela.colunas.length}`);
```

### Por Documentação

- Consulte `REFERENCIA_RAPIDA_PCE.md` para queries prontas
- Use `DOCUMENTACAO_BD_COMPLETA.md` para visão geral
- Verifique `INDICE_GERAL.json` para navegação programática

## 🎯 Próximos Passos

✅ **Mapeamento Completo** - Todas as 123 tabelas PCE foram mapeadas
✅ **Documentação Atualizada** - Toda a documentação reflete o estado atual
✅ **Scripts de Verificação** - Ferramentas para manutenção contínua

### Manutenção Futura

- Execute `verificar-mapeamento-completo.js` periodicamente
- Se novas tabelas forem descobertas, use `mapear-tabelas-pce-faltantes.js`
- Mantenha os scripts de teste atualizados com novas queries do sistema

---

**🏆 Status: MAPEAMENTO COMPLETO - 123/123 tabelas PCE mapeadas**
*Última atualização: julho de 2025*
