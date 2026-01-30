# Week 2: Challenge 1.2.4

## Chat 1: API Gateway Rate-Limiting & Routing Rules

**Prompt:** Where does the api-gateway define its rate-limiting or routing rules?

**Response Summary:**
- **Rate Limiting**: Defined in `microservices/api-gateway/src/index.ts` using `express-rate-limit`
  - Window: 15 minutes
  - Max: 1000 requests per IP
  - Requests per minute: ~66.67 req/min
- **Routing Rules**: Defined in `microservices/api-gateway/src/config.ts`
  - Service configuration with paths, URLs, and health checks
  - Proxy middleware setup in `index.ts` (lines 99+)
  - Routing by service: Products (3001), Cart (3002), Orders (3003), AI (3004)

## Chat 2: Rate Limiting Calculation Per Service

**Prompt:** #file:index.ts How many requests per minute are allowed before the gateway returns a 429 error for each of services?

**Response Summary:**
- **Current Configuration**: Single global rate limit applies to ALL services
- **Calculation**: 1000 requests ÷ 15 minutes = **~66.67 requests/min per IP**
- **HTTP Status**: 429 Too Many Requests
- **Per-Service Limits**: Currently NOT implemented (all services share same limit)
- **Storage**: In-memory (resets on restart) - should use Redis for production
- **Recommendation**: Implement service-specific limiters for granular control

## Key Findings

1. No per-service rate limits currently configured
2. Global limit applies to all traffic through gateway
3. Default in-memory storage not suitable for production with multiple instances
4. Suggested improvement: Add Redis-backed rate limiting with per-service thresholds

---
**Date**: January 30, 2026