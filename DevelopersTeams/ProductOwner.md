# Guia de Engenharia Sênior: Analista de Negócios (BA / PM)
**Foco do Papel:** Viabilidade Econômica, Orientação a Dados (Data-Driven) e Tradução de Requisitos.
**Versão:** 2.0 — Pós-Reunião de Alinhamento Estratégico (25/04/2026)

---

## 1. Descoberta de Produto (Product Discovery) e Validação
* **Validação Contínua:** O BA Sênior não assume que sabe o que o cliente quer. Ele estrutura pesquisas de campo e entrevistas de validação com donos de arenas e professores, transformando hipóteses em dados quantitativos antes do desenvolvimento começar.
* **Fatiamento de Valor (Slicing):** Habilidade de quebrar épicos gigantes (ex: "Sistema de Campeonatos") em entregas de extremo valor e baixo esforço técnico. O foco é colocar a funcionalidade na rua rapidamente para validar a aceitação do mercado (MVP rigoroso).
* **Mapeamento de Jornada (User Story Mapping):** Desenhar a jornada ponta a ponta do professor e do aluno, identificando gargalos onde o app pode salvar tempo ou gerar engajamento.

> **[DECISÃO #2 — Fundamentos Validados]:** O BA confirmou em entrevistas de campo que professores marcam 6 fundamentos, mas o MVP foi cortado para 4 (Saque, Recepção, Ataque, Erro) por restrição de UX fat-finger. O BA é responsável por:
> 1. Coletar feedback dos professores-piloto sobre a ausência de Bloqueio e Levantamento.
> 2. Medir se a falta desses fundamentos impacta a percepção de valor do produto.
> 3. Produzir um Business Case para a Fase 1.5 com dados quantitativos do Shadow Mode.

## 2. Engenharia de Receita e Modelagem de Negócio
* **Otimização de Unit Economics:** Monitoramento obsessivo do CAC e LTV. Se o app cobra R$ 30/mês e o aluno desiste no segundo mês, o negócio é inviável. O BA precisa identificar *por que* ocorre o *churn* e propor soluções na raiz.
* **Pricing e Empacotamento:** Definir a estratégia de precificação dinâmica:
    * **B2B (Arena):** Plano por volume de alunos ativos na arena. Faixas sugeridas: Até 20 alunos (R$ 99/mês), 21-50 (R$ 199/mês), 51+ (R$ 349/mês).
    * **B2C (Atleta):** Plano freemium com desbloqueio de ranking regional avançado e Cartão de Atleta premium.
* **Business Cases Obrigatórios:** Nenhuma feature das Fases 3 e 4 (wearables, IA) entra no backlog ativo sem Business Case aprovado provando ROI em novos assinantes.

## 3. Qualidade de Requisitos e Alinhamento com a Engenharia
* **Critérios de Aceite em BDD:** As histórias de usuário devem ter critérios claros no formato *Given, When, Then*, facilitando a automação pelo QA.
* **Requisitos Não-Funcionais como Valor de Negócio:** Latência de API e consumo de bateria não são "problemas técnicos". Se o app gasta muita bateria na quadra, o usuário desinstala. O BA prioriza estabilidade no *backlog* com o mesmo peso de uma feature nova.
* **Definição de Métricas de Sucesso (KPIs):** Toda história entregue precisa de um indicador claro.

> **[DIRETRIZ CRUZADA — BA → Mobile]:** O BA define os eventos de analytics obrigatórios no MVP (lista completa no MobileSenior.md, Seção 4). Todo evento deve ser instrumentado antes do launch.

## 4. Analítica e Tomada de Decisão (Growth)
* **Instrumentação de Produto:** Eventos rastreados via PostHog (escolha definitiva para MVP). Lista mínima: `sr_match_started`, `sr_fundamento_marcado`, `sr_match_finished`, `sr_sync_completed`, `sr_elo_provisional_shown`, `sr_elo_reconciled`.
* **Análise de Funil e A/B Testing:** Identificar onde os usuários desistem do fluxo de assinatura e criar hipóteses de testes A/B.

## 5. Shadow Mode (Calibração de Pesos)

> **[DECISÃO #3 — Responsabilidade do BA]:**
> * **Formulário pós-treino:** O BA redige 3 perguntas objetivas aplicadas ao professor após cada sessão:
>     1. "De 1 a 5, quão precisa foi a avaliação dos seus alunos hoje?"
>     2. "Qual aluno você acha que jogou melhor nesta sessão?" (resposta aberta)
>     3. "Você usaria este app para dar nota oficial aos seus alunos?" (Sim/Não/Talvez)
> * **Relatório de calibração:** Após 30 partidas/arena, o BA cruza ELO calculado vs. resposta do professor e produz relatório com recomendações de ajuste de pesos para o Backend.
> * **Gate de lançamento:** O MVP SÓ é lançado comercialmente após o BA aprovar que a divergência ELO vs. percepção é aceitável (≤15% de discordância).

## 🛠️ Habilidades Técnicas Exigidas (Perfil de Contratação)
* **Gestão de Backlog:** Jira, Trello, Linear (Scoping de MVP e fatiamento de Sprints).
* **Metodologias Ágeis:** Scrum, Kanban, condução de plannings e retrospectivas.
* **Análise de Dados:** Mixpanel, Google Analytics ou Metabase para decisões orientadas a dados (Data-driven).
* **Design de Produto:** Conhecimento básico em Figma para wireframes e aprovação de fluxos.
* **Visão de Negócio:** Entender Funil SaaS (AARRR) e conversar tanto com Devs quanto com o time de Vendas.