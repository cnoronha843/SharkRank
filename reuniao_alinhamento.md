# 🦈 SharkRank — Ata da Reunião de Alinhamento Estratégico

**Data:** 25/04/2026 | **Mediador:** Tech Founder (Carlos)

---

## 📋 Participantes

| # | Papel | Foco |
|---|-------|------|
| 1 | **Tech Founder / PO** | Mediação, Arquitetura, Decisão Final |
| 2 | **Arquiteto Mobile** | React Native, Offline-First, UX |
| 3 | **Arquiteto Backend** | Python, ELO Engine, Multi-Tenancy |
| 4 | **QA/SDET Sênior** | Testes, CI/CD, DevSecOps |
| 5 | **Analista de Negócios (BA)** | Product Discovery, Pricing, KPIs |
| 6 | **Gerente de Vendas** | GTM, CRM, Previsibilidade |
| 7 | **Executivo de Vendas (Hunter)** | Demo Pé na Areia, Fechamento |

---

## ⚔️ Simulação do Debate

### PAUTA 1: Sincronização ELO — Tempo Real vs. Assíncrono

**🏐 Executivo de Vendas (Hunter):**
> "Na demo pé na areia, eu preciso que o professor marque o último ponto e o ELO atualize na hora. Se eu digo 'olha o ranking atualizado' e aparece um spinner de 'Sincronizando...', eu perco a venda. O professor quer ver a mágica acontecer na frente dele."

**📱 Arquiteto Mobile:**
> "Impossível em tempo real confiável. A latência celular na praia varia de 200ms a 15 segundos. Se eu fizer uma chamada HTTP síncrona bloqueante, a UI congela. Se a rede cai no meio da requisição, o professor perde a partida inteira. O PRD já fala de offline-first, mas o cálculo ELO está no backend — essa é a contradição. O app NÃO pode depender do servidor para dar feedback visual imediato."

**🐍 Arquiteto Backend:**
> "Concordo com o Mobile. O cálculo ELO é relativamente leve para uma única partida. O que é pesado é o recálculo do ranking de TODA a arena. Se eu rodar isso síncrono numa requisição HTTP, vai dar timeout na rede instável. Proposta: mover uma versão simplificada do cálculo ELO para o cliente mobile. O backend serve como fonte de verdade e reconcilia depois."

**🧪 QA/SDET:**
> "Se o motor ELO rodar em dois lugares — mobile E backend — eu tenho um problema grave de testabilidade. Preciso de testes de contrato matemático que garantam que o resultado do cálculo local é idêntico ao do servidor, caso contrário o professor vê um número na quadra e outro número quando chega em casa. Isso destrói a confiança no produto."

**🔧 Tech Founder (DECISÃO):**
> **"DECISÃO #1: ELO Dual-Layer com Reconciliação."** O mobile calcula um ELO provisório instantâneo usando uma fórmula simplificada (apenas K-factor × resultado, sem recálculo de ranking global). A UI exibe imediatamente com um badge discreto de "✓ Provisório". O backend recebe a partida pela sync queue, roda o cálculo completo com pesos de fundamentos, e envia o delta de correção via push silencioso. Se o delta for <3 pontos, a UI corrige sem notificar. Se for >3, mostra "Seu ELO foi ajustado de X para Y". O QA cria um teste de contrato que valide que a divergência máxima entre os dois motores nunca exceda 5 pontos em 95% dos casos.

---

### PAUTA 2: Botões Fat-Finger vs. Automação E2E

**🧪 QA/SDET:**
> "O PRD exige botões cobrindo 30% da tela inferior. Eu fiz as contas: num iPhone SE, isso dá botões de 96×140dp. Se eu rodar Detox ou Appium com tap por coordenada, qualquer mudança de layout quebra 100% dos testes. E se o professor usar um tablet de 10 polegadas, as proporções mudam completamente. Preciso de `testID` fixos e uma zona de toque mínima garantida em pixels absolutos, não em porcentagem."

**📱 Arquiteto Mobile:**
> "Posso fazer os botões com `testID` semânticos como `btn_fundamento_saque`, `btn_fundamento_recepcao`. Mas a regra de '30% da tela' precisa ser convertida para um `minHeight` absoluto de 72dp e um `minWidth` de 100% da largura, com padding de 8dp entre botões. Isso funciona de iPhone SE a iPad sem quebrar layout."

**📊 Analista de Negócios (BA):**
> "Espera. Antes de definir o tamanho dos botões, quais fundamentos entram no MVP? O PRD lista Saque, Recepção e Ataque. Mas nas entrevistas de validação, os professores marcam no mínimo 6 fundamentos: Saque, Recepção, Levantamento, Ataque, Bloqueio e Erro. Seis botões cobrindo 30% da tela é um pesadelo de UX. Precisamos fatiar."

