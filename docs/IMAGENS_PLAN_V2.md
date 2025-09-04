# IMAGENS_PLAN_v2.md (Plano Consolidado de Evidências)

## 1. Perfis Clínicos (Evidências recolhidas)

### Médico – Prescrição

- `images/generated/med_prescricao_menu.png` → Menu principal do circuito de prescrição (perfil médico).
- `images/generated/med_prescricao_lista_doentes.png` → Lista de doentes disponíveis para prescrição.
- `images/generated/med_prescricao_utente.png` → Ecrã de prescrição hospitalar ativa do utente.
- `images/generated/med_prescricao_pdf.png` → Exportação em PDF da prescrição.

### Enfermeiro – Administração

- `images/generated/enf_administracao_lista_doentes.png` → Lista de doentes disponíveis para administração.
- `images/generated/enf_administracao_utente.png` → Ecrã de administração de medicamentos (ações: validar, suspender, alta).
- `images/generated/enf_administracao_pdf.png` → Exportação em PDF da administração.

### Farmácia – Validação & Suporte

- `images/generated/baseline_validation_queue_v1.png` → Lista de validação da farmácia.
- `images/generated/baseline_lista_zero_v1.png` → Lista zero (controlo de stock/dispensa).
- `images/generated/baseline_integration_failures_v1.png` → Evidência de falhas de integração.
- `images/generated/baseline_antibiotics_rules_v1.png` → Regras de antibióticos (módulo específico).
- `images/generated/baseline_medh_search_empty_v1.png` → Pesquisa MED-H sem resultados.
- `images/generated/baseline_medh_search_dropdown_v1.png` → Pesquisa MED-H (dropdown de seleção).
- `images/generated/baseline_medh_drug_detail_v1.png` → Detalhe de medicamento MED-H.

### Laboratório – Esquemas

- `images/generated/lab_esquemas_lista_doentes.png` → Lista de doentes do módulo esquemas.
- `images/generated/lab_esquemas_upload.png` → Pop-up para upload de documento associado ao esquema.  
⚠️ Nota: módulo incompleto no legado AIDA-PCE (funcionalidade limitada).

---

## 2. Outputs Agregados (CSV)

- `images/generated/agg_cycle_anomalies_v1.csv` → Contagem de anomalias no ciclo (dispensa/administração fora de sequência).
- `images/generated/agg_episode_anchors_v1.csv` → Distribuição de episódios totais vs. com/sem admissão.
- `images/generated/agg_lifecycle_funnel_v2.csv` → Funnel do ciclo de prescrição-administração (com percentagens).
- `images/generated/baseline_presc_freq_v1.csv` → Frequências de prescrição (baseline).
- `images/generated/baseline_prf_movements_extract_v1.csv` → Movimentos de prescrição (baseline).
- `images/generated/baseline_route_dictionary_v1.csv` → Dicionário de vias (baseline).

---

## 3. Não implementados no legado (apenas texto na tese)

- **Farmácia – Preparação**  
- **Farmácia – Devolução**  
- **Laboratório – Esquemas (funcionalidade parcial)**  

Serão descritos no capítulo de Resultados como **módulos inexistentes/incompletos no AIDA-PCE**, a serem redesenhados no HiSi.

---

## 4. Segurança / Compliance (pendente recolha HiSi)

Estas imagens não existem no legado → serão documentadas na fase de integração do HiSi:

- `images/generated/jwt_authentication_flow.png`
- `images/generated/system_architecture.png` (atualizado com módulo de segurança).
- `images/generated/monitoring_dashboard.png` (auditoria).
- `images/generated/error_reduction_dashboard.png` (indicadores de redução de erro).
