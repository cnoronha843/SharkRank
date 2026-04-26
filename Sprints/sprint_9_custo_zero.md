# 🦈 Sprint 9: Operação Custo Zero & Crescimento Viral

**Objetivo:** Preparar o SharkRank para o mercado real com infraestrutura gratuita e marketing orgânico.

## 🎯 Objetivos Principais
1.  **Infraestrutura Free-Tier:** Migrar backend para SQLite e Deploy no Render.
2.  **SharkVision Branding:** Adicionar marca d'água automática em replays.
3.  **Viral Share:** Otimizar o compartilhamento direto de vídeos via WhatsApp/Instagram.
4.  **User Onboarding:** Fluxo de cadastro de "Estreantes" 100% fluido.

---

## 🛠️ Detalhamento das Tarefas

### 1. Backend & Infra (Tech Founder)
- [ ] **Persistência SQLite:** Migrar `players_db` e `matches_db` de memória para SQLite para manter dados após reinício do servidor gratuito.
- [ ] **Render Deploy:** Configurar `Dockerfile` e realizar deploy no tier gratuito do Render.com.
- [ ] **API Health:** Garantir latência baixa mesmo no plano gratuito.

### 2. SharkVision AI (Frontend Engineer)
- [ ] **Watermark Overlay:** Adicionar uma `View` sobreposta ao player de replay com o nome da Arena e logo SharkRank.
- [ ] **WhatsApp Direct Share:** Implementar o envio do arquivo `.mp4` local diretamente para o contato do atleta.
- [ ] **Buffer Cleanup:** Rotina para limpar vídeos antigos e não marcados para não lotar o celular do professor.

### 3. Design & Experiência (UX Designer)
- [ ] **Soft UI Polish:** Revisar todos os `BORDER_RADIUS` de botões e cards para o padrão 16px/24px.
- [ ] **Micro-interações:** Adicionar feedback tátil (haptics) ao marcar pontos e abrir replays.
- [ ] **Share Card v2:** Adicionar o "Ranking Semanal" no card de compartilhamento.

### 4. Qualidade & Validação (QA Engineer)
- [ ] **Teste de Stress Offline:** Verificar comportamento do app sem internet por longos períodos.
- [ ] **Auditoria de Dados:** Garantir que o ELO dos "Estreantes" está evoluindo corretamente (de 1000.0 para cima/baixo).

---

## 📅 Cronograma Estimado
- **Dias 1-2:** Migração de Banco e Deploy.
- **Dias 3-5:** Motor de Vídeo e Marca d'água.
- **Dias 6-7:** Polish de UI e Testes de Campo.

---
**Status:** 🚀 Planejada (Aguardando início)
**Responsável:** Equipe SharkRank (DevelopersTeams)
