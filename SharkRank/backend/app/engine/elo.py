"""
SharkRank — Motor ELO para Futevôlei (Propriedade Intelectual Core)

Implementa:
1. ELO completo com pesos de fundamentos (Backend — fonte de verdade)
2. ELO simplificado exportável para mobile (fórmula provisória)
3. K-factor dinâmico (40→24→16 baseado em partidas jogadas)
4. Reconciliação: calcula delta entre provisório e definitivo
"""

from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any
from uuid import UUID


# === FUNDAMENTOS E PESOS ===

class Fundamento(str, Enum):
    """Fundamentos do Futevôlei (Sprint 5)."""
    COXA = "coxa"
    PEITO = "peito"
    OMBRO = "ombro"
    CHAPA = "chapa"
    CABECA = "cabeca"
    SHARK_ATAQUE = "shark_ataque"
    ERRO_SAQUE = "erro_saque"
    ERRO_RECEPCAO = "erro_recepcao"
    ERRO_ATAQUE = "erro_ataque"


# Pesos definidos na Sprint 5
PESOS_FUNDAMENTOS: dict[str, float] = {
    Fundamento.COXA: 0.5,
    Fundamento.PEITO: 0.8,
    Fundamento.OMBRO: 1.0,
    Fundamento.CHAPA: 0.5,
    Fundamento.CABECA: 0.8,
    Fundamento.SHARK_ATAQUE: 1.5,
    Fundamento.ERRO_SAQUE: -1.0,
    Fundamento.ERRO_RECEPCAO: -1.2,
    Fundamento.ERRO_ATAQUE: -1.0,
}


@dataclass
class Evento:
    """Um evento de fundamento registrado durante a partida."""
    tipo: Fundamento
    player_id: str
    timestamp: str  # ISO 8601


@dataclass
class SetResult:
    """Resultado de um set com eventos de fundamentos."""
    score_a: int
    score_b: int
    events: list[Evento] = field(default_factory=list)


@dataclass
class MatchResult:
    """Resultado completo de uma partida de futevôlei (duplas)."""
    match_id: str
    arena_id: str
    team_a: list[str]  # player IDs
    team_b: list[str]
    sets: list[SetResult]
    elo_provisional: dict[str, float] = field(default_factory=dict)
    client_version: str = "1.0.0"
    elo_config_version: str = "v1"

    @property
    def score_a(self) -> int:
        return sum(1 for s in self.sets if s.score_a > s.score_b)

    @property
    def score_b(self) -> int:
        return sum(1 for s in self.sets if s.score_b > s.score_a)

    @property
    def winner_team(self) -> list[str]:
        return self.team_a if self.score_a > self.score_b else self.team_b

    @property
    def loser_team(self) -> list[str]:
        return self.team_b if self.score_a > self.score_b else self.team_a

    @property
    def idempotency_key(self) -> str:
        """sha256(match_id + primeiro timestamp) — conforme PRD v2.0, Seção 7."""
        first_ts = self.sets[0].events[0].timestamp if self.sets and self.sets[0].events else ""
        raw = f"{self.match_id}:{first_ts}"
        return hashlib.sha256(raw.encode()).hexdigest()


# === K-FACTOR DINÂMICO ===

def get_k_factor(total_matches: int) -> float:
    """
    K-factor dinâmico conforme PRD v2.0, Seção 4:
    - Partidas 1-10:  K=40 (aceleração de nivelamento)
    - Partidas 11-30: K=24 (estabilização)
    - Partidas 31+:   K=16 (maturidade)
    """
    if total_matches <= 10:
        return 40.0
    elif total_matches <= 30:
        return 24.0
    else:
        return 16.0


# === MOTOR ELO COMPLETO (BACKEND — FONTE DE VERDADE) ===

