# Plano de Imagens e Evidências (para guia de recolha com IA externa)

## Objetivo

Orientar uma IA externa (e o operador) na recolha de screenshots/mockups e evidências para inserção direta na dissertação LaTeX, sem inventar conteúdo, com anonimização total e nomes de ficheiro padronizados.

### Contexto mínimo que a IA deve conhecer

- Sistema legado principal: AIDA-PCE (Oracle). Módulos/tabelas relevantes: `PRF_PRESC_MOV`, `PRF_PRESC_MOV_FDET`, `PRF_PRESC_FREQ`, `PRF_VIAS`, `PRF_PRESC_MOV_ENF`, `PRF_PRESC_MOV_LOG`, `PCEEPISODIOS`, `PCEADMISSOES`, `UTILIZADORES`, `LOGS_COMPLETO`, `LOGS_CC`, `LOGS_MAN`.
- Novo artefacto: HiSi (frontend/backend unificado). Evidências pedidas: ecrãs equivalentes por etapa e configuração de segurança.
- Regras: sem PHI (identificadores de utentes, datas de nascimento, nomes, notas livres), capturas sempre anonimizadas e com disclosure no caption. Não inventar funcionalidades.

### Convenções de nomes e localização

- Guardar todos os ficheiros em `images/generated/`.
- Nomes para baseline (legado):
  - `baseline_prf_movements_extract_v1.png`
  - `baseline_prescription_fields_v1.png`
  - `baseline_validation_queue_v1.png`
  - `baseline_administration_record_v1.png`
  - `baseline_prescription_leaflet_v1.png`
  - `baseline_patient_list_pre_validation_v1.png`
  - `baseline_patient_list_pre_prescription_v1.png`
  - `baseline_presc_freq_v1.png`
  - `baseline_route_dictionary_v1.png`
- Nomes para segurança/compliance (novo artefacto):
  - `security_jwt_config_v1.png`
  - `security_ldap_sso_flow_v1.png`
  - `security_tls_config_v1.png`
  - `security_audit_log_example_v1.png`
  - `security_retention_policy_v1.png`
- As imagens ficam referenciadas em `chapters/Results.tex` e mapeadas em `appendices/DetailsOfResults.tex`.

### Mapa de colocação (destinos no LaTeX)

- Baseline (legado): tabelas/figuras em `chapters/Results.tex`:
  - Movimentos PRF (campos): `tab:baseline_prf_movements_fields` → `baseline_prf_movements_extract_v1.png`
  - Prescrição (campos): `tab:baseline_prescription_fields` → `baseline_prescription_fields_v1.png`
  - Fila pré‑validação: `tab:baseline_patient_list_pre_validation_fields` → `baseline_patient_list_pre_validation_v1.png`
  - Lista pré‑prescrição: `tab:baseline_patient_list_pre_prescription_fields` → `baseline_patient_list_pre_prescription_v1.png`
  - Folheto antes de validar: `tab:baseline_prescription_leaflet_fields` → `baseline_prescription_leaflet_v1.png`
  - Frequência: `tab:baseline_prescription_frequency_fields` → `baseline_presc_freq_v1.png`
  - Vias: `tab:baseline_route_dictionary_fields` → `baseline_route_dictionary_v1.png`
  - Registo de administração (legado/eMAR): figura `fig:baseline_administration_record` → `baseline_administration_record_v1.png`
  - Fila de validação (vista de ecrã): figura `fig:baseline_validation_queue` → `baseline_validation_queue_v1.png`
- Segurança/Compliance (novo): secção “Security and Compliance Posture” e appendix
  - JWT config → `security_jwt_config_v1.png`
  - LDAP/SSO flow → `security_ldap_sso_flow_v1.png`
  - TLS in-transit → `security_tls_config_v1.png`
  - Audit log (exemplo estruturado, sem PHI) → `security_audit_log_example_v1.png`
  - Política de retenção → `security_retention_policy_v1.png`

### Checklists de captura (por etapa)

- Prescrição (legado vs novo)
  - Legado: ecrã com campos visíveis (código fármaco, dose, via, frequência), sem nomes/IDs reais; folheto antes de validar.
  - Novo: ecrã equivalente (mockup/screenshot), destacar validações/alertas.
- Validação farmacêutica
  - Legado: vista de fila/lista pré‑validação com colunas (serviço/unidade, pendentes, última atualização) sem PHI.
  - Novo: fila de validação e ações (aprovar/pedir esclarecimento) com rasto de auditoria.
- Administração (ponto de cuidados)
  - Legado/eMAR atual: registo de administração (timestamp, profissional), sem identificadores.
  - Novo: fluxo eMAR (tarefas, confirmação, opcionalmente passo de código de barras se aplicável).
- Stocks (movimentos controlados)
  - Legado: formulário/relatório com `NUMLOTE`, quantidades, `DTA_LANCA`, tipo de movimento.
  - Novo: vista de movimentos ligada a prescrição.
