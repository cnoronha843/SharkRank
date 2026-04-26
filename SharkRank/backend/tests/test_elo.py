"""
Testes unitários do Motor ELO — SharkRank
Validações conforme PRD v2.0 e QAEngineer.md:
- K-factor dinâmico (40→24→16)
- Divergência ELO simplificado vs. completo ≤5 pontos em 95% dos casos
- Idempotência de processamento
- Reconciliação com regra de notificação (|delta| > 3)
"""

import random

import pytest

from app.engine.elo import (
    ELOEngine,
    ELOSimplified,
    Evento,
    Fundamento,
    IdempotencyStore,
    MatchResult,
    SetResult,
    get_k_factor,
)

# === K-FACTOR ===


class TestKFactor:
    def test_acceleration_phase(self):
        """Partidas 1-10: K=40 para nivelamento rápido."""
        for i in range(1, 11):
            assert get_k_factor(i) == 40.0

    def test_stabilization_phase(self):
        """Partidas 11-30: K=24."""
        for i in range(11, 31):
            assert get_k_factor(i) == 24.0

    def test_maturity_phase(self):
        """Partidas 31+: K=16."""
        assert get_k_factor(31) == 16.0
        assert get_k_factor(100) == 16.0
        assert get_k_factor(1000) == 16.0


# === MOTOR ELO COMPLETO ===


class TestELOEngine:
    @pytest.fixture
    def engine(self) -> ELOEngine:
        return ELOEngine()

    @pytest.fixture
    def basic_match(self) -> MatchResult:
        """Partida simples: Time A vence 2×0 com fundamentos."""
        return MatchResult(
            match_id="test-001",
            arena_id="arena-001",
            team_a=["player-1", "player-2"],
            team_b=["player-3", "player-4"],
            sets=[
                SetResult(
                    score_a=18,
                    score_b=15,
                    events=[
                        Evento(Fundamento.SHARK_ATAQUE, "player-1", "2026-04-25T10:00:00Z"),
                        Evento(Fundamento.SHARK_ATAQUE, "player-2", "2026-04-25T10:01:00Z"),
                        Evento(Fundamento.PEITO, "player-1", "2026-04-25T10:02:00Z"),
                        Evento(Fundamento.ERRO_RECEPCAO, "player-3", "2026-04-25T10:03:00Z"),
                    ],
                ),
                SetResult(
                    score_a=18,
                    score_b=12,
                    events=[
                        Evento(Fundamento.SHARK_ATAQUE, "player-1", "2026-04-25T10:20:00Z"),
                        Evento(Fundamento.SHARK_ATAQUE, "player-2", "2026-04-25T10:21:00Z"),
                    ],
                ),
            ],
        )

    def test_winner_gets_higher_rating(self, engine: ELOEngine, basic_match: MatchResult):
        """Vencedores devem subir de rating, perdedores devem descer."""
        ratings = {"player-1": 1500, "player-2": 1500, "player-3": 1500, "player-4": 1500}
        counts = {"player-1": 5, "player-2": 5, "player-3": 5, "player-4": 5}

        new_ratings = engine.calculate_match(basic_match, ratings, counts)

        # Time A venceu — ratings devem subir
        assert new_ratings["player-1"] > 1500
        assert new_ratings["player-2"] > 1500
        # Time B perdeu — ratings devem descer
        assert new_ratings["player-3"] < 1500
        assert new_ratings["player-4"] < 1500

    def test_fundaments_affect_individual_rating(self, engine: ELOEngine, basic_match: MatchResult):
        """Jogador com mais fundamentos positivos deve ter rating maior que parceiro."""
        ratings = {"player-1": 1500, "player-2": 1500, "player-3": 1500, "player-4": 1500}
        counts = {"player-1": 5, "player-2": 5, "player-3": 5, "player-4": 5}

        new_ratings = engine.calculate_match(basic_match, ratings, counts)

        # Player-1 tem 3 eventos positivos (saque_ace + recepcao + ataque)
        # Player-2 tem 2 eventos positivos (ataque + saque_ace)
        assert new_ratings["player-1"] > new_ratings["player-2"]

    def test_error_penalizes_player(self, engine: ELOEngine, basic_match: MatchResult):
        """Jogador com erro não-forçado deve ter penalização individual."""
        ratings = {"player-1": 1500, "player-2": 1500, "player-3": 1500, "player-4": 1500}
        counts = {"player-1": 5, "player-2": 5, "player-3": 5, "player-4": 5}

        new_ratings = engine.calculate_match(basic_match, ratings, counts)

        # Player-3 tem erro, player-4 não tem eventos — player-3 cai mais
        assert new_ratings["player-3"] < new_ratings["player-4"]

    def test_higher_k_factor_for_new_players(self, engine: ELOEngine, basic_match: MatchResult):
        """Jogadores novos (K=40) devem ter variação maior que veteranos (K=16)."""
        ratings = {"player-1": 1500, "player-2": 1500, "player-3": 1500, "player-4": 1500}

        # Novatos
        new_novice = engine.calculate_match(
            basic_match, ratings, {"player-1": 2, "player-2": 2, "player-3": 2, "player-4": 2}
        )
        # Veteranos
        new_veteran = engine.calculate_match(
            basic_match, ratings, {"player-1": 50, "player-2": 50, "player-3": 50, "player-4": 50}
        )

        delta_novice = abs(new_novice["player-1"] - 1500)
        delta_veteran = abs(new_veteran["player-1"] - 1500)
        assert delta_novice > delta_veteran

    def test_expected_score_symmetry(self, engine: ELOEngine):
        """E(A,B) + E(B,A) = 1.0 (propriedade fundamental do ELO)."""
        e_ab = engine.expected_score(1500, 1600)
        e_ba = engine.expected_score(1600, 1500)
        assert abs(e_ab + e_ba - 1.0) < 0.001