**🔧 Tech Founder (DECISÃO):**
> **"DECISÃO #2: MVP com 4 fundamentos + layout adaptativo."** O MVP rastreia: Saque, Recepção, Ataque e Erro Não-Forçado. Quatro botões organizados em grid 2×2 no terço inferior da tela. Cada botão com `minHeight: 72dp`, `testID` semântico padronizado (`sr_btn_{fundamento}`), e contraste WCAG AAA para sol direto. Bloqueio e Levantamento entram na Fase 1.5 via menu expansível "Mais Fundamentos" que o professor pode ligar nas configurações. O QA automatiza o fluxo E2E com taps via testID, nunca por coordenada.

---

### PAUTA 3: Shadow Mode e Viabilidade de Go-To-Market

**📈 Gerente de Vendas:**
> "O PRD fala de Shadow Mode: rodar o algoritmo em paralelo sem o professor saber e comparar com a nota manual dele. Isso é excelente para calibrar os pesos. Mas quem paga o custo de aquisição dessas arenas de teste? Se o app ainda não está vendável, eu não tenho como justificar comissão para o Hunter ir até lá. Preciso saber: o Shadow Mode gera receita ou é custo puro?"

**🏐 Executivo de Vendas (Hunter):**
> "Eu consigo levar o app para 3 arenas de Blumenau sem cobrar, se eu puder oferecer 3 meses gratuitos em troca de dados e depoimentos. O depoimento gravado no celular do professor dizendo 'esse app mudou minha aula' vale mais que qualquer campanha paga. Mas preciso de um app que funcione sem travar. Se der crash na demo, eu queimo a arena para sempre."

**🧪 QA/SDET:**
> "Para o Shadow Mode funcionar, preciso de um build separado com feature flag que grave os inputs do professor sem calcular ELO visível. Isso é uma variante de teste que precisa da mesma estabilidade do app final. Sugiro usar o Shadow Mode como teste de carga real e smoke test em produção."

**📊 Analista de Negócios (BA):**
> "Os 3 meses gratuitos são justificáveis se limitarmos a 5 arenas-piloto com contrato de beta tester assinado. O professor se compromete a usar o app em pelo menos 10 sessões, e nós obtemos os dados de calibração E o case. O CAC dessa fase é zero em dinheiro, mas custa tempo de engenharia. Preciso que o Tech Founder defina o orçamento de horas."

**🔧 Tech Founder (DECISÃO):**
> **"DECISÃO #3: Shadow Mode como Beta Fechado com SLA."** Até 5 arenas-piloto em Blumenau/Vale do Itajaí recebem o app gratuito por 90 dias. Em troca: contrato simples de beta tester com autorização de uso de dados anônimos e compromisso de 12 sessões mínimas. O app nesse período roda com flag `SHADOW_MODE=true`: o professor marca fundamentos normalmente, o ELO calcula em background mas NÃO é exibido. Após 30 partidas coletadas por arena, o BA cruza o ELO calculado vs. a percepção subjetiva do professor (coletada via formulário pós-treino de 3 perguntas). O Hunter tem autonomia para fechar os pilotos e o Gerente de Vendas rastreia no CRM como "Pipeline - Piloto Ativo". A conversão para pagante após 90 dias é o primeiro KPI real de vendas.

---

## 🏆 3 Maiores Decisões de Engenharia e Negócio

### 1. ⚡ ELO Dual-Layer com Reconciliação Assíncrona
- **Problema:** Latência de rede impossibilita cálculo ELO em tempo real na beira da quadra, mas a demo de vendas exige feedback instantâneo.
- **Solução:** Motor ELO simplificado roda no mobile (resultado provisório imediato). Backend roda o cálculo completo com pesos e reconcilia via push silencioso. Divergência máxima tolerada: 5 pontos em 95% dos casos.
- **Impacto:** Mobile adiciona ~200 linhas de lógica ELO local. Backend adiciona endpoint de reconciliação. QA cria teste de contrato matemático cruzado.

### 2. 🎯 MVP com 4 Fundamentos + Layout Adaptativo com testIDs
- **Problema:** 30% da tela para botões fat-finger conflita com 6 fundamentos desejados pelo negócio e com automação E2E por coordenadas.
- **Solução:** MVP rastreia 4 fundamentos (Saque, Recepção, Ataque, Erro) em grid 2×2. Botões com `minHeight: 72dp`, `testID` padronizado (`sr_btn_{fundamento}`), contraste WCAG AAA. Fundamentos extras entram pós-MVP via toggle de configurações.
- **Impacto:** Reduz complexidade de UI em 33%, viabiliza automação E2E estável, e mantém a demo simples e impactante para o vendedor.

### 3. 🧪 Shadow Mode como Beta Fechado Instrumentado
- **Problema:** Calibração dos pesos do motor ELO requer dados reais, mas o app não pode ser vendido sem calibração. Ciclo de dependência.
- **Solução:** 5 arenas-piloto, 90 dias gratuitos, contrato de beta tester, ELO roda em background invisível. Após 30 partidas/arena, BA compara ELO vs. percepção do professor para ajustar pesos. Pipeline rastreado no CRM.
- **Impacto:** Gera dados de calibração com custo zero em CAC monetário, produz cases de sucesso e depoimentos, e cria o primeiro funil de conversão real (piloto → pagante).
