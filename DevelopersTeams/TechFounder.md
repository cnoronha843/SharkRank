# Product Requirements Document (PRD) & Architecture Blueprint
**Produto:** SharkRank — App de Telemetria e Nivelamento para Futevôlei
**Visão:** Dominar o nicho B2B2C de esportes de areia, entregando o primeiro motor de nivelamento ELO baseado em dados para arenas e organizadores de torneios. 
**Meta de MRR (Monthly Recurring Revenue):** R$ 5k a R$ 10k na fase inicial de tração.
**Versão:** 2.0 — Pós-Reunião de Alinhamento Estratégico (25/04/2026)

---

## 1. Visão de Mercado e Oportunidade (Business & Strategy)
O mercado de futevôlei atingiu um platô de amadorismo na gestão de dados. Arenas e professores perdem tempo e geram atritos com alunos devido a avaliações subjetivas de nível técnico. 

A solução não é apenas um app de "marcar pontos", mas um **Ecossistema de Validação Técnica**. Ao vender a plataforma para o professor (B2B), ganhamos o aluno (B2C) como usuário passivo, que futuramente pagará para ter análises profundas do seu próprio jogo e um "passaporte" do seu nível técnico validado para se inscrever em campeonatos.

> **[DIRETRIZ CRUZADA — Vendas → Produto]:** O ICP (Ideal Customer Profile) definido pelo Gerente de Vendas é: *arenas com ≥3 quadras, ≥2 torneios/ano e professores fixos*. O produto deve ser projetado para o workflow desse perfil específico, não para o jogador avulso da praia.

## 2. Arquitetura de Software (Software Architecture)
A arquitetura deve suportar o crescimento rápido e a latência de redes móveis instáveis (típico de arenas abertas).

* **Frontend Mobile (React Native + Expo):** Escolha estratégica para iterar rápido no iOS e Android. 
* **Abordagem Offline-First:** Redes de celular falham na praia e em complexos esportivos. O app deve usar `WatermelonDB` (escolha definitiva — `AsyncStorage` descartado por falta de motor de resolução de conflitos) para salvar os inputs da partida localmente e criar uma fila de sincronização (Sync Queue) em background assim que o aparelho detectar conexão.
* **Backend & Lógica (Python + FastAPI):** Microsserviço isolado para rodar o motor ELO completo e as matrizes matemáticas de pesos de fundamentos. FastAPI é a escolha final (Django descartado por overhead desnecessário no MVP).
* **Banco de Dados:** PostgreSQL com Row-Level Security (RLS) habilitado desde o Dia 1 para isolamento multi-tenant.

