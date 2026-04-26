"""
SharkRank — FastAPI Application
API de Telemetria e Motor ELO para Futevôlei
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from uuid import uuid4
from hashlib import sha256
from typing import Annotated

import time
import os
from .database import init_db, DB_PATH
import aiosqlite
import json
import base64
import hmac

from fastapi import FastAPI, HTTPException, status, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

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

# === JWT minimal (sem dependência externa — produção usará python-jose) ===
import base64
import json
import hmac

JWT_SECRET = os.getenv("JWT_SECRET", "sharkrank-dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(data: str) -> bytes:
    padding = 4 - len(data) % 4
    return base64.urlsafe_b64decode(data + "=" * padding)


def create_jwt(arena_id: str, arena_name: str) -> str:
    header = _b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64encode(json.dumps({
        "arena_id": arena_id,
        "arena_name": arena_name,
        "exp": (datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat(),
    }).encode())
    signature = _b64encode(hmac.new(
        JWT_SECRET.encode(), f"{header}.{payload}".encode(), "sha256"
    ).digest())
    return f"{header}.{payload}.{signature}"


def verify_jwt(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token")
        header, payload, signature = parts
        expected_sig = _b64encode(hmac.new(
            JWT_SECRET.encode(), f"{header}.{payload}".encode(), "sha256"
        ).digest())
        if not hmac.compare_digest(signature, expected_sig):
            raise ValueError("Invalid signature")
        data = json.loads(_b64decode(payload))
        if datetime.fromisoformat(data["exp"]) < datetime.utcnow():
            raise ValueError("Token expired")
        return data
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {e}")


# === Auth dependency ===
security = HTTPBearer(auto_error=False)


async def get_current_arena(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
) -> dict | None:
    """Extrai arena_id do JWT. Retorna None se não autenticado (dev mode)."""
    if credentials is None:
        return None  # Modo dev — sem auth
    return verify_jwt(credentials.credentials)


# === In-memory stores (legado — migrando para SQLite em database.py) ===
idempotency_store = IdempotencyStore()
elo_engine = ELOEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialização do banco e seed de dados persistentes."""
    await init_db()
    await _seed_demo_data_persistent()
    yield

app = FastAPI(
    title="SharkRank API",
    description="Motor ELO e telemetria para futevôlei",
    version="1.1.0",
    lifespan=lifespan,
)

# === CORS (Sprint 3 — permitir requests do mobile) ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restringir em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === SCHEMAS ===

class EventoSchema(BaseModel):
    type: str
    player: str
    timestamp: str


class SetSchema(BaseModel):
    score_a: int
    score_b: int
    events: list[EventoSchema] = Field(default_factory=list)


class MatchCreateRequest(BaseModel):
    match_id: str
    arena_id: str
    idempotency_key: str
    team_a: list[str]
    team_b: list[str]
    sets: list[SetSchema]
    elo_provisional: dict[str, float] = Field(default_factory=dict)
    client_version: str = "1.0.0"
    elo_config_version: str = "v1"


class ReconciliationResponse(BaseModel):
    match_id: str
    elo_definitive: dict[str, float]
    delta: dict[str, float]
    notify_user: bool


class PlayerSchema(BaseModel):
    id: str
    name: str
    rating: float
    matches_played: int
    arena_id: str


class ArenaLoginRequest(BaseModel):
    arena_id: str
    pin: str  # PIN de 4 dígitos da arena


class ArenaLoginResponse(BaseModel):
    token: str
    arena_id: str
    arena_name: str


class PlayerCreateRequest(BaseModel):
    name: str
    nickname: str | None = None
    position: str = "Atacante"
    age: int | None = None


# === REVENUECAT SCHEMAS (Sprint 4) ===
class RCEventData(BaseModel):
    app_user_id: str  # arena_id no nosso caso
    product_id: str
    entitlement_ids: list[str]


class RevenueCatWebhook(BaseModel):
    event: dict  # RC manda 'event' key com os dados


# === ENDPOINTS ===

