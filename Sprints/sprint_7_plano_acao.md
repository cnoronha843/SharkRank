# SharkRank — Sprint 7: "The Business Leap"
**Foco:** Inteligência de Dados, Retenção e Monetização.
**Duração Estimada:** 10 dias.

## 🎯 Objetivos Principais
1. **Valor Percebido:** Transformar dados brutos de partida em estatísticas visuais (Heatmaps).
2. **Monetização:** Ativar o paywall real para desbloqueio do ranking.
3. **Engajamento:** Sistema de medalhas para incentivar o uso diário.

---

## 🛠️ User Stories & Tasks

### [FEAT] Player Analytics V2 (Heatmap)
- **Backend:** Criar endpoint `/players/{id}/stats` que retorna agregados por fundamento.
- **Mobile:** Implementar gráfico de radar/teia no `PlayerProfileModal` para exibir habilidades.
- **UX:** Cores premium (Gold/Silver) para fundamentos onde o atleta é "Top 5% da Arena".

### [FEAT] Match Timeline & Share
- **Mobile:** Tela de "Resumo da Partida" pós-jogo com cronologia dos pontos.
- **Mobile:** Botão "Compartilhar no Story" com template visual (Placar + Tier do vencedor).

### [FEAT] Shark Pro & RevenueCat Sync
- **Backend:** Middleware para validar status `is_premium` antes de retornar o ranking oficial.
- **Mobile:** Tela de Paywall integrada com o sistema de compras (Apple/Google).

### [FEAT] Medalhas & Gamificação
- **Engine ELO:** Implementar lógica de "Achievements" (ex: 5 vitórias seguidas = Medalha "On Fire").
- **UI:** Exibir badges conquistados no Ranking e no Dashboard.

---

## 🏗️ Definição de Pronto (DoD)
- [ ] Endpoints de estatísticas respondendo em <200ms.
- [ ] Fluxo de assinatura testado em Sandbox (RevenueCat).
- [ ] Compartilhamento de imagem gerando template correto.
- [ ] Código versionado no branch `sprint-7`.

## 👥 Alocação da Equipe
- **Backend Senior:** API de Estatísticas e Middleware de Assinatura.
- **Mobile Senior:** Heatmaps, Timeline e Integração Paywall.
- **UX Designer:** Templates de compartilhamento e Badges.
- **QA:** Validar persistência de dados offline no novo histórico.
