import { describe, expect, it } from 'vitest';

import { extractCitations, stripCitationMarkers } from '@/citations/extract';
import { isFilingRequest } from '@/content/filing-request';
import { search } from '@/retrieval/index';
import { answerQuestion } from '@/service/answer-question';
import { createConversationStore } from '@/service/conversation-store';
import { firstQuestion, yearNoticeFor } from '@/service/responses';
import { classifyScope } from '@/service/scope-guard';
import { createTurnTelemetry } from '@/service/types';
import { parseChatBody } from '@/server/chat-route';

import { FakeLlmAdapter } from '../support/fake-llm-adapter';
import { fixtureCorpus } from '../support/harness';

describe('extractCitations', () => {
  it('returns ids in first-appearance order without repeats', () => {
    const extraction = extractCitations('a [^p:x#1] b [^p:y#2] c [^p:x#1]');
    expect(extraction.ids).toEqual(['x#1', 'y#2']);
  });

  it('handles a marker at the start and end of the text', () => {
    const extraction = extractCitations('[^p:x#1] texto [^p:y#2]');
    expect(extraction.ids).toEqual(['x#1', 'y#2']);
    expect(extraction.text).toBe(' texto ');
  });

  it('returns an empty list when there are no markers', () => {
    expect(extractCitations('sin marcas').ids).toEqual([]);
    expect(stripCitationMarkers('sin marcas')).toBe('sin marcas');
  });

  it('keeps an empty id as an entry so it can be rejected later', () => {
    expect(extractCitations('[^p:]').ids).toEqual(['']);
  });
});

describe('classifyScope', () => {
  it('does not match a word that merely contains a topic abbreviation', () => {
    expect(classifyScope('¿Puedo privatizar mi vivienda?')).toBeNull();
    expect(classifyScope('Quiero deducir el alquiler de mi vivienda habitual')).toBeNull();
  });

  it('prefers a filing request over a tax mention in the same sentence', () => {
    const match = classifyScope('Hazme la declaración del IVA de este trimestre');
    expect(match?.reasonCode).toBe('filing_request');
  });

  it('is accent-insensitive', () => {
    expect(classifyScope('¿Cuánto es la CUOTA DE AUTÓNOMOS?')?.reasonCode).toBe('social_security');
  });

  it('matches a non-resident question', () => {
    expect(classifyScope('Soy NO RESIDENTE en España')?.reasonCode).toBe('non_residents');
  });

  it('routes a registration request to the alta de autónomos topic, not to IRPF', () => {
    expect(classifyScope('Me quiero dar de alta como autónomo en España. Dime pasos')?.reasonCode).toBe(
      'autonomo_registration'
    );
    expect(classifyScope('Quiero empezar como autónomo')?.reasonCode).toBe('autonomo_registration');
    expect(classifyScope('¿Qué gastos puedo deducirme siendo autónomo?')).toBeNull();
  });
});

describe('yearNoticeFor', () => {
  it('is undefined for a message with no year, the covered year, or an out-of-range year', () => {
    expect(yearNoticeFor('¿Puedo deducir el alquiler?', 2025)).toBeUndefined();
    expect(yearNoticeFor('¿Puedo deducir el alquiler en 2025?', 2025)).toBeUndefined();
    expect(yearNoticeFor('Nací en 1990 y cobro 25.000 €', 2025)).toBeUndefined();
  });

  it('names the covered year and the asked year', () => {
    const notice = yearNoticeFor('¿Y en 2024?', 2025);
    expect(notice).toContain('2025');
    expect(notice).toContain('2024');
    expect(notice).toMatch(/puede haber cambiado/i);
  });

  it('fires when one of several years is outside the corpus year', () => {
    expect(yearNoticeFor('Comparo 2025 con 2031', 2025)).toBeDefined();
    expect(yearNoticeFor('¿Y si la renta es de 2019?', 2025)).toBeDefined();
  });
});

describe('firstQuestion', () => {
  it('extracts the first interrogative sentence only', () => {
    expect(firstQuestion('¿Año? ¿Comunidad autónoma?')).toBe('¿Año?');
  });

  it('handles a question without the opening mark', () => {
    expect(firstQuestion('Dime cual es tu comunidad?')).toBe('Dime cual es tu comunidad?');
  });

  it('returns null when the text asks nothing', () => {
    expect(firstQuestion('La escala general se aplica a la base liquidable.')).toBeNull();
  });
});

