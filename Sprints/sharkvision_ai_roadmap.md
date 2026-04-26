# 🦈 SharkVision AI — Estratégia de Visão Computacional
**Objetivo:** Automatizar a marcação de pontos e gerar replays instantâneos via Câmera.

---

## 📅 Roadmap de Implementação

### 🚀 Sprint 8: "The Replay Engine" (Semana 15-16)
**Foco:** Gravação otimizada e Buffer de Replay.
- [ ] **Mobile:** Implementar `expo-camera` com buffer circular de 15 segundos.
- [ ] **Mobile:** Lógica "Action-Trigger": Ao clicar em um fundamento, o app extrai os últimos 10s do buffer e salva como arquivo `.mp4`.
- [ ] **UI:** Mini-player de replay instantâneo no `TrackerScreen`.
- [ ] **Cloud:** Upload assíncrono desses clips para AWS S3/Google Cloud Storage.

### 🔜 Sprint 9: "The Data Factory" (Semana 17-18)
**Foco:** Lote de dados para Treinamento de IA.
- [ ] **Mobile:** Tela "Rever Meus Pontos" onde o atleta assiste seus clips.
- [ ] **Gamificação:** Atleta ganha "XP" ao confirmar se a IA (ou o professor) marcou o fundamento correto no vídeo.
- [ ] **Backend:** Estrutura de Dataset (Vídeo + Label de Fundamento + Coordenadas de Jogadores).

### 🔜 Sprint 10: "Auto-Shark" (Semana 19-20)
**Foco:** Deploy do Modelo de Visão Computacional.
- [ ] **AI:** Integração com MediaPipe (Pose Tracking) para detectar a altura do salto no Shark Ataque.
- [ ] **AI:** Modelo YOLO (You Only Look Once) customizado para rastrear a bola de futevôlei.
- [ ] **Edge Computing:** Rodar modelos leves de detecção diretamente no celular (TensorFlow Lite).

---

## 💰 Modelo de Negócio (Monetização)
- **Plano Free/Pro:** Sem vídeo.
- **Plano Shark Pro Max:** Gravação de até 10 replays por partida.
- **Add-on Arena:** R$ 1,00 por "Clip de IA" processado (opcional para a arena repassar ao atleta).

---

## ⚠️ Riscos Técnicos
1. **Aquecimento:** Gravar vídeo enquanto roda lógica de ELO e UI complexa pode esquentar o tablet.
2. **Latência:** O upload de muitos clips pode congestionar o Wi-Fi da arena.
3. **Privacidade:** Necessário Termo de Uso claro sobre gravação de imagem na quadra.
