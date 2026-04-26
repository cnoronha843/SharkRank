"""
SharkRank — Teste de Caminho Feliz (Happy Path E2E)
====================================================
Simula o fluxo COMPLETO de um professor chegando na arena:
  1. Cadastrar jogadores
  2. Montar os times
  3. Jogar uma partida (criar match com fundamentos)
  4. Verificar se o ELO foi calculado
  5. Consultar o ranking (ordem correta)
  6. Consultar as estatísticas individuais
  7. Consultar o histórico de partidas do jogador
  8. Jogar uma SEGUNDA partida (validar acúmulo)
  9. Verificar que o ranking atualizou

Diretriz: QAEngineer.md — Toda feature entregue DEVE ter teste automatizado.
"""

import os

import pytest
from fastapi.testclient import TestClient

from app.database import DB_PATH
from app.main import app


@pytest.fixture(autouse=True)
def fresh_db():
    """Garante banco limpo para cada teste (isolamento total)."""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    yield
    # Cleanup pós-teste
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


ARENA_ID = "arena-teste-happy-path"


class TestHappyPath:
    """
    Teste sequencial do caminho feliz completo.
    Cada método depende do anterior — simula uma sessão real na arena.
    """

    def test_full_journey(self, client):
        # ============================================================
        # FASE 1: Cadastrar 4 jogadores na arena
        # ============================================================
        players = {}
        player_names = [
            {"name": "Rafael Costa", "nickname": "Rafa", "position": "atacante", "age": 28},
            {"name": "Mateus Silva", "nickname": "Mateus", "position": "levantador", "age": 25},
            {"name": "Lucas Souza", "nickname": "Lucas", "position": "defensor", "age": 30},
            {"name": "Pedro Santos", "nickname": "Pedrão", "position": "atacante", "age": 22},
        ]

        for p in player_names:
            r = client.post(f"/arenas/{ARENA_ID}/players", json=p)
            assert r.status_code == 201, f"Falha ao criar jogador {p['name']}: {r.text}"
            data = r.json()
            assert data["rating"] == 1000.0, "Rating inicial deve ser 1000"
            players[p["nickname"]] = data["id"]

        # Validar que todos os 4 foram criados
        r = client.get(f"/arenas/{ARENA_ID}/players")
        assert r.status_code == 200
        assert r.json()["total"] == 4, "Devem existir exatamente 4 jogadores"

        # ============================================================
        # FASE 2: Jogar a PRIMEIRA partida (Rafa+Mateus vs Lucas+Pedrão)
        # ============================================================
        match_1_payload = {
            "match_id": "happy-match-001",
            "arena_id": ARENA_ID,
            "idempotency_key": "happy-idem-001",
            "team_a": [players["Rafa"], players["Mateus"]],
            "team_b": [players["Lucas"], players["Pedrão"]],
            "sets": [
                {
                    "score_a": 18,
                    "score_b": 12,
                    "events": [
                        {
                            "type": "shark_ataque",
                            "player": players["Rafa"],
                            "timestamp": "2026-04-26T14:00:00Z",
                        },
                        {
                            "type": "shark_ataque",
                            "player": players["Rafa"],
                            "timestamp": "2026-04-26T14:01:00Z",
                        },
                        {
                            "type": "peito",
                            "player": players["Mateus"],
                            "timestamp": "2026-04-26T14:02:00Z",
                        },
                        {
                            "type": "erro_recepcao",
                            "player": players["Lucas"],
                            "timestamp": "2026-04-26T14:03:00Z",
                        },
                    ],
                },
                {
                    "score_a": 18,
                    "score_b": 15,
                    "events": [
                        {
                            "type": "shark_ataque",
                            "player": players["Rafa"],
                            "timestamp": "2026-04-26T14:20:00Z",
                        },
                        {
                            "type": "peito",
                            "player": players["Mateus"],
                            "timestamp": "2026-04-26T14:21:00Z",
                        },
                    ],
                },
            ],
            "elo_provisional": {
                players["Rafa"]: 1020,
                players["Mateus"]: 1015,
                players["Lucas"]: 985,
                players["Pedrão"]: 980,
            },
            "client_version": "1.0.0",
            "elo_config_version": "v1",
        }

        r = client.post("/matches", json=match_1_payload)
        assert r.status_code == 202, f"Falha ao criar partida: {r.text}"
        match_1_result = r.json()

        # Verificar que o motor ELO retornou os campos obrigatórios
        assert "elo_definitive" in match_1_result, "Faltou elo_definitive na resposta"
        assert "delta" in match_1_result, "Faltou delta na resposta"
        assert "match_id" in match_1_result, "Faltou match_id na resposta"
        assert match_1_result["match_id"] == "happy-match-001"

        # Verificar que os vencedores (Time A) ganharam ELO
        elo_def = match_1_result["elo_definitive"]
        assert elo_def[players["Rafa"]] > 1000, "Rafa (vencedor) deveria ter ELO > 1000"
        assert elo_def[players["Mateus"]] > 1000, "Mateus (vencedor) deveria ter ELO > 1000"

        # ============================================================
        # FASE 3: Consultar o RANKING e validar a ordem
        # ============================================================
        r = client.get(f"/arenas/{ARENA_ID}/ranking")
        assert r.status_code == 200
        ranking = r.json()["ranking"]
        assert len(ranking) == 4, "Ranking deve ter 4 jogadores"

        # Verificar ordenação decrescente por rating
        ratings = [p["rating"] for p in ranking]
        assert ratings == sorted(ratings, reverse=True), "Ranking deve estar em ordem decrescente"

        # O #1 do ranking deve ser um dos vencedores (Rafa ou Mateus)
        top_ids = [ranking[0]["id"], ranking[1]["id"]]
        assert players["Rafa"] in top_ids, "Rafa deveria estar no top 2"
        assert players["Mateus"] in top_ids, "Mateus deveria estar no top 2"

        # ============================================================
        # FASE 4: Consultar ESTATÍSTICAS individuais do Rafa
        # ============================================================
        r = client.get(f"/players/{players['Rafa']}/stats")
        assert r.status_code == 200
        stats = r.json()
        assert stats["name"] == "Rafael Costa"
        assert stats["rating"] > 1000, "Rating do Rafa deveria ter subido"
        assert stats["stats"]["total_matches"] == 1
        # Rafa fez 3 shark_ataques nos 2 sets
        assert stats["stats"]["fundamentals"].get("shark_ataque", 0) == 3, (
            f"Rafa deveria ter 3 shark_ataques, mas tem {stats['stats']['fundamentals']}"
        )

        # ============================================================
        # FASE 5: Consultar HISTÓRICO de partidas do Mateus
        # ============================================================
        r = client.get(f"/players/{players['Mateus']}/matches")
        assert r.status_code == 200
        matches = r.json()["matches"]
        assert len(matches) == 1, "Mateus deveria ter 1 partida no histórico"
        assert matches[0]["id"] == "happy-match-001"

        # ============================================================
        # FASE 6: Jogar uma SEGUNDA partida (revanche! Lucas+Pedrão vencem)
        # ============================================================
        match_2_payload = {
            "match_id": "happy-match-002",
            "arena_id": ARENA_ID,
            "idempotency_key": "happy-idem-002",
            "team_a": [players["Lucas"], players["Pedrão"]],
            "team_b": [players["Rafa"], players["Mateus"]],
            "sets": [
                {
                    "score_a": 18,
                    "score_b": 16,
                    "events": [
                        {
                            "type": "shark_ataque",
                            "player": players["Lucas"],
                            "timestamp": "2026-04-26T15:00:00Z",
                        },
                        {
                            "type": "shark_ataque",
                            "player": players["Pedrão"],
                            "timestamp": "2026-04-26T15:01:00Z",
                        },
                    ],
                },
                {
                    "score_a": 18,
                    "score_b": 14,
                    "events": [
                        {
                            "type": "peito",
                            "player": players["Pedrão"],
                            "timestamp": "2026-04-26T15:20:00Z",
                        },
                    ],
                },
            ],
            "elo_provisional": {
                players["Lucas"]: 1010,
                players["Pedrão"]: 1005,
                players["Rafa"]: 990,
                players["Mateus"]: 995,
            },
            "client_version": "1.0.0",
            "elo_config_version": "v1",
        }

        r = client.post("/matches", json=match_2_payload)
        assert r.status_code == 202, f"Falha na segunda partida: {r.text}"
        match_2_result = r.json()
        assert match_2_result["match_id"] == "happy-match-002"

        # ============================================================
        # FASE 7: Validar que o RANKING atualizou após 2 partidas
        # ============================================================
        r = client.get(f"/arenas/{ARENA_ID}/ranking")
        assert r.status_code == 200
        ranking_v2 = r.json()["ranking"]

        # Verificar que todos jogadores agora têm matches_played > 0
        for p in ranking_v2:
            assert p["matches_played"] >= 1, f"{p['name']} deveria ter pelo menos 1 partida jogada"

        # A ordenação continua decrescente
        ratings_v2 = [p["rating"] for p in ranking_v2]
        assert ratings_v2 == sorted(ratings_v2, reverse=True), "Ranking v2 deve estar ordenado"

        # ============================================================
        # FASE 8: Verificar acúmulo de STATS do Rafa (agora com 2 partidas)
        # ============================================================
        r = client.get(f"/players/{players['Rafa']}/stats")
        assert r.status_code == 200
        stats_v2 = r.json()
        assert stats_v2["stats"]["total_matches"] == 2, "Rafa deveria ter 2 partidas agora"

        # ============================================================
        # FASE 9: Health check — tudo saudável após o fluxo completo
        # ============================================================
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

        r = client.get("/health/elo-accuracy")
        assert r.status_code == 200
        assert r.json()["sample_size"] >= 0  # Pode ter deltas ou não

        print("\n[SHARK] HAPPY PATH COMPLETO -- Todas as fases passaram!")
        print(f"   Jogadores criados: {len(players)}")
        print("   Partidas jogadas: 2")
        print(
            f"   Ranking final: {[p['name'] + ' (' + str(p['rating']) + ')' for p in ranking_v2]}"
        )