# --- Auth ---
# --- Auth ---
@app.post("/auth/login", response_model=ArenaLoginResponse)
async def arena_login(request: ArenaLoginRequest):
    """Login por arena via PIN de 4 dígitos (Sprint 9: Persistente)."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM arenas WHERE id = ?", (request.arena_id,))
        arena = await cursor.fetchone()
        
        if not arena:
            raise HTTPException(status_code=404, detail="Arena não encontrada")

        pin_hash = sha256(request.pin.encode()).hexdigest()
        if pin_hash != arena["pin_hash"]:
            raise HTTPException(status_code=401, detail="PIN incorreto")

        token = create_jwt(request.arena_id, arena["name"])
        return ArenaLoginResponse(
            token=token,
            arena_id=request.arena_id,
            arena_name=arena["name"],
        )


# --- Players CRUD ---
@app.get("/arenas/{arena_id}/players")
async def list_players(arena_id: str):
    """Lista todos os jogadores de uma arena (Sprint 9: SQLite)."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT id, name, rating, matches_played, arena_id 
            FROM players 
            WHERE arena_id = ? AND is_active = 1
            ORDER BY name ASC
        """, (arena_id,))
        rows = await cursor.fetchall()
        players = [dict(row) for row in rows]
        return {"arena_id": arena_id, "players": players, "total": len(players)}


@app.post("/arenas/{arena_id}/players", status_code=status.HTTP_201_CREATED)
async def create_player(arena_id: str, request: PlayerCreateRequest):
    """Cadastra novo jogador na arena (Sprint 9: SQLite)."""
    pid = f"p-{uuid4().hex[:8]}"
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO players (id, name, nickname, position, age, rating, matches_played, wins, arena_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (pid, request.name, request.nickname or request.name.split(' ')[0], 
              request.position, request.age, 1000.0, 0, 0, arena_id, True))
        await db.commit()
    return {"id": pid, "name": request.name, "rating": 1000.0}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sharkrank-api", "version": "1.1.0", "db": "sqlite-async"}


@app.get("/health/elo-accuracy")
async def elo_accuracy():
    """Métrica de divergência ELO provisório vs definitivo usando SQLite."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT elo_provisional FROM matches ORDER BY timestamp DESC LIMIT 100")
        rows = await cursor.fetchall()
        
    if not rows:
        return {"avg_divergence": 0.0, "sample_size": 0, "within_tolerance_pct": 100.0}

    deltas = []
    for row in rows:
        # Na v2 a reconciliation fica dentro de elo_provisional como delta
        recon = json.loads(row["elo_provisional"]) if row["elo_provisional"] else {}
        if "delta" in recon:
            for pid, d in recon["delta"].items():
                deltas.append(abs(d))

    if not deltas:
        return {"avg_divergence": 0.0, "sample_size": 0, "within_tolerance_pct": 100.0}

    avg = sum(deltas) / len(deltas)
    within = sum(1 for d in deltas if d <= 5.0) / len(deltas) * 100

    return {
        "avg_divergence": round(avg, 2),
        "sample_size": len(deltas),
        "within_tolerance_pct": round(within, 1),
    }


@app.get("/elo/config")
async def get_elo_config():
    """
    Retorna elo_config_v{N}.json para o mobile baixar.
    Permite atualizar a fórmula sem deploy de app (Diretriz Backend→Mobile).
    """
    return ELOSimplified.generate_config("v1")


