"""
SharkRank — SQLAlchemy Models
Schema PostgreSQL com Row-Level Security (RLS) desde o Dia 1.
Conforme PRD v2.0, Seção 2 e BackendSenior.md.

Tabelas: arenas, players, matches, match_events, elo_history, processed_requests
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Arena(Base):
    """Arena de futevôlei (tenant principal do sistema B2B)."""

    __tablename__ = "arenas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(2), nullable=False, default="SC")
    owner_name = Column(String(200))
    owner_email = Column(String(200))
    owner_phone = Column(String(20))
    plan_tier = Column(String(20), default="basic")  # basic, premium
    max_students = Column(Integer, default=20)
    is_active = Column(Boolean, default=True)
    shadow_mode = Column(Boolean, default=True)  # Decisão #3: Shadow Mode
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    players = relationship("Player", back_populates="arena", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="arena", cascade="all, delete-orphan")


class Player(Base):
    """Atleta/aluno vinculado a uma arena."""

    __tablename__ = "players"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    arena_id = Column(
        UUID(as_uuid=True), ForeignKey("arenas.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(200), nullable=False)
    nickname = Column(String(100))
    position = Column(String(50), default="Atacante")
    age = Column(Integer)
    rating = Column(Float, default=1500.0)
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    arena = relationship("Arena", back_populates="players")
    elo_history = relationship("ELOHistory", back_populates="player", cascade="all, delete-orphan")

    # Índice composto para busca rápida (BackendSenior.md)
    __table_args__ = (
        Index("ix_players_arena_rating", "arena_id", "rating"),
        Index("ix_players_arena_created", "arena_id", "created_at"),
    )


class Match(Base):
    """Partida de futevôlei (duplas 2v2)."""

    __tablename__ = "matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_match_id = Column(String(100), nullable=False)  # ID gerado no mobile
    arena_id = Column(
        UUID(as_uuid=True), ForeignKey("arenas.id", ondelete="CASCADE"), nullable=False
    )
    team_a_player1_id = Column(UUID(as_uuid=True), ForeignKey("players.id"), nullable=False)
    team_a_player2_id = Column(UUID(as_uuid=True), ForeignKey("players.id"), nullable=False)
    team_b_player1_id = Column(UUID(as_uuid=True), ForeignKey("players.id"), nullable=False)
    team_b_player2_id = Column(UUID(as_uuid=True), ForeignKey("players.id"), nullable=False)
    score_a = Column(Integer, default=0)  # Sets ganhos Time A
    score_b = Column(Integer, default=0)  # Sets ganhos Time B
    sets_data = Column(JSONB, default=list)  # Array de sets com scores e eventos
    elo_provisional = Column(JSONB, default=dict)  # ELO calculado no mobile
    elo_definitive = Column(JSONB, default=dict)  # ELO calculado no backend
    elo_delta = Column(JSONB, default=dict)  # Diferença entre provisório e definitivo
    notify_user = Column(Boolean, default=False)  # Se |delta| > 3
    client_version = Column(String(20))
    elo_config_version = Column(String(10))
    played_at = Column(DateTime, default=datetime.utcnow)
    synced_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    arena = relationship("Arena", back_populates="matches")
    events = relationship("MatchEvent", back_populates="match", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("client_match_id", "arena_id", name="uq_match_client_arena"),
        Index("ix_matches_arena_played", "arena_id", "played_at"),
    )


class MatchEvent(Base):
    """Evento de fundamento individual dentro de uma partida."""

    __tablename__ = "match_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(
        UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False
    )
    player_id = Column(UUID(as_uuid=True), ForeignKey("players.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    event_type = Column(String(50), nullable=False)  # saque_ace, recepcao_perfeita, etc.
    timestamp = Column(DateTime, nullable=False)

    # Relationships
    match = relationship("Match", back_populates="events")

    __table_args__ = (
        Index("ix_events_match_set", "match_id", "set_number"),
        Index("ix_events_player_type", "player_id", "event_type"),
    )


class ELOHistory(Base):
    """Histórico de evolução do rating ELO do jogador."""

    __tablename__ = "elo_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id = Column(
        UUID(as_uuid=True), ForeignKey("players.id", ondelete="CASCADE"), nullable=False
    )
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id", ondelete="SET NULL"))
    rating_before = Column(Float, nullable=False)
    rating_after = Column(Float, nullable=False)
    delta = Column(Float, nullable=False)
    k_factor_used = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    player = relationship("Player", back_populates="elo_history")

    __table_args__ = (Index("ix_elo_history_player_created", "player_id", "created_at"),)


class ProcessedRequest(Base):
    """
    Cache de idempotência (BackendSenior.md, Seção 1).
    TTL de 72h gerenciado via job de limpeza.
    """

    __tablename__ = "processed_requests"

    idempotency_key = Column(String(64), primary_key=True)  # sha256 hash
    result = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_processed_created", "created_at"),  # Para job de cleanup
    )


class CalibrationSurvey(Base):
    """
    Formulário pós-treino do Shadow Mode (Decisão #3).
    3 perguntas do professor após cada sessão.
    """

    __tablename__ = "calibration_surveys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    arena_id = Column(
        UUID(as_uuid=True), ForeignKey("arenas.id", ondelete="CASCADE"), nullable=False
    )
    professor_name = Column(String(200))
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id", ondelete="SET NULL"))
    q1_accuracy_score = Column(Integer)  # 1-5: "Quão precisa foi a avaliação?"
    q2_best_player = Column(Text)  # "Qual aluno jogou melhor?"
    q3_would_use = Column(String(10))  # "Sim", "Não", "Talvez"
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("ix_survey_arena_created", "arena_id", "created_at"),)


# === ROW-LEVEL SECURITY (RLS) ===
# Nota: RLS é habilitado via migration SQL direta, não via SQLAlchemy.
# O Alembic migration incluirá os comandos SQL para:
#   ALTER TABLE players ENABLE ROW LEVEL SECURITY;
#   CREATE POLICY player_arena_isolation ON players
#     USING (arena_id = current_setting('app.current_arena')::uuid);
