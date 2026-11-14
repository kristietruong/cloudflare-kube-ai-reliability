import { describe, expect, it } from 'vitest';

import { classifyIncident, parseKubernetesEvidence } from '../src/lib/incidentClassifier';
import { buildIncidentAnalysis, validateIncidentInput } from '../src/lib/diagnosticEngine';
import { runInvestigationWorkflow } from '../src/lib/workflow';
import { getConversationContext, saveConversationTurn } from '../src/lib/storage';
import { generateDiagnosis } from '../src/lib/aiService';

describe('kubernetes incident classification', () => {
  it('detects CrashLoopBackOff from a pod description', () => {
    const result = classifyIncident({
      userPrompt: 'Why is my payment-service pod in CrashLoopBackOff?',
      logs: 'Back-off restarting failed container payment-service in 30s',
    });

    expect(result.category).toBe('CrashLoopBackOff');
    expect(result.severity).toBe('high');
  });

  it('detects OOMKilled from memory exhaustion logs', () => {
    const result = classifyIncident({
      userPrompt: 'Why did my worker pod restart?',
      logs: 'Container exceeded its memory limit; OOMKilled',
    });

    expect(result.category).toBe('OOMKilled');
    expect(result.severity).toBe('critical');
  });
});

describe('diagnostic parsing and validation', () => {
  it('parses evidence strings into known Kubernetes problem categories', () => {
    const evidence = parseKubernetesEvidence('ImagePullBackOff: failed to pull image registry.example.com/app:latest');
    expect(evidence).toContain('ImagePullBackOff');
  });

  it('builds a valid structured diagnosis payload', () => {
    const diagnosis = buildIncidentAnalysis({
      userPrompt: 'Why is my node NotReady?',
      events: 'Node worker-3 is NotReady: Kubelet stopped posting ready',
    });

    expect(diagnosis.incidentCategory).toBe('NodeNotReady');
    expect(diagnosis.severity).toBe('critical');
    expect(diagnosis.supportingEvidence.length).toBeGreaterThan(0);
    expect(diagnosis.suggestedKubectlCommands.length).toBeGreaterThan(0);
  });

  it('rejects malformed input', () => {
    expect(() => validateIncidentInput({ userPrompt: '' })).toThrow('A user prompt is required');
  });

  it('rejects oversized log input', () => {
    expect(() => validateIncidentInput({ userPrompt: 'Investigate this pod', logs: 'x'.repeat(20_001) }))
      .toThrow('logs is too long');
  });

  it('does not present sample scenario text as observed evidence', () => {
    const diagnosis = buildIncidentAnalysis({ userPrompt: 'Why is my pod in CrashLoopBackOff?' });

    expect(diagnosis.supportingEvidence).toContain(
      'No Kubernetes logs or events were supplied; diagnosis is based on the user-reported issue only.',
    );
    expect(diagnosis.supportingEvidence.some((item) => item.includes('kubectl logs'))).toBe(false);
  });
});

describe('workflow execution and conversation persistence', () => {
  it('completes a workflow for a valid incident report', async () => {
    const result = await runInvestigationWorkflow({
      userPrompt: 'Why is my deployment failing to schedule pods?',
      events: '0/6 nodes are available: 6 Insufficient cpu',
      resource: 'deployment/analytics',
    });

    expect(result.workflow.every((step) => step.status === 'completed')).toBe(true);
    expect(result.investigation.incidentCategory).toBe('FailedScheduling');
    expect(result.conversation.conversationId).toBeDefined();
  });

  it('retrieves stored conversational context', async () => {
    const conversationId = 'conversation-test-1';
    await saveConversationTurn(conversationId, 'Why is the pod restarting?', 'The app is likely crashing due to OOMKilled.');

    const history = await getConversationContext(conversationId);
    expect(history.length).toBeGreaterThan(0);
    expect(history.at(-1)?.prompt).toContain('Why is the pod restarting?');
  });

  it('falls back safely when the model returns invalid category and severity values', async () => {
    const diagnosis = await generateDiagnosis(
      { userPrompt: 'Why is my pod in CrashLoopBackOff?' },
      {
        AI: {
          run: async () => ({
            response: JSON.stringify({
              incidentCategory: 'MadeUpCategory',
              severity: 'urgent',
              confidence: 5,
            }),
          }),
        },
      },
    );

    expect(diagnosis.incidentCategory).toBe('CrashLoopBackOff');
    expect(diagnosis.severity).toBe('high');
    expect(diagnosis.confidence).toBe(1);
  });

  it('uses the deterministic diagnosis when the model call fails', async () => {
    const diagnosis = await generateDiagnosis(
      { userPrompt: 'Why is my pod OOMKilled?' },
      { AI: { run: async () => { throw new Error('model unavailable'); } } },
    );

    expect(diagnosis.incidentCategory).toBe('OOMKilled');
  });
});
