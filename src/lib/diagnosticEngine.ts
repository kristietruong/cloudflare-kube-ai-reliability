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

export function validateIncidentInput(input: unknown): InvestigationInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Incident input must be an object.');
  }

  const fields = input as Record<string, unknown>;
  const prompt = typeof fields.userPrompt === 'string' ? fields.userPrompt.trim() : '';
  if (!prompt) {
    throw new Error('A user prompt is required to begin an investigation.');
  }

  if (prompt.length > 2000) {
    throw new Error('The incident description is too long. Keep it under 2000 characters.');
  }

  const optionalText = (key: 'logs' | 'events' | 'resource' | 'conversationId', maxLength: number): string | undefined => {
    const value = fields[key];
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value !== 'string') {
      throw new Error(`${key} must be a string.`);
    }
    if (typeof value === 'string' && value.length > maxLength) {
      throw new Error(`${key} is too long. Keep it under ${maxLength} characters.`);
    }
    return value;
  };

  return {
    userPrompt: prompt,
    logs: optionalText('logs', 64_000) ?? '',
    events: optionalText('events', 20_000) ?? '',
    resource: optionalText('resource', 256),
    conversationId: optionalText('conversationId', 128),
  };
}

function buildSuggestedCommands(category: IncidentCategory): string[] {
  const scenario = sampleScenarios.find((item) => item.category === category) ?? sampleScenarios[0];
  return scenario.commands;
}

function buildEvidence(input: InvestigationInput, classification: ClassificationResult): string[] {
  const evidence = new Set<string>();

  if (input.userPrompt.trim()) {
    evidence.add(`User-reported issue: ${input.userPrompt.trim().slice(0, 180)}`);
  }

  if (input.logs) {
    const logLines = input.logs
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.slice(0, 500))
      .slice(0, 5);
    logLines.forEach((line) => evidence.add(`Supplied log: ${line}`));
  }

  if (input.events) {
    const eventLines = input.events
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.slice(0, 500))
      .slice(0, 5);
    eventLines.forEach((line) => evidence.add(`Supplied event: ${line}`));
  }

  if (!input.logs && !input.events) {
    evidence.add('No Kubernetes logs or events were supplied; diagnosis is based on the user-reported issue only.');
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
