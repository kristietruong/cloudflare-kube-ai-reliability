import { buildIncidentAnalysis, validateIncidentInput } from './lib/diagnosticEngine';
import { generateDiagnosis } from './lib/aiService';
import { getDashboardStats, getInvestigationById, listRecentInvestigations, runInvestigationWorkflow } from './lib/workflow';

type RequestBody = {
  userPrompt?: string;
  logs?: string;
  events?: string;
  resource?: string;
  conversationId?: string;
};

interface Env {
  AI?: {
    run: (model: string, payload: Record<string, unknown>) => Promise<unknown>;
  };
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function rejectInvalidInput(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return jsonResponse({ ok: true, service: 'kube-ai-reliability', status: 'healthy' });
    }

    if (url.pathname === '/api/dashboard') {
      const stats = await getDashboardStats();
      return jsonResponse(stats);
    }

    if (url.pathname === '/api/investigations' && request.method === 'GET') {
      const investigations = await listRecentInvestigations();
      return jsonResponse({ investigations });
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/investigations/')) {
      const id = url.pathname.split('/').at(-1);
      if (!id) {
        return rejectInvalidInput('Investigation ID is required.', 400);
      }

      const investigation = await getInvestigationById(id);
      if (!investigation) {
        return rejectInvalidInput('Investigation not found.', 404);
      }
      return jsonResponse(investigation);
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = (await request.json()) as RequestBody;
        const normalized = validateIncidentInput(body);
        const result = await runInvestigationWorkflow(normalized, env);
        return jsonResponse({
          message: 'Investigation completed.',
          investigation: result.investigation,
          workflow: result.workflow,
          conversation: result.conversation,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Request failed.';
        return rejectInvalidInput(message, 400);
      }
    }

    if (request.method === 'GET' && url.pathname === '/') {
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return new Response('Not found', { status: 404 });
    }

    if (env.ASSETS && request.method === 'GET') {
      return env.ASSETS.fetch(request);
    }

    return rejectInvalidInput('Route not found.', 404);
  },
} as const;
