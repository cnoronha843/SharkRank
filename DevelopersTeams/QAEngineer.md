# Guia de Engenharia Sênior: QA, SDET e Infraestrutura
**Foco do Papel:** Shift-Left Testing, CI/CD Inquebrável e Otimização de Custos (FinOps).
**Versão:** 2.0 — Pós-Reunião de Alinhamento Estratégico (25/04/2026)

---

## 1. Estabilidade e Automação (SDET Core)
* **Arquitetura de Testes em Pirâmide Escalonável:** Testes unitários rodando em milissegundos, testes de API (PyTest) validando os contratos matemáticos do motor ELO, e automação E2E UI focada estritamente no caminho crítico do negócio.
* **Testes de Contrato (Pact):** Garantir que o Backend em Python não quebre o Frontend em React Native ao mudar a estrutura de um JSON, bloqueando o *merge* automaticamente no repositório.
* **Pipelines de CI/CD Robustas:** GitHub Actions (escolha definitiva para MVP) que constroem, assinam e distribuem o app para o TestFlight e Google Play Console automaticamente.

> **[DECISÃO #1 — Teste de Contrato Matemático ELO]:** O QA é responsável por criar e manter um teste de contrato que:
> 1. Recebe um dataset de 100 partidas sintéticas com fundamentos pré-definidos.
> 2. Roda a fórmula simplificada (mesma do mobile) e a fórmula completa (mesma do backend).
> 3. Calcula o delta entre os dois resultados para cada jogador.
> 4. **Critério de aceite:** `|delta| ≤ 5 pontos` em `≥ 95%` dos casos.
> 5. Se o teste falhar, a pipeline de CI é bloqueada e o Tech Founder é notificado.
> 
> **Frequência:** Roda a cada commit no repositório do backend E quando o `elo_config_v{N}.json` é atualizado.

## 2. Padrão de testID e Automação E2E

> **[DECISÃO #2 — Convenção de testID]:** O QA define e audita a nomenclatura obrigatória:
> * **Padrão:** `sr_{tipo}_{nome}` 
> * **Tipos válidos:** `btn`, `input`, `screen`, `card`, `modal`, `label`, `list`
> * **Exemplos MVP:**
>     * `sr_btn_saque`, `sr_btn_recepcao`, `sr_btn_ataque`, `sr_btn_erro`
>     * `sr_screen_tracker`, `sr_screen_dashboard`, `sr_screen_ranking`
>     * `sr_input_placar_a`, `sr_input_placar_b`
>     * `sr_btn_finalizar_partida`, `sr_btn_criar_jogo`
> * **Regra de merge:** PR sem `testID` nos componentes de telemetria é BLOQUEADO pelo QA na revisão.
> * **Automação E2E:** Detox com taps exclusivamente via `testID`. Coordenadas de tela são PROIBIDAS.
> * **Fluxo crítico automatizado:** `Criar Jogo → Marcar 18 Pontos (alternando fundamentos) → Finalizar → Verificar ELO Provisório → Simular Sync → Verificar Reconciliação`.

## 3. Segurança Contínua (DevSecOps)
* **SAST e DAST no Pipeline:** SonarQube para análise estática e varredura de vulnerabilidades em dependências a cada commit. Se uma biblioteca NPM tiver falha de segurança conhecida (CVE), a pipeline aborta.
* **Infraestrutura Imutável:** Terraform para provisionar PostgreSQL e servidores de homologação. Infraestrutura versionada em código.

## 4. Rentabilidade e FinOps
* **Redução de Time-to-Market (TTM):** Testes em paralelo para feedback ao desenvolvedor em <5 minutos.
* **Otimização de Ambientes:** Scripts que ligam ambientes de homologação na nuvem às 8h e destroem às 19h, reduzindo custo de cloud.

> **[DIRETRIZ CRUZADA — QA → Backend]:** O QA monitora o endpoint `/health/elo-accuracy` do Backend. Se a divergência média ELO provisório vs. definitivo ultrapassar 5 pontos por 24h consecutivas, um alerta Slack é disparado automaticamente para o Tech Founder e o Backend.

## 5. Shadow Mode (Validação)

> **[DECISÃO #3 — QA no Beta]:** Durante o Shadow Mode:
> * O QA roda smoke tests semanais no build de produção dos pilotos.
> * Monitora crash rate via Sentry/Crashlytics — SLA: <0.5% de sessões com crash.
> * Valida que os dados de telemetria dos pilotos estão chegando no backend corretamente (teste de integridade da sync queue).
> * Acompanha o formulário pós-treino para garantir que ≥80% dos professores-piloto estão respondendo.

## 🛠️ Habilidades Técnicas Exigidas (Perfil de Contratação)
* **Automação Backend:** Pytest, coverage de código para testes de unidade do motor ELO.
* **Automação Mobile E2E:** Detox ou Appium para simular jornadas reais do professor no app.
* **Testes de API:** Postman, Insomnia, scripts automatizados de carga.
* **CI/CD:** Configuração de GitHub Actions para rodar testes a cada Pull Request.
* **Visão Sistêmica:** Criar cenários de "Corner Cases" (Ex: Partidas encerradas por WO, desempate no Cap máximo, queda de conexão no envio da partida).