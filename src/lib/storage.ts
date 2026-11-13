import type { IncidentDiagnosis } from './diagnosticEngine';

export interface ConversationTurn {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
}

export interface InvestigationRecord extends IncidentDiagnosis {
  workflowStatus: string;
  conversationId: string;
  summary: string;
}

interface MemoryStorage {
  investigations: InvestigationRecord[];
  conversations: Record<string, ConversationTurn[]>;
}

const memory: MemoryStorage = {
  investigations: [],
  conversations: {},
};

function getConversationMap() {
  return memory.conversations;
}

export async function saveConversationTurn(conversationId: string, prompt: string, response: string): Promise<void> {
  if (!conversationId) {
    return;
  }

  const map = getConversationMap();
  if (!map[conversationId]) {
    map[conversationId] = [];
  }

  map[conversationId].push({
    id: crypto.randomUUID(),
    prompt,
    response,
    createdAt: new Date().toISOString(),
  });
}

export async function getConversationContext(conversationId: string, limit = 6): Promise<ConversationTurn[]> {
  const map = getConversationMap();
  return (map[conversationId] ?? []).slice(-limit);
}

export async function saveInvestigation(record: InvestigationRecord): Promise<void> {
  memory.investigations.push(record);
}

export async function listInvestigations(): Promise<InvestigationRecord[]> {
  return [...memory.investigations].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export async function getInvestigation(id: string): Promise<InvestigationRecord | undefined> {
  return memory.investigations.find((item) => item.incidentId === id);
}

export async function getDashboardSnapshot() {
  const investigations = await listInvestigations();
  const openIncidents = investigations.filter((item) => item.workflowStatus !== 'completed').length;
  const criticalIncidents = investigations.filter((item) => item.severity === 'critical').length;
  return {
    totalInvestigations: investigations.length,
    openIncidents,
    criticalIncidents,
    recent: investigations.slice(0, 5),
  };
}