describe('parseChatBody', () => {
  it('distinguishes malformed JSON from an unexpected field', () => {
    expect(parseChatBody('not json')).toEqual({ ok: false, error: 'invalid_request' });
    expect(parseChatBody('[]')).toEqual({ ok: false, error: 'invalid_request' });
    expect(parseChatBody('null')).toEqual({ ok: false, error: 'invalid_request' });
    expect(parseChatBody(JSON.stringify({ message: 'x', name: 'y' }))).toEqual({
      ok: false,
      error: 'unexpected_field',
    });
  });

  it('rejects wrong types and missing message', () => {
    expect(parseChatBody(JSON.stringify({ message: 3 }))).toEqual({
      ok: false,
      error: 'invalid_request',
    });
    expect(parseChatBody(JSON.stringify({ message: 'x', conversationId: 3 }))).toEqual({
      ok: false,
      error: 'invalid_request',
    });
    expect(parseChatBody(JSON.stringify({}))).toEqual({ ok: false, error: 'invalid_request' });
  });

  it('accepts message alone or with a conversationId', () => {
    expect(parseChatBody(JSON.stringify({ message: 'x' }))).toEqual({
      ok: true,
      request: { message: 'x' },
    });
    expect(parseChatBody(JSON.stringify({ message: 'x', conversationId: 'c' }))).toEqual({
      ok: true,
      request: { message: 'x', conversationId: 'c' },
    });
  });
});

describe('classifyScope — the filing_request topic is direct address, not vocabulary', () => {
  // Task 11's topic is a request to *this product* to file, sign or represent. The
  // cases below are grouped by **situation** rather than by phrasing, because a
  // table of the phrasings a rule was written around hides over-matches: Spanish
  // uses the same second-person forms for a generic "tú" in a conditional clause,
  // for the taxpayer's own filing, and for an address to the product.
  const theTaxpayerActsOrAsks = [
    // Their own filing, pronoun attached to the infinitive.
    '¿Puedo presentarla por internet?',
    'Quiero presentarla yo mismo, ¿qué necesito?',
    '¿Puedo firmarla con certificado digital?',
    'Voy a presentarla el lunes',
    // Their own filing, with a possessive, a periphrasis or a reflexive.
    '¿Puedo presentar mi declaración por internet?',
    '¿Cuándo debo presentar mi declaración?',
    'Tengo que presentar el modelo 100, ¿qué casillas relleno?',
    'Voy a firmar la declaración mañana, ¿necesito cita?',
    '¿Tengo que presentarme en la oficina de Hacienda?',
    '¿Puedo presentarme en la oficina sin cita?',
    'Voy a presentar por mi parte la declaración',
    'Quiero presentar la declaración por mi cuenta',
    // Generic "tú" in a conditional, temporal or causal clause: a question about
    // the rules, whatever the object is called.
    'Si presentas la declaración conjunta, ¿cuánto te desgravas?',
    'Cuando presentas el modelo 100, ¿qué plazo tienes?',
    'Cuando presentas la declaración, ¿qué documentos necesitas?',
    'Cuando presentas el borrador, ¿qué plazo tengo?',
    'Mientras presentas la declaración, ¿qué pasa si hay un error?',
    'Si firmas la declaración conjunta, ¿quién paga?',
    'Al presentar la declaración conjunta, ¿cambia el mínimo personal?',
    'Yo presento la declaración, ¿tú qué deduces?',
    'Nosotros presentamos la declaración conjunta, ¿qué cambia?',
    // Ownership of an asset, not a request to represent anyone.
    '¿Puedo deducir el alquiler si el contrato está en mi nombre?',
    'La vivienda está a nombre de mi madre, ¿puedo deducir el alquiler?',
    'El contrato está en mi nombre pero quiero presentar la declaración conjunta',
    // Filings described in the third person or as a deadline.
    '¿Cuándo se presenta el borrador de la renta?',
    '¿Cuándo presenta la declaración un contribuyente con dos pagadores?',
    // Addressed to the product, but asking for information rather than action.
    '¿Puedes explicarme cómo presentar la declaración?',
    '¿Me puedes explicar cómo se presenta el borrador?',
    '¿Me preparas un resumen de la escala?',
    '¿Podrías hacerme un favor y explicarme la escala?',
    // Other in-scope IRPF topics.
    '¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?',
    '¿Qué rendimientos del capital inmobiliario se declaran?',
    '¿Son deducibles las cotizaciones a la Seguridad Social de un autónomo en el IRPF?',
  ];

  it.each(theTaxpayerActsOrAsks)('keeps %s in scope', (message) => {
    expect(classifyScope(message)).toBeNull();
  });

  const theProductIsAskedToAct: [string, string][] = [
    // Imperative with the speaker as object, written together or apart.
    ['Hazme la declaración de la renta de 2024', 'filing_request'],
    ['Preséntame la declaración de la renta', 'filing_request'],
    ['Trámítame el modelo 100', 'filing_request'],
    ['Representa me ante Hacienda', 'filing_request'],
    ['Prepárame el borrador', 'filing_request'],
    ['Hazme el borrador', 'filing_request'],
    // Imperative opening the message with the user's own filing as object.
    ['Firma mi declaración', 'filing_request'],
    ['Presenta mi declaración del IRPF', 'filing_request'],
    // Question-initial address with a second-person modal.
    ['¿Puedes presentar mi declaración?', 'filing_request'],
    ['¿Puedes tramitarme el modelo 100?', 'filing_request'],
    ['¿Podrías hacerme la declaración?', 'filing_request'],
    ['¿Puedes firmarme la declaración?', 'filing_request'],
    ['¿Puedes representarme ante Hacienda?', 'filing_request'],
    ['¿Puedes preparármela?', 'filing_request'],
    ['¿Podrías presentar el modelo 100 por mí?', 'filing_request'],
    ['¿Podrías firmar mi declaración en mi nombre?', 'filing_request'],
    // Benefactive "me" on a second-person verb.
    ['¿Me presentas la declaración?', 'filing_request'],
    ['¿Me haces la declaración de la renta?', 'filing_request'],
    ['¿Me la puedes preparar tú?', 'filing_request'],
    ['¿Me lo puedes tramitar tú?', 'filing_request'],
    // A wish whose subject is the product.
    ['Quiero que presentes la declaración por mí', 'filing_request'],
    ['Necesito que presentes el modelo 100', 'filing_request'],
    ['Quiero que me presentes la declaración', 'filing_request'],
    // Other topics keep their routing.
    ['¿Cuánto es el IBI de mi vivienda?', 'ibi'],
    ['¿Cuánto pago de impuesto sobre bienes inmuebles?', 'ibi'],
    ['¿Cuánto es la cuota de autónomos este año?', 'social_security'],
    ['¿Cuánto pago a la Seguridad Social como autónomo?', 'social_security'],
  ];

  it.each(theProductIsAskedToAct)('refuses %s as %s', (message, reasonCode) => {
    expect(classifyScope(message)?.reasonCode).toBe(reasonCode);
  });
});

