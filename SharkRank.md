# 🦈 SharkRank - Futevôlei Analytics

**Telemetria e nivelamento técnico de atletas de futevôlei**

## Como Executar

Abra `SharkRank/index.html` diretamente no navegador. É uma PWA mobile-first — funciona offline e pode ser instalada como app.

## Funcionalidades

| Tela | Descrição |
|------|-----------|
| 🏠 Dashboard | Visão geral: stats, atleta destaque com radar chart, distribuição por tier |
| 👥 Atletas | Lista de atletas com busca e filtro por tier, adicionar novos |
| ⚡ Avaliação | Avaliar 8 habilidades técnicas com sliders (0-100) |
| 🏆 Ranking | Leaderboard geral com posições e badges de tier |
| 👤 Perfil | Radar completo, barras de skills, partidas, win rate |
| ⚙️ Config | Exportar/importar dados JSON, reset |

## Sistema de Ranking

| Tier | Rating | Emoji |
|------|--------|-------|
| Shark | 90-100 | 🦈 |
| Diamante | 80-89 | 💎 |
| Ouro | 70-79 | 🥇 |
| Prata | 55-69 | 🥈 |
| Bronze | 40-54 | 🥉 |
| Peixe | 0-39 | 🐟 |

## 8 Habilidades Avaliadas

🏐 Saque · 💥 Ataque · 🛡️ Defesa · 🎯 Levantamento · ⚡ Controle · 🕸️ Jogo de Rede · 💪 Físico · 🧠 Tático

## Stack

- HTML5 + CSS3 + JavaScript Vanilla
- Canvas API (gráficos radar, ring, barras)
- localStorage (persistência)
- PWA manifest (instalável)
- Zero dependências externas