class ELOEngine:
    """
    Motor ELO completo com pesos de fundamentos.
    Roda APENAS no backend (Decisão #1 da Reunião de Alinhamento).
    """

    def __init__(self, pesos: dict[str, float] | None = None):
        self.pesos = pesos or PESOS_FUNDAMENTOS

    def expected_score(self, rating_a: float, rating_b: float) -> float:
        """Probabilidade esperada de vitória de A contra B (fórmula ELO clássica)."""
        return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400.0))

    def calculate_performance_bonus(self, events: list[Evento], player_id: str) -> float:
        """
        Bonus/penalidade baseado nos fundamentos do jogador na partida.
        Soma ponderada dos eventos do jogador.
        """
        bonus = 0.0
        for event in events:
            if event.player_id == player_id:
                peso = self.pesos.get(event.tipo, 0.0)
                bonus += peso
        return bonus

    def calculate_match(
        self,
        match: MatchResult,
        current_ratings: dict[str, float],
        match_counts: dict[str, int],
    ) -> dict[str, float]:
        """
        Calcula os novos ratings ELO para todos os jogadores da partida.

        Args:
            match: Resultado completo da partida.
            current_ratings: {player_id: rating_atual}
            match_counts: {player_id: total_de_partidas_jogadas}

        Returns:
            {player_id: novo_rating}
        """
        all_events = []
        for s in match.sets:
            all_events.extend(s.events)

        # Rating médio de cada time
        avg_a = sum(current_ratings.get(p, 1500.0) for p in match.team_a) / len(match.team_a)
        avg_b = sum(current_ratings.get(p, 1500.0) for p in match.team_b) / len(match.team_b)

        # Resultado real (1.0 = vitória, 0.0 = derrota)
        actual_a = 1.0 if match.score_a > match.score_b else 0.0
        actual_b = 1.0 - actual_a

        # Margem de vitória (bonus por sets dominantes)
        total_sets = len(match.sets)
        if total_sets > 0:
            margin = abs(match.score_a - match.score_b) / total_sets
        else:
            margin = 0.0

        new_ratings = {}

        for player_id in match.team_a + match.team_b:
            is_team_a = player_id in match.team_a
            rating = current_ratings.get(player_id, 1500.0)
            matches_played = match_counts.get(player_id, 0)

            # K-factor dinâmico
            k = get_k_factor(matches_played)

            # Expected score baseado no rating médio dos times
            if is_team_a:
                expected = self.expected_score(avg_a, avg_b)
                actual = actual_a
            else:
                expected = self.expected_score(avg_b, avg_a)
                actual = actual_b

            # Bonus de fundamentos (diferencial do SharkRank)
            perf_bonus = self.calculate_performance_bonus(all_events, player_id)

            # Fórmula ELO com bonus de fundamentos e margem
            # Damping factor 0.3 para manter divergência ≤5pts vs. fórmula simplificada (contrato QA)
            delta = k * (actual - expected) + perf_bonus * 0.3 * (1 + margin * 0.3)

            new_ratings[player_id] = round(rating + delta, 1)

        return new_ratings

    def reconcile(
        self,
        elo_provisional: dict[str, float],
        elo_definitive: dict[str, float],
    ) -> dict[str, Any]:
        """
        Calcula delta entre ELO provisório (mobile) e definitivo (backend).
        Retorna payload de reconciliação conforme PRD v2.0, Seção 7.2.

        Regra: Se |delta| > 3 para qualquer jogador, notify_user = True.
        """
        delta = {}
        notify = False

        for player_id in elo_definitive:
            prov = elo_provisional.get(player_id, elo_definitive[player_id])
            diff = round(elo_definitive[player_id] - prov, 1)
            delta[player_id] = diff
            if abs(diff) > 3:
                notify = True

        return {
            "elo_definitive": elo_definitive,
            "delta": delta,
            "notify_user": notify,
        }


# === ELO SIMPLIFICADO (EXPORTÁVEL PARA MOBILE) ===

class ELOSimplified:
    """
    Fórmula ELO simplificada que roda no mobile (React Native).
    NÃO inclui pesos de fundamentos — apenas K-factor × resultado.
    Configurável via elo_config_v{N}.json (Diretriz Cruzada Backend→Mobile).
    """

    @staticmethod
    def calculate(
        player_rating: float,
        opponent_avg_rating: float,
        won: bool,
        k_factor: float = 32.0,
    ) -> float:
        """Cálculo ELO provisório (sem fundamentos)."""
        expected = 1.0 / (1.0 + math.pow(10, (opponent_avg_rating - player_rating) / 400.0))
        actual = 1.0 if won else 0.0
        return round(player_rating + k_factor * (actual - expected), 1)

    @staticmethod
    def generate_config(version: str = "v1") -> dict:
        """
        Gera o elo_config_v{N}.json que o mobile baixa via GET /elo/config.
        Permite atualizar a fórmula sem deploy de app.
        """
        return {
            "version": version,
            "algorithm": "elo_simplified",
            "params": {
                "base_rating": 1500,
                "k_factor_rules": [
                    {"max_matches": 10, "k": 40},
                    {"max_matches": 30, "k": 24},
                    {"max_matches": 999999, "k": 16},
                ],
                "formula": "new_rating = rating + K * (actual - expected)",
                "expected_formula": "1 / (1 + 10^((opponent_rating - player_rating) / 400))",
            },
            "fundamentos_tracked": [
                "saque_ace",
                "recepcao_perfeita",
                "ataque_vencedor",
                "erro_nao_forcado",
            ],
            "note": "Fundamentos são rastreados pelo mobile mas NÃO usados no cálculo provisório. "
                    "O backend usa os fundamentos no cálculo definitivo.",
        }


# === IDEMPOTÊNCIA ===

class IdempotencyStore:
    """
    Armazena chaves de idempotência para evitar reprocessamento.
    Em produção, usar Redis com TTL de 72h (conforme BackendSenior.md).
    """

    def __init__(self):
        self._store: dict[str, dict] = {}

    def exists(self, key: str) -> bool:
        return key in self._store

    def store(self, key: str, result: dict) -> None:
        self._store[key] = result

    def get(self, key: str) -> dict | None:
        return self._store.get(key)
