# Mapeamento da Base de Dados - Sistema Registo de Tratamentos

## 1. Tabelas de Actos/Tratamentos

### PCE.CSU_DEFACTOS

**Descrição:** Catálogo de actos médicos disponíveis
**Campos principais:**

- `CDU_CSU_ID` (VARCHAR2 36) - GUID único do acto
- `CDU_CSU_CODIGO` (VARCHAR2 10) - Código do acto  
- `CDU_CSU_DESCRICAO` (VARCHAR2 255) - Descrição do acto
- `CDU_CSU_FLAGMEDICACAO` (NUMBER) - Flag indica se é medicação

### PCE.CSU_DEFACTOSENTGASTOS  

**Descrição:** Artigos/gastos predefinidos para cada acto
**Campos principais:**

- `CDU_CSU_ACTOID` - FK para CSU_DEFACTOS.CDU_CSU_ID
- `CDU_CSU_ARTIGO` - Código do artigo
- `CDU_CSU_DESCRICAO` - Descrição do artigo
- `CDU_CSU_QUANTIDADE` - Quantidade padrão
- `CDU_CSU_ACTIVO` - Se o artigo está ativo

### PCE.CSU_EPENTIDADEACTOS

**Descrição:** Actos realizados/registados para episódios
**Campos principais:**

- `CDU_CSU_ID` (NUMBER) - ID autoincrement do registo
- `EPISODIO` - Número do episódio
- `CDU_CSU_ACTOID` (VARCHAR2 36) - FK para CSU_DEFACTOS.CDU_CSU_ID
- `CDU_CSU_DATA` - Data/hora do acto
- `CDU_CSU_UTILIZADOR` - ID do utilizador que registou
- `MODULO` - Módulo do sistema (URG, INT, etc)
- `CDU_CSU_EXPORTADO` - Estado de exportação (0=pendente, 2=exportado, 9=erro)
- `ERRO` - Mensagem de erro se houver

### PCE.CSU_EPENTIDADEACTOGASTOS

**Descrição:** Artigos/gastos efetivamente usados em cada acto
**Campos principais:**

- `CDU_CSU_EPISODIOENTIDADEACTOID` - FK para CSU_EPENTIDADEACTOS.CDU_CSU_ID
- `CDU_CSU_ARTIGO` - Código do artigo
- `CDU_CSU_QUANTIDADE` - Quantidade utilizada
- `CDU_CSU_DESCRICAO` - Descrição do artigo

## 2. Tabelas de Episódios/Utentes

### PCE.PCEEPISODIOS

**Descrição:** Episódios de atendimento
**Campos principais:**

- `EPISODIO` - Número do episódio
- `NUM_SEQUENCIAL` - Número do utente
- `MODULO` - Módulo (URG, INT, etc)
- `COD_ESPECIALIDADE` - Código da especialidade
- `DES_ESPECIALIDADE` - Descrição da especialidade
- `DTA_EPISODIO` - Data do episódio

## 3. Tabelas de Artigos/Medicamentos

### ARTIGOS

**Descrição:** Catálogo geral de artigos
**Campos principais:**

- `CODIGO` - Código do artigo
- `NOME` - Nome/descrição
- `UNID_MEDIDA` - Unidade de medida

### PRF_MEDICAMENTOS  

**Descrição:** Catálogo de medicamentos
**Campos principais:**

- `CODIGO` - Código do medicamento
- `DESC_C` - Descrição completa

## 4. Relacionamentos

```text
CSU_DEFACTOS (Catálogo de Actos)
    |
    ├─> CSU_DEFACTOSENTGASTOS (Artigos predefinidos por acto)
    |
    └─> CSU_EPENTIDADEACTOS (Actos registados)
            |
            └─> CSU_EPENTIDADEACTOGASTOS (Artigos usados no acto)
```

## 5. Fluxo de Dados

1. **Selecionar Tratamento:** Busca em `PCE.CSU_DEFACTOS`
2. **Buscar Artigos do Tratamento:** Query em `PCE.CSU_DEFACTOSENTGASTOS` usando `CDU_CSU_ACTOID`
3. **Registar Tratamento:** Insert em `PCE.CSU_EPENTIDADEACTOS`
4. **Registar Artigos Usados:** Insert em `PCE.CSU_EPENTIDADEACTOGASTOS`

## 6. Estados de Exportação (CDU_CSU_EXPORTADO)

- `0` - Pendente de exportação
- `2` - Exportado com sucesso  
- `9` - Erro na exportação (ver campo ERRO)
