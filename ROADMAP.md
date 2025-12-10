# UptimeMonitor — Backend Upgrade Roadmap

> **Purpose:** Turn UptimeMonitor from a site-check proof-of-concept into a backend-heavy, production-grade SaaS. This roadmap breaks the plan into milestones, features, tasks, owners, acceptance criteria and a realtime progress-tracking template you can maintain in the repo.

---

## How to use this file

1. Treat each row in the **Roadmap Board** as a git-issue or project card. Keep this file updated when you open/close issues.
2. Update **Status** (`Not started / In progress / Blocked / Done`) and **% Done** for realtime progress.
3. Use `Owner` to assign responsibility. Keep `Blockers` short and actionable.
4. Add short release notes beneath each completed Milestone.

---

## Quick summary (high level milestones)

1. Architecture & Workerization
2. Alerting & Rules engine
3. Metrics, Timeseries & Aggregation
4. Observability: Logs, Traces, Prometheus
5. Security, API & Rate-limiting
6. Deployment, CI/CD & Infra
7. Polishing: Dashboard, Webhooks, Docs

---

# Roadmap Board (canonical, realtime)

> **Legend:** Status: `Not started / In progress / Blocked / Done` — keep this updated. Use `%` to express approximate completion.

| Milestone                    | Task ID | Task                                                     | Owner      | Priority | Status      | % Done |      Start |     Target | Blockers              | Acceptance Criteria                                                                   |
| ---------------------------- | ------: | -------------------------------------------------------- | ---------- | -------: | ----------- | -----: | ---------: | ---------: | --------------------- | ------------------------------------------------------------------------------------- |
| Architecture & Workerization |     A-1 | Split API & Worker services (separate repos or packages) | @parikshit |     High | In progress |    20% | 2025-12-10 | 2026-01-07 | Repo layout decisions | API accepts check creation; worker reads jobs from queue and performs a single check. |
|                              |     A-2 | Add Redis + BullMQ (or RabbitMQ) queue + job schema      | @parikshit |     High | Not started |     0% |          - |          - | Redis infra           | Jobs enqueued for checks; worker consumes and updates DB.                             |
|                              |     A-3 | Implement distributed worker pool (multiple instances)   | @parikshit |     High | Not started |     0% |          - |          - | Containerization      | Horizontal workers run concurrently without duplicating jobs.                         |
|                              |     A-4 | Retry logic with exponential backoff & jitter            | @parikshit |   Medium | Not started |     0% |          - |          - | None                  | Retries implemented; final failure mark after configured attempts.                    |
|                              |     A-5 | Geographic check nodes (Asia / EU / US)                  | @parikshit |   Medium | Not started |     0% |          - |          - | Hosting for nodes     | Checks can be executed from different regions and tagged.                             |

| Milestone              | Task ID | Task                                               | Owner      | Priority | Status      | % Done | Start      | Target      | Blockers              | Acceptance Criteria                                         |
| ---------------------- | ------: | -------------------------------------------------- | ---------- | -------: | ----------- | -----: | ---------- | ----------- | --------------------- | ----------------------------------------------------------- |
| Alerting & Rules Engine|     B-1 | Design rule model (thresholds, window, frequency) | @parikshit | High     | In progress | 30%    | 2025-12-10 | 2026-01-14  | Rule edge cases       | Rules stored in DB; evaluated correctly by evaluator.       |
|                        |     B-2 | Rule evaluator worker (runs every minute)          | @parikshit | High     | Not started | 0%     | -          | -           | Aggregation queries    | Alerts generated idempotently per rule.                     |
|                        |     B-3 | Notification pipeline (email/SMS/webhook)          | @parikshit | High     | Not started | 0%     | -          | -           | Provider accounts     | Notifications delivered with retries on failure.            |
|                        |     B-4 | Alert deduplication & suppression windows          | @parikshit | Medium   | Not started | 0%     | -          | -           | Rule clarity          | Only one alert created during suppression window.           |


| Milestone           | Task ID | Task                                                | Owner      | Priority | Status      | % Done | Start | Target | Blockers       | Acceptance Criteria                                           |
| ------------------- | ------: | --------------------------------------------------- | ---------- | -------: | ----------- | -----: | ----- | ------ | -------------- | -------------------------------------------------------------- |
| Metrics & Timeseries|     C-1 | Integrate TimescaleDB or ClickHouse                | @parikshit | High     | Not started | 0%     | -     | -      | DB selection   | Time-series ingestion works and queries are efficient.         |
|                     |     C-2 | Schema for check results & metrics                  | @parikshit | High     | Not started | 0%     | -     | -      | Schema review  | Insert throughput 100s/s achieved locally.                    |
|                     |     C-3 | Stats aggregator (hourly summaries)                 | @parikshit | Medium   | Not started | 0%     | -     | -      | Depends on C1/2| Summary tables reduce dashboard query load.                   |
|                     |     C-4 | Response time histograms & p95/p99 metrics          | @parikshit | Medium   | Not started | 0%     | -     | -      | Metrics ingestion| Endpoints return accurate p95/p99 data.                        |