# === CONTRATO ELO: SIMPLIFICADO vs. COMPLETO ===


class TestELOContract:
    """
    Teste de contrato matemático (QAEngineer.md, Decisão #1):
    Divergência ≤5 pontos em ≥95% dos casos com 100 partidas sintéticas.
    """

    def test_divergence_within_tolerance(self):
        engine = ELOEngine()
        within_tolerance = 0
        total = 100

        random.seed(42)  # Reprodutível

        for i in range(total):
            # Gerar partida aleatória
            r1, r2 = 1400 + random.randint(0, 200), 1400 + random.randint(0, 200)
            r3, r4 = 1400 + random.randint(0, 200), 1400 + random.randint(0, 200)
            won_a = random.choice([True, False])

            ratings = {"p1": float(r1), "p2": float(r2), "p3": float(r3), "p4": float(r4)}
            counts = {
                "p1": random.randint(1, 50),
                "p2": random.randint(1, 50),
                "p3": random.randint(1, 50),
                "p4": random.randint(1, 50),
            }

            events = []
            for _ in range(random.randint(2, 8)):
                player = random.choice(["p1", "p2", "p3", "p4"])
                tipo = random.choice(list(Fundamento))
                events.append(Evento(tipo, player, f"2026-01-01T{i:02d}:00:00Z"))

            s_a, s_b = (18, 12 + random.randint(0, 5)) if won_a else (12 + random.randint(0, 5), 18)
            match = MatchResult(
                match_id=f"test-{i:03d}",
                arena_id="arena-test",
                team_a=["p1", "p2"],
                team_b=["p3", "p4"],
                sets=[SetResult(score_a=s_a, score_b=s_b, events=events)],
            )

            # ELO completo (backend)
            full = engine.calculate_match(match, ratings, counts)

            # ELO simplificado (mobile)
            avg_a = (ratings["p1"] + ratings["p2"]) / 2
            avg_b = (ratings["p3"] + ratings["p4"]) / 2
            for pid in ["p1", "p2", "p3", "p4"]:
                is_a = pid in ["p1", "p2"]
                k = get_k_factor(counts[pid])
                opp_avg = avg_b if is_a else avg_a
                simplified = ELOSimplified.calculate(
                    ratings[pid], opp_avg, won_a if is_a else not won_a, k
                )
                delta = abs(full[pid] - simplified)
                if delta <= 5.0:
                    within_tolerance += 1

        pct = within_tolerance / (total * 4) * 100
        assert pct >= 95.0, f"Divergência fora da tolerância: {pct:.1f}% ≤5pts (mínimo 95%)"


# === RECONCILIAÇÃO ===


class TestReconciliation:
    def test_no_notification_for_small_delta(self):
        engine = ELOEngine()
        result = engine.reconcile(
            {"p1": 1520.0, "p2": 1480.0},
            {"p1": 1522.0, "p2": 1479.0},
        )
        assert result["notify_user"] is False
        assert result["delta"]["p1"] == 2.0
        assert result["delta"]["p2"] == -1.0

    def test_notification_for_large_delta(self):
        engine = ELOEngine()
        result = engine.reconcile(
            {"p1": 1520.0},
            {"p1": 1528.0},
        )
        assert result["notify_user"] is True
        assert result["delta"]["p1"] == 8.0


# === IDEMPOTÊNCIA ===


class TestIdempotency:
    def test_duplicate_detection(self):
        store = IdempotencyStore()
        store.store("abc123", {"elo": 1500})
        assert store.exists("abc123") is True
        assert store.get("abc123") == {"elo": 1500}

    def test_non_existent_key(self):
        store = IdempotencyStore()
        assert store.exists("xyz") is False
        assert store.get("xyz") is None


# === ELO CONFIG ===


class TestELOConfig:
    def test_config_generation(self):
        config = ELOSimplified.generate_config("v1")
        assert config["version"] == "v1"
        assert len(config["params"]["k_factor_rules"]) == 3
        assert len(config["fundamentos_tracked"]) == 4
        assert "saque_ace" in config["fundamentos_tracked"]
