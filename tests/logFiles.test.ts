import { describe, expect, it } from 'vitest';

import checkoutLogs from '../k8smocklog/checkout-svc.log?raw';
import schedulingLogs from '../k8smocklog/failed-scheduling-analytics.log?raw';
import imagePullLogs from '../k8smocklog/imagepullbackoff-api.log?raw';
import incidentStoryLogs from '../k8smocklog/incident_story.log?raw';
import probeLogs from '../k8smocklog/probe-failure-auth.log?raw';
import pvcLogs from '../k8smocklog/pvc-pending-db.log?raw';
import { classifyIncident } from '../src/lib/incidentClassifier';
import { MAX_LOG_FILE_BYTES, readLocalKubernetesLog } from '../src/lib/logFiles';

describe('local Kubernetes log handling', () => {
  it('reads the selected .log file without storing it', async () => {
    const file = new File(['Warning: ImagePullBackOff'], 'image pull.log');

    const read = await readLocalKubernetesLog(file);

    expect(read.fileName).toBe('image_pull.log');
    expect(read.content).toContain('ImagePullBackOff');
  });

  it('rejects non-log and oversized files', async () => {
    await expect(readLocalKubernetesLog(new File(['not a log'], 'notes.txt')))
      .rejects.toThrow('Only .log files');
    await expect(readLocalKubernetesLog(new File(['x'.repeat(MAX_LOG_FILE_BYTES + 1)], 'large.log')))
      .rejects.toThrow('limit');
  });
});

describe('mock Kubernetes log samples', () => {
  const examples = [
    ['checkout-svc.log', checkoutLogs, 'OOMKilled'],
    ['incident_story.log', incidentStoryLogs, 'CrashLoopBackOff'],
    ['imagepullbackoff-api.log', imagePullLogs, 'ImagePullBackOff'],
    ['failed-scheduling-analytics.log', schedulingLogs, 'FailedScheduling'],
    ['pvc-pending-db.log', pvcLogs, 'PVCIssue'],
    ['probe-failure-auth.log', probeLogs, 'ProbeFailures'],
  ] as const;

  it.each(examples)('classifies %s as %s', (fileName, logs, category) => {
    const diagnosis = classifyIncident({ userPrompt: `Analyze ${fileName}`, logs });

    expect(diagnosis.category).toBe(category);
  });
});
