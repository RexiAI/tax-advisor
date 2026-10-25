import { describe, expect, it, vi } from 'vitest';

import { newRequestId, serializeLogRecord } from '@/observability/log';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { detectSensitiveData } from '@/service/privacy';
import { createTurnTelemetry } from '@/service/types';
import { createChatRouteHandler } from '@/server/chat-route';

import { FakeLlmAdapter, answerScript } from '../support/fake-llm-adapter';
import {
  configureLlmEnv,
  jsonChatRequest,
  makeDeps,
  sequentialRequestIds,
} from '../support/harness';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function routeDeps(logs: string[]) {
  configureLlmEnv();
  return makeDeps({
    logs,
    adapter: new FakeLlmAdapter(answerScript('Respuesta [^p:BOE-A-2006-20764#a63].')),
    newRequestId: sequentialRequestIds(),
  });
}

describe('AC-001-59 a DNI stops the turn before retrieval or the model', () => {
  it('AC-001-59: the warning names DNI, the model is not called and the value is not echoed', async () => {
    const logs: string[] = [];
    const adapter = new FakeLlmAdapter({ deltas: ['No debería llamarse.'] });
    const handler = createChatRouteHandler(
      makeDeps({ logs, adapter, newRequestId: sequentialRequestIds() })
    );
    configureLlmEnv();

    const response = await handler(
      jsonChatRequest({ message: 'Mi DNI es 12345678Z, ¿puedo deducir el alquiler?' })
    );
    const raw = await response.text();

    const body = JSON.parse(raw) as { kind: string; categoryLabel: string; message: string };
    expect(response.status).toBe(200);
    expect(body.kind).toBe('privacy_warning');
    expect(body.categoryLabel).toBe('DNI');
    expect(body.message).toContain('DNI');
    expect(adapter.callCount).toBe(0);
    for (const fragment of ['12345678Z', '12345678', '1234567', '5678Z']) {
      expect(raw).not.toContain(fragment);
    }
  });
});

describe('AC-001-60 NIE and IBAN are detected too', () => {
  it('AC-001-60: both categories are named and neither raw value reaches the response or the log', async () => {
    const values: [string, string][] = [
      ['Mi NIE es X1234567L', 'NIE'],
      ['Mi cuenta es ES91 2100 0418 4502 0005 1332', 'IBAN'],
    ];

    for (const [message, label] of values) {
      const logs: string[] = [];
      const adapter = new FakeLlmAdapter({ deltas: ['No debería llamarse.'] });
      configureLlmEnv();
      const handler = createChatRouteHandler(
        makeDeps({ logs, adapter, newRequestId: sequentialRequestIds() })
      );

      const response = await handler(jsonChatRequest({ message }));
      const raw = await response.text();
      const body = JSON.parse(raw) as { kind: string; categoryLabel: string };

      expect(body.kind).toBe('privacy_warning');
      expect(body.categoryLabel).toBe(label);
      expect(adapter.callCount).toBe(0);
      expect(logs).toHaveLength(1);
      const rawValue = label === 'NIE' ? 'X1234567L' : 'ES9121000418450200051332';
      expect(raw).not.toContain(rawValue);
      expect(logs.join('\n')).not.toContain(rawValue);
      expect(logs.join('\n')).not.toContain('X1234567L');
    }
  });
});

describe('AC-001-61 fields the product must never accept are rejected', () => {
  it('AC-001-61: an extra field is a 400 before any processing; message+conversationId is accepted', async () => {
    const adapter = new FakeLlmAdapter(answerScript('Hola [^p:BOE-A-2006-20764#a63].'));
    configureLlmEnv();
    const loadCorpus = vi.fn(() => {
      throw new Error('retrieval must not run for a rejected body');
    });
    const handler = createChatRouteHandler(
      makeDeps({ adapter, loadCorpus, newRequestId: sequentialRequestIds() })
    );

    const rejected = await handler(
      jsonChatRequest({ message: '¿Puedo deducir el alquiler?', dni: '12345678Z' })
    );
    expect(rejected.status).toBe(400);
    const body = (await rejected.json()) as { errorCode: string };
    expect(body.errorCode).toBe('unexpected_field');
    expect(adapter.callCount).toBe(0);
    expect(loadCorpus).not.toHaveBeenCalled();

    const acceptingHandler = createChatRouteHandler(
      makeDeps({ adapter, newRequestId: sequentialRequestIds() })
    );
    const accepted = await acceptingHandler(
      jsonChatRequest({ message: '¿Puedo deducir el alquiler?', conversationId: 'conv-9' })
    );
    expect(accepted.status).toBe(200);
  });
});

