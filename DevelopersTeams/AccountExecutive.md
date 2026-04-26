# Guia Sênior: Executivo de Vendas (Field Sales / Hunter)
**Foco do Papel:** Prospecção, Demonstração de Produto (Demo) e Fechamento de Contratos.
**Versão:** 2.0 — Pós-Reunião de Alinhamento Estratégico (25/04/2026)

---

## 1. Prospecção Ativa (Outbound) e Qualificação
* **Mapeamento de Campo:** Levantamento diário de arenas e centros de treinamento dentro do ICP (≥3 quadras, ≥2 torneios/ano, professores fixos).
* **Abordagem de Alto Valor:** Substituir "Quero te vender um app" por "Quero te mostrar como você está perdendo R$ X por mês com alunos que desistem por falta de nivelamento claro".
* **Qualificação (BANT / SPIN):** Identificar rapidamente se a Arena tem Orçamento, Autoridade (quem decide: dono ou professor?), Necessidade e Tempo para implementar.

## 2. Execução de Vendas e Demonstração

> **[DECISÃO #1 — Demo com ELO Provisório]:** A demo "pé na areia" agora explora o ELO Dual-Layer como vantagem competitiva:
> * Mostrar que o app calcula o ELO **instantaneamente** na beira da quadra (ELO provisório) — sem depender de internet.
> * Explicar que quando o Wi-Fi voltar, o número se ajusta automaticamente com a análise completa do servidor.
> * **Pitch sugerido:** "Até sem internet, seu aluno já sabe onde está no ranking. Nenhum concorrente faz isso."

* **Demonstração "Pé na Areia":** Ir até a arena nos horários de pico (segundas, quintas e sábados) e colocar o app na mão do professor na quadra.
* **Prova de Valor Prática (Roteiro de Demo Atualizado):**
    1. Abrir o app e mostrar o contraste da tela sob sol direto (WCAG AAA).
    2. Demonstrar os 4 botões grandes (Saque, Recepção, Ataque, Erro) — tocar sem olhar.
    3. Ativar o modo avião do celular e continuar marcando pontos — mostrar que funciona offline.
    4. Finalizar a partida e mostrar o ELO provisório aparecendo instantaneamente.
    5. Reconectar o celular e mostrar o ajuste automático (se houver delta).
* **Gestão de Objeções (Matriz Atualizada):**
    | Objeção | Resposta |
    |---------|----------|
    | "Já uso Excel" | "O Excel não calcula ELO automático nem funciona offline na quadra" |
    | "É caro" | "Se o ELO fizer 1 aluno que ia desistir continuar, a mensalidade se paga por 3 meses" |
    | "Não confio na nota automática" | "Por isso rodamos 90 dias gratuitos: você avalia e nós comparamos. Se não bater, não cobra" |
    | "Meu celular não pega aqui" | *Ativar modo avião e demonstrar ao vivo* |

## 3. Shadow Mode — Fechamento de Pilotos

> **[DECISÃO #3 — Autonomia do Hunter]:** O Hunter tem autonomia para fechar até 5 arenas-piloto em Blumenau/Vale do Itajaí com as seguintes condições:
> * **Oferta:** 90 dias gratuitos de uso completo.
> * **Exigência:** Contrato de beta tester assinado (modelo fornecido pelo BA). Compromisso de ≥12 sessões de uso e autorização de dados anônimos.
> * **Coleta obrigatória:** Depoimento em vídeo (30-60 segundos) do professor ao final do período piloto.
> * **CRM:** Registrar como "Pipeline — Piloto Ativo" com data de início e data de conversão projetada.

## 4. Fechamento e Onboarding
* **Aceleração do Fechamento:** Gatilhos de urgência para contratos anuais: isenção de taxa de setup ou consultoria técnica exclusiva.
* **Hand-off (Passagem de Bastão):** Após contrato assinado, repassar informações claras ao Customer Success, garantindo uso no primeiro dia de treino.
* **Métricas-Chave (KPIs):**
    * **Demos/Semana** — Meta: ≥4
    * **MRR Adicionado** (Receita Nova por mês)
    * **Conversão Demo→Fechamento** — Meta: ≥30%
    * **Pilotos Fechados** — Meta imediata: 5 arenas em 30 dias ← **NOVO**
    * **Conversão Piloto→Pagante** — Meta: ≥60% após 90 dias ← **NOVO**

> **[DIRETRIZ CRUZADA — Hunter → QA]:** Se ocorrer um crash durante qualquer demo, o Hunter:
> 1. Registra no CRM com motivo de perda `crash_na_demo` (mesmo que a venda não seja perdida).
> 2. Envia screenshot/vídeo do erro para o canal #bugs-field no Slack.
> 3. O QA prioriza o bug como P0 (bloqueador) e corrige em ≤48 horas.

## 🛠️ Habilidades Técnicas Exigidas (Perfil de Contratação)
* **Prospecção (Outbound):** Cold Calling 2.0, Cold Emailing, qualificação de leads de donos de arenas.
* **Apresentação Técnica (Demo):** Habilidade de espelhar o celular, demonstrar o app ao vivo e criar o "Momento Aha!" no cliente.
* **Negociação e Fechamento:** Quebra de objeções (Ex: "Já uso papel e caneta, por que pagar um app?"), assinatura de contratos digitais.
* **Ferramentas do Dia-a-Dia:** CRM (HubSpot), WhatsApp Business API, Google Meet/Zoom.