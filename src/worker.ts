import { validateIncidentInput } from './lib/diagnosticEngine';
import { getDashboardStats, getInvestigationById, listRecentInvestigations, runInvestigationWorkflow } from './lib/workflow';
import { LogFileError, MAX_LOG_FILE_BYTES, readLocalKubernetesLog } from './lib/logFiles';

type RequestBody = {
  userPrompt?: string;
  logs?: string;
  events?: string;
  resource?: string;
  conversationId?: string;
};

export interface Env {
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

    if (url.pathname === '/api/logs/analyze' && request.method === 'POST') {
      const contentLength = request.headers.get('content-length');
      if (contentLength && Number(contentLength) > MAX_LOG_FILE_BYTES + 16_384) {
        return jsonResponse({ error: 'The request exceeds the log file size limit.' }, 413);
      }

      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        return rejectInvalidInput('Choose a .log file to analyze.');
      }
      const file = formData.get('file');
      if (!(file instanceof File)) {
        return rejectInvalidInput('Choose a .log file to analyze.');
      }

      let localLog: Awaited<ReturnType<typeof readLocalKubernetesLog>>;
      try {
        localLog = await readLocalKubernetesLog(file);
      } catch (error) {
        if (error instanceof LogFileError) {
          return jsonResponse({ error: error.message }, error.status);
        }
        console.error('Local Kubernetes log read failed.', error);
        return jsonResponse({ error: 'The local log file could not be read.' }, 500);
      }

      let normalized: ReturnType<typeof validateIncidentInput>;
      try {
        normalized = validateIncidentInput({
          userPrompt: `Analyze the selected local Kubernetes log file ${localLog.fileName}. Identify the failure mode, explain likely causes, and recommend safe validation commands.`,
          logs: localLog.content,
          conversationId: formData.get('conversationId'),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid incident input.';
        return rejectInvalidInput(message);
      }

      try {
        const result = await runInvestigationWorkflow(normalized, env);
        return jsonResponse({
          message: `Analysis completed for ${localLog.fileName}. The file was not stored.`,
          fileName: localLog.fileName,
          investigation: result.investigation,
          workflow: result.workflow,
          conversation: result.conversation,
        });
      } catch (error) {
        console.error('Local Kubernetes log analysis failed.', error);
        return jsonResponse({ error: 'The local log analysis could not be completed.' }, 500);
      }
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      let body: RequestBody;
      try {
        body = (await request.json()) as RequestBody;
      } catch {
        return rejectInvalidInput('Request body must contain valid JSON.', 400);
      }

      let normalized: ReturnType<typeof validateIncidentInput>;
      try {
        normalized = validateIncidentInput(body);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid incident input.';
        return rejectInvalidInput(message, 400);
      }

      try {
        const result = await runInvestigationWorkflow(normalized, env);
        return jsonResponse({
          message: 'Investigation completed.',
          investigation: result.investigation,
          workflow: result.workflow,
          conversation: result.conversation,
        });
      } catch (error) {
        console.error('Incident investigation failed.', error);
        return jsonResponse({ error: 'The incident investigation could not be completed.' }, 500);
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