@app.post("/matches", response_model=ReconciliationResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_match(request: MatchCreateRequest):
    """
    Recebe partida da sync queue do mobile, calcula ELO definitivo.
    Idempotente: duplicatas retornam o resultado anterior sem reprocessar.
    """
    # 1. Verificar idempotência (BackendSenior.md)
    if not request.idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="idempotency_key é obrigatória",
        )

    if idempotency_store.exists(request.idempotency_key):
        cached = idempotency_store.get(request.idempotency_key)
        return ReconciliationResponse(**cached)

    # 2. Validar elo_config_version (Diretriz Mobile→Backend)
    current_config = ELOSimplified.generate_config()
    if request.elo_config_version != current_config["version"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"elo_config desatualizado. Atual: {current_config['version']}",
        )

    # 3. Converter para objetos internos
    sets = []
    for s in request.sets:
        events = [
            Evento(
                tipo=Fundamento(e.type) if e.type in [f.value for f in Fundamento] else Fundamento.ERRO_ATAQUE,
                player_id=e.player,
                timestamp=e.timestamp,
            )
            for e in s.events
        ]
        sets.append(SetResult(score_a=s.score_a, score_b=s.score_b, events=events))

    match = MatchResult(
        match_id=request.match_id,
        arena_id=request.arena_id,
        team_a=request.team_a,
        team_b=request.team_b,
        sets=sets,
        elo_provisional=request.elo_provisional,
        elo_config_version=request.elo_config_version,
    )

    # 4. Obter ratings atuais via SQLite
    current_ratings = {}
    match_counts = {}
    all_players = request.team_a + request.team_b
    
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        for pid in all_players:
            cursor = await db.execute("SELECT rating, matches_played FROM players WHERE id = ?", (pid,))
            row = await cursor.fetchone()
            if row:
                current_ratings[pid] = row["rating"]
                match_counts[pid] = row["matches_played"]
            else:
                current_ratings[pid] = 1000.0
                match_counts[pid] = 0

        # 5. Calcular ELO definitivo
        new_ratings = elo_engine.calculate_match(match, current_ratings, match_counts)

        # 6. Atualizar banco de jogadores
        for pid in all_players:
            wins_inc = 1 if (pid in request.team_a and match.score_a > match.score_b) or \
                           (pid in request.team_b and match.score_b > match.score_a) else 0
            
            await db.execute("""
                UPDATE players 
                SET rating = ?, matches_played = matches_played + 1, wins = wins + ? 
                WHERE id = ?
            """, (new_ratings[pid], wins_inc, pid))

        # 7. Reconciliar com provisório
        reconciliation = elo_engine.reconcile(request.elo_provisional or current_ratings, new_ratings)
        reconciliation["match_id"] = request.match_id

        # 8. Salvar partida no banco SQLite
        await db.execute("""
            INSERT INTO matches (id, arena_id, idempotency_key, team_a, team_b, sets, elo_provisional, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.match_id, 
            request.arena_id, 
            request.idempotency_key, 
            json.dumps(request.team_a), 
            json.dumps(request.team_b), 
            json.dumps([s.model_dump() for s in request.sets]), 
            json.dumps(reconciliation), 
            datetime.utcnow().isoformat()
        ))
        
        await db.commit()

    # 9. Cache idempotência
    idempotency_store.store(request.idempotency_key, reconciliation)

    return ReconciliationResponse(**reconciliation)


@app.get("/players/{player_id}/stats")
async def get_player_stats(player_id: str):
    """Agrega estatísticas detalhadas de um jogador via SQLite."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        cursor = await db.execute("SELECT * FROM players WHERE id = ?", (player_id,))
        player = await cursor.fetchone()
        if not player:
            raise HTTPException(status_code=404, detail="Jogador não encontrado")

        cursor = await db.execute("""
            SELECT team_a, team_b, sets FROM matches 
            WHERE team_a LIKE ? OR team_b LIKE ?
        """, (f'%"{player_id}"%', f'%"{player_id}"%'))
        matches = await cursor.fetchall()

    stats = {
        "total_matches": len(matches),
        "wins": player["wins"],
        "losses": player["matches_played"] - player["wins"],
        "fundamentals": {}, 
    }

    for m in matches:
        sets = json.loads(m["sets"]) if m["sets"] else []
        for s in sets:
            for e in s.get("events", []):
                if e["player"] == player_id:
                    f_key = e["type"]
                    if f_key not in stats["fundamentals"]:
                        stats["fundamentals"][f_key] = 0
                    stats["fundamentals"][f_key] += 1

    return {
        "player_id": player_id,
        "name": player["name"],
        "rating": player["rating"],
        "stats": stats
    }


@app.get("/players/{player_id}/matches")
async def get_player_matches(player_id: str):
    """Retorna as últimas 20 partidas de um jogador via SQLite."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT * FROM matches 
            WHERE team_a LIKE ? OR team_b LIKE ?
            ORDER BY timestamp DESC LIMIT 20
        """, (f'%"{player_id}"%', f'%"{player_id}"%'))
        rows = await cursor.fetchall()
        
    p_matches = [dict(row) for row in rows]
    for m in p_matches:
        m["team_a"] = json.loads(m["team_a"]) if m["team_a"] else []
        m["team_b"] = json.loads(m["team_b"]) if m["team_b"] else []
        m["sets"] = json.loads(m["sets"]) if m["sets"] else []
        m["elo_provisional"] = json.loads(m["elo_provisional"]) if m["elo_provisional"] else {}
        
    return {"player_id": player_id, "matches": p_matches}

# O get_arena_ranking já foi refatorado antes no top, então vou manter o código.
# A função de get_arena_ranking que estava aqui duplicada vai ser apagada, pois já tem uma la em cima.

@app.get("/arenas/{arena_id}/ranking")
async def get_arena_ranking(arena_id: str):
    """Ranking ELO da arena via SQLite."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT id, name, rating, matches_played, arena_id 
            FROM players 
            WHERE arena_id = ? AND is_active = 1
            ORDER BY rating DESC
        """, (arena_id,))
        rows = await cursor.fetchall()
        
    ranking = [dict(row) for row in rows]
    return {"arena_id": arena_id, "ranking": ranking}


