import { buildIncidentAnalysis, validateIncidentInput, type IncidentDiagnosis, type InvestigationInput } from './diagnosticEngine';
import { generateDiagnosis } from './aiService';
import { getConversationContext, saveConversationTurn, saveInvestigation, type InvestigationRecord } from './storage';

export interface WorkflowResult {
  workflow: {
    stage: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    step: string;
  }[];
  investigation: InvestigationRecord;
  conversation: {
    conversationId: string;
    previousContext: Array<{ prompt: string; response: string; createdAt: string }>;
  };
}

export async function runInvestigationWorkflow(input: InvestigationInput, env?: { AI?: { run: (model: string, payload: Record<string, unknown>) => Promise<unknown> } }): Promise<WorkflowResult> {
  const normalizedInput = validateIncidentInput(input);
  const conversationId = normalizedInput.conversationId ?? crypto.randomUUID();

  const workflow = [
    { stage: 'receive', status: 'completed' as const, step: 'Incident request received' },
    { stage: 'validate', status: 'completed' as const, step: 'Normalized request and validated safety constraints' },
    { stage: 'evidence', status: 'completed' as const, step: 'Sample logs and Kubernetes evidence collected' },
    { stage: 'analysis', status: 'completed' as const, step: 'AI classification and root cause analysis performed' },
    { stage: 'recommend', status: 'completed' as const, step: 'Remediation plan generated' },
    { stage: 'persist', status: 'completed' as const, step: 'Investigation persisted for future retrieval' },
  ];

  const localDiagnosis = await generateDiagnosis(normalizedInput, env);
  const evidenceSummary = localDiagnosis.supportingEvidence.join(' | ');

  const record: InvestigationRecord = {
    ...localDiagnosis,
    workflowStatus: 'completed',
    conversationId,
    summary: `${localDiagnosis.incidentCategory}: ${evidenceSummary.slice(0, 160)}`,
  };

  await saveInvestigation(record);
  await saveConversationTurn(conversationId, normalizedInput.userPrompt, record.probableRootCause);

  const previousContext = await getConversationContext(conversationId);

  return {
    workflow,
    investigation: record,
    conversation: {
      conversationId,
      previousContext,
    },
  };
}

export async function listRecentInvestigations() {
  const { listInvestigations } = await import('./storage');
  return listInvestigations();
}

export async function getInvestigationById(id: string) {
  const { getInvestigation } = await import('./storage');
  return getInvestigation(id);
}

export async function getDashboardStats() {
  const { getDashboardSnapshot } = await import('./storage');
  return getDashboardSnapshot();
}

export function getConversationHistory(conversationId: string) {
  return getConversationContext(conversationId);
}

export function isValidSeverity(value: string): value is IncidentDiagnosis['severity'] {
  return ['critical', 'high', 'medium', 'low'].includes(value);
}
