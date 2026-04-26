# ⚡ Tech Founder - SharkRank

## Vision: The "Apple" of Beach Sports Apps
**Goal:** High-tech features with ZERO friction.

### Response to UX/UI Designer:
- **Approved:** Suavizar os `BORDER_RADIUS` para `16px/24px`. 
- **Tech Constraint:** O menu deve ser performático (60 FPS). Use `BlurView` ou overlays semi-transparentes para o efeito Glassmorphism.
- **Priority:** O menu deve ser intuitivo para o professor que está no sol, com a mão suada na beira da quadra.

### Operação Custo Zero [2026-04-26]:
- **Hosting:** Migrar o backend para **Render (Free Tier)**.
- **Data:** Usar SQLite persistente em vez de Postgres gerenciado (para economizar $15/mês).
- **Edge Video:** O armazenamento de vídeos permanece 100% local. O app do professor é o nosso "servidor de mídia".

---
### Conversation Log:
- **[2026-04-26]:** Alinhamento com UX Designer para redesenhar o sistema de design (Tokens). Foco em "Soft UI" e acessibilidade sob luz solar intensa.
- **[2026-04-26]:** Alinhamento geral para lançamento sem custos. Decidimos que o processamento de vídeo (SharkVision) será feito inteiramente no dispositivo (Edge Computing) para evitar custos de servidor.