import { sampleScenarios, type IncidentCategory, type Severity } from './sampleData';

export interface ClassificationResult {
  category: IncidentCategory;
  severity: Severity;
  resource: string;
  symptoms: string[];
}

const fallbackScenario = sampleScenarios[0];

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function parseKubernetesEvidence(input: string): string[] {
  const normalized = normalizeText(input);
  const evidence: string[] = [];

  if (!normalized) {
    return evidence;
  }

  const patterns: Array<[RegExp, string]> = [
    [/crashloopbackoff/i, 'CrashLoopBackOff'],
    [/oomkilled|out of memory|killed due to memory/i, 'OOMKilled'],
    [/errimagepull|imagepullbackoff|failed to pull image/i, 'ImagePullBackOff'],
    [/pending|containercreating/i, 'PendingPods'],
    [/failed scheduling|insufficient cpu|insufficient memory/i, 'FailedScheduling'],
    [/node .* notready|notready/i, 'NodeNotReady'],
    [/readiness probe failed|liveness probe failed|probe failed/i, 'ProbeFailures'],
    [/persistentvolumeclaim|mountvolume|pvc/i, 'PVCIssue'],
    [/cpu throttling|memory pressure|resource exhausted|high cpu/i, 'ResourceExhaustion']
  ];

  for (const [regex, label] of patterns) {
    if (regex.test(normalized)) {
      evidence.push(label);
    }
  }

  return [...new Set(evidence)];
}

export function classifyIncident(input: { userPrompt?: string; logs?: string; events?: string; resource?: string }): ClassificationResult {
  const source = [input.userPrompt ?? '', input.logs ?? '', input.events ?? '', input.resource ?? ''].join('\n');
  const normalized = normalizeText(source);

  if (!normalized) {
    return {
      category: fallbackScenario.category,
      severity: fallbackScenario.severity,
      resource: fallbackScenario.resource,
      symptoms: [fallbackScenario.symptomSummary]
    };
  }

  for (const scenario of sampleScenarios) {
    const matcher = scenario.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
    if (matcher) {
      return {
        category: scenario.category,
        severity: scenario.severity,
        resource: input.resource ?? scenario.resource,
        symptoms: [scenario.symptomSummary]
      };
    }
  }

  const detectedTags = parseKubernetesEvidence(source);
  const matchedScenario = sampleScenarios.find((scenario) => detectedTags.includes(scenario.category));

  if (matchedScenario) {
    return {
      category: matchedScenario.category,
      severity: matchedScenario.severity,
      resource: input.resource ?? matchedScenario.resource,
      symptoms: [matchedScenario.symptomSummary]
    };
  }

  return {
    category: 'CrashLoopBackOff',
    severity: 'high',
    resource: input.resource ?? 'deployment/default-app',
    symptoms: ['The platform could not confidently identify the failure mode, so a crash-loop diagnosis was used as the default.']
  };
}
