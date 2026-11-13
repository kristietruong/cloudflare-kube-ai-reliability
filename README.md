# Kubernetes AI Reliability Copilot

A Cloudflare Workers-based Kubernetes reliability demo built for a platform engineering job application. The app demonstrates Kubernetes incident classification, multi-step AI investigation workflow orchestration, persistent incident history, and a browser-based dashboard.

## Technology stack

- Cloudflare Workers
- Static frontend assets served by Workers
- Workers AI integration with a structured diagnosis fallback
- Persistent in-memory investigation history with D1-ready storage hooks
- TypeScript + Vitest
- Wrangler local development

## Local setup

1. Install Node.js 20+ and npm.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Start the local worker:
   ```bash
   npm run dev
   ```
5. Open the local URL printed by Wrangler and use the dashboard to investigate sample Kubernetes incidents.

## Production notes

- The app validates user input and falls back to deterministic local diagnosis if Workers AI is unavailable.
- Sample scenarios cover CrashLoopBackOff, OOMKilled, ImagePullBackOff, PendingPods, FailedScheduling, NodeNotReady, ProbeFailures, PVC issues, and resource exhaustion.
- Investigation results are persisted in memory for local demonstration and can be connected to Cloudflare D1 when configured.

## Key routes

- `GET /api/health` for service health
- `POST /api/chat` for a new incident investigation
- `GET /api/investigations` for incident history
- `GET /api/investigations/:id` for a specific incident
- `GET /api/dashboard` for metrics summary
