# Análise Técnica e Científica da Dissertação

## Lacunas e Secções Subexploradas

**Descrição insuficiente do contexto atual (SCMVV):** A dissertação
carece de uma secção dedicada a descrever em detalhe o panorama atual da
gestão de medicação no hospital **Santa Casa da Misericórdia de Vila
Verde (SCMVV)**. Embora o **Capítulo 1 (Introdução)** mencione a
existência de um sistema legado (AIDA-PCE) e destaca a fragmentação dos
sistemas de
informação[\[1\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20Santa%20Casa%20da%20Miseric%C3%B3rdia,da%20Miseric%C3%B3rdia%20de%20Vila%20Verde)[\[2\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20literature%20review%20reveals%20several,most%20significant%20is%20deficient%20integra),
faltam detalhes práticos sobre **como os processos decorrem
atualmente**. Não se expõe claramente quais sistemas estão em uso (por
exemplo, AIDA-PCE, SONHO, PEM, etc.), como se interligam (ou não), nem
como as equipas (médicos, farmacêuticos, enfermeiros) executam o ciclo
de medicação hoje. Essa **lacuna contextual** dificulta ao leitor
compreender plenamente os **pontos de partida** e a magnitude dos
problemas que o trabalho pretende resolver.

**Arquitetura atual dos sistemas pouco detalhada:** Relacionado ao ponto
anterior, não há **diagrama ou descrição arquitetural** da solução
existente. A dissertação fornece um diagrama conceitual da fragmentação
(Figura 1 mencionada) e compara funcionalidades de sistemas
(Tabela 1)[\[3\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Table%201%3A%20Comparative%20analysis%20of,systems%20including%20legacy%20and%20modern)[\[4\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=User%20Interface%20Desktop%20Only%20Web%2FMobile,Web%2FMobile%20Responsive%20Web),
mas não explica a **arquitetura legada atual** do hospital. Por exemplo,
seria importante saber se o AIDA-PCE funciona isoladamente, se há trocas
de dados manuais ou via interfaces com outros módulos (p. ex. com SONHO,
plataforma nacional de prescrição eletrónica, etc.), e quais **pontos de
falha** existem. Esta secção está subexplorada e a sua inclusão
enriqueceria o trabalho.

**Resultados práticos inexistentes ou apenas esperados:** Observa-se que
os **capítulos de resultados e discussão** são escritos de forma
**prospectiva**, baseando-se em resultados **esperados** e não em dados
empíricos recolhidos. Por exemplo, o Capítulo 5 ("Problem and
Challenges") discute implicações **antecipadas** e desafios
esperados[\[5\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=the%20raw%20metrics,for%20instance%2C%20should%20be%20interpreted)[\[6\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=5),
indicando reduções projetadas de erros de medicação (73% nas
prescrições, 85% nas validações) e melhorias de eficiência, mas esses
números parecem ser **metas ou estimativas**, não resultados de medições
reais. Essa ausência de resultados **observados** é uma lacuna
científica significativa -- numa dissertação completa esperar-se-ia a
apresentação de **dados recolhidos** durante a implementação piloto
(mesmo que preliminares). A discussão torna-se hipotética, o que
enfraquece a robustez do trabalho caso não sejam incluídos pelo menos
alguns **resultados experimentais ou evidências** obtidas.

**Análise de custo-benefício e impacto financeiro superficial:** Embora
o plano da dissertação mencione a inclusão de uma análise de
custo-benefício com horizonte temporal de
ROI[\[7\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=7%20Cost,ROI%20timeline%2C%20and%20payback%20period),
a versão atual não apresenta estes detalhes de forma desenvolvida. A
falta de uma **secção quantitativa de análise económica** -- por
exemplo, estimativa de custos de implementação/manutenção vs. poupanças
geradas por menos erros ou ganhos de eficiência -- é outra área
subexplorada. Este tipo de análise reforçaria a relevância prática do
projeto, especialmente para **decisores hospitalares**, mas necessita de
ser aprofundada além de um possível gráfico de ROI.

**Cobertura limitada de certos tópicos no Estado da Arte:** O **Capítulo
2 (Estado da Arte)** apresenta um levantamento sólido das tecnologias e
sistemas (ePrescription, CDSS, IA, blockchain, microserviços, HL7/FHIR,
etc.). No entanto, alguns tópicos poderiam ser mais explorados. Por
exemplo, **sistemas de administração de medicamentos no ponto de
cuidado** (p. ex. registos eletrónicos de administração -- eMAR, ou
sistemas de código de barras para dispensação e administração) não são
mencionados, apesar de serem parte integrante do **ciclo fechado de
medicação** em hospitais modernos. Além disso, embora se refira a
fragmentação de sistemas e interoperabilidade, faltou discutir
iniciativas específicas de **normalização de processos** (por ex.,
aplicação de frameworks Lean Six Sigma na gestão do medicamento ou
protocolos de segurança do doente nacionais/internacionais). A
dissertação também toca pouco na realidade portuguesa para além do caso
SCMVV -- por exemplo, poderia referir brevemente projetos ou diretrizes
do SNS ou da SPMS relacionados com informatização da prescrição ou
segurança da medicação, se existirem, para **posicionar o trabalho no
contexto nacional**.

**Estruturação e nomes de capítulos:** Nota-se uma **inconsistência na
estrutura** proposta vs. conteúdo. A Introdução indicia 7 capítulos (com
Resultados, Discussão e Conclusão
separados)[\[8\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=This%20dissertation%20is%20organized%20to,Following%20this%20introduction)[\[9\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=plementation%20and%20pilot%20study,these%20results%2C%20contextualizing%20them%20within),
mas o texto atual combina **Discussão/Desafios** no Capítulo 5 e
**Conclusão/Futuro** no Capítulo
6[\[10\]\[11\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Chapter%206),
deixando o Capítulo 7 apenas para Plano de Trabalhos. Esta alteração
pode confundir o leitor. Além disso, o título do Capítulo 4 surge como
"Applications" (aplicações), quando na verdade trata da
**Metodologia**[\[12\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Applications).
Estas discrepâncias sugerem lacunas editoriais e deverão ser corrigidas
para clarificar a finalidade de cada capítulo. Em resumo, os conteúdos
fundamentais estão presentes, mas **algumas secções requerem expansão e
maior detalhe** para cobrir totalmente os objetivos propostos e dar à
dissertação a profundidade esperada numa obra de \~100 páginas.

## Melhorias Técnicas e Científicas no Conteúdo Atual

**Detalhar o contexto e sistemas legados:** Recomenda-se incluir uma
secção específica (no início da dissertação, possivelmente após a
Introdução ou dentro do Capítulo de Metodologia) que **descreva os
processos atuais de gestão de medicação no SCMVV e a arquitetura dos
sistemas existentes**. Esta descrição deve ser técnica e pormenorizada,
indicando, por exemplo: quais etapas do circuito do medicamento são
suportadas pelo AIDA-PCE e quais não são; como médicos, farmacêuticos e
enfermeiros interagem com o sistema (ou recorrem a soluções manuais);
que outros sistemas estão envolvidos (e.g., SONHO para faturação,
Prescrição Eletrónica Médica nacional (PEM) para receitas, etc.) e de
que forma se comunica (ou falha a comunicação) entre eles. Incluir um
**diagrama arquitetural "as-is"** dos sistemas no hospital seria
extremamente elucidativo -- mostrando bases de dados, módulos,
interfaces e fluxos de informação atuais. Esses acréscimos dariam base
concreta ao problema descrito e tornariam mais claras as **necessidades
de otimização e standardização**.

**Reforçar a fundamentação no Estado da Arte:** O conteúdo existente no
capítulo de Estado da Arte pode ser **aprofundado tecnicamente** em
algumas áreas. Por exemplo, ao discutir **CDSS e prescrição
eletrónica**, poderiam ser adicionados exemplos concretos de **falhas de
integração** encontradas na literatura (p.ex., situações onde sistemas
de prescrição não comunicam com farmácia ou enfermagem, resultando em
erros). Na parte de **IA em saúde**, além de NLP para interações
medicamentosas, poderiam mencionar-se outras aplicações relevantes como
sistemas de apoio à decisão baseados em machine learning para dosagem ou
deteção de alertas de alergia (caso não estejam já incluídas). Ao
referir **blockchain**, valeria clarificar brevemente **como** esta
tecnologia poderia ser integrada num hospital (por ex., gestão de
consentimentos ou rastreabilidade de fármacos) para que o leitor
compreenda a aplicação prática.

**Incluir aspectos de "standardização" de processos:** Dado que o título
enfatiza **standardization** (normalização) dos processos, seria
benéfico explicitar no texto atual *como* a plataforma proposta
contribui para uniformizar procedimentos. Por exemplo, mencionar
**protocolos clínicos padronizados** ou checklists eletrónicas
integradas (inexistentes no sistema legado) que o novo sistema vai
introduzir para garantir que todas as prescrições e administrações
seguem um padrão seguro. Poderia também ser introduzida a noção de
**ciclo fechado de medicação** (Closed-loop medication management),
explicando que a solução visa cobrir todas as etapas -- prescrição CPOE,
validação farmacêutica, dispensa e administração com confirmação
eletrónica -- de forma integrada. Essa discussão liga-se a literatura de
segurança do doente e garantiria que o aspeto de **normalização de
processos clínicos** fica tão claro quanto o de otimização tecnológica.

**Melhorar a coesão e consistência editorial:** Do ponto de vista
formal, é importante alinhar a terminologia e estrutura. Deve-se
uniformizar os títulos de capítulos com o conteúdo (por exemplo,
renomear "Applications" para **"Metodologia"** ou equivalente, para
refletir com rigor o conteúdo da
secção[\[12\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Applications)).
Garantir que a Introdução descreve corretamente a estrutura final dos
capítulos, evitando discrepâncias (se a Conclusão for Capítulo 6,
atualizar o texto introdutório para refletir isso). Também é
aconselhável **verificar siglas e termos técnicos**, garantindo que cada
sigla (HIS, SNS, AIDA-PCE, CDSS, etc.) é explicada na primeira aparição
e usada consistentemente. No Resumo em português, foi usado um acrónimo
inglês (HIT para Health Information Technology) -- avaliar se deve ser
vertido para português ou mantido como anglicismo, consoante o estilo
adotado.

**Evidências e exemplos para suportar argumentos:** Para fortalecer
cientificamente a dissertação, sempre que se afirma um benefício
esperado deve-se, se possível, **apoiar em dados ou referências**. Por
exemplo, quando se alega que a interface atual é "não-intuitiva" e que
faltam alertas em tempo real, poderia citar-se um **exemplo concreto**
observado no SCMVV ou na literatura (p. ex., "atualmente, a validação de
interações é feita manualmente, o que atrasou X processos conforme
observado" ou "segundo Bowles et al. (2020), a ausência de alertas
computorizados levou a um aumento de erros em Y%" -- já há referências
afins
citadas[\[13\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Execut%C3%A1vel)).
No **Capítulo 3 (Arquitetura proposta e resultados esperados)**, onde se
listam metas de desempenho (ex.: tempo de resposta \< 1 s, uptime
99,95%, etc.), estas metas estão bem
definidas[\[14\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=3)[\[15\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=A%20primary%20technical%20objective%20is,The);
porém, seria útil indicar **como foram determinadas** -- por exemplo,
referindo benchmarks de literatura ou requisitos do hospital.
Adicionalmente, quando forem obtidos resultados reais, estes devem ser
inseridos para substituir expectativas. Por exemplo, se durante o piloto
de 6 meses forem recolhidos dados de redução de erros, esses **números
efetivos devem aparecer**, nem que seja em formato preliminar ou de
estudo de caso, para dar **credibilidade empírica** às afirmações.

**Incorporar análise de custo-benefício:** A melhoria do conteúdo
técnico-científico também passa por incluir elementos de **avaliação
económica** e prática. Desenvolver a secção de custo-benefício, tal como
planeado, fornecendo detalhes numéricos ou qualitativos: por exemplo,
estimar o **Retorno do Investimento (ROI)** em função de custos de
desenvolvimento vs. poupanças anuais com menos eventos adversos
medicamentosos (podendo referenciar estudos que quantificam o custo de
um erro de medicação evitado). Se existirem dados, incluir também a
perspetiva de **escalabilidade financeira** -- p.ex., discutir se a
solução aberta pode ser mais barata que licenças de softwares comerciais
(algo já indicado na Tabela 1, com modelo open source vs
subscrição[\[16\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Integration%20Custom%20APIs%20HL7%2FFHIR%20HL7%2FFHIR,RESTful%2FHL7)).
Essa discussão tornará a dissertação mais **científica e aplicável**,
mostrando que não só há ganhos clínicos, mas também **viabilidade
económica**, o que reforça a importância do trabalho.

**Clarificar limitações e condições do estudo:** Embora o Capítulo 4
apresente uma subseção de
limitações[\[17\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=4)[\[18\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=organizational%20culture%20or%20patient%20outcomes,lacking%20a%20parallel%20control%20group),
esta poderia ser fortalecida com mais detalhes técnicos. Por exemplo, ao
afirmar que não há grupo de controlo paralelo, pode-se mencionar
explicitamente que os resultados serão analisados em comparação ao
**baseline histórico** (que foi levantado de 10.000 prescrições
anteriores[\[19\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=elicitation%20and%20a%20deep%20analysis,structured))
e que será usada análise estatística apropriada (testes de
significância, intervalos de confiança) para validar reduções de erro.
Além disso, poderia ser útil declarar as **hipóteses de investigação**
de forma clara (embora implícitas, podiam ser enumeradas formalmente:
ex.: "H1: O sistema integrado reduzirá significativamente a taxa de
erros de medicação face ao sistema legado"; "H2: O tempo médio de cada
etapa do processo de medicação será reduzido em pelo menos X%", etc.).
Isso tornaria a avaliação mais **cientificamente rigorosa**, alinhando
métricas a hipóteses testáveis.

**Aprimorar a discussão com apoio bibliográfico:** Quando a dissertação
interpretar os resultados (ou expectativas) no Capítulo de Discussão, é
importante **confrontar com a literatura** de maneira robusta. Por
exemplo, se se esperar uma redução de 70% dos erros, discutir se estudos
semelhantes obtiveram valores próximos -- e se divergirem, porque poderá
o caso do SCMVV ter resultados diferentes. No texto atual já há
tentativas de fazer isso, citando Radley et al. (2013) e
outros[\[20\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=by%20the%20goals%20in%20Figure,prescribing%20errors%20and%20over%2085),
mas esse diálogo pode ser ampliado. Cada implicação citada (ex.: a
modernização da camada de front-end produz grandes ganhos mesmo sem
substituir os back-ends
legados[\[21\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Similarly%2C%20the%20projected%20improvements%20in,user%20satisfaction%20are%20expected%20to))
pode ser fortalecida citando **experiências de outras instituições** ou
artigos de revisão que suportem ou alertem para desafios dessas
estratégias. Assim, a discussão fica mais equilibrada entre o **otimismo
do projeto** e as lições da comunidade científica, demonstrando uma
visão crítica e embasada.

## Sugestões de Novos Tópicos a Incluir

**Descrição da Organização Prática Atual (SCMVV):** Como prioridade,
sugere-se introduzir um novo tópico ou capítulo dedicado ao **"Contexto
e Organização Atual do Processo de Medicação no SCMVV"**. Nele, deve-se
narrar o **ciclo de medicação tal como existe hoje** no hospital, passo
a passo: prescrição médica (por ex., efetuada no AIDA-PCE ou em papel?),
validação farmacêutica (onde ocorre, em que sistema ou manualmente?),
dispensa de medicamentos pela farmácia, administração ao doente
(registos feitos em papel, num módulo separado, ou não registrados?).
Identificar *quem* faz *o quê* e *como*, evidenciando pontos de
descontinuidade. Este tópico deve também enumerar os **sistemas de
informação legados** envolvidos: por exemplo, AIDA-PCE (detalhar a sua
função: "aplicação integrada para prescrição, codificação e execução"),
SONHO (sistema hospitalar usado talvez para internamentos/faturação),
eventualmente folhas de cálculo ou módulos auxiliares, etc. O objetivo é
pintar um **quadro concreto do "antes"**, para que o leitor perceba os
desafios práticos (p. ex., dupla introdução de dados, passagem de
informação por telefone, falta de alerta de interações, etc.). Esta
secção servirá de **fundamento** para justificar as soluções
apresentadas no resto da dissertação. Incluir um **diagrama de fluxo do
processo atual** ou esquemas das interfaces legadas aumentaria a clareza
-- por exemplo, uma figura ilustrando a jornada de uma prescrição desde
que o médico a faz até à administração pelo enfermeiro, indicando em que
pontos intervém cada sistema ou pessoa e onde ocorrem eventuais quebras
de comunicação.

**Arquitetura Atual dos Sistemas no Hospital:** Complementarmente,
dentro do tópico acima ou separado, incluir um **diagrama da arquitetura
de sistemas existente no SCMVV**. Este poderia mostrar módulos como:
AIDA-PCE (prescrição e registo clínico), base de dados local; sistema
SONHO (HIShospitalar para outros fins), PEM nacional; eventuais módulos
de farmácia ou armazém; e canais de integração (ou sua ausência) entre
eles. Essa representação servirá para contrastar posteriormente com a
**arquitetura proposta** (que já está bem detalhada no Capítulo
3[\[22\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=3)[\[23\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20proposed%20architecture%20will%20be,The%20Presentation%20Layer%2C%20built%20with)).
Ao evidenciar graficamente as **lacunas de integração** atuais (por
exemplo, setas inexistentes onde deveria haver comunicação automática),
o leitor entenderá facilmente **onde o projeto incide**. Este novo
tópico reforça a componente prática e de engenharia da dissertação,
demonstrando que o autor analisou a fundo o sistema atual (como, de
facto, mencionou ter feito através de entrevistas e
observação[\[19\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=elicitation%20and%20a%20deep%20analysis,structured)).

**Análise de Processos e Identificação de Ineficiências:** Ainda no
contexto do funcionamento atual, um subtópico interessante seria
apresentar resultados da **análise de processos** realizada na fase
inicial do projeto. Por exemplo, se foram elaborados **mapas de
processos** ou diagramas BPMN para representar o fluxo de trabalho, a
dissertação pode incluir um desses diagramas (talvez no Apêndice, com
referência no texto) e destacar **ineficiências identificadas** -- p.
ex., passos redundantes, esperas, transcrição manual de dados entre
sistemas, etc. Poderia mesmo quantificar alguma coisa do estado atual:
*"Verificou-se que a introdução manual de dados duplicados ocorria em X%
dos casos de prescrição, e a clarificação de ordens por via
verbal/telefone ocorria diariamente, introduzindo risco e atraso"*.
Estes detalhes tornarão claras as **oportunidades de otimização** (que o
sistema proposto vai abordar) e dão sustento factual à necessidade do
projeto.

**Resultados e Avaliação Empírica (caso possível):** Caso entretanto
haja **dados coletados do piloto ou testes**, é fundamental
incorporá-los. Um novo tópico **"Resultados Preliminares da
Implementação Piloto"** poderia ser adicionado antes do capítulo de
Discussão. Nele, apresentariam-se os **KPI medidos** no período
experimental de 6 meses (ou o intervalo disponível até à conclusão da
dissertação). Por exemplo: redução efetiva da taxa de erros de medicação
de A% para B% (com N erros antes e M erros depois, definindo claramente
o que foi considerado "erro de medicação"); tempos médios de
prescrição/validação antes vs. depois; grau de utilização do sistema
(número de prescrições feitas no novo vs. no antigo, etc.); resultados
do questionário de usabilidade SUS (se já aplicado, indicar a pontuação
média atingida e interpretação). Caso esses resultados ainda não
existam, poderia considerar-se realizar uma **avaliação simulada ou
teste limitado** -- por exemplo, convidar alguns utilizadores-chave a
usar um protótipo e recolher feedback quantitativo (mesmo que não seja o
piloto completo, quaisquer evidências empíricas adicionam valor
científico). Este tópico de resultados concretos fortalecerá a
dissertação, mas mesmo que os resultados definitivos não estejam
disponíveis a tempo, recomenda-se **apresentar pelo menos alguns dados
observados** durante o desenvolvimento (por ex., resultados de testes de
desempenho do sistema, screenshots de módulos funcionais, ou relatos
qualitativos de utilizadores que já experimentaram).

**Gestão da Mudança e Adoção pelo Utilizador:** Dada a **importância da
vertente humana** num projeto destes, seria pertinente incluir um tópico
dedicado à **estratégia de gestão de mudança e formação** implementada
(ou proposta) no hospital. A dissertação refere a existência de um plano
de change management com "champions"
departamentais[\[24\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=strategies%20were%20implemented%20for%20each,resistance%20to%20change%2C%20a%20comprehensive)[\[25\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=change%2C%20a%20comprehensive)
e formação contínua, o que é ótimo. Este aspeto poderia ser alargado num
subtópico próprio, detalhando ações concretas: sessões de formação
realizadas, materiais de apoio desenvolvidos, frequência de feedback
rounds com os utilizadores finais durante o desenvolvimento (co-design).
Poderia também citar **teorias de adoção de tecnologia** para sustentar
as ações (já há referência a Rogers
(2003)[\[26\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=organizational);
poderia reforçar-se com, por ex., *Technology Acceptance Model (TAM)* ou
estudos recentes em adoção de SI em saúde). Assim, demonstra-se
preocupação não apenas com a tecnologia em si, mas também com a
**mudança organizacional**, tornando o trabalho mais abrangente.

**Segurança da Informação e Conformidades:** Embora haja menção ao
compliance com GDPR e à segurança (encriptação de dados,
etc.)[\[27\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20study%20protocol%20received%20full,All%20research%20activities)[\[28\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=A%20critical%20sociotechnical%20risk%20is,The%20mitigation),
um tópico dedicado a **"Segurança, Privacidade e Conformidade"** poderia
ser incluído ou expandido. Nele, poderia detalhar-se como o sistema
garante a **confidencialidade e integridade** dos dados clínicos: por
exemplo, arquitetura de permissões (já citada: LDAP, SSO e
roles[\[29\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Key%20components%20to%20be%20implemented,system%20integrated%20with%20the%20hospi)),
logs auditáveis de todas ações (importante para responsabilidade legal),
medidas contra downtime (servidores redundantes, backups). Também
mencionar **normas ou standards de segurança** específicos de saúde, se
relevantes (p. ex., ISO 27799 para segurança de informação em saúde, ou
IEEE/UL standards para software médico). Este tópico tornaria explícito
que a solução não só é funcional, mas também **segura e em
conformidade** com exigências legais/hospitalares -- um aspeto
técnico-científico muitas vezes valorizado em sistemas de saúde.

**Extensões tecnológicas emergentes:** Como forma de expandir conteúdo e
demonstrar visão além do estado atual, poderia adicionar-se um tópico de
**"Possíveis Extensões Futuras da Plataforma"** (talvez dentro de Future
Work). Exemplos: integração com **dispositivos móveis ou IoT** (ex.:
*apps* para enfermeiros administrarem medicação à beira do leito com
código de barras -- o texto de futuro trabalho até refere aplicação
mobile-first[\[30\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=a%20proactive%20safety%20model%2C%20identifying,%282021),
que poderia ser descrita melhor); uso de **smart cabinets** ou
dispensários automáticos ligados ao sistema; aplicação de **inteligência
artificial avançada** para recomendação de doses ótimas ou deteção
preditiva de eventos adversos (indo além do que foi feito inicialmente).
Esses tópicos não precisam de ser implementados já, mas a sua discussão
mostra **riqueza científica** e pode render conteúdo adicional apoiado
por literatura (por ex., citar estudos de sistemas de dispensação
automatizada ou IA preditiva em medicação).

Em suma, os novos tópicos sugeridos acima focam-se em **tornar o
trabalho mais completo e aprofundado**: cobrindo desde a base (contexto
atual) até assuntos complementares (económicos, organizacionais,
técnicos) que ainda não foram explorados. Dando atenção especial ao
**caso prático do SCMVV**, à **demonstração de resultados** e a
**aspectos de implementação real**, a dissertação ganhará substância e
facilmente atingirá (ou excederá) as 100 páginas com conteúdo relevante.

## Avaliação da Robustez Metodológica e Científica

**Abordagem metodológica bem estruturada:** A dissertação segue uma
metodologia **Design Science Research (DSR)**, complementada por
**Action Research**, o que é adequado para um projeto de intervenção
tecnológica em ambiente
clínico[\[31\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=fundamentally%20grounded%20in%20Design%20Science,DSR%29%29%2C%20an%20approach)[\[32\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=To%20operationalize%20the%20DSR%20paradigm%2C,was%20employed%20Greenhalgh%20et%20al).
Esta escolha metodológica é cientificamente sólida, pois combina rigor
(DSR impõe artefacto + avaliação) com relevância prática (Action
Research envolve os utilizadores e iteratividade). A descrição
metodológica no Capítulo 4 é detalhada e merece elogios: define
paradigma pragmático, questões de investigação, fases do projeto
(análise, desenvolvimento, integração, etc.) e inclui considerações
éticas e
limitações[\[33\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=,1)[\[17\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=4).
Isto demonstra **robustez científica**, pois mostra consciencialização
tanto dos pontos fortes quanto das fragilidades do estudo.

**Robustez da avaliação (a melhorar com dados):** Em termos de
avaliação, o plano contempla **métricas quantitativas** (erros de
medicação, tempos de tarefa, uptime, utilização) e **qualitativas**
(entrevistas,
observação)[\[34\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Quantitative%20data%20focused%20on%20objective%2C,System%20perfor)[\[35\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Qualitative%20data%20provided%20rich%2C%20contextual,structured%20inter),
o que é uma abordagem abrangente (métodos mistos). A definição de **KPI
baseados no modelo de Donabedian** -- estrutura, processo, resultados --
é uma escolha metodológica
acertada[\[36\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20system%E2%80%99s%20success%20was%20assessed,rooted%20in%20the%20Donabedian%20model)[\[37\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=reduction%20in%20medication%20errors).
No entanto, para fortalecer a robustez, será crucial **apresentar a
aplicação prática desses métodos**: por exemplo, detalhar como se mediu
a taxa de erros (através de análise de relatórios de farmacovigilância?
revisão manual de prescrições? definição clara do que conta como "erro")
e como se garantiu a **comparabilidade pré e pós**. A robustez
estatística deve ser assegurada: idealmente, mencionar que se fará um
teste estatístico (p. ex., teste qui-quadrado ou teste exato de Fisher
para proporções de erros antes/depois, teste t ou de Mann-Whitney para
tempos de processo, etc.) para validar se as diferenças observadas são
**estatisticamente significativas** e não devidas ao acaso. Como o
próprio texto admite, não havendo um grupo de controlo simultâneo, esta
análise **quasi-experimental** precisa de cuidado redobrado na
interpretação[\[38\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=infrastructures.%20The%20quasi)[\[39\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=organizational%20culture%20or%20patient%20outcomes,lacking%20a%20parallel%20control%20group).
Sugerir a realização de **testes estatísticos de série temporal** (por
ex., comparar mensalmente a taxa de erros ao longo dos 6 meses, ou usar
métodos de controle estatístico de processo) poderia aumentar a
confiança nos resultados, isolando efeitos de tendência temporal.

**Generalização e validade externa:** A metodologia, por ser centrada
num só hospital, tem limitações de validade externa já
reconhecidas[\[40\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20findings%20must%20be%20interpreted,The%20single)[\[41\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=match%20at%20L1801%20specific%20implementation,of%20the%20findings%20to%20other).
Cientificamente, seria recomendável discutir possibilidades de
**generalização analítica**: ou seja, em vez de generalizar
estatisticamente, argumentar por que os achados do SCMVV **podem ser
relevantes** para outros contextos (identificando características
semelhantes a outros hospitais de médio porte, por exemplo). A
dissertação poderia reforçar a robustez argumentativa mencionando que
embora os resultados num só centro não provem eficácia universal,
**alinhamentos com literatura** (e.g., se outros estudos de
implementação em hospitais pequenos obtiveram sucesso) dão confiança de
que conclusões são transferíveis. Também valeria a pena notar que o uso
de tecnologias standard (Java, Node.js, FHIR) torna o artefacto mais
**reutilizável noutros locais**, o que é um ponto a favor da validade do
design.

**Considerações éticas e de confiabilidade:** O texto aborda bem a
questão ética (aprovação do comité de ética, GDPR, consentimento
informado)[\[42\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=4). Para
máxima robustez, certifique-se de documentar isso formalmente (por ex.,
Referenciar o número de aprovação ética ou data de aprovação). Em termos
de **confiabilidade dos dados**, podia mencionar-se se houve **treino
dos observadores** ou validação dos instrumentos (por ex., se várias
pessoas avaliaram erros, houve consenso sobre definições? O questionário
SUS é validado, mas e as entrevistas -- foi usada análise temática com
dupla verificação?). Pequenos apontamentos assim mostrariam preocupação
com **rigor metodológico** nas etapas de recolha e análise de dados
qualitativos.

**Equilíbrio entre otimização técnica e avaliação científica:** Uma
possível fragilidade a apontar -- e melhorar, se possível -- é que o
trabalho enfatiza bastante a **solução técnica** (arquitetura,
desenvolvimento). Para uma dissertação de Engenharia, isto é normal, mas
convém equilibrar com avaliação científica do impacto. Ou seja, não
basta demonstrar que se construiu a plataforma; é preciso comprovar que
ela **resolve o problema**. A robustez científica sairia reforçada se na
redação final houver uma **análise crítica dos resultados** (mesmo que
parciais): discutir não apenas se os KPIs melhoraram, mas também se há
**significância prática** (por ex., uma redução de 5% em erros pode ser
estatisticamente significativa mas talvez não clinicamente relevante; já
70% seria, obviamente, muito relevante). Mostrar esta capacidade de
avaliar criticamente evita qualquer impressão de viés de confirmação. Se
algum indicador não melhorar conforme esperado, mencioná-lo e discutir
possíveis razões (falta de adoção completa, curva de aprendizagem, etc.)
também demonstra **integridade científica** e robustez na abordagem.

Em resumo, do ponto de vista metodológico e científico, o trabalho está
bem pensado e articulado. As recomendações acima focam-se em **reforçar
essa robustez**: implementando análise estatística adequada, explicando
claramente procedimentos de medida, e mantendo uma postura crítica e
fundamentada na discussão. Assim, a dissertação não será apenas um
relato de um desenvolvimento de software, mas sim um **estudo científico
completo**, com hipótese, método, resultados e análise rigorosa.

## Referências Recentes e Áreas da Literatura para Aprofundar

**Integração de Sistemas e Interoperabilidade:** Para aprofundar a
componente de interoperabilidade, recomenda-se incluir referências
atuais sobre **HL7 FHIR e integração de sistemas hospitalares**. Por
exemplo, estudos de 2022-2023 que avaliam a adoção de FHIR em ambientes
hospitalares ou estratégias de integração de sistemas legados poderiam
dar suporte científico às escolhas arquiteturais. Há trabalhos recentes
sobre **impacto da interoperabilidade na segurança do doente** (por ex.,
*The Impact of Electronic Health Record Interoperability on Safety* --
estudo de 2021 que explora como a falta de interoperabilidade afeta
cuidados[\[43\]](https://www.jmir.org/2022/9/e38144/#:~:text=The%20Impact%20of%20Electronic%20Health,income%20health%20care%20settings)).
Incluir uma referência como essa contextualiza a relevância de adotar
padrões abertos. Também poderia ser citado algum **white paper da HIMSS
ou HL7 International** sobre melhores práticas de integração -- para
reforçar a ideia de que a solução está alinhada com tendências
internacionais de **sistemas de informação em saúde conectados**.

**Segurança do Doente e Erros de Medicação:** A dissertação já cita
relatórios clássicos (Kohn et al., 2000; WHO 2017) e estudos até 2021
sobre erros de medicação. Seria vantajoso incorporar **referências mais
recentes (2022-2025)** sobre este tema, para mostrar que a revisão está
atualizada. Por exemplo, uma **revisão sistemática de 2022** no *Journal
of Patient Safety* ou *BMC Health Services* analisando o efeito dos
**registos eletrónicos na redução de erros** pode fornecer dados
consolidados (percentagens médias de redução de erros de prescrição com
CPOE, etc.). Outra área relevante é a **iniciativa "Medication Without
Harm"** da OMS (2017-2022) -- se já não citado, vale mencionar
relatórios finais ou progressos dessa campanha global de segurança
medicamentosa. Também poderiam ser citados estudos sobre **erros de
medicação em Portugal** ou Europa, se disponíveis, para salientar a
magnitude local do problema (por ex., publicações de autores portugueses
ou europeus em 2023 quantificando erros antes/depois de implementar
prescrição eletrónica). Isso não só atualiza as referências como ajuda a
**enquadrar o problema no contexto nacional**.

**Implementação de EHR e Impacto Organizacional:** Para enriquecer a
discussão dos **desafios sociotécnicos**, adicionar literatura sobre
**fatores de sucesso e insucesso na implementação de sistemas de
saúde**. Por exemplo, um estudo recente de 2023 que analise
implementações de sistemas de prescrição eletrónica em hospitais e
reporta lições aprendidas (como importância do treinamento contínuo,
envolvimento dos stakeholders, etc.). Referências de autores como
**Black, Car, Greenhalgh** ou outros em periódicos de informária médica
podem ser úteis. A dissertação já cita Rogers (2003) e Greenhalgh et al.
(2017) -- poderia somar, por exemplo, **Chan et al. (2022)** sobre
barreiras humanas à adoção de health IT, ou um artigo da **JMIR** de
2021/2022 investigando a relação entre usabilidade de EHR e burnout
(*The influence of EHR design on usability and
safety*[\[44\]](https://bmchealthservres.biomedcentral.com/articles/10.1186/s12913-024-12060-2#:~:text=The%20influence%20of%20electronic%20health,was%20conducted%20of%20PubMed)
é um exemplo de pesquisa que casa bem com a temática). Isto reforçará a
componente de **avaliação qualitativa** e de **usabilidade**, mostrando
consciência das implicações humanas e não apenas técnicas.

**Métodos de Avaliação e Usabilidade:** Na linha metodológica, poderiam
ser citadas referências sobre a **escala SUS** em contexto de saúde
digital -- por exemplo, **Lewis (2018)** é mencionado como fonte da
interpretação do
SUS[\[45\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=acceptance%20will%20be%20conducted%20using,The),
mas talvez uma referência a estudos que utilizaram SUS em enfermeiros ou
médicos para avaliar um sistema similar. Além disso, mencionar outros
métodos complementares (como análise cognitiva ou estudos de carga de
trabalho, p.ex. **Holden & Karsh (2010)** sobre *cognitive workload in
healthcare IT*, já citada nas perspetivas
futuras[\[46\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=into%20the%20cognitive%20ergonomics%20of,insights%20into%20minimizing%20cognitive%20load))
demonstra profundidade. Na eventualidade de incluir dados de
usabilidade, referências sobre **valores médios de SUS em sistemas
clínicos** (há artigos que dizem que sistemas de prescrição eletrónica
costumam ter SUS baixos, \~50-60, indicando espaço de melhoria) podem
ser adicionadas para contextualizar os resultados obtidos ou esperados.

**Tecnologias Emergentes e Futuro:** Dado que o trabalho toca em IA e
blockchain, poder-se-ia citar alguns **trabalhos recentes concretos**:
por exemplo, um estudo de 2023 onde uma IA foi implementada para
prevenir interações medicamentosas num hospital (se existir algum case
study). Também, se mencionar **mobile health**, referenciar projetos de
apps móveis para apoio à administração de terapêutica (há conferências
de informática médica com papers sobre apps para enfermeiros, etc., em
2022/23). Em **blockchain**, poderia citar um artigo de 2020+ que tenha
testado blockchain para rastrear fármacos ou gerir consentimento, para
não ficar apenas a menção teórica -- por ex., um estudo piloto em
farmacologia utilizando Hyperledger ou Ethereum para cadeia de
suprimentos farmacêutica. Estas referências mostram que o autor está a
par das **inovações mais recentes** e de como elas estão a ser
exploradas globalmente.

**Processos Lean e melhoria contínua:** Caso se deseje fortalecer o
aspeto de **optimização de processos**, buscar literatura de saúde sobre
aplicação de **Lean Six Sigma na farmácia hospitalar ou nos fluxos de
medicação** pode trazer ideias. Por exemplo, um artigo de 2019 ou 2020
onde mapearam o processo de medicação e reduziram desperdícios pode
fornecer tanto metodologia de análise de processos quanto resultados.
Embora o foco principal da dissertação seja tecnológico, essa
perspectiva processual alinha-se com "optimização de processos" do
título. Referências nesse sentido poderiam incluir estudos em revistas
de gestão em saúde ou engenharia industrial aplicada a hospitais.

**Trabalhos relacionados** (benchmarking científico): Para posicionar
melhor a contribuição, seria útil referenciar **outros projetos
semelhantes**. Por exemplo, procurar se há estudos publicados sobre a
implementação de um **front-end unificado sobre sistemas legados** em
ambiente hospitalar. Qualquer publicação de case study (mesmo em
conferências) sobre unificar sistemas sem os substituir completamente
seria pertinente. Isto mostraria que o autor comparou a sua abordagem
com abordagens de outros. Se não encontrar um caso idêntico, pode
citar-se por exemplo o caso de implementação de um **portal clínico
unificado** nalgum hospital (p.ex., "Smith et al. 2020 implementaram um
portal integrador para médicos englobando vários sistemas heterogéneos e
relataram melhorias X"). Tais referências dariam mais força ao argumento
de que a solução proposta é inovadora mas tem paralelos na literatura,
validando a direção tomada.

Ao incorporar referências recentes destes domínios, a dissertação
beneficiará de um **enquadramento científico atualizado e abrangente**.
Isso não só preenche possíveis lacunas bibliográficas como também
oferece ideias para enriquecer a redação. Por exemplo, ao citar um
estudo real sobre EHRs e erros, pode-se aproveitar dados ou conclusões
desse estudo para **informar a discussão** do trabalho (confirmando ou
contrastando resultados). Igualmente, referências contemporâneas servem
para **justificar escolhas técnicas** -- por ex., "Optámos por uma
arquitetura de microserviços, uma abordagem recentemente recomendada em
sistemas de saúde (Shermock et al., 2023)". Em suma, explorar mais a
literatura de 2020-2025 nas áreas acima indicadas vai aumentar a
**densidade científica** do texto e demonstrar que o autor realizou um
**exercício exaustivo de revisão** até ao estado da arte atual.

## Conclusão e Recomendações Finais

A dissertação "Optimization and Standardization of Medication Management
Processes in Hospital Environments" apresenta uma base muito promissora,
cobrindo um problema relevante com uma solução tecnológica atual. Para
evoluir de 59 para **pelo menos 100 páginas** de conteúdo rico e
pertinente, as recomendações-chave desta análise podem ser resumidas da
seguinte forma:

- **Expandir o contexto prático:** Introduzir uma descrição abrangente
  do *status quo* no SCMVV -- sistemas existentes, fluxos de trabalho
  atuais e problemas identificados. Isto criará um alicerce sólido para
  todas as propostas de melhoria, permitindo ao leitor perceber **de
  onde se parte e para onde se quer ir**.

- **Aprofundar detalhes técnicos e científicos:** Em cada capítulo,
  adicionar **camadas de detalhe** -- seja explicando melhor certos
  conceitos (p.ex. standardização de processos, segurança de software),
  incluindo exemplos empíricos (resultados preliminares, casos
  ilustrativos), ou sustentando afirmações com dados da literatura.
  Garantir que aspetos importantes como análise de custo-benefício,
  resultados de desempenho/usabilidade e segurança de informação sejam
  abordados com a devida profundidade.

- **Incluir novos tópicos relevantes:** Incorporar secções sobre
  **Arquitetura atual dos sistemas**, **Resultados
  piloto/Preliminares**, **Gestão da mudança**, entre outras sugeridas,
  para cobrir todas as dimensões do projeto -- tecnológica, clínica,
  organizacional e económica. Isso tornará a dissertação mais
  **multi-facetada** e completa.

- **Fortalecer a metodologia e avaliação:** Manter o rigor metodológico
  demonstrado, complementando com indicações de **tratamento
  estatístico** dos dados e discutindo abertamente as limitações. Sempre
  que possível, apresentar evidências recolhidas no terreno (mesmo que
  parciais) para dar **credibilidade experimental** às melhorias
  reivindicadas.

- **Atualizar e ampliar a revisão literária:** Integrar referências
  recentes (2021--2024) nos tópicos chave -- segurança do doente,
  interoperabilidade, adoção de sistemas -- e quaisquer outras áreas
  conexas que suportem as decisões do projeto. Isso assegura que o
  trabalho reflete o **estado da arte atual** e não apenas fontes
  clássicas.

Implementando estas sugestões, espera-se que a dissertação não só
alcance a extensão pretendida, mas sobretudo **ganhe em qualidade
técnico-científica**, clareza e impacto. Cada recomendação dada foi
justificada com base nas melhores práticas académicas e exemplos do
próprio texto, para facilitar ao autor a sua aplicação. Em última
análise, ao preencher lacunas e enriquecer conteúdo, o autor estará a
elevar o trabalho para um nível superior -- apto a servir de referência
para outros projetos de modernização de sistemas de saúde, cumprindo
assim o duplo objetivo de **rigor científico e relevância prática**. Boa
escrita e sucesso na continuação deste
projeto\![\[1\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20Santa%20Casa%20da%20Miseric%C3%B3rdia,da%20Miseric%C3%B3rdia%20de%20Vila%20Verde)[\[2\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20literature%20review%20reveals%20several,most%20significant%20is%20deficient%20integra)

------------------------------------------------------------------------

[\[1\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20Santa%20Casa%20da%20Miseric%C3%B3rdia,da%20Miseric%C3%B3rdia%20de%20Vila%20Verde)
[\[2\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20literature%20review%20reveals%20several,most%20significant%20is%20deficient%20integra)
[\[3\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Table%201%3A%20Comparative%20analysis%20of,systems%20including%20legacy%20and%20modern)
[\[4\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=User%20Interface%20Desktop%20Only%20Web%2FMobile,Web%2FMobile%20Responsive%20Web)
[\[5\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=the%20raw%20metrics,for%20instance%2C%20should%20be%20interpreted)
[\[6\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=5)
[\[7\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=7%20Cost,ROI%20timeline%2C%20and%20payback%20period)
[\[8\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=This%20dissertation%20is%20organized%20to,Following%20this%20introduction)
[\[9\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=plementation%20and%20pilot%20study,these%20results%2C%20contextualizing%20them%20within)
[\[10\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Chapter%206)
[\[11\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Chapter%206)
[\[12\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Applications)
[\[13\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Execut%C3%A1vel)
[\[14\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=3)
[\[15\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=A%20primary%20technical%20objective%20is,The)
[\[16\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Integration%20Custom%20APIs%20HL7%2FFHIR%20HL7%2FFHIR,RESTful%2FHL7)
[\[17\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=4)
[\[18\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=organizational%20culture%20or%20patient%20outcomes,lacking%20a%20parallel%20control%20group)
[\[19\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=elicitation%20and%20a%20deep%20analysis,structured)
[\[20\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=by%20the%20goals%20in%20Figure,prescribing%20errors%20and%20over%2085)
[\[21\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Similarly%2C%20the%20projected%20improvements%20in,user%20satisfaction%20are%20expected%20to)
[\[22\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=3)
[\[23\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20proposed%20architecture%20will%20be,The%20Presentation%20Layer%2C%20built%20with)
[\[24\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=strategies%20were%20implemented%20for%20each,resistance%20to%20change%2C%20a%20comprehensive)
[\[25\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=change%2C%20a%20comprehensive)
[\[26\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=organizational)
[\[27\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20study%20protocol%20received%20full,All%20research%20activities)
[\[28\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=A%20critical%20sociotechnical%20risk%20is,The%20mitigation)
[\[29\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Key%20components%20to%20be%20implemented,system%20integrated%20with%20the%20hospi)
[\[30\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=a%20proactive%20safety%20model%2C%20identifying,%282021)
[\[31\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=fundamentally%20grounded%20in%20Design%20Science,DSR%29%29%2C%20an%20approach)
[\[32\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=To%20operationalize%20the%20DSR%20paradigm%2C,was%20employed%20Greenhalgh%20et%20al)
[\[33\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=,1)
[\[34\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Quantitative%20data%20focused%20on%20objective%2C,System%20perfor)
[\[35\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=Qualitative%20data%20provided%20rich%2C%20contextual,structured%20inter)
[\[36\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20system%E2%80%99s%20success%20was%20assessed,rooted%20in%20the%20Donabedian%20model)
[\[37\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=reduction%20in%20medication%20errors)
[\[38\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=infrastructures.%20The%20quasi)
[\[39\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=organizational%20culture%20or%20patient%20outcomes,lacking%20a%20parallel%20control%20group)
[\[40\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=The%20findings%20must%20be%20interpreted,The%20single)
[\[41\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=match%20at%20L1801%20specific%20implementation,of%20the%20findings%20to%20other)
[\[42\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=4)
[\[45\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=acceptance%20will%20be%20conducted%20using,The)
[\[46\]](file://file-THkgMZfcUY2nMnTJiYxGge#:~:text=into%20the%20cognitive%20ergonomics%20of,insights%20into%20minimizing%20cognitive%20load)
dissertation.pdf

<file://file-THkgMZfcUY2nMnTJiYxGge>

[\[43\]](https://www.jmir.org/2022/9/e38144/#:~:text=The%20Impact%20of%20Electronic%20Health,income%20health%20care%20settings)
The Impact of Electronic Health Record Interoperability on Safety \...

<https://www.jmir.org/2022/9/e38144/>

[\[44\]](https://bmchealthservres.biomedcentral.com/articles/10.1186/s12913-024-12060-2#:~:text=The%20influence%20of%20electronic%20health,was%20conducted%20of%20PubMed)
The influence of electronic health record design on usability and \...

<https://bmchealthservres.biomedcentral.com/articles/10.1186/s12913-024-12060-2>
