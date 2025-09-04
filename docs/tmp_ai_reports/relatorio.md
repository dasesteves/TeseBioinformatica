# Relatório Técnico-Científico de Apoio à Dissertação

## Introdução

Este relatório de apoio tem como objetivo analisar e ampliar o conteúdo
técnico-científico da dissertação **"Optimization and Standardization of
Medication Management Processes in Hospital Environments"** de Diogo
André da Silva Esteves. Baseia-se na análise prévia realizada (documento
**"Análise Técnica e Científica da Dissertação"**) e considera agora os
artefactos de software desenvolvidos no âmbito do projeto, disponíveis
em repositórios GitHub. Pretende-se avaliar o conteúdo técnico de cada
repositório, identificar o papel de cada um no contexto da dissertação,
e propor melhorias concretas para incorporar os resultados práticos na
tese -- **visando uma versão final mais extensa (\>100 páginas),
coerente e robusta cientificamente**. O documento está estruturado em
tópicos com recomendações orientadas para ação, servindo de guia para
reforçar a dissertação em termos de detalhe técnico e profundidade
científica.

## Análise dos Repositórios do Projeto

Nesta secção apresentam-se os principais repositórios GitHub associados
ao projeto da dissertação, descrevendo o conteúdo técnico de cada um
(estrutura, código, documentação) e o seu propósito. Em seguida,
discute-se a relevância de cada artefacto no contexto dos objetivos da
tese.

### **Registo de Tratamentos** -- *Artefacto Proposto*