| Milestone    | Task ID | Task                                           | Owner      | Priority | Status      | % Done | Start | Target | Blockers  | Acceptance Criteria                                          |
|--------------|--------:|-----------------------------------------------|------------|---------:|-------------|-------:|-------|--------|-----------|--------------------------------------------------------------|
| Observability|     D-1 | Structured logging (JSON) + central log store | @parikshit | High     | Not started | 0%     | -     | -      | ELK infra | Logs searchable and linked to incidents.                     |
|              |     D-2 | Prometheus metrics exporter                   | @parikshit | High     | Not started | 0%     | -     | -      | Naming spec| Grafana dashboards show real-time worker/API metrics.        |
|              |     D-3 | OpenTelemetry tracing                         | @parikshit | Medium   | Not started | 0%     | -     | -      | Backend    | Traces show worker lifecycle, queue ops, and DB interactions.|


| Milestone      | Task ID | Task                                        | Owner      | Priority | Status      | % Done | Start | Target | Blockers      | Acceptance Criteria                                              |
|----------------|--------:|---------------------------------------------|------------|---------:|-------------|-------:|-------|--------|----------------|------------------------------------------------------------------|
| Security & API |     E-1 | API keys + per-key rate limiting            | @parikshit | High     | Not started | 0%     | -     | -      | Billing design | API keys scoped, revocable, and usage-limited.                  |
|                |     E-2 | Role-based access (admin vs user actions)   | @parikshit | Medium   | Not started | 0%     | -     | -      | Auth flows     | Admin-only routes protected; user scopes enforced.              |
|                |     E-3 | Input validation + suspicious request logs  | @parikshit | Medium   | Not started | 0%     | -     | -      | WAF            | No unhandled errors; invalid inputs return proper 400/403.      |


| Milestone       | Task ID | Task                                           | Owner      | Priority | Status      | % Done | Start | Target | Blockers        | Acceptance Criteria                                               |
|-----------------|--------:|------------------------------------------------|------------|---------:|-------------|-------:|-------|--------|------------------|-------------------------------------------------------------------|
| Deployment/CI/CD|     F-1 | Dockerize services + Compose + K8s manifests  | @parikshit | High     | Not started | 0%     | -     | -      | Container images | All services run under Docker Compose and deploy on Kubernetes.  |
|                 |     F-2 | GitHub Actions CI/CD pipeline                 | @parikshit | High     | Not started | 0%     | -     | -      | Secrets/env      | Pipelines lint, test, build, push, and deploy without failures.  |
|                 |     F-3 | Canary / blue-green deployments (optional)    | @parikshit | Low      | Not started | 0%     | -     | -      | Infra support    | Canary deploys with rollback support.                            |


| Milestone     | Task ID | Task                                             | Owner      | Priority | Status      | % Done | Start | Target | Blockers        | Acceptance Criteria                                              |
|---------------|--------:|--------------------------------------------------|------------|---------:|-------------|-------:|-------|--------|------------------|------------------------------------------------------------------|
| Polishing & UX|     G-1 | Dashboard: SLA, timeline, logs link             | @parikshit | Medium   | Not started | 0%     | -     | -      | Frontend design  | Dashboard displays metrics, incidents, and logs.                |
|               |     G-2 | Webhooks: Slack/Discord/custom + validation      | @parikshit | Medium   | Not started | 0%     | -     | -      | Security signing | Webhooks validated, sent reliably with retries.                 |
|               |     G-3 | Docs: README + architecture + deployment guide   | @parikshit | High     | Not started | 0%     | -     | -      | Documentation    | Full documentation runnable locally.                            |





---

# Milestone Deep-dive (tasks & checklists)

## Milestone A — Architecture & Workerization

**A-1 Split API & Worker**

* Checklist:

  * [ ] Create `api/` and `worker/` packages/repos
  * [ ] Define shared `models/` or prisma schema package
  * [ ] Add interface docs (job payload definition)
  * [ ] Local dev compose to run API + Redis + worker

**A-2 Queue & Job Schema**

