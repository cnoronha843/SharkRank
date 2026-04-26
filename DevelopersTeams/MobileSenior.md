# Guia de Engenharia Sênior: Mobile (React Native)
**Foco do Papel:** Resiliência Edge, Segurança de Cliente e Engenharia de Conversão.
**Versão:** 2.0 — Pós-Reunião de Alinhamento Estratégico (25/04/2026)

---

## 1. Estabilidade e Performance (Resiliência)
* **Nova Arquitetura (JSI/Fabric):** Compreensão profunda da nova arquitetura do React Native (TurboModules) para evitar gargalos na bridge do JavaScript, garantindo 60 FPS consistentes mesmo renderizando gráficos complexos de ELO.
* **Resolução de Conflitos Offline:** Uso obrigatório de `WatermelonDB` (decisão PRD v2.0 — `AsyncStorage` descartado). Implementar padrão de **Optimistic UI** (a interface reage imediatamente) com motor de resolução de conflitos para lidar com o cenário onde o professor marcou o ponto offline, mas o servidor diz que o set já havia acabado.
* **Memory Leaks & Profiling:** Uso de ferramentas como Flipper e Xcode Instruments para garantir que o app não acumule lixo na memória e feche sozinho (OOM - Out of Memory) após 4 horas de uso contínuo sob o sol na arena.

> **[DECISÃO #1 — ELO Provisório Local]:** O Mobile é responsável por implementar a fórmula ELO simplificada (`K-factor × resultado`) localmente. A fórmula e seus parâmetros são recebidos via JSON versionado (`elo_config_v{N}.json`) baixado na sync — o cálculo NUNCA é hardcoded. O resultado provisório é exibido com badge "✓ Provisório" e corrigido silenciosamente quando o push de reconciliação chega do backend (se delta ≤3 pontos).

## 2. Segurança e Anti-Fraude
* **Gestão de Segredos:** Tokens de API e chaves privadas nunca no código fonte. Uso obrigatório de `EncryptedSharedPreferences` (Android) e `Keychain` (iOS).
* **Prevenção de Fraude Competitiva:** Implementação de Root/Jailbreak detection e SSL Pinning. Um usuário mal-intencionado não pode interceptar a requisição e forjar um envio de "Vitória" para subir seu ELO artificialmente.

> **[DIRETRIZ CRUZADA — Backend → Mobile]:** O payload de criação de partida DEVE incluir o campo `idempotency_key` (sha256 de `match_id + timestamp`). Sem essa chave, o backend rejeita a requisição com HTTP 422. Isso impede reprocessamento duplicado em cenários de retry da sync queue.

## 3. UI/UX de Telemetria na Quadra

> **[DECISÃO #2 — Layout Fat-Finger]:** A tela de marcação de fundamentos segue regras absolutas:
> * **4 botões no MVP:** Saque, Recepção, Ataque, Erro Não-Forçado
> * **Layout:** Grid 2×2 no terço inferior da tela
> * **Dimensões:** `minHeight: 72dp`, `width: 100%` do container, `padding: 8dp` entre botões
> * **Contraste:** WCAG AAA obrigatório (leitura sob sol direto)
> * **Acessibilidade:** Cada botão DEVE ter `testID` no padrão `sr_btn_{fundamento}` (ex: `sr_btn_saque`)
> * **Responsividade:** Funcional de iPhone SE (375px) a iPad (1024px)

> **[DIRETRIZ CRUZADA — QA → Mobile]:** NENHUM componente de telemetria passa no code review sem o `testID` correspondente no padrão `sr_{tipo}_{nome}`. O QA tem poder de BLOQUEAR o merge.

## 4. Rentabilidade e Crescimento (Engenharia de Receita)
* **Gestão de Assinaturas In-App:** Integração com RevenueCat (escolha definitiva para MVP — Adapty avaliado pós-Fase 2). Tratamento rigoroso de *edge cases*: cartões recusados, downgrades, cancelamentos parciais e "grace periods".
* **Feature Flags e A/B Testing:** Código preparado para receber Remote Configs (PostHog para MVP, Firebase como fallback). A capacidade de liberar funcionalidades premium (ex: Dashboard Avançado) para percentuais controlados da base.

> **[DIRETRIZ CRUZADA — BA → Mobile]:** Os seguintes eventos de analytics DEVEM ser instrumentados no MVP:
> * `sr_match_started` — Partida iniciada
> * `sr_fundamento_marcado` (com parâmetro `tipo`) — Cada marcação de fundamento
> * `sr_match_finished` — Partida finalizada
> * `sr_sync_completed` — Sincronização concluída
> * `sr_elo_provisional_shown` — ELO provisório exibido
> * `sr_elo_reconciled` — ELO corrigido após push do backend

## 5. Shadow Mode (Feature Flag)

> **[DECISÃO #3 — Implementação]:** O mobile deve suportar a flag `SHADOW_MODE`:
> * Quando `true`: O tracker de fundamentos funciona normalmente, mas a tela de ranking/ELO é substituída por uma tela placeholder ("Em breve — seu ranking está sendo calibrado 🔬").
> * O ELO provisório é calculado e armazenado localmente, mas NÃO exibido.
> * O formulário pós-treino (3 perguntas) é exibido automaticamente ao finalizar a sessão para coleta de percepção do professor.

## 🛠️ Habilidades Técnicas Exigidas (Perfil de Contratação)
* **Linguagem:** TypeScript avançado.
* **Framework:** React Native & Expo (EAS Build, Expo Router).
* **Banco de Dados Local:** WatermelonDB (Offline-first, sincronização assíncrona).
* **Gerenciamento de Estado:** React Context API / Zustand.
* **Monetização:** Integração SDK RevenueCat (react-native-purchases).
* **Performance:** Otimização de renderização (React.memo, re-renders) para a tela de Tracker.
* **Navegação:** React Navigation (Bottom Tabs, Modais rápidos).