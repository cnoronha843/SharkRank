"""
Testes da API FastAPI — SharkRank
Cobre: health, ELO config, match creation, ranking, surveys, analytics.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


import os
from app.database import DB_PATH

@pytest.fixture(autouse=True)
def clean_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


class TestHealthEndpoints:
    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"
        assert r.json()["service"] == "sharkrank-api"

    def test_elo_accuracy(self, client):
        r = client.get("/health/elo-accuracy")
        assert r.status_code == 200
        assert "avg_divergence" in r.json()


class TestELOConfig:
    def test_get_config(self, client):
        r = client.get("/elo/config")
        assert r.status_code == 200
        data = r.json()
        assert data["version"] == "v1"
        assert len(data["params"]["k_factor_rules"]) == 3
        assert len(data["fundamentos_tracked"]) == 4


class TestMatchEndpoint:
    def test_create_match(self, client):
        payload = {
            "match_id": "test-api-001",
            "arena_id": "arena-blumenau-01",
            "idempotency_key": "abc123def456",
            "team_a": ["p-rafael", "p-mateus"],
            "team_b": ["p-lucas", "p-pedro"],
            "sets": [{
                "score_a": 18, "score_b": 12,
                "events": [
                    {"type": "shark_ataque", "player": "p-rafael", "timestamp": "2026-04-25T10:00:00Z"},
                    {"type": "shark_ataque", "player": "p-mateus", "timestamp": "2026-04-25T10:01:00Z"},
                ]
            }],
            "elo_provisional": {"p-rafael": 1625, "p-mateus": 1560, "p-lucas": 1575, "p-pedro": 1515},
            "client_version": "1.0.0",
            "elo_config_version": "v1",
        }
        r = client.post("/matches", json=payload)
        assert r.status_code == 202
        data = r.json()
        assert "elo_definitive" in data
        assert "delta" in data
        assert "notify_user" in data

    def test_idempotency_returns_cached(self, client):
        """Requisição duplicada retorna 200 sem reprocessar."""
        payload = {
            "match_id": "test-idem-001",
            "arena_id": "arena-blumenau-01",
            "idempotency_key": "unique_key_12345",
            "team_a": ["p-rafael", "p-mateus"],
            "team_b": ["p-lucas", "p-pedro"],
            "sets": [{"score_a": 18, "score_b": 15, "events": []}],
            "elo_provisional": {},
            "client_version": "1.0.0",
            "elo_config_version": "v1",
        }
        r1 = client.post("/matches", json=payload)
        r2 = client.post("/matches", json=payload)
        assert r1.status_code == 202
        assert r2.status_code == 202
        assert r1.json()["elo_definitive"] == r2.json()["elo_definitive"]

    def test_missing_idempotency_key_returns_422(self, client):
        payload = {
            "match_id": "test-no-key",
            "arena_id": "arena-blumenau-01",
            "idempotency_key": "",
            "team_a": ["p-rafael", "p-mateus"],
            "team_b": ["p-lucas", "p-pedro"],
            "sets": [{"score_a": 18, "score_b": 15, "events": []}],
            "client_version": "1.0.0",
            "elo_config_version": "v1",
        }
        r = client.post("/matches", json=payload)
        assert r.status_code == 422

    def test_wrong_config_version_returns_409(self, client):
        payload = {
            "match_id": "test-wrong-config",
            "arena_id": "arena-blumenau-01",
            "idempotency_key": "config_test_key",
            "team_a": ["p-rafael", "p-mateus"],
            "team_b": ["p-lucas", "p-pedro"],
            "sets": [{"score_a": 18, "score_b": 15, "events": []}],
            "client_version": "1.0.0",
            "elo_config_version": "v999",  # versão que não existe
        }
        r = client.post("/matches", json=payload)
        assert r.status_code == 409


class TestRanking:
    def test_arena_ranking(self, client):
        r = client.get("/arenas/arena-blumenau-01/ranking")
        assert r.status_code == 200
        data = r.json()
        assert data["arena_id"] == "arena-blumenau-01"
        assert len(data["ranking"]) >= 4  # At least 4 players from match tests + seeds
        # Verificar ordenação decrescente
        ratings = [p["rating"] for p in data["ranking"]]
        assert ratings == sorted(ratings, reverse=True)


class TestCalibrationSurvey:
    def test_submit_survey(self, client):
        payload = {
            "arena_id": "arena-blumenau-01",
            "match_id": "test-api-001",
            "q1_accuracy_score": 4,
            "q2_best_player": "Rafael",
            "q3_would_use": "Sim",
        }
        r = client.post("/calibration-surveys", json=payload)
        assert r.status_code == 201
        assert r.json()["status"] == "ok"

    def test_calibration_report_with_surveys(self, client):
        # Submeter survey primeiro
        client.post("/calibration-surveys", json={
            "arena_id": "arena-blumenau-01",
            "match_id": "test-cal-001",
            "q1_accuracy_score": 4,
            "q2_best_player": "Rafael",
            "q3_would_use": "Sim",
        })
        r = client.get("/arenas/arena-blumenau-01/calibration-report")
        assert r.status_code == 200
        data = r.json()
        assert "total_surveys" in data
        assert "avg_accuracy_score" in data
        assert "gate_status" in data


class TestAnalytics:
    def test_track_event(self, client):
        payload = {
            "event_name": "sr_match_started",
            "arena_id": "arena-blumenau-01",
            "properties": {"player_count": 4},
        }
        r = client.post("/analytics/events", json=payload)
        assert r.status_code == 201