- Segurança/compliance (novo)
  - Capturas de configuração JWT/SSO/TLS e exemplo de linha de audit log (actor, ação, escopo, timestamp), sem segredos.

### Âncoras temporais e agregados (sem PHI)

- Executar as consultas agregadas (ver `appendices/Listings.tex`) e exportar resultados (CSV/screenshot):
  - Ciclo prescrição→validação→dispensa→administração (contagens por condição).
  - Âncoras de episódio (admissão/início presentes).
- Ficheiros de saída sugeridos (opcional):
  - `agg_lifecycle_counts_v1.png` ou `.csv`
  - `agg_episode_anchors_v1.png` ou `.csv`

### Regras de anonimização e qualidade

- Remover/ocultar: nomes de doentes/profissionais, números de cartão, NIF, data de nascimento, notas livres.
- Manter apenas estrutura de campos e rótulos. Se inevitável, aplicar blur/box‑redaction.
- Verificar legibilidade (escala 100% ou 125%), margens consistentes, sem cortes de campos.
- Legendas devem referir: fonte “docs/tmp_ai_reports” (consolidada) e nota “anonymized”/“mockup”.

### Prompt inicial (colar na IA externa)

```text
Contexto: Estou a preparar evidências para uma dissertação (LaTeX) sobre unificação do processo de medicação num hospital. Há um sistema legado (AIDA‑PCE em Oracle) e um novo artefacto (HiSi). Não podes inventar conteúdo nem expor PHI. Tens de me guiar passo a passo para capturar screenshots anonimizados e outputs agregados, com nomes de ficheiro e destinos exatos.

Objetivo: Ajudar-me a recolher e guardar, em images/generated/, as 9 imagens de baseline e 5 de segurança/compliance com os nomes abaixo, e a exportar 2 outputs agregados (sem PHI), garantindo que cada artefacto cumpre as regras.

Nomes obrigatórios (guardar exatamente assim):
- baseline_prf_movements_extract_v1.png
- baseline_prescription_fields_v1.png
- baseline_validation_queue_v1.png
- baseline_administration_record_v1.png
- baseline_prescription_leaflet_v1.png
- baseline_patient_list_pre_validation_v1.png
- baseline_patient_list_pre_prescription_v1.png
- baseline_presc_freq_v1.png
- baseline_route_dictionary_v1.png
- security_jwt_config_v1.png
- security_ldap_sso_flow_v1.png
- security_tls_config_v1.png
- security_audit_log_example_v1.png
- security_retention_policy_v1.png

Tarefas que quero que conduzas (uma de cada vez, validação após cada passo):
1) Diz-me exatamente que ecrã capturar no legado para cada imagem baseline, que campos devem estar visíveis e como anonimizar.
2) Diz-me o ecrã equivalente no novo artefacto (ou mockup) e que melhoria evidenciar.
3) Para âncoras temporais, dá-me as consultas agregadas (sem PHI) e o formato de exportação.
4) Verifica comigo o nome final do ficheiro e a pasta correta (images/generated/).
5) Dá uma checklist de qualidade/anonimização antes de eu guardar cada ficheiro.
6) Mantém um quadro de progresso (feito/pendente) com o nome de cada ficheiro e destino LaTeX.

Restrições rígidas:
- Nunca solicitar/guardar PHI. Se um ecrã tiver PHI inevitável, instruir blur/mascaramento.
- Usar apenas os nomes e a pasta indicados. Confirmar após cada gravação.
- Colocar nas legendas (que eu tratarei no LaTeX) a nota “Source: docs/tmp_ai_reports; anonymized/mockup”.

Primeiro passo: começa por “baseline_prf_movements_extract_v1.png”. Diz-me: (a) que ecrã abrir; (b) que campos devem estar visíveis (NUMLOTE, CDU_CSU_ENVIADOQUANTIDADE, DTA_LANCA, DTMEDD, etc.); (c) como anonimizar; (d) checklist antes de guardar; (e) confirma o nome do ficheiro e pergunta-me quando estiver pronto.
```

### Critérios de aceitação (para cada ficheiro)

- Nome e pasta corretos (`images/generated/<nome>.png`).
- Anonimização verificada (sem PHI). Campos estruturais visíveis e legíveis.
- Alinhamento com os campos/tabelas definidos nas tabelas de “Baseline Field Examples” e “Security and Compliance”.
- Para agregados: sem valores identificáveis; apenas contagens/resumos.

### Fluxo sugerido (ordem)

1) Baseline: movimentos PRF → prescrição (campos) → fila pré‑validação → lista pré‑prescrição → folheto → frequência → vias → administração.
2) Novo artefacto: prescrição → validação → administração → stocks.
3) Segurança/compliance: JWT → SSO/LDAP → TLS → audit log → retenção.
4) Agregados: ciclo de vida → âncoras de episódio.

### Após a recolha

- Compilar LaTeX e verificar que as figuras aparecem sem warnings adicionais (overfulls). Se necessário, iremos ajustar largura/captions.
- Commit sugerido: `feat(images): adicionar evidências baseline e segurança (anonimizadas)`.
