# 🤝 Reunião Geral de Estratégia: Operação Custo Zero 🚀

**Objetivo:** Lançar e demonstrar o SharkRank para as arenas sem gastar 1 centavo inicial.

## 👥 Análise por Profissão:

### ⚡ Tech Founder:
- **Infraestrutura:** Migrar o backend para o **Render (Free Tier)** ou **Railway**. Banco de dados local/in-memory para o MVP para evitar custos de RDS.
- **Vídeo (SharkVision):** Manter o armazenamento dos replays **exclusivamente no celular do professor/arena**. Não faremos upload para a nuvem agora para economizar em S3 e largura de banda.

### 🎨 UX/UI Designer:
- **Design de Valor:** Focar 100% no **Share Card**. Se o atleta compartilha um vídeo com a marca da arena e o logo do SharkRank, a arena ganha marketing grátis e nós ganhamos visibilidade sem anúncios pagos.
- **Viralidade:** O design deve ser tão bonito que o atleta *queira* postar no Instagram.

### 🔍 QA Engineer:
- **Teste de Carga Zero:** Garantir que o app funcione offline (marcação de pontos) e sincronize apenas o essencial quando houver Wi-Fi.
- **Demo Mode:** Criar um "Modo Demonstração" que não precise de internet para o usuário mostrar para donos de arenas.

### 💻 Frontend Engineer:
- **Distribuição:** Usar o **Expo Go** para demonstrações presenciais rápidas. Para o lançamento "soft", usar o **EAS Build (Free Tier)** para gerar o APK/IPA e distribuir via link direto (Firebase App Distribution).
- **PWA:** Avaliar transformar o dashboard em um PWA para acesso via navegador sem passar pela App Store (economizando a anuidade de $99).

---

## 🗺️ Roadmap Custo Zero (Sprint 9)

1.  **Deploy Free Backend:** Migrar o banco para SQLite ou similar persistente em volume gratuito.
2.  **Offline-First:** O SharkVision deve funcionar 100% sem internet (já está encaminhado).
3.  **Local Replay Sharing:** Implementar a função "Enviar Replay para Atleta" via WhatsApp (envio direto do arquivo local) em vez de link de streaming.
4.  **Organic Branding:** Inserir a marca d'água da Arena em todos os replays gerados.

---
### 📝 Notas da Equipe:
"Não precisamos de servidores caros se o poder de processamento e armazenamento (vídeo) estiver no celular do usuário. O SharkRank vai rodar na 'infraestrutura' do próprio cliente."
