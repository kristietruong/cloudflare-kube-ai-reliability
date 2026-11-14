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

Run these commands from the project directory 

1. Install Node.js 20+ and npm.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Check TypeScript:
   ```bash
   npm run typecheck
   ```
5. Start the local Worker:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:8787](http://localhost:8787) (or the URL printed by Wrangler) and use the dashboard to investigate sample Kubernetes incidents.

On Windows PowerShell, start with:

```powershell
npm install
npm test
npm run typecheck
npm run dev
```

## Production notes

- The app validates user input and falls back to deterministic local diagnosis when no Workers AI binding is configured.
- Sample scenarios cover CrashLoopBackOff, OOMKilled, ImagePullBackOff, PendingPods, FailedScheduling, NodeNotReady, ProbeFailures, PVC issues, and resource exhaustion.
- The current storage adapter and investigation workflow are in-memory/local demo implementations. Data is lost when the Worker isolate restarts; Cloudflare D1 and durable Workflows are not configured yet.
- Local `.log` files are sent directly to the Worker for analysis and are not written to R2 or disk. The request is limited to 64 KB; the Worker releases the file after the request finishes. The diagnosis and bounded evidence snippets (up to 500 characters per log line) still appear in the in-memory investigation history.
- The R2 binding and local-to-R2 upload feature are commented out until R2 is enabled on the Cloudflare account. No R2 bucket access or charges are involved in this flow.
- A real Workers AI binding is not configured; incident analysis currently uses the deterministic local diagnostic fallback.
- Sample logs for local analysis are in [`k8smocklog/`](./k8smocklog/).

## Key routes
s
- `GET /api/health` for service health
- `POST /api/chat` for a new incident investigation
- `POST /api/logs/analyze` to analyze a local `.log` file sent as multipart form data; the file is not stored
- `GET /api/investigations` for incident history
- `GET /api/investigations/:id` for a specific incident
- `GET /api/dashboard` for metrics summary
