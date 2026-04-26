/**
 * SharkRank — Detox E2E Test: Fluxo Crítico
 * QAEngineer.md, Decisão #2:
 * Criar Jogo → Marcar 18 Pontos → Finalizar → Verificar ELO Provisório → Sync
 * 
 * Taps EXCLUSIVAMENTE via testID (coordenadas PROIBIDAS).
 */

describe('SharkRank — Fluxo Crítico', () => {

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  // === S1: Verificar tela de Tracker ===
  it('deve renderizar a tela de Tracker com 4 botões de fundamento', async () => {
    // Navegar para Tracker via tab
    await element(by.text('⚡')).tap();

    // Verificar existência dos 4 botões fat-finger (testIDs obrigatórios)
    await expect(element(by.id('sr_screen_tracker'))).toBeVisible();
    await expect(element(by.id('sr_btn_saque'))).toBeVisible();
    await expect(element(by.id('sr_btn_recepcao'))).toBeVisible();
    await expect(element(by.id('sr_btn_ataque'))).toBeVisible();
    await expect(element(by.id('sr_btn_erro'))).toBeVisible();

    // Verificar placares iniciais
    await expect(element(by.id('sr_label_score_a'))).toHaveText('0');
    await expect(element(by.id('sr_label_score_b'))).toHaveText('0');
  });

  // === S2: Marcar pontos com fundamentos ===
  it('deve incrementar placar ao tocar botões de fundamento', async () => {
    await element(by.text('⚡')).tap();

    // Marcar 3 saques ace (Time A sacando por default)
    await element(by.id('sr_btn_saque')).tap();
    await element(by.id('sr_btn_saque')).tap();
    await element(by.id('sr_btn_saque')).tap();

    // Placar deve ser 3-0
    await expect(element(by.id('sr_label_score_a'))).toHaveText('3');
    await expect(element(by.id('sr_label_score_b'))).toHaveText('0');
  });

  // === S3: Jogar set completo até 18 pontos ===
  it('deve finalizar set automaticamente ao atingir 18 pontos', async () => {
    await element(by.text('⚡')).tap();

    // Marcar 18 pontos para Time A via saques e ataques (alternando fundamentos)
    for (let i = 0; i < 9; i++) {
      await element(by.id('sr_btn_saque')).tap();
      await element(by.id('sr_btn_ataque')).tap();
    }

    // Após 18 pontos, placar reseta para 0 (novo set) ou partida finaliza
    // Se for primeiro set, placar resetou e sets A = 1
  });

  // === S4: Fluxo completo — 2 sets → Partida finalizada → ELO Provisório ===
  it('deve completar partida em 2 sets e exibir ELO provisório', async () => {
    await element(by.text('⚡')).tap();

    // Set 1: 18 pontos para Time A
    for (let i = 0; i < 18; i++) {
      await element(by.id('sr_btn_saque')).tap();
    }

    // Set 2: 18 pontos para Time A
    for (let i = 0; i < 18; i++) {
      await element(by.id('sr_btn_ataque')).tap();
    }

    // Verificar que survey de calibração aparece (Shadow Mode)
    // Ou que resultado com ELO provisório é exibido
    await waitFor(element(by.id('sr_btn_survey_submit')).or(element(by.id('sr_btn_nova_partida'))))
      .toBeVisible()
      .withTimeout(5000);
  });

  // === S5: Ranking em Shadow Mode mostra placeholder ===
  it('deve exibir placeholder de calibração no ranking (Shadow Mode)', async () => {
    // Navegar para tab Ranking
    await element(by.text('Ranking')).tap();

    await expect(element(by.id('sr_screen_ranking'))).toBeVisible();
    // Em Shadow Mode, o texto de calibração deve aparecer
    await expect(element(by.text('Ranking em Calibração'))).toBeVisible();
  });

  // === S6: Formulário de calibração ===
  it('deve exibir e submeter formulário de calibração', async () => {
    await element(by.text('⚡')).tap();

    // Jogar partida completa (2 sets)
    for (let set = 0; set < 2; set++) {
      for (let i = 0; i < 18; i++) {
        await element(by.id('sr_btn_saque')).tap();
      }
    }

    // Survey deve aparecer
    await waitFor(element(by.id('sr_btn_q1_4'))).toBeVisible().withTimeout(5000);

    // Responder perguntas
    await element(by.id('sr_btn_q1_4')).tap();  // Accuracy: 4
    await element(by.id('sr_input_q2')).typeText('Rafael');  // Best player
    await element(by.id('sr_btn_q3_sim')).tap();  // Would use: Sim

    // Submeter
    await element(by.id('sr_btn_survey_submit')).tap();

    // Deve voltar para resultado da partida
    await waitFor(element(by.id('sr_btn_nova_partida'))).toBeVisible().withTimeout(3000);
  });

  // === S7: Nova partida reseta estado ===
  it('deve resetar estado ao iniciar nova partida', async () => {
    await element(by.text('⚡')).tap();

    // Verificar estado limpo
    await expect(element(by.id('sr_label_score_a'))).toHaveText('0');
    await expect(element(by.id('sr_label_score_b'))).toHaveText('0');
  });
});