describe('AC-001-62 nothing is persisted', () => {
  it('AC-001-62: only a clarification flag is stored and it expires with the TTL', async () => {
    let now = 1_000;
    const conversations = createConversationStore({ ttlMs: 5_000, now: () => now });
    const adapter = new FakeLlmAdapter({ deltas: ['¿En qué año fiscal?'] });

    await answerQuestion(
      { message: '¿Puedo deducir el alquiler?', conversationId: 'conv-1' },
      {
        index: (await import('../support/harness')).fixtureCorpus().index,
        adapter,
        config: { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 },
        conversations,
        telemetry: createTurnTelemetry(),
        now: () => now,
      }
    );

    expect(conversations.size()).toBe(1);
    expect(JSON.stringify(Object.keys(conversations))).not.toContain('conv-1');

    now = 10_000;
    expect(conversations.size()).toBe(0);
  });
});

describe('AC-001-63 each request emits one structured log line with the required fields', () => {
  it('AC-001-63: exactly one JSON record with every required field and a closed citation value', async () => {
    const logs: string[] = [];
    const handler = createChatRouteHandler(routeDeps(logs));

    await (await handler(jsonChatRequest({ message: '¿Puedo deducir el alquiler?' }))).text();

    expect(logs).toHaveLength(1);
    const record = JSON.parse(logs[0]!) as Record<string, unknown>;
    for (const field of [
      'requestId',
      'route',
      'latencyMs',
      'firstTokenMs',
      'promptTokens',
      'completionTokens',
      'retrievalHitCount',
      'citationValidation',
      'status',
    ]) {
      expect(record).toHaveProperty(field);
    }
    expect(record.route).toBe('/api/chat');
    expect(['pass', 'fail', 'insufficient', 'not_applicable']).toContain(record.citationValidation);
  });
});

describe('AC-001-64 the log line carries no content and a single random identifier', () => {
  it('AC-001-64: no message, answer, question or ip; requestId is a fresh UUID v4', async () => {
    const logs: string[] = [];
    const handler = createChatRouteHandler(
      makeDeps({
        logs,
        adapter: new FakeLlmAdapter(answerScript('marcador-unico-123 [^p:BOE-A-2006-20764#a63].')),
        newRequestId,
      })
    );
    configureLlmEnv();

    await (await handler(jsonChatRequest({ message: 'marcador-unico-123' }))).text();
    await (await handler(jsonChatRequest({ message: 'marcador-unico-123' }))).text();

    expect(logs).toHaveLength(2);
    const [first, second] = logs.map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(JSON.stringify(first)).not.toContain('marcador-unico-123');
    for (const forbidden of ['message', 'answer', 'text', 'question', 'ip']) {
      expect(first).not.toHaveProperty(forbidden);
    }
    expect(String(first!.requestId)).toMatch(UUID_V4);
    expect(first!.requestId).not.toBe(second!.requestId);
  });

  it('AC-001-64: the serializer whitelists fields even if extra data is attached', () => {
    const line = serializeLogRecord({
      requestId: 'id',
      route: '/api/chat',
      latencyMs: 1,
      firstTokenMs: 1,
      promptTokens: 1,
      completionTokens: 1,
      retrievalHitCount: 1,
      citationValidation: 'pass',
      status: 'ok',
      message: 'marcador-unico-123',
    } as never);

    expect(line).not.toContain('marcador-unico-123');
  });
});

describe('privacy detection unit behaviour', () => {
  it('detects DNI, NIE and IBAN without matching unrelated text', () => {
    expect(detectSensitiveData('Mi DNI es 12345678Z')).toEqual(['dni']);
    expect(detectSensitiveData('Mi NIE es X1234567L')).toEqual(['nie']);
    expect(detectSensitiveData('Cuenta ES91 2100 0418 4502 0005 1332')).toEqual(['iban']);
    expect(detectSensitiveData('Quiero deducir el alquiler en 2025')).toEqual([]);
  });
});