> **[DECISÃO #1 — ELO Dual-Layer]:** O cálculo ELO roda em DOIS locais:
> 1. **Mobile (ELO Provisório):** Fórmula simplificada (K-factor × resultado) executada localmente, gerando feedback instantâneo para a demo de vendas e para o professor na quadra. Exibe badge "✓ Provisório".
> 2. **Backend (ELO Definitivo):** Cálculo completo com pesos de fundamentos, reconciliado via push silencioso. Se delta <3 pontos, UI corrige silenciosamente. Se delta >3, notifica o usuário.
> 
> **Contrato de tolerância:** Divergência máxima ≤5 pontos em 95% dos casos — validado por teste de contrato do QA.

## 3. Engenharia de Requisitos e Qualidade (QA/SDET Approach)
A confiabilidade do input de dados na beira da quadra é o nosso SLA crítico. O sistema não pode travar.

* **Requisitos Não-Funcionais de UI/UX:**
    * **High-Contrast Mode:** A paleta de cores deve ter contraste WCAG AAA para leitura sob luz solar direta.
    * **Fat-Finger Friendly (Regras Absolutas):** Botões de marcação de fundamentos devem seguir:
        * `minHeight: 72dp` (absoluto, não percentual)
        * `minWidth: 100%` da largura do container
        * `padding: 8dp` entre botões
        * Layout grid 2×2 no terço inferior da tela
        * Funcional de iPhone SE (375px) a iPad (1024px) sem quebra

> **[DECISÃO #2 — 4 Fundamentos no MVP]:** O MVP rastreia SOMENTE: **Saque, Recepção, Ataque e Erro Não-Forçado**. Quatro botões em grid 2×2. Bloqueio e Levantamento entram na Fase 1.5 via menu expansível "Mais Fundamentos" ativável nas configurações do app.

* **Shift-Left Testing Base:** Todo componente crítico deve nascer com `testID` padronizado seguindo a convenção `sr_{tipo}_{nome}` (ex: `sr_btn_saque`, `sr_input_placar`, `sr_screen_dashboard`). Obrigatório para iOS e Android.
* **Cobertura:** Pipeline de CI/CD com Detox para o fluxo crítico: *Criar Jogo → Marcar 18 Pontos → Finalizar e Sincronizar*. Taps sempre via `testID`, nunca por coordenada.

> **[DIRETRIZ CRUZADA — QA → Mobile]:** O Mobile é BLOQUEADO de fazer merge de qualquer componente de telemetria sem o `testID` correspondente aprovado pelo QA. A nomenclatura `sr_btn_{fundamento}` é obrigatória.

## 4. O Motor de Nivelamento (Core Business Logic)
O algoritmo multicritério é a nossa propriedade intelectual. Ele processa:
1.  **Fundamentos e Pesos (MVP):**
    * Saque Ace = +1.5
    * Recepção Perfeita = +1.5
    * Ataque Vencedor = +1.2
    * Erro Não-Forçado = -1.0
    * *(Bloqueio e Levantamento: pesos a definir na Fase 1.5)*
2.  **Rating Competitivo Adaptado:** Modelo ELO adaptado para duplas. K-factor dinâmico:
    * Partidas 1-10: K=40 (aceleração de nivelamento)
    * Partidas 11-30: K=24 (estabilização)
    * Partidas 31+: K=16 (maturidade)

> **[DIRETRIZ CRUZADA — Backend → Mobile]:** O Backend publica a fórmula ELO simplificada como um JSON de configuração versionado (`elo_config_v{N}.json`) que o mobile baixa na sync. Se os pesos mudarem após calibração, o mobile atualiza sem deploy de app.

## 5. Roadmap de Features Baseado em Tendências (Product Vision)

* **Fase 0 (Shadow Mode — 90 dias):** Beta fechado em 5 arenas-piloto. ELO calcula em background, invisível para o professor. Coleta de dados para calibração de pesos.
* **Fase 1 (MVP — Retenção B2B):** Tracker manual de 4 fundamentos, cronômetros de descanso e Dashboard ELO provisório.
* **Fase 1.5 (Expansão de Fundamentos):** Toggle "Mais Fundamentos" adicionando Bloqueio e Levantamento. Configurável por arena.
* **Fase 2 (Growth B2C & Social Proof):** "Cartão de Atleta" exportável para Instagram Stories. Gamificação com categorias (Iniciante → Intermediário → Avançado → Pro).
* **Fase 3 (Tendência de Mercado - Integração Wearable):** Conexão via HealthKit/Google Fit para cruzar eficiência técnica com batimentos cardíacos.
* **Fase 4 (Visão de Futuro - IA/Computer Vision):** Substituir input manual via Pose Estimation.

> **[DIRETRIZ CRUZADA — BA → Tech Founder]:** Nenhuma feature das Fases 3 e 4 entra no backlog ativo sem Business Case financeiro aprovado pelo BA provando ROI em novos assinantes.

## 6. Go-To-Market e Validação de Campo

> **[DECISÃO #3 — Shadow Mode como Beta Fechado]:**
> * **Quem:** Até 5 arenas-piloto em Blumenau e Vale do Itajaí.
> * **Duração:** 90 dias gratuitos.
> * **Contrato:** Beta tester assinado. Autorização de uso de dados anônimos. Compromisso de ≥12 sessões de uso.
> * **Coleta:** Após 30 partidas/arena, o BA cruza ELO calculado vs. percepção subjetiva do professor (formulário pós-treino de 3 perguntas).
> * **Feature Flag:** `SHADOW_MODE=true` — ELO calcula mas não exibe.
> * **CRM:** Hunter cadastra como "Pipeline — Piloto Ativo". Conversão para pagante após 90 dias é o primeiro KPI de vendas.
> * **Deliverable de Vendas:** O Hunter coleta depoimento em vídeo de cada professor-piloto para uso como prova social no GTM pós-beta.

## 7. Contratos de Interface (API Contracts)

> **[NOVA SEÇÃO — Exigência do QA + Mobile + Backend]:**

### 7.1 Payload de Criação de Partida (Mobile → Backend)
```json
{
  "match_id": "uuid-v4 (gerado no mobile)",
  "arena_id": "uuid",
  "idempotency_key": "sha256(match_id + timestamp)",
  "team_a": ["player_uuid_1", "player_uuid_2"],
  "team_b": ["player_uuid_3", "player_uuid_4"],
  "sets": [
    {
      "score_a": 18,
      "score_b": 15,
      "events": [
        {"type": "saque_ace", "player": "player_uuid_1", "timestamp": "ISO8601"},
        {"type": "erro_nao_forcado", "player": "player_uuid_3", "timestamp": "ISO8601"}
      ]
    }
  ],
  "elo_provisional": {"player_uuid_1": 1523, "player_uuid_2": 1498},
  "client_version": "1.0.0",
  "elo_config_version": "v1"
}
```

### 7.2 Resposta de Reconciliação ELO (Backend → Mobile via Push)
```json
{
  "match_id": "uuid-v4",
  "elo_definitive": {"player_uuid_1": 1525, "player_uuid_2": 1496},
  "delta": {"player_uuid_1": +2, "player_uuid_2": -2},
  "notify_user": false
}
```

> **Regra:** Se `|delta| > 3` para qualquer jogador, `notify_user = true`.

## 🛠️ Habilidades Técnicas Exigidas (Perfil de Contratação)
* **Arquitetura de Sistemas:** Desenho de arquiteturas escaláveis e resilientes (C4 Model, Cloud Native).
* **Liderança Técnica:** Code Review, definição de padrões de código (PEP8, ESLint) e mentoria de seniores.
* **Infraestrutura e DevOps:** Gestão de custos na nuvem (AWS, Fly.io, Supabase), DNS, SSL, escalonamento.
* **Estratégia Tecnológica:** Escolha de stack (Decidir entre Expo vs Bare RN, FastAPI vs Django) com base em tempo de mercado (Time-to-market).
* **Segurança Global:** Prevenção contra engenharia reversa, vazamento de dados e conformidade (LGPD).