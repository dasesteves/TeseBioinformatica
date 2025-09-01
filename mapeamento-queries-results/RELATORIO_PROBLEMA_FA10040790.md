# Relatório de Investigação - Problema de Baixa do Artigo FA10040790

**Data:** 10/07/2025  
**Artigo:** FA10040790  
**Problema:** O artigo não está dando baixa na base de dados externa (SCMVV)

## 🔍 Resumo Executivo - ATUALIZADO

**IMPORTANTE: O artigo FA10040790 EXISTE no sistema SCMVV!** O problema não é a falta do artigo, mas sim a **configuração de séries de documentos** necessária para criar movimentos de stock.

### Dados do Artigo no SCMVV

- **Código**: FA10040790
- **Descrição**: Macrogol 10000 mg Pó sol oral Saq
- **Stock Atual**: 516 unidades
- **Unidade**: UNID
- **Preço Médio**: €0,35795
- **Tipo**: 6
- **Família**: 12
- **Última Entrada**: 24/09/2024
- **Última Saída**: 02/10/2024

## 📊 Resultados da Investigação - REVISADO

### 1. Status do Artigo na API Externa

| Verificação | Resultado | Observação |
|-------------|-----------|------------|
| Artigo existe | ✅ **SIM** | Encontrado com endpoint correto |
| Stock disponível | ✅ 516 unidades | Stock suficiente |
| Endpoint correto | ✅ `/api/Artigos/Edita` | Com parâmetro `codigo` ou `Codigo` |
| Formato alternativo | ✅ `/api/Listas/Lista` | POST com filtros |

### 2. Problema Identificado: Séries de Documentos

| Teste | Resultado | Mensagem de Erro |
|-------|-----------|------------------|
| Série 2025 | ❌ Inválida | "A série 2025 não existe para o tipo de documento GS" |
| Série 2024 | ❌ Inválida | "A série 2024 não existe para o tipo de documento GS" |
| Série 2023 | ❌ Inválida | "A série 2023 não existe para o tipo de documento GS" |
| Série A | ❌ Inválida | "A série A não existe para o tipo de documento GS" |
| Série 1 | ❌ Inválida | "A série 1 não existe para o tipo de documento GS" |

## 🚨 Diagnóstico Correto

**O problema NÃO é a falta do artigo no sistema externo.** O artigo existe e tem stock disponível.

**O problema real é:** O sistema SCMVV requer uma série de documento válida para criar movimentos de stock, e nenhuma das séries testadas está configurada para o tipo de documento GS (Guia de Saída).

## ✅ Ações Necessárias - ATUALIZADO

### Imediatas

1. **Descobrir as séries válidas:**
   - Contactar a equipe responsável pelo SCMVV
   - Solicitar lista de séries disponíveis para documentos internos
   - Identificar qual tipo de documento usar para consumos

2. **Alternativas a testar:**

   ```javascript
   // Opção 1: Usar outro tipo de documento
   TipoDoc: 'CI'  // Consumo Interno (se existir)
   
   // Opção 2: Usar série vazia
   Serie: ''
   
   // Opção 3: Usar endpoint diferente
   /api/Consumos ou /api/MovimentosStock
   ```

3. **Verificar configuração:**
   - As séries podem precisar ser criadas no sistema
   - Pode haver um módulo de configuração de séries
   - Verificar se há série "default" ou "padrão"

### Solução Alternativa

Se não for possível descobrir a série correta, considerar:

1. **Criar série via API** (se houver permissão):

   ```javascript
   POST /api/Series/Actualiza
   {
     TipoDoc: 'GS',
     Serie: 'CONSUMO',
     Descricao: 'Consumos Internos',
     Ano: 2025
   }
   ```

2. **Usar outro módulo:**
   - Verificar se há módulo específico de farmácia
   - Procurar endpoints como `/api/Farmacia/Consumo`

## 📝 Scripts Criados

1. **investigar-chamadas-api.js** - Descobriu que o artigo existe
2. **verificar-formato-correto.js** - Identificou formato correto da API
3. **testar-movimentos-stock.js** - Revelou problema com séries
4. **investigar-series-documentos.js** - Tentou descobrir séries válidas

## 🔧 Próximos Passos

1. **Contactar suporte SCMVV** para obter:
   - Lista de séries configuradas
   - Tipo de documento correto para consumos
   - Exemplo de documento de consumo válido

2. **Testar com informações corretas:**
   - Usar série e tipo de documento fornecidos
   - Confirmar estrutura exata do documento

3. **Documentar processo:**
   - Criar guia de configuração
   - Registrar séries e tipos válidos

## 📞 Informações para Solicitar ao Suporte

Ao contactar o suporte, perguntar:

1. Qual série usar para documentos de consumo interno?
2. Qual tipo de documento (TipoDoc) usar para baixas de stock?
3. Existe endpoint específico para consumos que não requeira série?
4. Como criar/configurar uma nova série se necessário?
5. Há alguma autenticação necessária que não estamos usando?

---

**Conclusão Revista:** O artigo EXISTE no sistema. O problema é puramente de configuração - precisamos da série correta para criar documentos. Com a série válida, as baixas funcionarão normalmente.

## 🎯 Exemplo de Chamada Correta (quando tivermos a série)

```javascript
POST /api/DocumentosInternos/Actualiza
{
  "TipoDoc": "GS",  // ou tipo correto
  "Serie": "???",   // SÉRIE VÁLIDA A DESCOBRIR
  "Data": "2025-07-10",
  "Entidade": "INTERNO",
  "Linhas": [{
    "Artigo": "FA10040790",
    "Descricao": "Macrogol 10000 mg Pó sol oral Saq",
    "Quantidade": 1,
    "Unidade": "UNID",
    "PrecoUnitario": 0.35795
  }]
}
```
