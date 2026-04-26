"""
SharkRank — Initial schema with RLS

Revision ID: 001_initial
Revises: None
Create Date: 2026-04-25
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # === ARENAS ===
    op.create_table(
        "arenas",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("state", sa.String(2), nullable=False, server_default="SC"),
        sa.Column("owner_name", sa.String(200)),
        sa.Column("owner_email", sa.String(200)),
        sa.Column("owner_phone", sa.String(20)),
        sa.Column("plan_tier", sa.String(20), server_default="basic"),
        sa.Column("max_students", sa.Integer, server_default="20"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("shadow_mode", sa.Boolean, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    # === PLAYERS ===
    op.create_table(
        "players",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("arena_id", UUID(as_uuid=True), sa.ForeignKey("arenas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("nickname", sa.String(100)),
        sa.Column("position", sa.String(50), server_default="Atacante"),
        sa.Column("age", sa.Integer),
        sa.Column("rating", sa.Float, server_default="1500.0"),
        sa.Column("matches_played", sa.Integer, server_default="0"),
        sa.Column("wins", sa.Integer, server_default="0"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_players_arena_rating", "players", ["arena_id", "rating"])
    op.create_index("ix_players_arena_created", "players", ["arena_id", "created_at"])

    # === MATCHES ===
    op.create_table(
        "matches",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("client_match_id", sa.String(100), nullable=False),
        sa.Column("arena_id", UUID(as_uuid=True), sa.ForeignKey("arenas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("team_a_player1_id", UUID(as_uuid=True), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("team_a_player2_id", UUID(as_uuid=True), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("team_b_player1_id", UUID(as_uuid=True), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("team_b_player2_id", UUID(as_uuid=True), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("score_a", sa.Integer, server_default="0"),
        sa.Column("score_b", sa.Integer, server_default="0"),
        sa.Column("sets_data", JSONB, server_default="[]"),
        sa.Column("elo_provisional", JSONB, server_default="{}"),
        sa.Column("elo_definitive", JSONB, server_default="{}"),
        sa.Column("elo_delta", JSONB, server_default="{}"),
        sa.Column("notify_user", sa.Boolean, server_default=sa.text("false")),
        sa.Column("client_version", sa.String(20)),
        sa.Column("elo_config_version", sa.String(10)),
        sa.Column("played_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("synced_at", sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint("client_match_id", "arena_id", name="uq_match_client_arena"),
    )
    op.create_index("ix_matches_arena_played", "matches", ["arena_id", "played_at"])

    # === MATCH EVENTS ===
    op.create_table(
        "match_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("match_id", UUID(as_uuid=True), sa.ForeignKey("matches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("player_id", UUID(as_uuid=True), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("set_number", sa.Integer, nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("timestamp", sa.DateTime, nullable=False),
    )
    op.create_index("ix_events_match_set", "match_events", ["match_id", "set_number"])
    op.create_index("ix_events_player_type", "match_events", ["player_id", "event_type"])

    # === ELO HISTORY ===
    op.create_table(
        "elo_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("player_id", UUID(as_uuid=True), sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("match_id", UUID(as_uuid=True), sa.ForeignKey("matches.id", ondelete="SET NULL")),
        sa.Column("rating_before", sa.Float, nullable=False),
        sa.Column("rating_after", sa.Float, nullable=False),
        sa.Column("delta", sa.Float, nullable=False),
        sa.Column("k_factor_used", sa.Float),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_elo_history_player_created", "elo_history", ["player_id", "created_at"])

    # === PROCESSED REQUESTS (Idempotência) ===
    op.create_table(
        "processed_requests",
        sa.Column("idempotency_key", sa.String(64), primary_key=True),
        sa.Column("result", JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_processed_created", "processed_requests", ["created_at"])

    # === CALIBRATION SURVEYS (Shadow Mode) ===
    op.create_table(
        "calibration_surveys",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("arena_id", UUID(as_uuid=True), sa.ForeignKey("arenas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("professor_name", sa.String(200)),
        sa.Column("match_id", UUID(as_uuid=True), sa.ForeignKey("matches.id", ondelete="SET NULL")),
        sa.Column("q1_accuracy_score", sa.Integer),
        sa.Column("q2_best_player", sa.Text),
        sa.Column("q3_would_use", sa.String(10)),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_survey_arena_created", "calibration_surveys", ["arena_id", "created_at"])

    # === ROW-LEVEL SECURITY (BackendSenior.md) ===
    # Habilitar RLS em tabelas multi-tenant
    for table in ["players", "matches", "match_events", "elo_history", "calibration_surveys"]:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")

    # Policies de isolamento por arena_id
    op.execute("""
        CREATE POLICY arena_isolation_players ON players
        USING (arena_id = current_setting('app.current_arena')::uuid)
    """)
    op.execute("""
        CREATE POLICY arena_isolation_matches ON matches
        USING (arena_id = current_setting('app.current_arena')::uuid)
    """)
    op.execute("""
        CREATE POLICY arena_isolation_surveys ON calibration_surveys
        USING (arena_id = current_setting('app.current_arena')::uuid)
    """)


def downgrade() -> None:
    # Drop policies
    for table in ["players", "matches", "calibration_surveys"]:
        op.execute(f"DROP POLICY IF EXISTS arena_isolation_{table} ON {table}")

    # Drop tables in reverse dependency order
    for table in [
        "calibration_surveys", "processed_requests", "elo_history",
        "match_events", "matches", "players", "arenas",
    ]:
        op.drop_table(table)
