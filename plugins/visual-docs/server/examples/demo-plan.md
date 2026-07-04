# Add rate limiting to the public API

## Summary

We will add a token-bucket rate limiter in front of the public REST API. Requests over the limit get `429 Too Many Requests` with a `Retry-After` header. Limits are per API key, stored in Redis, with an in-memory fallback when Redis is unavailable.

> **Decision needed:** default limit of 100 req/min per key — is that acceptable for the enterprise tier, or do we need per-tier limits at launch?

## Architecture

```mermaid
flowchart LR
    C[Client] --> GW[API Gateway]
    GW --> RL{Rate limiter}
    RL -- "under limit" --> API[REST API]
    RL -- "over limit" --> R429[429 + Retry-After]
    RL <--> REDIS[(Redis token buckets)]
    REDIS -. "unavailable" .-> MEM[In-memory fallback]
```

## Limiter states

A sketch-style view of the same flow, for contrast:

```nomnoml
#stroke: #33322E
[<start> request] -> [check bucket]
[check bucket] -> [<choice> tokens left?]
[tokens left?] yes -> [serve request]
[tokens left?] no -> [<state> 429 Too Many Requests]
[serve request] -> [<end> done]
```

And a hand-drawn note (Excalidraw scene JSON):

```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "elements": [
    {
      "id": "box1", "type": "rectangle", "x": 0, "y": 0, "width": 200, "height": 70,
      "angle": 0, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff",
      "fillStyle": "solid", "strokeWidth": 2, "strokeStyle": "solid",
      "roughness": 1, "opacity": 100, "roundness": { "type": 3 },
      "seed": 1, "version": 1, "versionNonce": 1, "isDeleted": false,
      "groupIds": [], "frameId": null, "boundElements": null,
      "updated": 1, "link": null, "locked": false
    },
    {
      "id": "txt1", "type": "text", "x": 28, "y": 22, "width": 150, "height": 25,
      "angle": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
      "fillStyle": "solid", "strokeWidth": 2, "strokeStyle": "solid",
      "roughness": 1, "opacity": 100, "roundness": null,
      "seed": 2, "version": 1, "versionNonce": 2, "isDeleted": false,
      "groupIds": [], "frameId": null, "boundElements": null,
      "updated": 1, "link": null, "locked": false,
      "text": "token bucket", "fontSize": 20, "fontFamily": 1,
      "textAlign": "center", "verticalAlign": "middle",
      "containerId": null, "originalText": "token bucket", "lineHeight": 1.25, "baseline": 18
    }
  ],
  "appState": {}
}
```

## Key changes

### New middleware

```go
func RateLimit(store limiter.Store) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            key := apiKeyFrom(r)
            res, err := store.Take(r.Context(), key)
            if err != nil || res.Allowed {
                next.ServeHTTP(w, r)
                return
            }
            w.Header().Set("Retry-After", strconv.Itoa(res.RetryAfterSeconds))
            http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
        })
    }
}
```

### Router wiring

```diff
--- a/internal/server/router.go
+++ b/internal/server/router.go
@@ -12,6 +12,7 @@ func NewRouter(deps Deps) http.Handler {
 	r := chi.NewRouter()
 	r.Use(middleware.RequestID)
 	r.Use(middleware.Logger)
+	r.Use(ratelimit.RateLimit(deps.LimiterStore))
 	r.Mount("/api/v1", apiRoutes(deps))
 	return r
 }
```

## Database changes

```migration
-- name: add api_key_limits table
-- up
CREATE TABLE api_key_limits (
    api_key_id  UUID PRIMARY KEY REFERENCES api_keys (id),
    per_minute  INTEGER NOT NULL DEFAULT 100,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_key_limits_key ON api_key_limits (api_key_id);

-- down
DROP INDEX idx_api_key_limits_key;
DROP TABLE api_key_limits;
```

## API behavior

When a key exceeds its budget, the API responds like this:

```api
> POST /api/v1/orders HTTP/1.1
> authorization: Bearer sk-•••
> content-type: application/json

{"sku": "A-1001", "qty": 2}

< HTTP/1.1 429 Too Many Requests
< retry-after: 12
< content-type: application/json

{"error": "rate_limit_exceeded", "retry_after_seconds": 12}
```

## API surface

```openapi
openapi: 3.0.3
info:
  title: Rate limit admin API
  version: 1.2.0
paths:
  /admin/limits/{apiKeyId}:
    get:
      summary: Read the configured limit for a key
      parameters:
        - name: apiKeyId
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Current limit
          content:
            application/json:
              schema:
                type: object
                required: [per_minute]
                properties:
                  per_minute: { type: integer }
                  updated_at: { type: string, format: date-time }
        "404":
          description: Key not found
    put:
      summary: Set a custom limit for a key
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [per_minute]
              properties:
                per_minute: { type: integer }
      responses:
        "204":
          description: Limit updated
```

## Rollout

1. Ship middleware behind `RATE_LIMIT_ENABLED=false`.
2. Enable in staging, watch `rate_limit_rejections_total`.
3. Enable in production per-region.

## Open questions

- Should websocket connections count against the same bucket?
- Do we backfill `api_key_limits` for existing keys or lazily default?
