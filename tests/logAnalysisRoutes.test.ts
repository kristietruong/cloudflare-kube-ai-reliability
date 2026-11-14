import { describe, expect, it } from 'vitest';

import worker from '../src/worker';

describe('local log analysis Worker route', () => {
  it('analyzes a local multipart .log file without an R2 binding', async () => {
    const form = new FormData();
    form.append('file', new File(['Container OOMKilled; exit code 137'], 'worker.log'));

    const response = await worker.fetch(
      new Request('https://copilot.test/api/logs/analyze', { method: 'POST', body: form }),
      {},
    );
    const analysis = await response.json() as {
      message: string;
      fileName: string;
      investigation: { incidentCategory: string; supportingEvidence: string[] };
    };

    expect(response.status).toBe(200);
    expect(analysis.fileName).toBe('worker.log');
    expect(analysis.message).toContain('file was not stored');
    expect(analysis.investigation.incidentCategory).toBe('OOMKilled');
    expect(analysis.investigation.supportingEvidence.some((item) => item.includes('OOMKilled'))).toBe(true);
  });

  it('rejects non-log files', async () => {
    const form = new FormData();
    form.append('file', new File(['not a log'], 'notes.txt'));

    const response = await worker.fetch(
      new Request('https://copilot.test/api/logs/analyze', { method: 'POST', body: form }),
      {},
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'Only .log files can be analyzed.' });
  });

  it('no longer exposes an R2 upload route', async () => {
    const response = await worker.fetch(
      new Request('https://copilot.test/api/logs/upload', { method: 'POST' }),
      {},
    );

    expect(response.status).toBe(404);
  });
});
