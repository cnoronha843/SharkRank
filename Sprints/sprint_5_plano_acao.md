# 🦈 Reunião de Diretoria: Sprint 5 (O Polimento B2C)

## 1. O Debate Estratégico (O Conselho)

**👑 Tech Founder / PO**
> "O feedback do cliente foi cirúrgico. Nós criamos uma base B2B forte com o RevenueCat e RLS, mas a experiência *in-game* (na areia) ainda estava genérica. Trazer os fundamentos do Futevôlei (Coxa, Peito, Shark Ataque), regras de "vai a dois" (vantagem) e dar uma página de perfil para cada atleta ver suas Vitórias/Derrotas é o que vai gerar engajamento diário. Vamos aprovar todo o escopo, mas precisamos ser inteligentes em como o Professor lança isso sem perder velocidade."

**📱 Arquiteto Mobile (React Native)**
> "O maior desafio aqui é o **TrackerScreen**. Mapear *quem* da dupla fez o ponto, *se* foi erro ou ponto direto, e com *qual* fundamento (Cabeça, Chapa, etc.) vai poluir a tela se não fizermos direito. 
> *Ação:* Vou criar um **Modal de Ação Rápida**. O professor clica em "+ Ponto Time A", sobe um *bottom sheet* perguntando 'Quem foi?' (Carlão ou Pablo) e 'Como?' (Shark Ataque, Chapa, Erro do adversário). Também vou consertar o bug da `Tab Bar` (o `CenterTabIcon` estava ficando ativado para todas as rotas) e trocar os emojis 🏐 por ⚽."

**⚙️ Arquiteto Backend (Python)**
> "As mudanças impactam profundamente o banco.
> 1. **Categorias de ELO:** Preciso atualizar a lógica de faixas (Estreante, Iniciante, Intermediário, Bronze, Prata, Ouro) no `elo.py`.
> 2. **Setup de Partida:** O modelo `Match` precisará gravar as regras do jogo: `max_sets`, `points_to_win`, `win_by_two` e `point_cap`.
> 3. **Perfis:** Vou criar o endpoint `GET /players/{id}/stats` que calcula as vitórias/derrotas totais, e o array completo das parciais dos sets (ex: 18x16, 18x12)."

**🐛 QA/SDET Sênior**
> "Atenção máxima à lógica de encerramento da partida! Com a regra da 'diferença de 2 pontos' e o 'cap máximo', os testes de unidade no frontend e no backend vão ter que simular placares apertados (ex: 17x17 num jogo de 18). Precisamos garantir que o jogo só mostre a tela de 'Fim de Jogo' quando a matemática de vantagem fechar, ou o usuário usar o novo **Botão de Encerrar Partida (Desistência/W.O)**."

**💼 Executivo de Vendas & Gerente de Vendas**
> "Incrível! Os nomes de seed (Carlão, Seu Andre, Andrezinho, Lucas, Pablo, Crys, Candinho) trazem a realidade da quadra pro sistema. Poder mostrar o histórico de vitórias na tela do celular do aluno (Perfil) é o que vai forçar a renovação da assinatura da Arena. O aluno *vai querer* ver suas estatísticas de Shark Ataque e Chapa!"

---

## 2. O Roadmap de Execução (Até a Última Entrega)

Esse é o cronograma de código que vai acontecer do início da Sprint 5 até a compilação final.

### Fase 1: Setup da Nova Realidade (Backend & Core)
1. **Nomenclatura e Temática**:
   - Trocar o emoji de 🏐 para ⚽ em todo o repositório.
   - Resetar o seed data de players nas arenas do backend para injetar os nomes exatos: *Carlão, Seu Andre, Andrezinho, Lucas, Pablo, Crys, Candinho*.
2. **Atualização do Motor ELO (Categorias)**:
   - Refatorar a função de conversão de ELO para as 6 categorias exigidas:
     - *Estreante* (Até 1200)
     - *Iniciante* (1200 - 1400)
     - *Intermediário* (1400 - 1600)
     - *Bronze* (1600 - 1800)
     - *Prata* (1800 - 2000)
     - *Ouro* (Acima de 2000)
3. **Novos Endpoints**:
   - Criar `GET /players/{id}/profile` no backend, retornando histórico de partidas com as parciais dos sets e W/L Ratio.

### Fase 2: Configuração e Motor da Partida (Mobile)
1. **Configuração de Partida (Match Settings)**:
   - Adicionar uma etapa antes de entrar no Tracker: um modal rápido onde o professor escolhe:
     - Número de Sets (1 ou 3).
     - Pontos para vencer (ex: 18).
     - Vai a Dois? (Sim/Não).
     - Cap máximo de pontos (ex: 20).
2. **Tracker V2.0 (Inteligência Central)**:
   - Implementar a matemática que escuta a configuração e sabe exatamente a hora de virar o Set e encerrar a partida (ou esperar a diferença de 2).
   - Inserir o **Botão "Encerrar Partida"** (para forçar o fim do jogo por WO ou lesão).
   - Mostrar no placar as pontuações exatas dos Sets passados (ex: [18x16] | [18x20]), e não apenas "1 a 0".

### Fase 3: Detalhamento de Pontos e Fundamentos (Mobile)
1. **O Menu de Futevôlei**:
   - Quando um time marca ponto, perguntar **Quem?** (Player 1 ou Player 2) e **Como?**.
   - Fundamentos positivos: *Coxa, Peito, Ombro, Chapa, Cabeça, Shark Ataque*.
   - Fundamentos negativos (Erros): *Erro de Saque, Erro de Recepção, Erro de Ataque*.
2. **Salvar os dados**:
   - Atrelar cada ponto no `match_events` a um atleta específico para alimentar o ELO Individual com perfeição.

### Fase 4: Perfis Individuais e UX Fixes (Mobile)
1. **O Perfil do Jogador**:
   - Na tela de Ranking (ou Dashboard), permitir o toque no nome do atleta (Carlão, Crys, etc.).
   - Abrir o `PlayerProfileScreen` mostrando: Tier Ouro/Prata, Win Rate (%), Total de Partidas, Parciais Antigas e Estatísticas de Fundamento.
2. **Polimento UI**:
   - Corrigir o bug do componente `CenterTabIcon` na `App.tsx` para que a cor azul/ativa acompanhe corretamente a navegação real e não fique travada.

---
**Status:** Plano arquitetado e aprovado. A execução da Fase 1 começa em seguida.
