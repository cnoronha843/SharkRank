# 🗺️ Roadmap de Evolução: SharkRank V2

Fazendo uma análise retroativa das nossas Sprints, a velocidade e a qualidade da entrega foram altíssimas. Aqui está o nosso "Raio-X":

### 🏆 O Que Já Conquistamos (O Alicerce)
*   **Sprints 1-4:** Base do app, ELO Engine matemático (Padrão Xadrez/Tênis) e integração mobile.
*   **Sprint 5:** Polimento Futevôlei B2C (Fundamentos reais: Shark Ataque, Coxa, Peito) e Setup de Partida (Teto, Vantagem). **[CONCLUÍDO]**
*   **Sprint 7:** Estrutura para Radar de Habilidades, Timeline da Partida e ShareCard (Estruturas de tela prontas). **[PARCIALMENTE CONCLUÍDO]**
*   **Sprint 8:** O diferencial tecnológico absoluto: **SharkVision AI** (Replays instantâneos sem custo de nuvem). **[CONCLUÍDO]**
*   **Sprint 9:** Estratégia **Custo Zero**. Migração para SQLite local e Deploy da API no Render (Tudo online sem gastar um centavo). **[CONCLUÍDO]**

---

O app hoje funciona perfeitamente como uma ferramenta de **Arbitragem + Replay**. Para torná-lo um **Produto Comercial** irresistível, precisamos planejar o futuro. 

## 🚀 Planejamento das Novas Sprints

### 🔋 Sprint 10: "A Blindagem" (Offline-First e Resiliência)
**Por que fazer?** As quadras de futevôlei costumam ter sinal de Wi-Fi ruim e o 4G oscila. O professor não pode parar a aula se a internet cair.
*   **Modo Offline Real:** Fazer o TrackerScreen funcionar 100% sem internet.
*   **Fila de Sincronização Automática:** Quando o celular do professor detectar Wi-Fi, o app empurra todas as partidas do dia para o Render automaticamente.
*   **Cache de Ranking:** Ao abrir o app sem rede, ele mostra o último ranking salvo localmente.

### 📸 Sprint 11: "O Loop Viral" (WhatsApp & Instagram)
**Por que fazer?** O crescimento orgânico (Custo Zero) vem do próprio jogador postando que é "Tier Ouro". Precisamos facilitar isso ao máximo.
*   **Finalizar o ShareCard (Sprint 7):** Integrar o botão nativo de compartilhar direto para o Instagram Stories (com o placar bonito e o Radar Chart do ELO).
*   **Exportar Replay (SharkVision):** Permitir que o professor envie o vídeo MP4 do "Shark Ataque" direto no WhatsApp do aluno em 1 clique (mantendo o tráfego local, sem custo de nuvem).
*   **Perfil Web Público:** Criar uma rota web básica (ex: `sharkrank.com/p/carlao`) para o jogador colocar na "Bio" do Instagram dele.

### 💰 Sprint 12: "O Motor Financeiro" (B2B Monetization)
**Por que fazer?** Transformar o engajamento em faturamento para você e para o dono da Arena.
*   **Ativar o Paywall Real (RevenueCat):** Ligar a chave do sistema de pagamentos. Donos de Arena podem assinar pelo celular (Apple Pay / Google Pay).
*   **Dashboard da Arena:** Uma tela exclusiva para o dono ver: Quantas partidas ocorreram no mês, qual aluno joga mais, e fluxo de caixa.
*   **Shadow Mode Real:** Arenas que não pagam a mensalidade ainda podem usar o Tracker, mas o Ranking fica "borrado" (bloqueado) no celular dos alunos.

### ⚙️ Sprint 13: "Polimento Profissional" (Deploy & Analytics)
*   **EAS Build Pipeline:** Automatizar a geração dos arquivos de instalação (APK/IPA).
*   **Integração PostHog:** Monitorar secretamente onde os usuários clicam mais para guiar as próximas melhorias.
*   **Notificações Push:** "O Carlão roubou sua posição Ouro no Ranking! Volte para a quadra."