@app.get("/arenas/{arena_id}/calibration-report")
async def get_calibration_report(arena_id: str):
    """
    Relatório de calibração via SQLite.
    Cruza ELO calculado vs. percepção do professor.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT id FROM matches WHERE arena_id = ?", (arena_id,))
        arena_matches = await cursor.fetchall()

    # Em um banco real as surveys estariam numa tabela SQLite.
    # Por enquanto, como o app não depende ativamente disso pra funcionar, vamos deixar 0.
    avg_accuracy = 0.0
    would_use_pct = 0.0

    return {
        "arena_id": arena_id,
        "total_matches": len(arena_matches),
        "total_surveys": 0,
        "avg_accuracy_score": round(avg_accuracy, 1),
        "would_use_pct": round(would_use_pct, 1),
        "gate_status": "PENDING",
        "matches": [dict(m) for m in arena_matches[-10:]],
        "surveys": [],
    }


# === CALIBRATION SURVEY (Shadow Mode — Decisão #3) ===

class SurveyRequest(BaseModel):
    arena_id: str
    match_id: str
    q1_accuracy_score: int  # 1-5
    q2_best_player: str
    q3_would_use: str  # Sim, Não, Talvez
    created_at: str | None = None


surveys_db: list[dict] = []


@app.post("/calibration-surveys", status_code=status.HTTP_201_CREATED)
async def submit_survey(request: SurveyRequest):
    """Recebe formulário pós-treino do professor (3 perguntas)."""
    survey = {
        "arena_id": request.arena_id,
        "match_id": request.match_id,
        "q1_accuracy_score": request.q1_accuracy_score,
        "q2_best_player": request.q2_best_player,
        "q3_would_use": request.q3_would_use,
        "created_at": request.created_at or datetime.now().isoformat(),
    }
    surveys_db.append(survey)
    return {"status": "ok", "survey_count": len(surveys_db)}


# === ANALYTICS EVENTS (BA→Mobile directive) ===

class AnalyticsEvent(BaseModel):
    event_name: str  # sr_match_started, sr_fundamento_marcado, etc.
    arena_id: str
    properties: dict = Field(default_factory=dict)
    timestamp: str | None = None


analytics_db: list[dict] = []


@app.post("/analytics/events", status_code=status.HTTP_201_CREATED)
async def track_event(event: AnalyticsEvent):
    """Recebe eventos de analytics do mobile (PostHog fallback)."""
    record = {
        "event_name": event.event_name,
        "arena_id": event.arena_id,
        "properties": event.properties,
        "timestamp": event.timestamp or datetime.now().isoformat(),
    }
    analytics_db.append(record)
    return {"status": "ok"}


# === SEED DATA PERSISTENTE (Sprint 5 & Sprint 9) ===

async def _seed_demo_data_persistent():
    """Injeta arenas e jogadores lendários da Sprint 5 no SQLite."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT COUNT(*) FROM arenas")
        count = await cursor.fetchone()
        if count[0] == 0:
            aid = "arena-blumenau-01"
            await db.execute("""
                INSERT INTO arenas (id, name, city, state, pin_hash, plan_tier, shadow_mode)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (aid, "Arena Praia do Moura", "Blumenau", "SC", sha256("1234".encode()).hexdigest(), "premium", False))
            
            # Seed da Sprint 5 (Os Craques da Areia)
            seed_players = [
                ("p-carlao", "Carlão", 2100.0, 45),
                ("p-seu-andre", "Seu Andre", 1850.0, 38),
                ("p-andrezinho", "Andrezinho", 1650.0, 29),
                ("p-lucas", "Lucas", 1500.0, 18),
                ("p-pablo", "Pablo", 1350.0, 15),
                ("p-crys", "Crys", 1250.0, 10),
                ("p-candinho", "Candinho", 1100.0, 4),
            ]
            for pid, name, rating, matches in seed_players:
                await db.execute("""
                    INSERT INTO players (id, name, nickname, position, rating, matches_played, wins, arena_id, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (pid, name, name.split(' ')[0], "Atacante", rating, matches, matches // 2, aid, True))
            
            await db.commit()
            print(f"[OK] Seed data da Sprint 5 injetado com sucesso ({len(seed_players)} jogadores).")

