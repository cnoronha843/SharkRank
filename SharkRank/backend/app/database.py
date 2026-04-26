import aiosqlite

DB_PATH = "sharkrank.db"


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        # Tabela de Arenas
        await db.execute("""
            CREATE TABLE IF NOT EXISTS arenas (
                id TEXT PRIMARY KEY,
                name TEXT,
                city TEXT,
                state TEXT,
                pin_hash TEXT,
                plan_tier TEXT,
                shadow_mode BOOLEAN
            )
        """)

        # Tabela de Jogadores
        await db.execute("""
            CREATE TABLE IF NOT EXISTS players (
                id TEXT PRIMARY KEY,
                name TEXT,
                nickname TEXT,
                position TEXT,
                age INTEGER,
                rating REAL,
                matches_played INTEGER,
                wins INTEGER,
                arena_id TEXT,
                is_active BOOLEAN,
                FOREIGN KEY (arena_id) REFERENCES arenas (id)
            )
        """)

        # Tabela de Partidas
        await db.execute("""
            CREATE TABLE IF NOT EXISTS matches (
                id TEXT PRIMARY KEY,
                arena_id TEXT,
                idempotency_key TEXT UNIQUE,
                team_a TEXT, -- JSON string
                team_b TEXT, -- JSON string
                sets TEXT,   -- JSON string
                elo_provisional TEXT, -- JSON string
                timestamp TEXT,
                FOREIGN KEY (arena_id) REFERENCES arenas (id)
            )
        """)

        await db.commit()


async def get_db():
    return await aiosqlite.connect(DB_PATH)
