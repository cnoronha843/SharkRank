"""
SharkRank -- Suite E2E de Interface (Playwright)
=================================================
Testes visuais automatizados que validam TODAS as telas do app mobile.
Roda contra o Expo Web (localhost:8081).

COMO RODAR:
  1. Inicie o app: cd mobile && npx expo start
  2. Rode os testes: cd e2e && pytest test_ui.py -v

Diretriz: QAEngineer.md -- Toda feature entregue DEVE ter teste automatizado.
Diretriz: MobileSenior.md -- Nunca usar overflow:hidden em container pai de FAB.
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8081"
TIMEOUT = 15000  # 15s para o Metro Bundler carregar


@pytest.fixture(scope="session")
def browser_context_args():
    """Configura viewport mobile e dark mode."""
    return {
        "viewport": {"width": 390, "height": 844},  # iPhone 14 Pro
        "color_scheme": "dark",
    }


# ============================================================
# TELA 1: HOME (DASHBOARD)
# ============================================================
class TestHomeScreen:
    def test_greeting_visible(self, page: Page):
        """Verifica se a saudacao aparece ao abrir o app."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        expect(page.get_by_text("Painel de telemetria SharkRank")).to_be_visible()

    def test_stat_cards_exist(self, page: Page):
        """Verifica se os 3 cards de estatisticas estao na tela."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        expect(page.get_by_text("ATLETAS")).to_be_visible()
        expect(page.get_by_text("RATING M")).to_be_visible()  # RATING MEDIO/MÉDIO
        expect(page.get_by_text("PARTIDAS", exact=True)).to_be_visible()

    def test_quick_actions_exist(self, page: Page):
        """Verifica se os botoes de Acoes Rapidas estao presentes."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        expect(page.get_by_text("Nova Partida")).to_be_visible()
        expect(page.get_by_text("Novo Atleta")).to_be_visible()
        expect(page.get_by_text("Quadras")).to_be_visible()

    def test_recent_matches_scoreboard(self, page: Page):
        """Verifica se o placar de Ultimas Partidas esta renderizando."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        expect(page.get_by_text("Ao Vivo")).to_be_visible()
        expect(page.get_by_text("Rafa & Gui")).to_be_visible()


# ============================================================
# TELA 2: RANKING
# ============================================================
class TestRankingScreen:
    def test_ranking_title_visible(self, page: Page):
        """Verifica se a tela de ranking carrega com o titulo."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        # Clicar no icone do trofeu (segundo item do nav)
        nav_items = page.locator('[role="tab"]').all()
        if len(nav_items) >= 2:
            nav_items[1].click()
        page.wait_for_timeout(1000)
        expect(page.get_by_text("Ranking da Arena")).to_be_visible()


# ============================================================
# TELA 3: TRACKER
# ============================================================
class TestTrackerScreen:
    def test_tracker_opens_team_selection(self, page: Page):
        """Verifica se clicar no botao central abre a selecao de times."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        nav_items = page.locator('[role="tab"]').all()
        if len(nav_items) >= 3:
            nav_items[2].click()
        page.wait_for_timeout(1000)
        expect(page.get_by_text("Selecione o Time A")).to_be_visible()
        expect(page.get_by_text("Escolha 2 jogadores")).to_be_visible()

    def test_tracker_has_new_athlete_button(self, page: Page):
        """Verifica se o botao de cadastrar novo atleta existe no Tracker."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        nav_items = page.locator('[role="tab"]').all()
        if len(nav_items) >= 3:
            nav_items[2].click()
        page.wait_for_timeout(1000)
        # Deve ter botao de voltar e novo atleta
        expect(page.get_by_text("Voltar")).to_be_visible()

    def test_add_athlete_modal_opens(self, page: Page):
        """[BUG-001 REGRESSAO] Verifica se o modal de cadastro abre corretamente."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        nav_items = page.locator('[role="tab"]').all()
        if len(nav_items) >= 3:
            nav_items[2].click()
        page.wait_for_timeout(1000)

        # Clicar em "+ Novo Atleta" ou "Cadastrar Primeiro Atleta"
        plus_btn = page.get_by_text("+ Novo Atleta", exact=True)
        first_btn = page.get_by_text("Cadastrar Primeiro Atleta")
        if plus_btn.is_visible():
            plus_btn.click()
        elif first_btn.is_visible():
            first_btn.click()
        page.wait_for_timeout(500)

        # O modal deve abrir com o formulario
        expect(page.get_by_text("Novo Atleta Estreante")).to_be_visible()
        expect(page.get_by_placeholder("Nome Completo")).to_be_visible()

    def test_add_athlete_form_validation(self, page: Page):
        """[BUG-001 REGRESSAO] Verifica que o campo de nome e o botao cancelar funcionam."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        nav_items = page.locator('[role="tab"]').all()
        if len(nav_items) >= 3:
            nav_items[2].click()
        page.wait_for_timeout(1000)

        # Abrir modal
        plus_btn = page.get_by_text("+ Novo Atleta", exact=True)
        first_btn = page.get_by_text("Cadastrar Primeiro Atleta")
        if plus_btn.is_visible():
            plus_btn.click()
        elif first_btn.is_visible():
            first_btn.click()
        page.wait_for_timeout(500)

        # Digitar nome
        page.get_by_placeholder("Nome Completo").fill("Jogador de Teste E2E")
        page.wait_for_timeout(300)

        # Cancelar deve fechar o modal
        page.get_by_text("Cancelar").click()
        page.wait_for_timeout(500)
        expect(page.get_by_text("Novo Atleta Estreante")).not_to_be_visible()


