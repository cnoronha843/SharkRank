# Guia de Engenharia Sênior: Backend (Python)
**Foco do Papel:** Concorrência, Integridade Transacional e Multi-Tenancy.
**Versão:** 2.0 — Pós-Reunião de Alinhamento Estratégico (25/04/2026)

---

## 1. Estabilidade e Escalabilidade
* **Idempotência de Rotas (Obrigatória):** Crítico para telemetria. Toda requisição de criação de partida DEVE conter um campo `idempotency_key` (sha256 de `match_id + timestamp`). A API deve:
    1. Verificar a existência da chave na tabela `processed_requests`.
    2. Se existir, retornar HTTP 200 com o resultado já calculado (sem reprocessar).
    3. Se não existir, processar normalmente e armazenar a chave com TTL de 72 horas.
    4. Se ausente, rejeitar com HTTP 422.
* **Processamento Assíncrono:** O cálculo ELO completo (com recálculo de ranking da arena) roda em worker assíncrono via Celery + Redis. A API retorna HTTP 202 (Accepted) imediatamente e envia o resultado via push silencioso ao mobile.
* **Otimização de Banco e Connection Pooling:** PostgreSQL com `PgBouncer`. Índices compostos em `(arena_id, player_id, created_at)` para busca rápida de histórico.

> **[DECISÃO #1 — Motor ELO Dual-Layer]:** O Backend é a FONTE DE VERDADE do ELO. Responsabilidades:
> 1. Receber partida da sync queue do mobile.
> 2. Validar `idempotency_key` — rejeitar duplicatas.
> 3. Rodar cálculo ELO completo com pesos de fundamentos e K-factor dinâmico.
> 4. Comparar resultado com `elo_provisional` enviado pelo mobile.
> 5. Enviar push de reconciliação com `delta` e flag `notify_user` (true se |delta| > 3).
> 6. Publicar `elo_config_v{N}.json` com a fórmula simplificada para o mobile atualizar sem deploy.

### 1.1 Payload de Reconciliação (Backend → Mobile)
```json
{
  "match_id": "uuid-v4",
  "elo_definitive": {"player_uuid_1": 1525, "player_uuid_2": 1496},
  "delta": {"player_uuid_1": +2, "player_uuid_2": -2},
  "notify_user": false
}
```

## 2. Segurança e Controle de Acesso
* **Arquitetura Multi-Tenant Data Isolation:** Row-Level Security (RLS) habilitado no PostgreSQL desde o Dia 1. Toda query inclui `WHERE arena_id = current_setting('app.current_arena')`. Um professor da Arena A jamais pode acessar os alunos da Arena B via injeção de ID.
* **Rate Limiting & WAF:** Proteção severa de endpoints públicos. Rate limit de 100 req/min por tenant. Endpoints de telemetria (marcação de pontos) têm rate limit mais generoso (500 req/min) para não bloquear partidas intensas.
* **Segurança de Webhooks:** Validação de assinaturas criptográficas em webhooks de pagamento (Pagar.me para MVP — Stripe avaliado pós-internacionalização).

> **[DIRETRIZ CRUZADA — Mobile → Backend]:** O payload de partida enviado pelo mobile inclui os campos `client_version` e `elo_config_version`. O Backend DEVE validar que o `elo_config_version` é compatível. Se o mobile estiver usando uma versão depreciada da fórmula ELO, a API retorna HTTP 409 (Conflict) forçando o app a baixar a config atualizada antes de sincronizar.

## 3. Rentabilidade e Operação
* **Modelagem de *Billing*:** Banco de dados preparado para faturamento pró-rata, gestão de *tiers* (Básico vs Premium) e controle de licenças ativas por Arena.
* **Observabilidade:** Logs estruturados (JSON) com campo `arena_id` em toda requisição. APM (Datadog para MVP) para detectar imediatamente se a latência do checkout ou do cálculo ELO subiu.

> **[DIRETRIZ CRUZADA — QA → Backend]:** O Backend DEVE expor um endpoint `/health/elo-accuracy` que retorna a métrica de divergência média entre ELO provisório e definitivo nas últimas 100 partidas. Essa métrica alimenta o dashboard do QA e dispara alerta se ultrapassar 5 pontos.

## 4. Shadow Mode (Backend)

> **[DECISÃO #3 — Suporte]:** Quando a flag `SHADOW_MODE=true` está ativa para uma arena:
> * O cálculo ELO completo roda normalmente e é armazenado no banco.
> * O push de reconciliação é enviado com flag `shadow=true`, instruindo o mobile a NÃO exibir o resultado.
> * O endpoint `/arenas/{id}/calibration-report` agrega os dados de ELO calculado vs. percepção do professor para o BA acessar via dashboard interno.

## 🛠️ Habilidades Técnicas Exigidas (Perfil de Contratação)
* **Linguagem:** Python 3.12+ (Tipagem estática avançada).
* **Framework:** FastAPI (Assíncrono, Pydantic, Dependency Injection).
* **Banco de Dados:** PostgreSQL Avançado (Row-Level Security - RLS, SQLAlchemy, Alembic).
* **Cloud & DevOps:** Docker, Deploy serverless (Fly.io/Render), CI/CD.
* **Segurança:** Autenticação JWT, Hashing (SHA-256), Webhooks (RevenueCat).
* **Arquitetura:** Multi-tenant B2B, Cache de Idempotência (Offline-first support).