Este repositório corresponde ao **sistema central (protótipo)**
desenvolvido na dissertação, destinado a unificar os processos de gestão
da medicação no hospital SCMVV. Pelo contexto da tese, trata-se de uma
aplicação web com arquitetura moderna (backend em Node.js/Express e
frontend em TypeScript/React) suportando uma abordagem de
microsserviços[\[1\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=nol%C3%B3gico%20%E2%80%94%20um%20sistema%20web,Type).
Embora o repositório *registo-tratamentos* em si não tenha um README
público detalhado, informações cruzadas indicam que este é o **principal
artefacto** que materializa a solução proposta. De acordo com o resumo
da dissertação, o sistema proposto é um *web-based system* com
*microservices architecture (Node.js)* e um frontend React, concebido
para integração com os sistemas
existentes[\[1\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=nol%C3%B3gico%20%E2%80%94%20um%20sistema%20web,Type).

Do ponto de vista técnico, espera-se que o repositório contenha módulos
de backend para **APIs REST** (orquestrando funcionalidades como
prescrição, validação farmacêutica, administração de medicamentos) e um
frontend unificado para os diferentes perfis de utilizador (médicos,
farmacêuticos, enfermeiros). Provavelmente inclui mecanismos de
autenticação (e.g., JWT tokens) e integração com base de dados Oracle do
hospital. De facto, o repositório da modernização do AIDA-PCE refere
explicitamente a necessidade de compatibilidade total com a aplicação
*registo-tratamentos*[\[2\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L5),
incluindo a partilha da chave JWT para
autenticação[\[3\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L10),
o que confirma que o artefacto principal utiliza **JWT e um esquema de
autenticação unificado** entre módulos (legado e novo).

Espera-se ainda que a estrutura de *registo-tratamentos* siga boas
práticas de desenvolvimento: possivelmente um diretório `app/` (à
semelhança do módulo AIDA modernizado) com sub-diretórios para APIs
(`app/api/`), interfaces (`app/*`), integração de BD (`db/`), etc. O
repositório poderá não conter um README descritivo, mas inferindo do
contexto, o **papel deste artefacto é central**: é a plataforma onde os
fluxos hoje dispersos serão padronizados e otimizados, concretizando o
objetivo principal da dissertação de **unificar workflows
clínico-farmacêuticos num único sistema
moderno**[\[4\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=de%20software%20centralizada,farmac%C3%AAuticos%2C%20atualmente)[\[5\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=um%20artefacto%20tec).

**Tecnologias e implementação:** O artefacto adota tecnologias atuais
adequadas a um ambiente hospitalar crítico. O uso de Node.js no backend
garante escalabilidade e integração com sistemas legados, enquanto o
frontend em React/Next.js proporciona uma UI responsiva e coesa. É
provável que o *registo-tratamentos* comunique diretamente com a base de
dados Oracle do AIDA-PCE (ou via serviços) para ler/escrever dados
clínicos -- isto é sugerido pela ênfase em manter *conexão direta com
Oracle* no projeto de
modernização[\[6\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L5-L10).
Assim, este artefacto serve também de **"ponte" entre o novo e o
legado**, operando possivelmente com *camadas anti-corrupção* para
isolar a lógica nova dos sistemas
antigos[\[7\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=match%20at%20L2065%20ticularly%20AIDA,developed%2C%20acting%20as%20an%20anti).

**Estrutura e commits:** Uma análise dos commits sugere que parte do
código foi inserida via *upload* (indicando possivelmente um grande
*commit* inicial "Add files via upload"). Isto pode dificultar rastrear
pequenas mudanças; recomenda-se documentar as principais decisões de
design e componentes do sistema no texto da tese, dado que o repositório
por si pode não evidenciar isso em histórico detalhado. Em suma, o
*registo-tratamentos* é o **produto de software** resultante -- o
protótipo que demonstra a viabilidade da solução proposta -- e deve ser
amplamente descrito e avaliado na dissertação.

### **Psicofármacos** -- *Análise de Movimentos de Psicotrópicos*

O repositório `psicofarmacos` contém um conjunto de scripts e dados para
**extrair e analisar movimentos de medicamentos psicotrópicos** a partir
de uma API do sistema
hospitalar[\[8\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L1-L9).
Este projeto auxilia na caracterização do problema atual, focando num
caso particular: os medicamentos psicotrópicos, que tipicamente requerem
controle apertado devido ao potencial de abuso.

**Conteúdo técnico:** O repositório apresenta múltiplos scripts Python
organizados por funcionalidade -- desde a extração de dados brutos,
filtragem e agrupamento, até geração de relatórios (Excel) e análise
exploratória[\[9\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L12-L24)[\[10\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L92-L101).
Há também ficheiros CSV com listas de fármacos (e.g., antidemência,
psicotrópicos sinalizados) e exemplos de resposta da API. O README
detalha o fluxo de trabalho: primeiro testar a conexão (script
`testar_api.py`), depois obter os movimentos via API
(`obter_movimentos_psicotropicos.py`), filtrar dados irrelevantes,
agregar por medicamento e data, e finalmente gerar relatórios Excel por
medicamento e por
dia[\[11\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L56-L65)[\[12\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L98-L106).
Esse pipeline sugere uma preocupação em **tratar dados reais** do
hospital para compreender padrões de consumo/dispensa de psicotrópicos.

Um aspeto importante é a especificação da **API SCMVV** utilizada: o
endpoint base é `http://10.21.105.31/SCMVV/api/Listas/Lista`, com
parâmetros JSON indicando a *view* de interesse
(`"Vista": "ListaMovimentosArtigoSCMVV"`) e condições de filtro por
código de
artigo[\[13\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L131-L140).
Ou seja, os scripts conectam-se diretamente ao sistema legado
(provavelmente o AIDA-PCE ou sistema relacionado) para extrair todos os
registos de movimentos de stock de medicamentos (entradas/saídas)
marcados como psicotrópicos (`FLAG_PSICO = 1`). Esta capacidade de
extrair *dados do mundo real* é fundamental para quantificar a magnitude
dos problemas atuais: p.ex., quantos registos de movimentação existem
num dado período, quão dispersos estão os dados, e identificar possíveis
*inconsistências* ou ineficiências no processo manual/atual.

**Papel na dissertação:** Este artefacto funciona como **ferramenta de
análise do contexto atual**. A dissertação pode tirar partido destes
resultados para enriquecer a secção de contexto e motivação: por
exemplo, mencionar quantos movimentos mensais de psicotrópicos são
registados, a complexidade de os acompanhar manualmente, ou eventuais
atrasos e erros identificados. No relatório anterior foi notado que
faltava uma descrição prática do panorama atual no
SCMVV[\[14\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Descri%C3%A7%C3%A3o%20insuficiente%20do%20contexto%20atual,N%C3%A3o%20se%20exp%C3%B5e);
os dados obtidos aqui permitem preencher essa lacuna com **evidências
empíricas**. Por exemplo, se a análise revelar centenas de movimentações
mensais e que atualmente não há integração adequada (exigindo duplicação
de registos em papel ou sistemas distintos), isso reforça claramente a
necessidade da solução proposta.

Tecnicamente, o repositório psicofarmacos demonstra também experiência
em lidar com **interoperabilidade**: uso de APIs para obter dados de um
sistema legado, processamento local e geração de relatórios. Estes
passos metodológicos devem ser mencionados na tese, pois mostram
competências de *data analysis* aplicadas ao caso clínico e fundamentam
decisões de design (e.g., que dados integrar no novo sistema). Ainda que
os resultados detalhados desta análise não constem na versão atual da
dissertação (não se encontraram referências explícitas a "psicotrópicos"
no texto), recomenda-se fortemente incluí-los para dar peso quantitativo
à discussão do problema.

Em resumo, o repositório *psicofarmacos* é um artefacto auxiliar que
**quantifica e caracteriza parte do problema atual** -- a gestão de
medicamentos controlados -- e os seus resultados devem ser integrados no
capítulo de *Problemática/Contexto Atual* da dissertação, bem como
possivelmente na *Avaliação de Resultados*, caso alguma métrica
relacionada com psicotrópicos seja usada para validar melhorias (por
ex., redução de etapas manuais no novo sistema).

### **AIDA-PCE (Legado) e Módulo Modernizado** -- *Repositório aida_pce*

Este repositório é dividido em duas partes principais: - O diretório
`aida_pce/` com código da aplicação legada (módulo de
Prescrição/Dispensa) originalmente em tecnologia ASP.NET Web Forms
(ficheiros `.aspx` e code-behind VB.NET). - O diretório
`aida_pce_REACT/` que contém a **versão modernizada do módulo de
farmácia (PRF)** reimplementada numa stack atual (Next.js com
React/TypeScript, integrando com Oracle
DB)[\[15\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L1-L9).

**Conteúdo técnico e estrutura:** A presença de ficheiros como
`logon.aspx.vb`, `mapap.aspx`, etc., indica que se obteve acesso ao
código-fonte do sistema legado AIDA-PCE. Esse sistema, descrito na
dissertação como **monolítico e com várias limitações** (UI pouco
intuitiva, ausência de suporte à decisão em tempo real,
etc.[\[16\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=%28AIDA,interface%2C%20a%20lack%20of%20real)),
serve de ponto de partida para o projeto. A tese menciona AIDA-PCE como
o sistema utilizado no SCMVV para partes do ciclo do medicamento, logo
compreender a sua arquitetura era crucial. O repositório disponibiliza
essa *visão interna*, mostrando formulários e funcionalidades
existentes. Contudo, como sistema antigo, é difícil de manter e não
satisfaz os requisitos modernos de usabilidade e integração.

Para colmatar essas falhas, o sub-projecto *AIDA PCE Modern - PRF*
reimplementa o módulo de farmácia usando **Next.js/React** para o
frontend e comunica diretamente com a base de dados Oracle
existente[\[17\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L10).
O README especifica objetivos claros: *"Reimplementar o módulo PRF com
stack moderno"* e *"Garantir compatibilidade total com a aplicação
existente
registo-tratamentos"*[\[2\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L5).
Isto indica que o novo módulo foi desenvolvido **pensando na sua
integração com o artefacto principal** da dissertação. De facto, vários
pontos da documentação instruem como integrar o módulo React no sistema
unificado: por exemplo, usar a mesma `JWT_SECRET` no
*registo-tratamentos* para autenticacão
unificada[\[3\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L10)
e assegurar que as rotas públicas e formato de token coincidem.
Adicionalmente, são propostas duas estratégias de integração: - **Opção
1: Submódulo** -- copiar diretamente os componentes do módulo farmácia
(`app/farmacia`, `types/farmacia.ts`, etc.) para dentro do projeto
*registo-tratamentos*, adaptando a pool de conexão Oracle conforme
necessário[\[18\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L5). -
**Opção 2: Micro-frontend** -- executar o módulo *aida_pce_modern* como
aplicação independente, mas configurando navegação e partilha de
autenticação (cookies JWT) entre as duas
aplicações[\[19\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L105-L111).

Estas orientações deixam claro que a intenção é **integrar
funcionalmente o legado modernizado no novo sistema**. Na prática, isto
significa que o *registo-tratamentos* poderá incorporar a funcionalidade
de gestão de stocks e movimentos de farmácia reimplementada, evitando
que o utilizador tenha de recorrer à interface antiga do AIDA-PCE. Além
disso, o repositório define as **estruturas de dados necessárias** no
Oracle (tabelas prf_artigos, prf_stock, prf_movimentos) para suportar
este
módulo[\[20\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L113-L122)[\[21\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L134-L143)
-- informação valiosa que pode ser usada na dissertação ao descrever a
modelação da base de dados e migração de dados do sistema legado.

Importa referir que este componente modernizado foi desenvolvido com
boas práticas: inclui **testes unitários e de integração** que cobrem as
APIs do módulo e componentes
React[\[22\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L6).
Isto demonstra rigor técnico e deve ser mencionado na tese para
evidenciar a robustez da implementação (ex.: garantir que a nova solução
foi validada quanto a funcionalidade e desempenho esperado).

**Papel no contexto da tese:** O repositório *aida_pce* fornece um elo
crítico com o **sistema existente no hospital**. A dissertação carecia
inicialmente de uma descrição da arquitetura
legada[\[23\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Arquitetura%20atual%20dos%20sistemas%20pouco,ex);
com este código em mãos, pode agora detalhar como o AIDA-PCE funcionava
(tecnologias antiquadas, ausência de APIs modernas, integração limitada
com outros módulos como SONHO ou PEM). Isso deve ser explorado no
capítulo de *Contexto Atual*, possivelmente incluindo um **diagrama da
arquitetura atual** do SCMVV: mostrando o AIDA-PCE e outros sistemas
legados, e destacando pontos de falha (por ex., ausência de
interoperabilidade, duplicação de introdução de dados). Em seguida, no
capítulo de *Solução Proposta*, a tese deve explicar a estratégia de
modernização: ao invés de substituir todo o AIDA de uma vez, optou-se
por **modernizar por módulos**, começando pelo módulo de farmácia (PRF),
integrando-o ao novo sistema. Esta abordagem é condizente com princípios
de *anti-corruption layer* e garante uma transição suave -- um
contributo importante a salientar.

Concretamente, deve-se descrever na dissertação como o novo módulo PRF
opera dentro da solução: por exemplo, um **caso de uso** em que um
farmacêutico regista uma entrada/saída de stock através da interface
unificada (registo-tratamentos), a qual internamente invoca as funções
do módulo PRF modernizado (seja via chamada interna ou
redirecionamento), atualizando a BD Oracle e refletindo no stock em
tempo real -- algo impossibilitado no sistema antigo devido à
fragmentação.

Resumindo, o *aida_pce repo* traz para a dissertação: - **Detalhes do
legado** (essenciais para fundamentar a necessidade do projeto), - **Uma
prova de conceito de integração/modernização** (que pode ser discutida
nos resultados, mostrando que tecnicamente é viável integrar-se com o
legado sem interromper serviços), - **Demonstração de qualidade de
engenharia** (uso de tecnologias modernas, testes, segurança JWT, etc.).
Este artefacto deve ser explorado a fundo no texto, alinhando-o com
objetivos de interoperabilidade e melhoria de segurança do doente.

### **Pré-Tese** -- *Repositório pre-tese (Documentação)*

Este repositório contém a estrutura LaTeX utilizada para a pré-tese do
mestrado[\[24\]](https://github.com/dasesteves/pre-tese/blob/5e2d3ddc49c71af4b5f902db3d5d23e9fdb51969/README.md#L14-L22).
Em essência, trata-se de um *template* organizado em capítulos
(Introdução, Estado da Arte, Plano de Trabalho, Metodologia, Resultados,
Discussão, Conclusão) e material pré-textual (resumo, índice, etc.), de
acordo com as normas da Universidade do Minho. Não há código-fonte de
software aqui, mas sim o histórico da escrita inicial da dissertação.

**Conteúdo e utilidade:** A pré-tese, entregue anteriormente, delineou o
plano e capítulos esperados, servindo de guia para o desenvolvimento do
trabalho. Por exemplo, vemos que capítulos de *Resultados* e *Discussão*
estavam inicialmente previstos mas possivelmente ficaram por preencher
na
altura[\[25\]](https://github.com/dasesteves/pre-tese/blob/5e2d3ddc49c71af4b5f902db3d5d23e9fdb51969/README.md#L132-L140).
Este repositório confirma a **estrutura lógica** que a dissertação deve
seguir e que foi usada até agora. Serve, assim, como referência para
verificar se todos os tópicos planeados foram de facto abordados na
versão final.

Notou-se, na análise anterior, algumas inconsistências de estrutura e
nomenclatura de capítulos. É importante agora garantir coerência:
alinhar os títulos e sequência dos capítulos da versão final com o
proposto na pré-tese (por ex., se *Problem and Challenges* virou um
capítulo próprio, ou se *Estado da Arte* inclui subsecções novas, etc.).
O repositório *pre-tese* também inclui possivelmente um ficheiro `.bib`
com as referências bibliográficas, o que pode ser útil para expandir a
revisão de literatura -- inclusive adicionando novas fontes (2021-2024)
conforme
recomendado[\[26\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Atualizar%20e%20ampliar%20a%20revis%C3%A3o,%E2%80%93%20e%20quaisquer%20outras%20%C3%A1reas).

**Papel no contexto:** Embora não contribua com conteúdo técnico
adicional, o *pre-tese* repo é relevante para assegurar que nada foi
negligenciado. Pode-se utilizá-lo como **checklist**: por exemplo,
garantir que o capítulo de *Resultados* na versão final não permaneça
hipotético ou vazio -- deve incorporar resultados práticos (mesmo que
preliminares) dos artefactos desenvolvidos, conforme discutido neste
relatório. Além disso, a pré-tese tinha um *Plano de Trabalho* com
prazos e um *Gantt*; na versão final, pode ser interessante refletir
sobre desvios ou confirmações daquele plano (por ex., mencionar se todas
as tarefas planeadas foram concluídas, ou justificar mudanças de
escopo). Isso adiciona maturidade e transparência metodológica ao
documento.

Em suma, o repositório *pre-tese* não requer descrição na dissertação em
si, mas a *tese final deve refletir a estrutura completa* que ali estava
delineada, agora enriquecida com os desenvolvimentos efetivos e
resultados obtidos.

### **Outros Repositórios (e.g., "projeto")**

O utilizador forneceu também um repositório nomeado genericamente
`projeto`. Após análise, conclui-se que este repositório **não está
relacionado** com a temática da gestão de medicação hospitalar -- na
verdade, trata-se de um projeto anterior do mestrado em Bioinformática
sobre transcriptómica de células pigmentares em
**zebrafish**[\[27\]](https://github.com/dasesteves/projeto/blob/0daf545bab94bf83904056c60d8c7c1bbb978376/README.md#L2-L10).
O conteúdo (scripts R, análises de expressão génica, etc.) pertence a um
contexto científico distinto e não oferece contributo direto para a
dissertação atual.

Portanto, no âmbito das melhorias da tese de medicação, o repositório
*projeto* pode ser ignorado. É importante apenas garantir que não haja
confusão nem inclusão inadvertida de conteúdo desse projeto na
dissertação de gestão de medicação. Se, por acaso, alguma metodologia de
análise de dados ou visualização daquele projeto foi inspiração para o
atual (por ex., uso de R ou Python para análise), tal poderia ser
mencionado como enriquecimento de competências, mas não é essencial.

Resumindo, focaremos nos quatro repositórios chave mencionados acima
(registo-tratamentos, psicofarmacos, aida_pce, pre-tese), que de facto
se relacionam com o desenvolvimento e documentação da solução proposta
na dissertação.

## Relação dos Artefactos com as Secções e Objetivos da Dissertação

Tendo avaliado cada repositório, importa agora mapear **como estes
artefactos se conectam aos capítulos e objetivos definidos na tese**. A
dissertação possui várias secções -- **Introdução/Contexto, Estado da
Arte, Metodologia, Implementação/Solução Proposta, Resultados,
Discussão, Conclusões** -- e cada artefacto pode enriquecer uma ou mais
destas partes. A seguir, delineia-se essa relação:

- **Contexto Atual e Definição do Problema:** Os artefactos
  *psicofarmacos* e partes do repositório *aida_pce* são particularmente
  relevantes aqui. Conforme identificado na análise prévia, faltava na
  versão original uma descrição robusta do *status quo* no hospital
  SCMVV (sistemas existentes, fluxos de trabalho atuais, problemas
  concretos)[\[14\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Descri%C3%A7%C3%A3o%20insuficiente%20do%20contexto%20atual,N%C3%A3o%20se%20exp%C3%B5e).
  Agora, com os dados da análise de psicotrópicos, pode-se quantificar
  problemas: por exemplo, **volume de registos manuais e dispersos** que
  a farmácia do hospital lida, potenciais **riscos à segurança do
  doente** (erros de medicação não detetados devido à falta de suporte
  computacional), etc. Igualmente, a disponibilidade do código do
  AIDA-PCE permite detalhar **como o processo funciona hoje**: pode-se
  descrever que o médico prescreve no sistema AIDA-PCE (ou no SONHO,
  dependendo do fluxo), o farmacêutico valida noutra interface, e os
  enfermeiros administram talvez registando noutro local -- evidenciando
  a *fragmentação* com base real. Incluir um **diagrama de arquitetura
  atual** ilustrando AIDA-PCE e outros sistemas legados (ex.: SClínico,
  PEM, SONHO) e onde ocorrem quebras de integração seria
  valioso[\[23\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Arquitetura%20atual%20dos%20sistemas%20pouco,ex).
  Também convém referir quaisquer achados das entrevistas com
  stakeholders (mencionadas na tese
  atual[\[28\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=elicitation%20and%20a%20deep%20analysis,structured))
  em conjunto com evidências objetivas (dados). Assim, o *psicofarmacos*
  fornece dados concretos de movimentos de medicamentos, e o *aida_pce
  (legado)* fornece detalhes técnicos -- ambos alimentam uma **secção de
  Contexto/Problema** muito mais rica e fundamentada do que antes.

- **Estado da Arte:** Embora os repositórios em si não sejam fontes
  bibliográficas, eles sinalizam tópicos tecnológicos que devem aparecer
  na revisão. Por exemplo, o fato do artefacto usar **JWT,
  microsserviços, React, Oracle** sugere incluir referências sobre *web
  security (JWT usage in healthcare)*, *arquiteturas de microsserviços
  em saúde*, *sistemas de registo de medicação de última geração*, etc.
  O estado da arte já abordava ePrescription, CDSS, IA, blockchain,
  FHIR, etc., mas a análise apontou que poderiam ser explorados tópicos
  como sistemas de administração de medicamentos no ponto de cuidado
  (eMAR), códigos de barras, Lean Six Sigma para processos, e a
  realidade portuguesa (SNS,
  SPMS)[\[29\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=HL7%2FFHIR%2C%20etc,n%C3%A3o%20s%C3%A3o%20mencionados)[\[30\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=apesar%20de%20serem%20parte%20integrante,exemplo%2C%20%20poderia%20%20referir).
  A existência do módulo PRF modernizado no repositório mostra a
  preocupação com **interoperabilidade** e **modernização incremental**,
  o que está alinhado com iniciativas de sistemas abertos. Deve-se
  relacionar isso na revisão: citar, por exemplo, casos de hospitais que
  modernizaram sistemas legados gradualmente, ou soluções de mercado que
  integram vários módulos (Epic, Cerner vs. soluções caseiras -- a
  própria tese já faz uma
  comparação[\[31\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=match%20at%20L981%20Feature%20AIDA,Epic%20Cerner%20Our%20System)).
  Em suma, os artefactos reforçam a necessidade de abordar literaturas
  sobre *integração de sistemas hospitalares* e *segurança do doente
  associada a TI*. Qualquer tecnologia usada (React, Node.js, Oracle)
  deve ser brevemente justificada com referências: p.ex., Node.js em
  saúde porquê? -- possivelmente pela sua escalabilidade e por permitir
  implementar microsserviços de forma
  eficiente[\[32\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=such%20as%20Java%20and%20Node).
  Assim, os artefactos guiam a complementação do Estado da Arte para
  torná-lo **mais atualizado e diretamente relacionado às escolhas do
  projeto**.

- **Metodologia (Design Science Research) e Desenvolvimento:** A
  metodologia DSR seguida deve ser mantida, mas agora pode ser
  complementada com **detalhes da implementação** obtidos dos
  repositórios. Por exemplo, pode-se explicar que se seguiu uma
  metodologia iterativa de prototipagem, começando por analisar o legado
  (scripts psicofarmacos, leitura do código AIDA), definindo requisitos,
  e então desenvolvendo o artefacto principal e o módulo modernizado.
  Aqui, descreve-se também a **arquitetura da solução proposta**: é
  fundamental incluir um **diagrama da arquitetura do novo sistema**
  (*target architecture*), mostrando os microsserviços e módulos do
  *registo-tratamentos*, e as integrações -- incluindo o módulo PRF
  (farmácia) reimplementado e eventuais conexões com outros sistemas via
  API/DB. A partir do repositório principal e do aida_pce, conseguimos
  inferir componentes a destacar no diagrama:

- Frontend unificado (React) acessível via browser para todos os perfis.

- Backend Node.js com serviços: Prescrição, Validação, Administração,
  Farmácia (PRF).

- Módulo PRF comunica com Base de Dados Oracle legada (utilizando pool
  de conexão Oracle
  fornecida[\[33\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L40-L48)).

- Potencial camada de integração (middleware ou API Gateway) que
  interliga com outros sistemas (ex.: talvez exportar dados para SONHO
  ou reportar ao PEM nacional se aplicável).

- Autenticação centralizada por JWT (um único login para acessar todas
  as funções, token partilhado entre
  microsserviços)[\[3\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L10).

- Base de Dados local (talvez uma nova base para dados unificados) e
  Base de Dados legada (Oracle) coexistindo.

Descrever esta arquitetura em texto e figura preencherá uma lacuna
apontada pela análise
inicial[\[23\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Arquitetura%20atual%20dos%20sistemas%20pouco,ex),
tornando claro **como a solução se estrutura tecnicamente**. Além disso,
incorporar no texto escolhas de design justificadas: ex., "Optou-se por
Next.js/React no frontend pela necessidade de uma interface web
responsiva e dinâmica; Node.js no backend devido à familiaridade com
microsserviços e integração fácil com Oracle via módulos
oracledb[\[34\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L13-L21);
JWT para autenticação unificada entre
módulos[\[3\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L10),
garantindo segurança e single sign-on." Tais justificativas ligam a
implementação à teoria (segurança, desempenho, UX, etc.).

A metodologia deve também salientar aspectos de *qualidade de software*:
os repositórios evidenciam testes automáticos no módulo
farmácia[\[22\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L6),
o que é excelente -- na tese, documentar que foram implementados testes
unitários/integrados para garantir a corretude das principais
funcionalidades (ex.: verificar cálculos de stock, autenticação, etc.)
demonstra robustez científica e engenharia sólida. Também valeria
mencionar gestão de projeto e controlo de versão: ainda que os commits
não estejam totalmente granularizados, o uso de GitHub em múltiplos
repositórios já sugere uma abordagem organizada. Se foram usadas
*branches* ou *issues*, pode-se referir a prática de *version control* e
*issue tracking* para resolução de problemas.

- **Resultados e Avaliação:** Esta parte foi identificada como um ponto
  fraco na versão atual -- escrita de forma muito prospectiva e sem
  dados
  empíricos[\[35\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Resultados%20pr%C3%A1ticos%20inexistentes%20ou%20apenas,melhorias%20de%20efici%C3%AAncia%2C%20mas%20esses).
  Com os artefactos desenvolvidos, é possível melhorar
  significativamente. Devem-se incorporar **resultados práticos**, mesmo
  que preliminares:
- **Demonstração do Sistema:** Apresentar *screenshots* ou descrições de
  cenários de utilização do artefacto *registo-tratamentos*. Por
  exemplo, ilustrar o ecrã de prescrição unificada, o ecrã do módulo
  farmácia (PRF) modernizado exibindo stock ou permitindo registar um
  movimento
  (entrada/saída)[\[36\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L76-L84).
  Se disponível, incluir uma figura do protótipo em funcionamento torna
  o resultado concreto para o leitor.
- **Métricas de Desempenho/Validação:** Caso tenha sido possível
  realizar algum teste com utilizadores ou dados simulados, incluir
  métricas. Se não houve implementação piloto no hospital, pode-se ainda
  assim medir, por exemplo, o tempo de resposta médio das novas APIs
  (vs. do sistema antigo), ou a cobertura de testes atingida (dado que
  há testes, reportar que X% das funções críticas foram testadas
  automaticamente). Poderia também apresentar resultados da análise de
  psicotrópicos como *baseline* e depois simular como o novo sistema
  reduziria certos passos -- por ex., antes era necessário extrair dados
  manualmente para Excel (como feito no psicofarmacos), enquanto com o
  novo sistema esses relatórios são automáticos e disponíveis em tempo
  real. O relatório anterior menciona reduções de erros de medicação
  esperadas (73% prescrições, 85%
  validações)[\[37\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=emp%C3%ADricos%20%20recolhidos,ia);
  seria ideal contextualizar esses números -- se não há piloto,
  justificar que vêm da literatura ou de estimativas baseadas em
  entrevistas, mas agora complementando com **demonstração qualitativa**
  de que o sistema de facto endereça as causas raiz dos erros (p.ex.,
  alerta de interação medicamentosa implementado reduz erros de
  prescrição).
- **Avaliação por Stakeholders:** Se possível, incorporar feedback dos
  utilizadores finais. As entrevistas a 15 profissionais
  mencionadas[\[28\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=elicitation%20and%20a%20deep%20analysis,structured)podem
  ser retomadas aqui: por exemplo, citar que após verem o protótipo, X%
  consideraram-no mais intuitivo que o sistema atual, ou listar
  qualitativamente as melhorias percebidas (e.g., "farmacêuticos
  destacaram a rapidez na consulta de stock no novo módulo vs. AIDA-PCE
  antigo"). Isso adiciona evidência qualitativa ao capítulo de
  discussão.
- **Análise Económica (ROI):** A análise inicial notou ausência de
  detalhes de
  custo-benefício[\[38\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=An%C3%A1lise%20%20de%20%20custo,%E2%80%93%20%C3%A9%20outra%20%C3%A1rea%20subexplorada).
  Ainda que detalhar ROI precise de dados, pode-se agora pelo menos
  estimar: com base nos artefactos sabe-se quais processos serão
  automatizados. Por exemplo, se **obter um relatório de movimentos**
  antes exigia horas de trabalho a extrair e consolidar (como visto no
  psicofarmacos), quantificar esse tempo e projetar a poupança anual ao
  ter relatórios automáticos. Ou se o novo sistema evitará a aquisição
  de um módulo comercial, estimar esse benefício. Além disso,
  referenciar custos de desenvolvimento (foram X meses de trabalho) e
  manutenção (tecnologia open-source, etc.) versus custos de erro de
  medicação evitados (há estudos que quantificam custo de ADE --
  *adverse drug events*). Incluir pelo menos um parágrafo ou tabela
  hipotética de ROI irá fortalecer muito a relevância prática.

Em resumo, os *Resultados* devem deixar de ser apenas expectativas e
passar a incluir **provas de conceito e dados** -- as ferramentas
desenvolvidas fornecem matéria-prima para isso.

- **Discussão:** Com os resultados práticos em mãos, a Discussão pode
  ganhar substância. Aqui relaciona-se o que foi obtido com os objetivos
  iniciais e literatura. Por exemplo, discutir **dificuldades
  encontradas no desenvolvimento** (ex.: integrar com sistema legado foi
  desafiante por falta de documentação -- aprendemos que modernizar um
  sistema monolítico exige engenharia inversa, como a feita no módulo
  PRF; ou a extração de dados mostrou dados de má qualidade, indicando
  necessidade de limpeza ao migrar). Discutir também **limitações do
  protótipo** -- e sugerir melhorias futuras -- é importante: por ex.,
  talvez o artefacto ainda não implementa todos os módulos (só farmácia
  e prescrição, mas não dispensa direta ou administração via código de
  barras), ou não foi possível integrar com o sistema nacional de
  prescrição (PEM) neste projeto piloto. Essas limitações, se
  reconhecidas abertamente, mostram rigor. Igualmente, comentar
  **ameaças à validade**: p. ex., os testes foram em ambiente controlado
  e pode haver resistência dos utilizadores para adotar a nova interface
  -- implicando trabalho de gestão da mudança. A discussão deve abarcar
  os **impactos organizacionais e sociotécnicos**: com a unificação dos
  sistemas, como se reconfigura o fluxo de trabalho dos profissionais?
  Há necessidade de formação? Isto conecta também com a recomendação de
  abordar *gestão da mudança* que foi
  feita[\[39\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Incluir%20novos%20t%C3%B3picos%20relevantes%3A%20Incorporar,facetada%20e%20completa).
  Os artefactos demonstram que a tecnologia é viável; a Discussão deve
  então elevar o discurso para *como garantir que essa tecnologia será
  efetivamente implementada e trará benefícios*, e que lições se tiram
  para outros hospitais (o objetivo era ser referência para outros
  contextos
  semelhantes[\[40\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=enfermeiros%20e%20farmac%C3%AAuticos)).

- **Conclusão e Trabalho Futuro:** Por fim, os artefactos suportam
  conclusões mais enfáticas. Pode-se concluir que **foi desenvolvido um
  protótipo funcional** que resolve grande parte das lacunas
  identificadas no SCMVV (listar resumidamente: integração de X módulos,
  eliminação de Y tarefas redundantes, potencial redução de Z% erros). E
  no futuro, planear estender o artefacto: por exemplo, incluir módulos
  adicionais do AIDA (convertendo outros módulos para a plataforma
  moderna, dado sucesso com PRF), integração com sistemas nacionais
  (e.g., Prescrição Eletrónica Médica -- PEM, ou futura integração via
  HL7/FHIR), e talvez incorporar inteligência artificial para apoio à
  decisão clínica no futuro (como mencionado no estado da arte). Os
  repositórios fornecem base para esse futuro -- o código pode ser
  evoluído modularmente. Também se pode recomendar que o hospital
  considere um **piloto formal** pós-dissertação para recolher dados
  quantitativos de desempenho e usabilidade -- algo que infelizmente não
  coube no tempo da tese, mas que seria o passo lógico seguinte.

Em síntese, cada secção da dissertação pode -- e deve -- ser enriquecida
pelos desenvolvimentos práticos realizados. O quadro a seguir resume a
correspondência entre repositórios/artefactos e secções da tese:

- *Contexto Atual:* Dados da análise psicofarmacos; detalhes do legado
  AIDA-PCE (fluxos atuais).
- *Estado da Arte:* Tecnologias usadas nos artefactos (JWT,
  microsserviços, React) e temas correlatos (interoperabilidade, eMAR,
  etc.).
- *Metodologia:* Uso de DSR ilustrado com etapas práticas (análise de
  dados, prototipagem de software); referências a controlo de versões e
  testes (CI/CD se usado).
- *Implementação/Solução:* Descrição detalhada do artefacto
  *registo-tratamentos* e integração do módulo farmácia (aida_pce_REACT)
  -- arquitetura, componentes, tecnologias.
- *Resultados:* Apresentação do protótipo em ação; dados preliminares
  (desempenho, feedback); comparação qualitativa com sistema antigo.
- *Discussão:* Reflexão sobre cumprimento de objetivos, desafios
  (legado), limitações, impacto organizacional.
- *Conclusões:* Sumário do que foi conseguido na prática e próximos
  passos (estender solução, implementação real).

## Incorporação dos Artefactos e Resultados Práticos na Dissertação

Com base na análise acima, são apresentadas recomendações específicas de
**como incorporar os artefactos desenvolvidos e seus resultados** na
versão final da dissertação. O objetivo é **preencher lacunas
identificadas[\[41\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Expandir%20o%20contexto%20pr%C3%A1tico%3A%20Introduzir,para%20onde%20se%20quer%20ir)[\[35\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Resultados%20pr%C3%A1ticos%20inexistentes%20ou%20apenas,melhorias%20de%20efici%C3%AAncia%2C%20mas%20esses)**
e reforçar a robustez técnico-científica do documento, garantindo
coerência entre o que foi feito e o que é escrito. Seguem as sugestões
por área de melhoria:

- **1. Descrição do Panorama Atual (Status Quo) e Arquitetura Legada:**
  Incluir um subcapítulo no início (após a Introdução) dedicado ao
  contexto do SCMVV. Deve descrever os sistemas atualmente em uso
  (AIDA-PCE, SONHO, etc.), quem os usa e para quê, e **como se processa
  hoje o circuito do medicamento** passo a passo. Use informações do
  código legado e entrevistas para detalhar: por exemplo, "O AIDA-PCE
  (Aplicação Integrada para Área da Saúde -- Prescrição, Codificação e
  Executável) é utilizado para prescrições médicas e validação
  farmacêutica, porém apresenta interface desatualizada e não fornece
  alertas clínicos em tempo
  real[\[16\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=%28AIDA,interface%2C%20a%20lack%20of%20real).
  Não há integração direta com o módulo de administração de enfermagem
  -- os enfermeiros imprimem ou transcrevem prescrições para
  administração manual, levando a potenciais erros e retrabalho." Apoiar
  estas afirmações com evidências: *screenshots* do AIDA-PCE antigo (se
  possível), ou referência a dados (ex.: *"segundo entrevistas, X% dos
  enfermeiros relatam ter de reintroduzir dados manualmente"*). Em
  seguida, apresentar um **diagrama da arquitetura atual** mostrando a
  fragmentação (use a Figura 1 mencionada na versão anterior se existir,
  ampliando-a). Isso atende à recomendação de *"expandir o contexto
  prático"*[\[41\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Expandir%20o%20contexto%20pr%C3%A1tico%3A%20Introduzir,para%20onde%20se%20quer%20ir),
  dando ao leitor clara noção do ponto de partida.

- **2. Integração de Resultados da Análise de Dados Reais:** Aproveitar
  o repositório *psicofarmacos* para adicionar conteúdo empírico. Por
  exemplo, no final do capítulo de Contexto ou como ponte para o
  capítulo de Desafio, incluir uma secção "**Análise dos Movimentos de
  Medicamentos Controlados**" onde se apresentam os resultados
  extraídos:

- Quantidade de registos de movimentos de psicotrópicos num mês/ano no
  SCMVV (p.e., "Foram registados N movimentos de entrada/saída de
  psicotrópicos num período de 12 meses, envolvendo Y fármacos
  distintos[\[42\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L2-L10)").

- Como esses dados atualmente são obtidos (se é via consultas manuais
  complexas, evidenciado pelo script de obter movimentos via
  API[\[43\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L66-L74))
  e que dificuldades isso traz (demora, risco de erro na consolidação
  manual).

- Identificar quaisquer padrões interessantes: ex., "Observou-se picos
  mensais correspondentes a renovações de stock, ou que 80% dos
  movimentos concentram-se em 5 fármacos, etc." -- informação assim
  contextualiza desafios de gestão de stock.

- Se possível, incluir **gráficos ou tabelas** gerados a partir desses
  dados (o repositório tem scripts para visualizar e criar Excel; esses
  outputs podem ser convertidos em figuras para a tese). Um gráfico de
  movimentos mensais antes e depois do novo sistema (mesmo que "depois"
  seja simulado) poderia ilustrar a melhoria (ex.: menor variabilidade,
  menos stockouts).

Em síntese, isto mostra que o autor não se baseia apenas em suposições,
mas analisou dados reais (*"evidências recolhidas no terreno"* conforme
recomendado[\[44\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=complementando%20%20com%20%20indica%C3%A7%C3%B5es,credibilidade%20experimental%20%C3%A0s%20melhorias%20reivindicadas)).
Torna o problema mais tangível e prepara terreno para apresentar a
solução como resposta direta a esses problemas quantificados.

- **3. Descrição Detalhada da Solução Tecnológica (Artefacto)**: No
  capítulo de Implementação ou Metodologia, dedicar várias páginas para
  **dissecar o artefacto *registo-tratamentos***. Recomenda-se
  estruturar esta secção cobrindo:
- **Arquitetura do Sistema Proposto:** Inserir um diagrama de
  arquitetura *do novo sistema unificado*. Este diagrama deve ilustrar
  todos os componentes e a interação entre eles: frontend (React)
  acessado via navegador; backend Node.js/Express com módulos
  (prescrição, validação, farmácia, admin. enfermagem); base de dados
  (nova, se existe, e a do legado Oracle); APIs externas (se consumidas,
  ex. web services do PEM nacional ou outros); e integrações internas
  (ex.: o módulo farmácia comunicando com Oracle através do pool de
  conexões[\[33\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L40-L48)).
  Use legendas para destacar tecnologias (por ex., ícone do React no
  frontend, Oracle DB no repositório farmácia). Explique depois o
  diagrama no texto: *"Conforme ilustrado na Figura X, a solução adota
  uma arquitetura modular em microsserviços. O frontend React comunica
  via HTTP/HTTPS com um conjunto de APIs em Node.js (implementadas com
  Express ou Next.js API routes). Cada módulo lida com uma parte do
  ciclo de medicação -- por exemplo,* `/api/prescricoes`*,*
  `/api/validacoes`*,* `/api/admin` *e* `/api/farmacia`*. Este último
  módulo, correspondente à farmácia (PRF), interage diretamente com a
  base de dados Oracle legada utilizando um pool de conexões
  dedicado[\[33\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L40-L48).
  A autenticação é centralizada: usuários fazem login no sistema
  unificado e recebem um token JWT; este token é válido em todos os
  módulos e é verificado por middleware de segurança em cada
  requisição[\[45\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L4-L11),
  garantindo sessão única e segura."*
- **Componentes e Funcionalidades Implementadas:** Listar as principais
  funcionalidades que o artefacto oferece e como estão implementadas.
  Exemplo: "*Prescrição Eletrónica:* interface para médicos prescritores
  selecionarem medicamentos de uma base de dados unificada (pode
  mencionar se usa open source drug DB ou se replicou tabela de fármacos
  do AIDA). Inclui verificações de alergias e interações? (se sim,
  mencionar; se não, indicar como trabalho futuro). *Validação
  Farmacêutica:* módulo que permite ao farmacêutico revisar prescrições
  pendentes, comparando com guidelines -- possivelmente destaca-se a
  melhora face ao AIDA-PCE, que não tinha suporte à decisão. *Registo de
  Administração:* interface para enfermeiros confirmarem administrações,
  idealmente integrado com confirmação por código de barras -- se isto
  não foi implementado, sugerir como expansão futura, mas ao menos
  mencionar o design. *Gestão de Stocks (Farmácia):* módulo PRF
  modernizado -- descrever as telas ou APIs disponíveis, por ex.,
  "consulta de stock atual", "registo de entrada/saída de lote com data
  de validade", "verificação de stock
  mínimo"[\[46\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L70-L79).
  Aqui pode citar que este componente foi convertido do sistema legado
  para a nova plataforma, trazendo ganhos de usabilidade e evitando
  duplicação de interfaces." *Sempre que possível,* *citar excertos dos
  repositórios*\* para evidenciar detalhes -- por ex., o README do
  aida_pce lista as tabelas Oracle usadas, pode-se incorporar isso para
  mostrar o nível de design de dados
  envolvido[\[21\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L134-L143).
  Também o README do aida_pce detalha a estrutura de pastas do projeto
  React (components, hooks,
  context)[\[36\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L76-L84)
  -- isso pode ser citado para mostrar que se seguiu uma organização
  moderna de código.
- **Tecnologias e Justificativas:** Elaborar brevemente por que se
  escolheram as tecnologias empregues. Parte disso já está no resumo e
  capítulos iniciais, mas aqui pode aprofundar: p.ex., *"Optou-se por
  Next.js (framework React) para tirar partido de uma estrutura avançada
  de rendering e roteamento, agilizando o desenvolvimento do frontend. A
  escolha de Oracle como base de dados deveu-se à necessidade de
  integração direta com os dados legados existentes -- reutilizando-se a
  mesma base já em produção para evitar duplicação de fontes da verdade.
  O módulo de conexão Oracle em Node (oracledb) foi utilizado para
  assegurar performance e fiabilidade no acesso
  transacional[\[34\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L13-L21).
  A autenticação via JWT foi implementada por ser stateless e adequada a
  arquiteturas de microsserviços, permitindo escala horizontal do
  backend sem gestão complexa de sessão."* Tais justificações mostram
  consciência tecnológica e alinham com requisitos de sistemas críticos
  (segurança, escalabilidade).
- **Desafios de Implementação:** Relatar se houve obstáculos técnicos ao
  desenvolver os artefactos. Ex.: "Durante a migração do módulo PRF, foi
  necessário transpor lógica implementada em VB.NET no code-behind para
  JavaScript/TypeScript no Node. Um dos desafios foi gerir transações na
  BD Oracle fora do ambiente do AIDA-PCE; resolveu-se implementando uma
  função de execução transacional
  dedicada[\[47\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/app/db/connectionPool.ts#L87-L96)[\[48\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/app/db/connectionPool.ts#L101-L109)
  no pool de conexão, garantindo commits/rollbacks apropriados mesmo
  fora do contexto original." Ao mencionar isso, mostra-se profundidade
  técnica e compreensão do legado.
- **Testes e Validação Interna:** Conforme identificado, o projeto
  inclui testes automáticos. Mencionar na dissertação: *"Para assegurar
  a correção das funcionalidades críticas, desenvolveram-se testes
  unitários e de integração abrangendo as APIs da farmácia e componentes
  React[\[22\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L6).
  Estes testes permitiram verificar, por exemplo, que a função de
  cálculo de stock atualiza corretamente as tabelas* `prf_stock` *e*
  `prf_movimentos` *em diversos cenários, e que a interface React reage
  adequadamente a respostas da API (e.g., lista de movimentos)."* Se
  disponível, citar métricas como cobertura de testes (ex.: *"atingiu-se
  85% de coverage nas rotas de API"*) ou simplesmente afirmar que se
  seguiu a metodologia de testar as funcionalidades-chave. Esse ponto
  responde à necessidade de *robustez científica* -- demonstra que o
  autor validou o artefacto do ponto de vista técnico, aumentando a
  confiança nos resultados.

Ao incorporar todos esses elementos, a dissertação passará a ter uma
**secção de Implementação muito rica**, possivelmente ocupando várias
páginas com figuras, código de exemplo, tabelas de tecnologias, etc.
Isto contribui diretamente para atingir a extensão desejada (\>100
páginas) com conteúdo útil e não apenas texto prolixo. Importa manter a
**coerência**: os detalhes apresentados aqui devem relacionar-se com
problemas apontados antes (resolvendo-os) e com resultados discutidos
depois (validando-os).

- **4. Apresentação de Resultados Práticos:** Conforme já mencionado,
  inserir *evidence-based results*. Aqui resumimos ações concretas:
- **Screenshots ou Mockups:** Se o artefacto tem interface gráfica,
  incluir capturas de ecrã legíveis no documento, devidamente legendadas
  (ex.: "Figura X -- Ecrã de validação farmacêutica no sistema
  protótipo, mostrando lista de prescrições pendentes com alertas de
  interação destacados em amarelo"). Caso não seja possível obter
  capturas reais (talvez o sistema precise de ambiente), uma alternativa
  é criar mockups fiéis. Isso torna a leitura mais interessante e prova
  que o sistema existe para além da teoria.
- **Demonstração de Fluxo:** Descrever um *user journey* completo usando
  o sistema: p.ex., "*Um médico inicia sessão no sistema unificado
  (usando credenciais do AD do hospital via integração LDAP, ou outro
  mecanismo), prescreve um fármaco para um paciente; imediatamente o
  farmacêutico pode ver essa prescrição na sua lista de validação,
  efetuar alterações ou aprovar; a seguir, quando o enfermeiro acede à
  lista de tarefas de administração, já encontra a prescrição validada
  pronta a ser dada -- e após administrar regista no sistema. Durante
  todo este processo, o modulo de farmácia atualiza automaticamente o
  stock (decrementando a unidade do lote administrado) e toda a equipa
  partilha a mesma* fonte de verdade *em tempo real.*" Ao narrar este
  fluxo (que antes seria impossível devido a sistemas desconexos),
  está-se de facto apresentando o **resultado funcional** da unificação.
- **Tabela Comparativa Antes vs. Depois:** Considerar incluir uma tabela
  que compare as etapas do processo antes (fragmentado) e depois (no
  sistema novo). Por exemplo, número de sistemas/entradas envolvidas
  para completar um ciclo de medicação, tempo estimado, probabilidade de
  erro. Parte disso já existe (a tese tem uma tabela comparando features
  do AIDA-PCE, Epic, Cerner, etc., incluindo "Our
  System"[\[31\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=match%20at%20L981%20Feature%20AIDA,Epic%20Cerner%20Our%20System));
  podemos complementá-la com foco específico no SCMVV: "antes,
  prescrição no AIDA, validação às vezes verbal ou no papel,
  administração registada no SClínico -- 3 sistemas; depois, tudo num
  só". Uma coluna poderia indicar *gargalos resolvidos* (ex.: antes não
  havia alerta de alergias -- depois implementado; antes tinha de
  refazer login em cada módulo -- depois login único JWT, etc.).
- **Resultados de Performance/Qualidade:** Se foram medidos tempos de
  resposta do sistema novo (por ex., consulta de stock demora X
  segundos, similar ao antigo ou melhor), ou se o novo sistema foi capaz
  de detectar Y interações medicamentosas que o antigo falhava,
  apresentar esses dados. Mesmo que sejam de teste de laboratório,
  ajudam a dar substância. Se não houver dados numéricos, apoiar-se em
  *indicadores qualitativos*: "sistema novo simplificou o processo,
  espera-se reduzir erros -- de acordo com literatura, sistemas CPOE e
  de administração eletrónica reduzem erros em até 50% -- portanto os
  valores de 73% e 85% mencionados são ambiciosos mas plausíveis se
  todas as funcionalidades forem
  implementadas[\[37\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=emp%C3%ADricos%20%20recolhidos,ia)".
- **Feedback do Usuário Final:** Caso tenha havido demonstração para a
  SCMVV, recolher alguma citação ou impressão e incluir: ex., *"Um
  enfermeiro-chefe comentou que 'este sistema poupar-nos-ia imenso tempo
  nas passagens de turno, porque temos tudo no mesmo sítio'*, reforçando
  o valor prático." Esse tipo de inclusão dá um toque humano e prático
  aos resultados.

No fim do capítulo de Resultados, deve ficar claro que **há um artefacto
tangível e testável**. Mesmo que a implementação não tenha sido adotada
oficialmente ainda, a dissertação apresenta evidências de funcionamento
e de que os objetivos específicos foram alcançados em ambiente
controlado. Isso elevará a qualidade do trabalho de um nível meramente
propositivo para um nível experimental/prototipal, alinhado com a
expectativa de uma dissertação de mestrado em engenharia (onde se espera
ver algo construído e avaliado nem que seja em pequena escala).

- **5. Discussão Crítica e Recomendações:** Usar os desenvolvimentos e
  experiências para nutrir a discussão, conforme abordado na secção
  anterior sobre relação com capítulos. Trazer *coerência* aqui
  significa ligar os pontos:

- Confirmar que o que foi identificado como problema foi endereçado
  pelos resultados. Ex.: "Identificou-se que a falta de integração entre
  prescrição e administração levava a erros X. Com o protótipo,
  demonstramos a viabilidade de eliminar essa lacuna via um sistema
  unificado -- espera-se portanto uma redução desses erros. Contudo,
  notamos que a adesão dos utilizadores e o treino serão críticos para
  atingir essa redução na prática."

- Admitir limitações e lições: "Apesar do sucesso em modernizar o módulo
  de farmácia, tal esforço consumiu tempo significativo, e apenas um
  módulo foi convertido; isto sugere que uma estratégia completa de
  modernização poderá requerer um plano faseado longo, ou avaliar se
  soluções comerciais integradas (p.ex. implementação de um HIS
  completo) seriam alternativas mais eficientes a longo prazo. A
  *dissertação então discute o trade-off* entre modernizar internamente
  vs. adquirir novo sistema -- reforçando assim a análise crítica."

- Explorar impacto noutras dimensões: segurança de informação (o novo
  sistema requer gestão de permissões, encriptação de comunicações --
  mencionar se foi tratado, ex.: uso de HTTPS, armazenamento seguro de
  JWT etc.), impacto económico (já abordado acima), impacto em fluxos de
  trabalho (necessário redesenhar alguns processos, mas oportunidade de
  implementar melhores práticas padronizadas -- possivelmente introduzir
  conceitos de *Lean healthcare* se aplicável).

- Relacionar com literatura: se a literatura preconiza certos fatores de
  sucesso para implementação de sistemas de saúde (envolvimento dos
  usuários, apoio da gestão, etc.), verificar se no caso do SCMVV esses
  fatores estão presentes ou precisam ser trabalhados (ex.: se calhar,
  sugerir um plano de formação para funcionários, ou uma fase piloto
  gradual por enfermaria).

- Recomendações para o hospital: A dissertação pode concluir a Discussão
  com recomendações práticas, quase como um *guide* para a SCMVV
  prosseguir: "ex.: formalizar uma equipa de projeto para continuar
  desenvolvimento, assegurar suporte da administração, planear migração
  de dados do restante AIDA para módulos novos, etc." -- isso mostra
  preocupação com *sustentabilidade* da solução proposta.

- **6. Atualização da Revisão Bibliográfica:** Embora não diretamente
  ligado aos repositórios, esta foi uma recomendação importante para
  robustez
  científica[\[26\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Atualizar%20e%20ampliar%20a%20revis%C3%A3o,%E2%80%93%20e%20quaisquer%20outras%20%C3%A1reas).
  Portanto, deve-se incorporar novas referências (2021-2024) que
  sustentem: a) a eficácia de sistemas integrados no ciclo da medicação
  (novos estudos sobre redução de erros com CPOE+eMAR, por exemplo); b)
  estratégias de modernização de legados vs. substituição (algum artigo
  ou case study recente); c) contextos portugueses -- por ex., algum
  documento da SPMS ou estudo nacional sobre erros de medicação ou
  implementação de sistemas; d) quaisquer tecnologias emergentes
  mencionadas (ex.: se falou em blockchain ou IA, buscar referências
  atualizadas para não parecer desatualizado). Os artefactos apontam
  para a relevância de *interoperabilidade* -- buscar talvez referências
  de HL7 FHIR implementations ou OpenEHR in hospitals etc., mostrando
  que a solução do autor está alinhada com tendências globais. Incluir
  10-15 novas referências recentes espalhadas nos capítulos iniciais e
  de discussão vai elevar o rigor. No relatório anterior foi referido
  que o trabalho devia refletir o estado da arte atual e não apenas
  fontes
  clássicas[\[49\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=conexas%20que%20suportem%20as%20decis%C3%B5es,e%20n%C3%A3o%20apenas%20fontes%20cl%C3%A1ssicas)
  -- com essa atualização, cumpre-se isso. Lembrar de citar
  adequadamente e integrar naturalmente (evitar inserir referências sem
  contexto; use-as para embasar afirmações sobre benefícios esperados,
  desafios de adoção, etc.).

Resumindo esta secção, a incorporação dos artefactos resume-se a
**trazer toda a aprendizagem prática e técnica obtida durante o
desenvolvimento para dentro do texto da dissertação**, de forma
estruturada e fundamentada. Isso tornará a tese não só mais longa, mas
consideravelmente mais **sólida e convincente**, pois o leitor verá a
ligação direta entre problema, solução implementada e evidências de
validação, algo que distingue um trabalho aplicado de qualidade.

## Recomendações Finais Melhoradas

Com base em tudo o que foi exposto -- análise dos repositórios e
necessidades identificadas -- apresentam-se as recomendações finais para
a melhoria da dissertação. Estas recomendações retomam as sugestões do
relatório técnico-científico anterior, agora enriquecidas com foco na
**coerência** do documento, na **robustez científica** e na plena
**exploração dos artefactos desenvolvidos**. Seguem, em formato de
lista, os pontos de melhoria chave a implementar:

- **Expandir e detalhar o contexto prático do SCMVV:** Inclua uma
  descrição abrangente dos processos atuais de gestão de medicação no
  hospital, suportada por diagramas e dados reais. Especifique quais
  sistemas legados existem (AIDA-PCE, etc.), como interagem (ou falham
  em interagir) e quais problemas concretos decorrem disso (erros,
  atrasos, trabalho
  duplicado)[\[41\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Expandir%20o%20contexto%20pr%C3%A1tico%3A%20Introduzir,para%20onde%20se%20quer%20ir).
  Este alicerce contextual permitirá ao leitor perceber claramente o
  ponto de partida e a motivação do projeto.

- **Relacionar resultados empíricos ao problema:** Incorpore evidências
  recolhidas durante o projeto (e.g., análise de movimentos de
  psicotrópicos) para quantificar a magnitude dos problemas
  identificados. Apresente gráficos/tabelas de apoio mostrando, por
  exemplo, volumes de trabalho manual ou incidência de erros. **Estas
  evidências devem ser posteriormente usadas para comparar com a
  situação após a implementação proposta**, mesmo que de forma
  hipotética. Este passo acrescenta rigor científico, indo além de meras
  suposições[\[50\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Fortalecer%20%20a%20%20metodologia,credibilidade%20experimental%20%C3%A0s%20melhorias%20reivindicadas).

- **Descrever exaustivamente a arquitetura e implementação do artefacto
  desenvolvido:** Forneça um capítulo ou secção dedicada a explicar a
  solução proposta em nível técnico. Inclua diagramas de arquitetura do
  novo sistema, descrição dos componentes e das tecnologias utilizadas,
  ilustrando como cada módulo contribui para os objetivos da
  dissertação. Certifique-se de que **todo acrónimo ou tecnologia
  mencionada seja explicada** (por exemplo, JWT, Next.js, oracledb,
  etc., devem ser compreensíveis ao leitor não familiar) -- isso melhora
  a clareza e robustez do texto. Utilize fragmentos de documentação dos
  repositórios para reforçar a explicação (por ex., mencionar que o
  módulo X usa um pool Oracle conforme
  configurado[\[33\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L40-L48),
  ou que se seguiu metodologia de
  testes[\[22\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L6)).

- **Incorporar na tese os aspectos práticos de integração legado-novo:**
  Explicite como o novo sistema lida com a coexistência do legado. Por
  exemplo, descreva a abordagem de *"anti-corruption layer"*
  implementada: o uso do módulo PRF modernizado que interage com a base
  de dados legada isolando a lógica antiga, conforme
  planeado[\[7\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=match%20at%20L2065%20ticularly%20AIDA,developed%2C%20acting%20as%20an%20anti).
  Discuta opções consideradas (substituição total vs. integração
  faseada) e justifique a estratégia adotada. Isto demonstra reflexão
  arquitetural e dá confiança de que o autor pensou na
  **sustentabilidade da solução dentro do ecossistema real** do
  hospital.

- **Apresentar resultados concretos do protótipo (mesmo que
  preliminares):** Atenda à lacuna de resultados experimentais incluindo
  demonstrações e/ou medições. Por exemplo, documente um caso de teste
  realizado: quantos segundos demora a registar uma prescrição e tê-la
  validada no sistema novo comparado ao atual? Quantos cliques ou ecrãs
  são necessários antes e depois? Se possível, **inclua utilizadores
  reais numa pequena avaliação** (e.g., 2-3 profissionais usam o sistema
  em ambiente de teste e dão opinião). Ausência de resultados foi
  apontada como
  fraqueza[\[35\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Resultados%20pr%C3%A1ticos%20inexistentes%20ou%20apenas,melhorias%20de%20efici%C3%AAncia%2C%20mas%20esses)
  -- mesmo resultados limitados já melhoram muito a credibilidade. Caso
  não haja implementação no hospital, considere *simulações* ou
  *demonstrações de laboratório* cujos resultados possam ser
  apresentados (por ex., carga de 100 prescrições simuladas para testar
  estabilidade). Inclua também dados de qualidade de código (como
  cobertura de testes, número de commits, etc., para mostrar rigor de
  desenvolvimento).

- **Reforçar a avaliação económica e de viabilidade:** Não deixe a
  análise de custo-benefício superficial. Acrescente uma secção com
  estimativas de ROI, mesmo que aproximadas, num horizonte temporal (por
  ex., 5 anos). Utilize dados como: custo de desenvolver internamente
  vs. comprar novo sistema; benefícios quantificáveis (redução de erros
  -- há estudos que estimam o custo médio de um erro de medicação
  evitado; ganhos de eficiência -- ex.: menos 30 min por turno gasto em
  tarefas administrativas). Apresente *pelo menos uma tabela ou gráfico
  de
  ROI*[\[38\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=An%C3%A1lise%20%20de%20%20custo,%E2%80%93%20%C3%A9%20outra%20%C3%A1rea%20subexplorada),
  ainda que com hipóteses explícitas, para mostrar que a viabilidade
  financeira foi considerada -- isto será valioso para decisores
  hospitalares ao lerem o trabalho.

- **Alargar a discussão para dimensões organizacionais e de segurança:**
  Assegure que a tese aborda não apenas a tecnologia, mas também **como
  implementar na prática** (gestão de mudança). Inclua recomendações
  sobre formar utilizadores, fasear a adoção (piloto numa enfermaria
  antes de expandir), e gestão de riscos (plano de contingência se o
  sistema falhar, etc.). Além disso, trate de segurança de informação:
  indicar medidas implementadas (controlo de acesso por perfis,
  encriptação de dados sensíveis, compliance com RGPD no tratamento de
  dados de pacientes, etc.). Esta abrangência tornará a dissertação
  "multi-facetada e completa" cobrindo aspectos tecnológicos, clínicos,
  organizacionais e económicos conforme
  sugerido[\[39\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Incluir%20novos%20t%C3%B3picos%20relevantes%3A%20Incorporar,facetada%20e%20completa).

- **Manter rigor metodológico e incluir limitações:** Descreva
  claramente a metodologia de desenvolvimento e validação (DSR etapas,
  prototipagem, testes). Indique também o tratamento dado aos dados (por
  ex., se fez análise estatística dos dados de erros ou tempos, explique
  a abordagem; se não, reconheça que é exploratório). Admita as
  limitações do trabalho de forma transparente: escopo limitado do
  piloto, dependência de colaboração do hospital, etc. -- mas
  contextualize-as e proponha formas de as colmatar em trabalhos
  futuros[\[50\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Fortalecer%20%20a%20%20metodologia,credibilidade%20experimental%20%C3%A0s%20melhorias%20reivindicadas).
  Essa postura crítica demonstra maturidade científica.

- **Atualizar e enriquecer a revisão de literatura:** Integre fontes
  recentes e relevantes para todos os temas-chave tocados pelo projeto:
  segurança do doente relacionada a TI (ex.: estudos 2022/2023 sobre
  impactos de sistemas eletrónicos na redução de erros),
  interoperabilidade em saúde (papers sobre FHIR, OpenEHR), adoção de
  sistemas (fatores de sucesso e insucesso em TI na saúde), e
  normalização de processos (talvez citar iniciativas Lean ou Six Sigma
  aplicadas a farmácia hospitalar). Também posicione o trabalho no
  contexto nacional: se houver recomendações do Ministério da Saúde ou
  projetos piloto semelhantes em Portugal, referencie-os. Isso garante
  que o trabalho reflete o estado da arte atual e o contexto real, não
  se tornando uma solução
  isolada[\[26\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Atualizar%20e%20ampliar%20a%20revis%C3%A3o,%E2%80%93%20e%20quaisquer%20outras%20%C3%A1reas).
  Cada afirmação teórica importante deve ser sustentada por uma
  referência (de preferência recente).

- **Garantir coesão na estrutura e texto:** Revise a organização dos
  capítulos para evitar redundâncias e alinhar títulos com conteúdo. Por
  exemplo, se introduzir um capítulo só para "Problema e Desafios" (como
  estava no draft), certifique-se que ele não repete partes do Estado da
  Arte ou da Introdução, mas sim foca em sintetizar o contexto prático e
  introduzir os objetivos específicos da solução. Use transições claras
  entre capítulos, mencionando no final de um o que vem a seguir (ex.:
  no fim do Estado da Arte, dizer que "apesar dos avanços X e Y
  identificados na literatura, observa-se que no caso concreto do SCMVV
  persistem lacunas A e B; no próximo capítulo, detalhamos esses
  desafios específicos e os requisitos para os colmatar"). No geral,
  **amarrar bem** problema-solução-resultados: cada objetivo definido na
  introdução deve ser retomado na conclusão indicando como foi atingido,
  e cada resultado apresentado deve relacionar-se a um objetivo ou
  pergunta de investigação inicial. Elimine eventuais contradições ou
  sobreposições de conteúdo decorrentes de versões anteriores (a análise
  notou nomes de capítulos e organização um pouco inconsistentes -- isto
  deve ser polido agora com a estrutura final em
  mente[\[51\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=toca%20%20pouco%20%20na,o%20trabalho%20no%20contexto%20nacional)).

Implementando integralmente estas recomendações, espera-se que a
dissertação atinja não só a extensão pretendida, mas sobretudo um nível
muito superior de qualidade técnico-científica, clareza e impacto. Em
particular, a **exploração aprofundada dos artefactos desenvolvidos** --
descrevendo a implementação e trazendo resultados práticos -- dará
credibilidade e peso ao trabalho, diferenciando-o como um projeto
aplicado bem-sucedido e não apenas uma proposta teórica. Conforme
salientado no relatório anterior, ao **preencher as lacunas e enriquecer
o conteúdo**, o autor estará a elevar substancialmente o seu
trabalho[\[52\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Implementando%20estas%20sugest%C3%B5es%2C%20espera,outros%20%20projetos%20%20de),
tornando-o apto a servir de referência para iniciativas semelhantes de
modernização de sistemas de saúde.

Em suma, a dissertação deverá transformar-se numa narrativa coesa que
começa identificando claramente um problema real, passa por uma solução
engenheirada com base em conhecimento atual e confirmada por um
protótipo funcional, e conclui avaliando criticamente os impactos dessa
solução. Assim, cumprirá o duplo objetivo de rigor científico e
relevância prática, proporcionando valor tanto à comunidade académica
quanto ao hospital envolvido. Boa escrita e sucesso na conclusão deste
projeto
melhorado\![\[52\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Implementando%20estas%20sugest%C3%B5es%2C%20espera,outros%20%20projetos%20%20de)

------------------------------------------------------------------------

[\[1\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=nol%C3%B3gico%20%E2%80%94%20um%20sistema%20web,Type)
[\[4\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=de%20software%20centralizada,farmac%C3%AAuticos%2C%20atualmente)
[\[5\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=um%20artefacto%20tec)
[\[7\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=match%20at%20L2065%20ticularly%20AIDA,developed%2C%20acting%20as%20an%20anti)
[\[16\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=%28AIDA,interface%2C%20a%20lack%20of%20real)
[\[28\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=elicitation%20and%20a%20deep%20analysis,structured)
[\[31\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=match%20at%20L981%20Feature%20AIDA,Epic%20Cerner%20Our%20System)
[\[32\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=such%20as%20Java%20and%20Node)
[\[40\]](file://file-KwA4WoXJdP8zYN7PZxQfej#:~:text=enfermeiros%20e%20farmac%C3%AAuticos)
dissertation.pdf

<file://file-KwA4WoXJdP8zYN7PZxQfej>

[\[2\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L5)
[\[3\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L10)
[\[6\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L5-L10)
[\[15\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L1-L9)
[\[17\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L10)
[\[18\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L5)
[\[19\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L105-L111)
[\[20\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L113-L122)
[\[21\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L134-L143)
[\[22\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L2-L6)
[\[33\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L40-L48)
[\[34\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L13-L21)
[\[36\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L76-L84)
[\[45\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L4-L11)
[\[46\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md#L70-L79)
README.md

<https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/README.md>

[\[8\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L1-L9)
[\[9\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L12-L24)
[\[10\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L92-L101)
[\[11\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L56-L65)
[\[12\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L98-L106)
[\[13\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L131-L140)
[\[42\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L2-L10)
[\[43\]](https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md#L66-L74)
README.md

<https://github.com/dasesteves/psicofarmacos/blob/26a48b3cbb7499e1810f4f28c2677c27b83daf64/README.md>

[\[14\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Descri%C3%A7%C3%A3o%20insuficiente%20do%20contexto%20atual,N%C3%A3o%20se%20exp%C3%B5e)
[\[23\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Arquitetura%20atual%20dos%20sistemas%20pouco,ex)
[\[26\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Atualizar%20e%20ampliar%20a%20revis%C3%A3o,%E2%80%93%20e%20quaisquer%20outras%20%C3%A1reas)
[\[29\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=HL7%2FFHIR%2C%20etc,n%C3%A3o%20s%C3%A3o%20mencionados)
[\[30\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=apesar%20de%20serem%20parte%20integrante,exemplo%2C%20%20poderia%20%20referir)
[\[35\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Resultados%20pr%C3%A1ticos%20inexistentes%20ou%20apenas,melhorias%20de%20efici%C3%AAncia%2C%20mas%20esses)
[\[37\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=emp%C3%ADricos%20%20recolhidos,ia)
[\[38\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=An%C3%A1lise%20%20de%20%20custo,%E2%80%93%20%C3%A9%20outra%20%C3%A1rea%20subexplorada)
[\[39\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Incluir%20novos%20t%C3%B3picos%20relevantes%3A%20Incorporar,facetada%20e%20completa)
[\[41\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Expandir%20o%20contexto%20pr%C3%A1tico%3A%20Introduzir,para%20onde%20se%20quer%20ir)
[\[44\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=complementando%20%20com%20%20indica%C3%A7%C3%B5es,credibilidade%20experimental%20%C3%A0s%20melhorias%20reivindicadas)
[\[49\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=conexas%20que%20suportem%20as%20decis%C3%B5es,e%20n%C3%A3o%20apenas%20fontes%20cl%C3%A1ssicas)
[\[50\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Fortalecer%20%20a%20%20metodologia,credibilidade%20experimental%20%C3%A0s%20melhorias%20reivindicadas)
[\[51\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=toca%20%20pouco%20%20na,o%20trabalho%20no%20contexto%20nacional)
[\[52\]](file://file-XCvwUWbfpLvAsbhnprVGsL#:~:text=Implementando%20estas%20sugest%C3%B5es%2C%20espera,outros%20%20projetos%20%20de)
Análise Técnica e Científica da Dissertação.pdf

<file://file-XCvwUWbfpLvAsbhnprVGsL>

[\[24\]](https://github.com/dasesteves/pre-tese/blob/5e2d3ddc49c71af4b5f902db3d5d23e9fdb51969/README.md#L14-L22)
[\[25\]](https://github.com/dasesteves/pre-tese/blob/5e2d3ddc49c71af4b5f902db3d5d23e9fdb51969/README.md#L132-L140)
README.md

<https://github.com/dasesteves/pre-tese/blob/5e2d3ddc49c71af4b5f902db3d5d23e9fdb51969/README.md>

[\[27\]](https://github.com/dasesteves/projeto/blob/0daf545bab94bf83904056c60d8c7c1bbb978376/README.md#L2-L10)
README.md

<https://github.com/dasesteves/projeto/blob/0daf545bab94bf83904056c60d8c7c1bbb978376/README.md>

[\[47\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/app/db/connectionPool.ts#L87-L96)
[\[48\]](https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/app/db/connectionPool.ts#L101-L109)
connectionPool.ts

<https://github.com/dasesteves/aida_pce/blob/176f151daa86ede039d96a6281e623265aeac518/aida_pce_REACT/app/db/connectionPool.ts>