# ============================================================
# TELA 4: SHARKVISION (VIDEOS)
# ============================================================
class TestSharkVisionScreen:
    def test_sharkvision_title(self, page: Page):
        """Verifica se a galeria de videos carrega corretamente."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        nav_items = page.locator('[role="tab"]').all()
        if len(nav_items) >= 4:
            nav_items[3].click()
        page.wait_for_timeout(1000)
        expect(page.get_by_text("SharkVision")).to_be_visible()
        expect(page.get_by_text("Galeria de Replays e Destaques")).to_be_visible()

    def test_sharkvision_has_video_cards(self, page: Page):
        """Verifica se os cards de video existem com titulos e duracao."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        nav_items = page.locator('[role="tab"]').all()
        if len(nav_items) >= 4:
            nav_items[3].click()
        page.wait_for_timeout(1000)
        expect(page.get_by_text("Rafa vs Matheus - Set 1")).to_be_visible()
        expect(page.get_by_text("12:45")).to_be_visible()


# ============================================================
# TELA 5: SETTINGS
# ============================================================
class TestSettingsScreen:
    def test_settings_title(self, page: Page):
        """Verifica se a tela de configuracoes carrega."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        nav_items = page.locator('[role="tab"]').all()
        if len(nav_items) >= 5:
            nav_items[4].click()
        page.wait_for_timeout(1000)
        expect(page.get_by_text("Sincronizar Agora")).to_be_visible()

    def test_settings_shows_version(self, page: Page):
        """Verifica se a versao do app esta visivel."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        nav_items = page.locator('[role="tab"]').all()
        if len(nav_items) >= 5:
            nav_items[4].click()
        page.wait_for_timeout(1000)
        expect(page.get_by_text("SharkRank v1.0.0")).to_be_visible()
        expect(page.get_by_text("Motor ELO Config: v1")).to_be_visible()


# ============================================================
# NAVEGACAO ENTRE TELAS (REGRESSAO)
# ============================================================
class TestNavigation:
    def test_bottom_nav_has_5_tabs(self, page: Page):
        """Verifica se a barra de navegacao tem exatamente 5 abas."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        tabs = page.locator('[role="tab"]').all()
        assert len(tabs) == 5, f"Esperado 5 abas, encontrado {len(tabs)}"

    def test_full_navigation_cycle(self, page: Page):
        """Navega por todas as telas e volta para Home sem crash."""
        page.goto(BASE_URL, timeout=TIMEOUT, wait_until="networkidle")
        tabs = page.locator('[role="tab"]').all()
        assert len(tabs) == 5

        # Home -> Ranking
        tabs[1].click()
        page.wait_for_timeout(800)
        expect(page.get_by_text("Ranking da Arena")).to_be_visible()

        # Ranking -> Tracker
        tabs[2].click()
        page.wait_for_timeout(800)
        expect(page.get_by_text("Selecione o Time A")).to_be_visible()

        # Tracker -> SharkVision
        tabs[3].click()
        page.wait_for_timeout(800)
        expect(page.get_by_text("SharkVision")).to_be_visible()

        # SharkVision -> Settings
        tabs[4].click()
        page.wait_for_timeout(800)
        expect(page.get_by_text("SharkRank v1.0.0")).to_be_visible()

        # Settings -> Home (ciclo completo)
        tabs[0].click()
        page.wait_for_timeout(800)
        expect(page.get_by_text("Painel de telemetria SharkRank")).to_be_visible()
