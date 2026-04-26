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

JWT_SECRET = "sharkrank-dev-secret-change-in-prod"  # ENV var em prod
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


# === In-memory stores (substituir por PostgreSQL + Redis em produção) ===
idempotency_store = IdempotencyStore()
players_db: dict[str, dict] = {}
matches_db: list[dict] = []
elo_engine = ELOEngine()
arenas_db: dict[str, dict] = {}  # {arena_id: {name, pin_hash, ...}}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Seed de dados para desenvolvimento."""
    _seed_demo_data()
    yield


app = FastAPI(
    title="SharkRank API",
    description="Motor ELO e telemetria para futevôlei",
    version="0.2.0",
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
@app.post("/auth/login", response_model=ArenaLoginResponse)
async def arena_login(request: ArenaLoginRequest):
    """
    Login por arena via PIN de 4 dígitos.
    Usado pelo professor para vincular o app à sua arena.
    """
    arena = arenas_db.get(request.arena_id)
    if not arena:
        raise HTTPException(status_code=404, detail="Arena não encontrada")

    pin_hash = sha256(request.pin.encode()).hexdigest()
    if pin_hash != arena.get("pin_hash"):
        raise HTTPException(status_code=401, detail="PIN incorreto")

    token = create_jwt(request.arena_id, arena["name"])
    return ArenaLoginResponse(
        token=token,
        arena_id=request.arena_id,
        arena_name=arena["name"],
    )


# --- Webhooks (RevenueCat) ---
@app.post("/webhooks/revenuecat")
async def revenuecat_webhook(payload: RevenueCatWebhook):
    """
    Recebe eventos de assinatura (INITIAL_PURCHASE, RENEWAL, CANCELLATION)
    e atualiza o plan_tier da arena.
    """
    event_type = payload.event.get("type")
    arena_id = payload.event.get("app_user_id")
    entitlements = payload.event.get("entitlement_ids", [])
    
    if arena_id in arenas_db:
        if event_type in ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"]:
            if "premium_arena" in entitlements:
                arenas_db[arena_id]["plan_tier"] = "premium"
                arenas_db[arena_id]["shadow_mode"] = False  # Premium libera ranking
        elif event_type in ["CANCELLATION", "EXPIRATION"]:
            arenas_db[arena_id]["plan_tier"] = "basic"
            arenas_db[arena_id]["shadow_mode"] = True
    
    return {"status": "received"}


# --- Players CRUD ---
@app.get("/arenas/{arena_id}/players")
async def list_players(arena_id: str):
    """Lista todos os jogadores de uma arena."""
    arena_players = [
        PlayerSchema(
            id=pid, name=p["name"], rating=p["rating"],
            matches_played=p["matches_played"], arena_id=p["arena_id"],
        )
        for pid, p in players_db.items()
        if p["arena_id"] == arena_id and p.get("is_active", True)
    ]
    arena_players.sort(key=lambda x: x.name)
    return {"arena_id": arena_id, "players": arena_players, "total": len(arena_players)}


@app.post("/arenas/{arena_id}/players", status_code=status.HTTP_201_CREATED)
async def create_player(arena_id: str, request: PlayerCreateRequest):
    """Cadastra novo jogador na arena."""
    pid = f"p-{uuid4().hex[:8]}"
    players_db[pid] = {
        "name": request.name,
        "nickname": request.nickname,
        "position": request.position,
        "age": request.age,
        "rating": 1500.0,
        "matches_played": 0,
        "wins": 0,
        "arena_id": arena_id,
        "is_active": True,
    }
    return {"id": pid, "name": request.name, "rating": 1500.0}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sharkrank-api", "version": "0.1.0"}


@app.get("/health/elo-accuracy")
async def elo_accuracy():
    """
    Métrica de divergência ELO provisório vs definitivo (QAEngineer.md).
    Monitora as últimas 100 partidas processadas.
    """
    if not matches_db:
        return {"avg_divergence": 0.0, "sample_size": 0, "within_tolerance_pct": 100.0}

    recent = matches_db[-100:]
    deltas = []
    for m in recent:
        if "reconciliation" in m:
            for pid, d in m["reconciliation"]["delta"].items():
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
                tipo=Fundamento(e.type) if e.type in [f.value for f in Fundamento] else Fundamento.ERRO_NAO_FORCADO,
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

    # 4. Obter ratings atuais
    current_ratings = {}
    match_counts = {}
    all_players = request.team_a + request.team_b
    for pid in all_players:
        if pid not in players_db:
            players_db[pid] = {"rating": 1500.0, "matches_played": 0, "arena_id": request.arena_id, "name": pid}
        current_ratings[pid] = players_db[pid]["rating"]
        match_counts[pid] = players_db[pid]["matches_played"]

    # 5. Calcular ELO definitivo
    new_ratings = elo_engine.calculate_match(match, current_ratings, match_counts)

    # 6. Atualizar banco de jogadores
    for pid in all_players:
        players_db[pid]["rating"] = new_ratings[pid]
        players_db[pid]["matches_played"] += 1

    # 7. Reconciliar com provisório
    reconciliation = elo_engine.reconcile(request.elo_provisional or current_ratings, new_ratings)
    reconciliation["match_id"] = request.match_id

    # 8. Salvar partida
    match_record = {
        "match_id": request.match_id,
        "arena_id": request.arena_id,
        "team_a": request.team_a,
        "team_b": request.team_b,
        "score_a": match.score_a,
        "score_b": match.score_b,
        "reconciliation": reconciliation,
        "created_at": datetime.now().isoformat(),
    }
    matches_db.append(match_record)

    # 9. Cache idempotência
    idempotency_store.store(request.idempotency_key, reconciliation)

    return ReconciliationResponse(**reconciliation)


@app.get("/arenas/{arena_id}/ranking")
async def get_arena_ranking(arena_id: str):
    """Ranking ELO da arena, ordenado por rating."""
    arena_players = [
        PlayerSchema(id=pid, name=p["name"], rating=p["rating"],
                     matches_played=p["matches_played"], arena_id=p["arena_id"])
        for pid, p in players_db.items()
        if p["arena_id"] == arena_id
    ]
    arena_players.sort(key=lambda x: x.rating, reverse=True)
    return {"arena_id": arena_id, "ranking": arena_players}


@app.get("/arenas/{arena_id}/calibration-report")
async def get_calibration_report(arena_id: str):
    """
    Relatório de calibração para o BA (Decisão #3 — Shadow Mode).
    Cruza ELO calculado vs. percepção do professor.
    """
    arena_matches = [m for m in matches_db if m["arena_id"] == arena_id]
    arena_surveys = [s for s in surveys_db if s["arena_id"] == arena_id]

    # Calcular concordância ELO vs. percepção
    avg_accuracy = 0.0
    would_use_pct = 0.0
    if arena_surveys:
        avg_accuracy = sum(s["q1_accuracy_score"] for s in arena_surveys) / len(arena_surveys)
        yes_count = sum(1 for s in arena_surveys if s["q3_would_use"] == "Sim")
        would_use_pct = yes_count / len(arena_surveys) * 100

    return {
        "arena_id": arena_id,
        "total_matches": len(arena_matches),
        "total_surveys": len(arena_surveys),
        "avg_accuracy_score": round(avg_accuracy, 1),
        "would_use_pct": round(would_use_pct, 1),
        "gate_status": "APPROVED" if avg_accuracy >= 3.5 and would_use_pct >= 60 else "PENDING",
        "matches": arena_matches[-10:],
        "surveys": arena_surveys[-10:],
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


# === SEED DATA ===

def _seed_demo_data():
    """Dados iniciais para desenvolvimento — 5 arenas piloto de Blumenau/SC."""
    # === ARENAS (5 piloto — SaleManager.md) ===
    pilot_arenas = [
        ("arena-blumenau-01", "Arena Praia do Moura", "1234"),
        ("arena-blumenau-02", "CT Futevôlei BNU", "5678"),
        ("arena-blumenau-03", "Arena Gaspar Beach", "9012"),
        ("arena-blumenau-04", "Vila do Vôlei", "3456"),
        ("arena-blumenau-05", "Arena Sand Sports", "7890"),
    ]
    for aid, name, pin in pilot_arenas:
        arenas_db[aid] = {
            "name": name,
            "city": "Blumenau",
            "state": "SC",
            "pin_hash": sha256(pin.encode()).hexdigest(),
            "plan_tier": "basic",
            "shadow_mode": True,
        }

    # === JOGADORES (arena principal) ===
    seed = [
        ("p-carlao", "Carlão", 2100.0, 45),
        ("p-seu-andre", "Seu Andre", 1850.0, 38),
        ("p-andrezinho", "Andrezinho", 1650.0, 29),
        ("p-lucas", "Lucas", 1500.0, 18),
        ("p-pablo", "Pablo", 1350.0, 15),
        ("p-crys", "Crys", 1250.0, 10),
        ("p-candinho", "Candinho", 1100.0, 4),
    ]
    for pid, name, rating, matches in seed:
        players_db[pid] = {
            "name": name,
            "rating": rating,
            "matches_played": matches,
            "wins": matches // 2,
            "arena_id": "arena-blumenau-01",
            "is_active": True,
        }

