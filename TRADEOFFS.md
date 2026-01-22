# Technical Tradeoffs - Market Data Platform

> **Last Updated:** 2026-01-22
> **Scope:** Strategic architectural decisions
> **Constraint:** 5-7 hour implementation timebox

---

## 1. Data Provider: CoinGecko vs Binance

**Decision:** CoinGecko free tier with REST polling

**Rationale:**
Binance enforces geo-restrictions (HTTP 451) that would block development and testing in certain regions. CoinGecko's free tier requires no API key, has no geographic limitations, and offers only REST (no WebSocket streaming).

**Tradeoff:**
We accept 30-second REST polling intervals and reduced data granularity (no order book, no tick-level trades) in exchange for global accessibility and zero onboarding friction.

**Future Path:** Migrate to Binance WebSocket or CoinGecko Pro when sub-second updates become a product requirement.

---

## 2. Client Delivery: SSE vs WebSocket

**Decision:** Server-Sent Events (SSE)

**Rationale:**
Market data flows unidirectionally (server → client). SSE operates over standard HTTP, has native browser reconnection support, and requires no additional libraries.

**Tradeoff:**
No client-to-server messaging on the same channel—commands use separate REST endpoints. HTTP/1.1 connection limits (6 per domain) are mitigated by HTTP/2.

**Future Path:** Evaluate WebSocket if bidirectional communication (e.g., trading commands) enters scope.

---

## 3. Real-time State: Zustand vs TanStack Query

**Decision:** Zustand for streaming data, TanStack Query for REST/CRUD

**Rationale:**
TanStack Query is optimized for request/response patterns (stale-while-revalidate). SSE is push-based with no "refetch" concept. Zustand's `subscribeWithSelector` enables per-symbol subscriptions—components only re-render when their specific data changes.

**Tradeoff:**
Two state management paradigms in the same application. Developers must understand when to use each. This is the pattern recommended by TanStack Query maintainers for real-time data.

---

## 4. Historical Data: N+1 Parallel Queries

**Decision:** Parallel per-symbol queries via `Promise.all()`

**Rationale:**
Fetching the last 20 data points per symbol for sparklines. A single SQL query with window functions would be more efficient but harder to maintain. Parallel queries are simple, readable, and leverage connection pooling.

**Tradeoff:**
N+1 database round-trips (1 for latest prices + N for history). Acceptable for small symbol counts (< 50). Performance scales linearly with symbols.

**Future Path:** For 100+ symbols, consider materialized views, `LATERAL JOIN`, or a time-series database.

---

## Summary

| Decision | Optimized For | Tradeoff Accepted |
|----------|---------------|-------------------|
| CoinGecko + REST | Global accessibility | 30s polling, less granular data |
| SSE | Unidirectional simplicity | No client→server on same channel |
| Zustand (streaming) | Per-symbol render performance | Two state paradigms |
| N+1 Queries | Development speed, readability | Linear DB round-trips |

