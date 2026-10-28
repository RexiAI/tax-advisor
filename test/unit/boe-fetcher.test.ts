import { describe, expect, it } from 'vitest';

import {
  createBoeFetcher,
  metadatosUrl,
  normalizeBoeDate,
  readFechaActualizacion,
  textoUrl,
} from '@/corpus/boe-fetcher';

const METADATOS = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <status><code>200</code><text>ok</text></status>
  <data>
    <metadatos>
      <identificador>BOE-A-2006-20764</identificador>
      <fecha_actualizacion>2026-03-17</fecha_actualizacion>
    </metadatos>
  </data>
</response>`;

const METADATOS_LIVE = `<?xml version="1.0" encoding="utf-8"?>
<response>
  <status>
    <code>200</code>
    <text>ok</text>
  </status>
  <data>
    <metadatos>
      <fecha_actualizacion>20261007T095616Z</fecha_actualizacion>
      <identificador>BOE-A-2006-20764</identificador>
      <departamento codigo="7723">Jefatura del Estado</departamento>
      <titulo>Ley 35/2006, de 28 de noviembre, del Impuesto sobre la Renta de las Personas Físicas.</titulo>
      <fecha_publicacion>20061129</fecha_publicacion>
    </metadatos>
  </data>
</response>`;

const TEXTO = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <data>
    <texto>
      <bloque id="a1" tipo="normativo" titulo="Artículo 1. Objeto">
        <version id="v1"><p>Texto.</p></version>
      </bloque>
    </texto>
  </data>
</response>`;

function recordingFetch(responses: Record<string, Response>): {
  fetchImpl: typeof fetch;
  urls: string[];
} {
  const urls: string[] = [];
  const fetchImpl = ((input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    const response = responses[url];
    return Promise.resolve(response ?? new Response('missing', { status: 404 }));
  }) as typeof fetch;
  return { fetchImpl, urls };
}

describe('BOE urls', () => {
  it('target the open-data metadata and text resources', () => {
    expect(metadatosUrl('BOE-A-2006-20764')).toBe(
      'https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-2006-20764/metadatos'
    );
    expect(textoUrl('BOE-A-2006-20764')).toContain('/id/BOE-A-2006-20764/texto');
  });
});

describe('readFechaActualizacion', () => {
  it('reads the update date from the metadata document', () => {
    expect(readFechaActualizacion(METADATOS)).toBe('2026-03-17');
  });

  it('reads the live compact form without altering it', () => {
    expect(readFechaActualizacion(METADATOS_LIVE)).toBe('20261007T095616Z');
  });

  it('returns undefined when the element or the document is missing', () => {
    expect(readFechaActualizacion('<response><data/></response>')).toBeUndefined();
    expect(readFechaActualizacion('not xml')).toBeUndefined();
  });
});

describe('normalizeBoeDate', () => {
  it('normalises the exact live BOE value to a calendar date', () => {
    expect(normalizeBoeDate('20261007T095616Z')).toBe('2026-10-07');
  });

  it('normalises the dashed form with or without a timestamp', () => {
    expect(normalizeBoeDate('2026-03-17')).toBe('2026-03-17');
    expect(normalizeBoeDate('2026-03-17T10:11:12Z')).toBe('2026-03-17');
  });

  it('normalises a compact date with no time part', () => {
    expect(normalizeBoeDate('20261007')).toBe('2026-10-07');
  });

  it('refuses anything that is not a real calendar date', () => {
    expect(normalizeBoeDate('sin fecha')).toBeUndefined();
    expect(normalizeBoeDate('17/03/2026')).toBeUndefined();
    expect(normalizeBoeDate('20261399T095616Z')).toBeUndefined();
    expect(normalizeBoeDate('')).toBeUndefined();
  });
});

describe('createBoeFetcher', () => {
  it('reads metadata and text from their separate resources', async () => {
    const { fetchImpl, urls } = recordingFetch({
      [metadatosUrl('BOE-A-2006-20764')]: new Response(METADATOS, { status: 200 }),
      [textoUrl('BOE-A-2006-20764')]: new Response(TEXTO, { status: 200 }),
    });
    const fetcher = createBoeFetcher({ fetchImpl });

    const update = await fetcher.getLastUpdated('BOE-A-2006-20764');
    expect(update).toEqual({ ok: true, updatedAt: '2026-03-17' });

    const document = await fetcher.fetchDocument('BOE-A-2006-20764');
    expect(document.ok).toBe(true);
    if (!document.ok) return;
    expect(document.document).toContain('<bloque');

    expect(urls).toEqual([metadatosUrl('BOE-A-2006-20764'), textoUrl('BOE-A-2006-20764')]);
  });

  it('reads a date out of the live compact metadata form', async () => {
    const { fetchImpl } = recordingFetch({
      [metadatosUrl('BOE-A-2006-20764')]: new Response(METADATOS_LIVE, { status: 200 }),
    });

    const update = await createBoeFetcher({ fetchImpl }).getLastUpdated('BOE-A-2006-20764');
    expect(update).toEqual({ ok: true, updatedAt: '2026-10-07' });
  });

  it('maps a non-2xx answer to an error value naming the norm', async () => {
    const fetcher = createBoeFetcher({
      fetchImpl: recordingFetch({}).fetchImpl,
    });

    expect(await fetcher.getLastUpdated('BOE-A-2006-20764')).toEqual({
      ok: false,
      error: 'HTTP 404 for BOE-A-2006-20764',
    });
    expect(await fetcher.fetchDocument('BOE-A-2006-20764')).toEqual({
      ok: false,
      error: 'HTTP 404 for BOE-A-2006-20764',
    });
  });

  it('maps a transport failure to an error value', async () => {
    const fetcher = createBoeFetcher({
      fetchImpl: (() => Promise.reject(new Error('ECONNREFUSED'))) as unknown as typeof fetch,
    });
    expect(await fetcher.getLastUpdated('BOE-A-2006-20764')).toEqual({
      ok: false,
      error: 'ECONNREFUSED',
    });
  });
});