* Checklist:

  * [ ] Pick queue (BullMQ recommended for Node + Redis)
  * [ ] Job metadata (checkId, websiteId, runAt, attempts, region)
  * [ ] Failure meta (error, responseCode, duration)

**A-3 Worker Pool**

* Checklist:

  * [ ] Worker process concurrency config
  * [ ] Graceful shutdown + job locking
  * [ ] Health endpoint for worker

**A-4 Retry Logic**

* Checklist:

  * [ ] Exponential backoff with jitter
  * [ ] Max attempts configuration per plan
  * [ ] Move failed job to dead-letter queue (DLQ)

**A-5 Geo checks**

* Checklist:

  * [ ] Tag jobs with `region`
  * [ ] Deploy regional workers (VPS, Cloud regions)
  * [ ] UI shows region-based results

---

## Milestone B — Alerts & Rules

**B-1 Rule model**

* Checklist:

  * [ ] DB schema: rule type, metric, threshold, window, suppression
  * [ ] UI CRUD for rules

**B-2 Rule evaluator**

* Checklist:

  * [ ] Batch evaluation job runs every minute
  * [ ] Query time-series for windows efficiently
  * [ ] Create alert records (deduped)

**B-3 Notification delivery**

* Checklist:

  * [ ] Provider adapters (SendGrid/Twilio/HTTP webhook)
  * [ ] Queue notifications for retries
  * [ ] Per-user preferences

---

## Milestone C — Metrics & Aggregation

**C-1 Timeseries backend**

* Decision criteria (choose one):

  * TimescaleDB if you prefer SQL + Postgres features.
  * ClickHouse for massive ingestion / OLAP style queries.

**C-2 Schema tips**

* Keep wide table inserts compact. Partition by time and site_id. Use hypertables in Timescale.

**C-3 Aggregator**

* Aggregator performs rollups hourly/daily and writes to `site_stats`.

---

## Milestone D — Observability

**D-1 Logging**

* Use structured logs with correlation IDs (requestId, jobId)

**D-2 Metrics**

* Export metrics from API & workers: `checks_processed_total`, `checks_failed_total`, `worker_queue_lag_seconds`, `db_query_duration_seconds`

**D-3 Tracing**

* Instrument requests and worker pipelines; send traces to Jaeger/Tempo

---

# Realtime Progress Template (copy this into issues/project board)

**Task card example (use as GitHub issue template)**

```
Title: A-2 — Add Redis + BullMQ queue + job schema
Owner: @parikshit
Status: In progress
% Done: 20
Start: 2025-12-10
Target: 2026-01-03
Blockers: choosing cloud Redis provider
Notes:
- Implemented basic job enqueue and worker consume locally
- Next: add job backoff and DLQ
```

---

# Release plan & versions

* `v0.1` — Workerized checks, Redis queue, simple dashboard
* `v0.2` — Rule engine, notifications, retries
* `v0.3` — Timeseries backend + aggregator + SLA dashboard
* `v1.0` — Observability, API keys, CI/CD, production infra

Include release notes and changelog in `CHANGELOG.md` for each release.

---

# Dev environment & quick start (local)

1. Clone repo
2. `docker-compose -f docker-compose.dev.yml up --build`

   * services: api, worker, redis, postgres/timescaledb
3. `pnpm install` (or `npm`) in `api/` and `worker/`
4. Create a test site via API → watch the job enqueued and consumed in worker logs
5. Run `./scripts/seed-sample-data.sh` to populate sample checks

---

# Monitoring & SLOs (suggested)

* **SLO examples:**

  * 99.9% uptime per month for Pro customers
  * Alert to user when downtime > 1 minute and confirmed by 2 regions
* **SLO monitoring approach:**

  * Aggregate uptime per site daily and compare to SLO thresholds
  * Send weekly SLO report for paid tiers

---

# Checklist for "production readiness"

* [ ] Automated tests: unit + integration for API and worker
* [ ] Load test the checking pipeline (simulate X checks/sec)
* [ ] Backup & restore for TimescaleDB
* [ ] Secrets management (Vault or cloud secrets)
* [ ] Rate limiting for API + key management
* [ ] Incident runbook and playbook

---

# Next actions I can help with (pick one)

* Create architecture diagram (drawn) for the repo
* Generate GitHub issue templates from the Roadmap board
* Create docker-compose and k8s manifests for core services
* Scaffold the rule-evaluator worker (Node.js + BullMQ)

---

*Last updated: 2025-12-10 — keep this file in repo root. Update statuses frequently to keep realtime progress accurate.*