describe('isFilingRequest — one example per address form', () => {
  it('recognises the six direct-address forms', () => {
    expect(isFilingRequest('presentame la declaracion')).toBe(true); // imperative + clitic
    expect(isFilingRequest('¿puedes presentar la declaracion?')).toBe(true); // modal address
    expect(isFilingRequest('¿me presentas la declaracion?')).toBe(true); // benefactive me
    expect(isFilingRequest('quiero que presentes la declaracion')).toBe(true); // wish
    expect(isFilingRequest('¿puedes presentar por mi?')).toBe(true); // representation
    expect(isFilingRequest('presenta mi declaracion')).toBe(true); // imperative, own filing
  });

  it('does not treat a generic second person, a self-filing or ownership as a request', () => {
    expect(isFilingRequest('si presentas la declaracion conjunta, ¿cuanto te desgravas?')).toBe(
      false
    );
    expect(isFilingRequest('¿puedo presentarla por internet?')).toBe(false);
    expect(isFilingRequest('el contrato esta en mi nombre')).toBe(false);
    expect(isFilingRequest('presentar por mi mismo es posible')).toBe(false);
  });
});

describe('answerQuestion — an in-scope real-estate question reaches retrieval (V-01)', () => {
  const message = '¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?';

  it('is answered from the corpus instead of being refused as out of scope', async () => {
    const index = fixtureCorpus().index;
    const [top] = search(index, message);
    if (top === undefined)
      throw new Error('fixture corpus has no match for the regression message');

    const adapter = new FakeLlmAdapter({
      deltas: [
        `Los rendimientos del alquiler tributan como capital inmobiliario [^p:${top.passage.passageId}].`,
      ],
    });

    const response = await answerQuestion(
      { message },
      {
        index,
        adapter,
        config: { minRetrievalScore: 0.01, retrievalTopK: 5, corpusTaxYear: 2025 },
        conversations: createConversationStore(),
        telemetry: createTurnTelemetry(),
        now: () => 1,
      }
    );

    expect(response.kind).not.toBe('out_of_scope');
    expect(adapter.callCount).toBe(1);
  });
});
