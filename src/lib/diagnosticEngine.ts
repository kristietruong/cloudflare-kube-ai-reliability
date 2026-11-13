import { classifyIncident, type ClassificationResult } from './incidentClassifier';
import { sampleScenarios, type IncidentCategory, type Severity } from './sampleData';

export interface IncidentDiagnosis {
  incidentId: string;
  incidentCategory: IncidentCategory;
  severity: Severity;
  affectedResource: string;
  observedSymptoms: string[];
  probableRootCause: string;
  supportingEvidence: string[];
  recommendedTroubleshootingSteps: string[];
  suggestedKubectlCommands: string[];
  preventiveRecommendations: string[];
  confidence: number;
  generatedAt: string;
}

export interface InvestigationInput {
  userPrompt: string;
  logs?: string;
  events?: string;
  resource?: string;
  conversationId?: string;
}

export function validateIncidentInput(input: Partial<InvestigationInput>): InvestigationInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Incident input must be an object.');
  }

  const prompt = typeof input.userPrompt === 'string' ? input.userPrompt.trim() : '';
  if (!prompt) {
    throw new Error('A user prompt is required to begin an investigation.');
  }

  if (prompt.length > 2000) {
    throw new Error('The incident description is too long. Keep it under 2000 characters.');
  }

  return {
    userPrompt: prompt,
    logs: typeof input.logs === 'string' ? input.logs : '',
    events: typeof input.events === 'string' ? input.events : '',
    resource: typeof input.resource === 'string' ? input.resource : undefined,
    conversationId: typeof input.conversationId === 'string' ? input.conversationId : undefined,
  };
}

function buildSuggestedCommands(category: IncidentCategory): string[] {
  const scenario = sampleScenarios.find((item) => item.category === category) ?? sampleScenarios[0];
  return scenario.commands;
}

function buildEvidence(input: InvestigationInput, classification: ClassificationResult): string[] {
  const source = [input.userPrompt, input.logs ?? '', input.events ?? ''].join('\n');
  const evidence = new Set<string>([source.slice(0, 180)]);

  const candidate = sampleScenarios.find((scenario) => scenario.category === classification.category) ?? sampleScenarios[0];
  candidate.evidence.forEach((item) => evidence.add(item));

  if (input.logs) {
    const logLines = input.logs
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 5);
    logLines.forEach((line) => evidence.add(line));
  }

  if (input.events) {
    const eventLines = input.events
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 5);
    eventLines.forEach((line) => evidence.add(line));
  }

  return Array.from(evidence).slice(0, 8);
}

export function buildIncidentAnalysis(input: InvestigationInput): IncidentDiagnosis {
  const normalized = validateIncidentInput(input);
  const classification = classifyIncident(normalized);
  const scenario = sampleScenarios.find((item) => item.category === classification.category) ?? sampleScenarios[0];

  const observedSymptoms = [scenario.symptomSummary];
  const supportingEvidence = buildEvidence(normalized, classification);
  const recommendedTroubleshootingSteps = scenario.troubleshooting;
  const suggestedKubectlCommands = buildSuggestedCommands(classification.category);
  const preventiveRecommendations = scenario.preventive;

  return {
    incidentId: `INC-${Date.now().toString(36).toUpperCase()}`,
    incidentCategory: scenario.category,
    severity: scenario.severity,
    affectedResource: normalized.resource ?? classification.resource,
    observedSymptoms,
    probableRootCause: scenario.rootCause,
    supportingEvidence,
    recommendedTroubleshootingSteps,
    suggestedKubectlCommands,
    preventiveRecommendations,
    confidence: 0.9,
    generatedAt: new Date().toISOString(),
  };
}
