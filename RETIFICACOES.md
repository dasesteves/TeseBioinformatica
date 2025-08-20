# Relatório de Diagnóstico e Retificações – Template DI UMinho

Referência do template: [Templates LaTeX para dissertação (DI-UM)](https://web.di.uminho.pt/sitedi/latex)

Objetivo: alinhar o projeto com o template oficial e garantir compilação limpa (XeLaTeX) local e no Overleaf.

## 1) Motor de compilação e pipeline

- [ ] Usar XeLaTeX como compilador (exigência do template).
- [ ] Sequência local (PowerShell):
  - `xelatex dissertation.tex`
  - `bibtex dissertation.aux`
  - `makeindex dissertation`
  - `makeglossaries dissertation`
  - `xelatex dissertation.tex`
- [ ] Overleaf: definir o compilador como XeLaTeX (Menu > Compiler > XeLaTeX).

Nota: compilar só com XeLaTeX sem `makeindex`/`makeglossaries` pode gerar listas vazias (não quebra necessariamente).

## 2) Dependências/pacotes LaTeX

- [ ] Adicionar `\usepackage{graphicx}` no `dissertation.sty` (obrigatório para `\includegraphics`).
- [ ] Adicionar `\usepackage{booktabs}` no `dissertation.sty` (necessário para `\toprule`, `\midrule`, `\bottomrule` usados em `chapters/StateOfTheArt.tex`).
- [ ] Remover `\usepackage[utf8]{inputenc}` quando usando XeLaTeX+`fontspec` (redundante; evita warnings).
- [ ] `datetime` está importado duas vezes no `dissertation.sty`; manter apenas uma importação.

Estado atual:

- `graphicx`: ausente → erro imediato em `\includegraphics` (capa, figuras e ícones CC).
- `booktabs`: ausente → erro na tabela comparativa (`StateOfTheArt.tex`).

## 3) Estrutura e includes

- [ ] Corrigir `\input{chapters/ConclusionsAndFutureWork}`: no repositório existe `chapters/ConclusionsAndFutureWork.tex.tex`. Renomear para `ConclusionsAndFutureWork.tex` OU ajustar o `\input`.
- [ ] Alinhar títulos/conteúdo dos capítulos com os ficheiros `\input{}`:
  - `chapters/ProblemAndChallenges.tex` contém “Discussion”.
  - `chapters/Contribution.tex` contém “Methodology”.
  - `chapters/Applications.tex` contém “Expected Results and Evaluation Plan”.
  - `chapters/PlannedSchedule.tex` contém “Work Plan”.

Sugestão: manter a liberdade do template mas garantir consistência entre nome incluído, título do capítulo e posição narrativa (Parte I e Parte II).

## 4) Figuras e ativos

- [ ] Confirmar existência de todas as imagens referenciadas (OK neste repositório):
  - `images/generated/*.png` (presentes)
  - Logótipos: `images/logos/UM.jpg`, `images/logos/EE.jpg` (presentes)
  - Ícones CC: `images/CCBY*.png` (presentes)
- [ ] Após adicionar `graphicx`, as chamadas `\includegraphics` deixam de falhar.

## 5) Bibliografia

- [ ] `natbib` presente; estilo `plainnat` definido (OK).
- [ ] Chaves citadas existem no `dissertation.bib` (amostra verificada: `kohn2000`, `who2017`, `who2022`, `berwick2008`, `kazemi2016`, `ash2004`, `keasberry2017`, `moss2015`, `bowles2020`, `belle2013`, `mandl2020`, `european2016`, `newman2021`, `Ghobadi2022`, ...).
- [ ] Garantir execução de `bibtex` na pipeline.

## 6) Glossário, acrónimos e índice

- [ ] `\makeglossaries` e `\printglossary` (acronym e geral) ativos; sem entradas → secções vazias. Decidir: manter, adicionar entradas mínimas ou comentar temporariamente.
- [ ] Índice (`imakeidx`/`\printindex`) ativo; sem `\index{}` → índice vazio (aceitável).

## 7) Capa, folha de rosto e metadados

- [ ] `\logo{EE}{School of Engineering}{}` e `\logoB{EE}{...}` selecionados (OK conforme o template).
- [ ] Fonte NewsGotT (`*.ttf`) incluída no repositório (OK). XeLaTeX necessário para TTF.
- [ ] `\author`, `\titleA/B/C`, `\masters`, `\supervisor`, `\cosupervisor` definidos (OK).

## 8) Direitos de autor (preamble/Copyright)

- [ ] Escolher UMA licença Creative Commons e remover as restantes. Atualmente todas as variantes estão ativas (BY, BY-SA, BY-ND, BY-NC, BY-NC-SA, BY-NC-ND).

## 9) Idioma e nomenclatura

- [ ] `babel` com `[portuguese, english]`. Se PT for principal, considerar `\selectlanguage{portuguese}` no início.
- [ ] `\renewcommand*{\listtablename}{List of Tables}` está em EN; se a dissertação for PT, usar “Lista de Tabelas”.

## 10) Ajustes de formatação/estilo (não bloqueantes)

- [ ] `\setlength{\parindent}{0em}` no início e depois `1.5em` mais tarde — manter uma única definição após `\newgeometry`.
- [ ] Remover pacotes não usados para reduzir warnings (ex.: `epigraph`, `wrapfig` se não forem necessários).

---

## Plano de ação (prioridade)

1) Adicionar `graphicx` e `booktabs` ao `dissertation.sty` (bloqueantes).
2) Corrigir o nome do ficheiro `chapters/ConclusionsAndFutureWork.tex.tex` para `.tex` (bloqueante).
3) (Recomendado) Remover `inputenc` e duplicado de `datetime` do `dissertation.sty`.
4) Harmonizar títulos/ordem dos capítulos com os `\input{}`.
5) Escolher a licença CC e remover as restantes.
6) Confirmar idioma principal e nomenclatura das listas (PT/EN).
7) Validar pipeline completa (XeLaTeX → BibTeX → MakeIndex → MakeGlossaries → XeLaTeX) sem erros.
