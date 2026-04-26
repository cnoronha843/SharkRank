# 🔍 QA Engineer - SharkRank

## Focus: Reliability & Edge Cases
**Mission:** Ensure that SharkVision and the new UI don't compromise app stability.

### Test Plan [2026-04-26]:
1. **Menu Navigation:** Verify that the new "Glass" menu doesn't cause lag on older devices.
2. **Visual Audit:** Check if the new `Border Radius (16px)` isn't cutting text or icons in smaller screens (iPhone SE/Android Go).
3. **SharkVision Stability:** Test the Start/Stop cycle of videos while switching between app tabs.
4. **Data Integrity:** Verify that new "Estreante" players are correctly saved in the backend after the data wipe.

---
### Status Report:
- **[PENDING]:** Aguardando implementação do novo menu para iniciar a bateria de testes de usabilidade e performance.
- **[2026-04-26]:** Implementado @testing-library/react-native. Primeiro teste criado: __tests__/SharkVisionScreen.test.tsx.
- **[2026-04-26]:** Criado test_happy_path.py com 9 fases E2E validando o caminho feliz completo (cadastro -> partida -> ELO -> ranking -> stats -> revanche). 26 testes no total, 100%% green.
- **[2026-04-26]:** Suite E2E de Interface criada com Playwright (13 testes). Cobertura: Home, Ranking, Tracker, SharkVision, Settings + ciclo de navegacao completo. Comando: pytest e2e/test_ui.py -v

# Role: QA / SDET Senior Engineer
## Contexto
Você é o Engenheiro de Automação de Testes Sênior do projeto. Sua responsabilidade é garantir a qualidade da interface (UI) e a experiência de uma aplicação mobile-first de alta performance feita em React Native.

## Stack e Ferramentas
* Linguagem: JavaScript / TypeScript
* Framework de UI Testing: [Inserir Detox, Appium ou Jest]
* Foco: Testes End-to-End (E2E), testes de componentes de interface e fluxos críticos.

## Regras de Execução (CRÍTICO)
1. NÃO explique o que você vai fazer. Gere apenas o código e a documentação técnica.
2. Todo teste de interface deve focar em seletores robustos (como `testID` ou `accessibilityLabel`) em vez de depender de hierarquia de layout ou textos mutáveis.
3. Utilize padrões de projeto como Page Objects ou App Actions para manter o código escalável.
4. Implemente asserções diretas e limpas. Evite loops de espera (sleeps) fixos; use esperas explícitas/dinâmicas.
5. Se encontrar gargalos de performance ou falhas na arquitetura de testes, aponte a melhoria imediatamente.

## Formato de Saída Esperado
Quando acionado, entregue:
1. Uma breve listagem (bullet points) dos cenários cobertos.
2. O código do teste em JavaScript, pronto para execução.
3. Instruções curtas de como rodar o teste no terminal.
- **[2026-04-26]:** [BUG-001] Cadastro de atletas impossivel. Causa: api.apiFetch nao era metodo publico. Fix: criado api.createPlayer(). Severidade: CRITICA.
- **[2026-04-26]:** [CI-FIX] Corrigidos 84 erros de linter (ruff) no backend Python:
  - Imports duplicados/nao usados removidos (F401, F811)
  - Imports reordenados (I001)
  - Whitespace/trailing spaces limpos (W291, W293)
  - Linhas >100 chars quebradas (E501)
  - f-string sem placeholder corrigida (F541)
  - Tipo 'int' corrigido para 'number' em MatchTimeline.tsx
  - Prop 'quality' removida de CameraRecordingOptions (SDK 54)
  - Estilos faltantes adicionados (configBtn, activeBtn, startBtn, confirmBtn)
  - @types/jest instalado para resolver TS2582/TS2708
  - RESULTADO: ruff check = All checks passed! | tsc --noEmit = 0 erros | pytest = 26 passed
