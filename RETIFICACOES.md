# Relatório de Diagnóstico e Retificações – Template DI UMinho

Referência do template: [Templates LaTeX para dissertação (DI-UM)](https://web.di.uminho.pt/sitedi/latex)

Objetivo: alinhar o projeto com o template oficial e garantir compilação limpa (XeLaTeX) local e no Overleaf.

## 1) Motor de compilação e pipeline

- [x] Usar XeLaTeX como compilador (exigência do template).
- [x] Sequência local (PowerShell):
  - `xelatex dissertation.tex`
  - `bibtex dissertation.aux`
  - `makeindex dissertation`
  - `makeglossaries dissertation`
  - `xelatex dissertation.tex`
- [ ] Overleaf: definir o compilador como XeLaTeX (Menu > Compiler > XeLaTeX).

Nota: compilar só com XeLaTeX sem `makeindex`/`makeglossaries` pode gerar listas vazias (não quebra necessariamente).

## 2) Dependências/pacotes LaTeX

- [x] Adicionar `\usepackage{graphicx}` no `dissertation.sty` (obrigatório para `\includegraphics`).
- [x] Adicionar `\usepackage{booktabs}` no `dissertation.sty` (necessário para `\toprule`, `\midrule`, `\bottomrule`).
- [x] Remover `\usepackage[utf8]{inputenc}` (XeLaTeX+`fontspec` já trata UTF-8).
- [x] `datetime` duplicado removido no `dissertation.sty`.

## 3) Estrutura e includes

- [x] Corrigir `\input{chapters/ConclusionsAndFutureWork}` (ficheiro renomeado para `chapters/ConclusionsAndFutureWork.tex`).
- [x] Reordenar capítulos no `dissertation.tex` para alinhar com o conteúdo:
  - Introduction → State of the Art → Methodology (`Contribution.tex`) → Expected Results (`Applications.tex`) → Discussion (`ProblemAndChallenges.tex`) → Conclusions and Future Work → Work Plan.

## 4) Figuras e ativos

- [x] Verificadas imagens úteis (logos, generated, CC icons). OK.
- [x] `graphicx` ativado; `\includegraphics` funcional.

## 5) Bibliografia

- [x] `natbib` + `plainnat` OK; chaves existentes em `dissertation.bib`.
- [x] `bibtex` executado e `dissertation.bbl` gerado.

## 6) Glossário, acrónimos e índice

- [x] Criado `preamble/Glossary.tex` com entradas mínimas (SCMVV, CDSS, HIS, HIT, DSR, HL7, FHIR, API, JWT, UAT, GDPR, DDI, UI, ROI) e incluído no `dissertation.tex`.
- [x] `makeglossaries` executado (ficheiros vazios por enquanto é aceitável).
- [x] Índice gerado (sem entradas, aceitável).
- [ ] Marcação com `\gls{}` a expandir pelos capítulos (algumas primeiras ocorrências já assinaladas; continuar nos restantes).

## 7) Capa, folha de rosto e metadados

- [x] `\logo{EE}`/`\logoB{EE}` OK; fonte NewsGotT OK.
- [x] `\author`, `\titleA/B/C`, `\masters`, `\supervisor`, `\cosupervisor` definidos.
- [x] Idioma principal definido para EN com `\selectlanguage{english}` no início do documento.
- [x] `Resumo` em PT; `Abstract` forçado para EN em `preamble/Abstract.tex`.

## 8) Direitos de autor (preamble/Copyright)

- [x] Decisão: Licença CC BY.
- [x] Mantida apenas a secção CC BY; restantes variantes removidas.

## 9) Idioma e nomenclatura

- [x] Documento em EN (regra), com `Resumo` em PT. `List of Tables` mantém EN.

## 10) Ajustes de formatação/estilo (não bloqueantes)

- [ ] Consolidar `\parindent` (após `\newgeometry`).
- [ ] Remover pacotes não usados para reduzir warnings (ex.: `epigraph`, `wrapfig` se não forem necessários).
- [x] Fonte: configuradas variantes para evitar avisos de `font shape undefined` (Italic/BoldItalic ligadas às TTF disponíveis).
- [x] Warnings tracklang/datatool: silenciados com `\PassOptionsToPackage{quiet}{tracklang}`.

---

## Próximas ações

- [ ] Glossário: expandir lista com termos específicos do projeto (PEM, ADSE, SONHO, CDSS variantes, etc.).
- [ ] Alinhar títulos nos próprios capítulos (renomear títulos de `Contribution.tex` para “Methodology”, `ProblemAndChallenges.tex` para “Discussion”, etc., se desejado no PDF).
- [ ] Confirmar no Overleaf o compilador XeLaTeX.
- [ ] Revisar warnings de overfull/underfull boxes nas páginas indicadas.
