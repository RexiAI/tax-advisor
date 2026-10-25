# Spain Tax AI Landscape — Desk Research

Date: 2026-10-22
Purpose: ground the first spec for `tax-advisor` in primary sources (BOE/AEAT) and
in the public positioning of existing Spanish tax/legal AI products.

Method: public web pages and the BOE open-data API documentation, read on
2026-10-22. No competitor product was scraped into a corpus; only public
marketing/pricing pages were read. Figures marked "vendor claim" are the
vendor's own published numbers, not independently verified.

## 1. Primary legal sources

### BOE open data — consolidated legislation API

- The Agencia Estatal Boletín Oficial del Estado publishes a REST API for
  consolidated legislation, the daily BOE/BORME summaries, and auxiliary tables.
  Source: <https://www.boe.es/datosabiertos/api/api.php>
- The legislation API has two shapes:
  - list: `GET /datosabiertos/api/legislacion-consolidada` (JSON and XML)
  - by id: `GET /datosabiertos/api/legislacion-consolidada/id/{id}` (XML)
  - sub-resources under `/id/{id}/…`: `metadatos`, `analisis`,
    `metadata-eli`, `texto`, `texto/indice`, `texto/bloque/{id_bloque}`.
    Source: <https://www.boe.es/datosabiertos/documentos/APIconsolidada.pdf>
- The list returns `fecha_actualizacion` per norm, which enables incremental
  sync (`from` / `to` in `AAAAMMDD`). The by-id response also carries the
  consolidated-text metadata, including the last update timestamp.
- Consolidated texts are structured into `<bloque>` units (precepto, preamble,
  final provisions, etc.), each with one or more `<version>` nodes whose text is
  HTML (`p`, `table`, `blockquote`, `img`). This is the right granularity for
  article-level retrieval and citation.
- Consolidated text is informative and has no legal value:
  "Este texto consolidado es de carácter informativo y no tiene valor jurídico."
  Source (example norm page): <https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820>
- Reuse is allowed under the BOE reuse conditions (attribution, no distortion,
  no implication of official endorsement):
  <https://www.boe.es/informacion/aviso_legal/index.php#reutilizacion>
- Verified live on 2026-10-22: `Accept: application/xml` returns 200 for
  `id/BOE-A-2006-20764`; `Accept: application/json` returns 400 for the by-id
  document. The list endpoint does support JSON. Plan for XML parsing on the
  document/text path.

Core norms for an IRPF MVP:

| Norm                                        | BOE id             | URL                                                     |
| ------------------------------------------- | ------------------ | ------------------------------------------------------- |
| Ley 35/2006, de 28 de noviembre, del IRPF   | `BOE-A-2006-20764` | <https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764> |
| Real Decreto 439/2007 (Reglamento del IRPF) | `BOE-A-2007-6820`  | <https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820>  |

Both were last updated in 2026 according to their consolidated-text pages.

### AEAT — official interpretation and practical manual

- AEAT publishes the `Manual práctico de Renta 2025` (filing campaign 2026).
  The state-scale table for the general taxable base is published at
  <https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/gravamen-base-liquidable-general/gravamen-estatal.html>
  (page updated 2026-03-17).
- State scale (art. 63.1.1º LIRPF), applicable regardless of residence:

  | Base liquidable hasta (€) | Cuota íntegra (€) | Resto hasta (€) | Tipo   |
  | ------------------------- | ----------------- | --------------- | ------ |
  | 0.00                      | 0.00              | 12,450.00       | 9.50%  |
  | 12,450.00                 | 1,182.75          | 7,750.00        | 12.00% |
  | 20,200.00                 | 2,112.75          | 15,000.00       | 15.00% |
  | 35,200.00                 | 4,362.75          | 24,800.00       | 18.50% |
  | 60,000.00                 | 8,950.75          | 240,000.00      | 22.50% |
  | 300,000.00                | 62,950.75         | en adelante     | 24.50% |

- Regional scales and regional deductions differ by comunidad autónoma; the
  state table alone is not a full IRPF calculation. Any numeric estimate must
  say which scale(s) it applied and what it ignored.

## 2. Competitor and comparable products

### TaxDown / Luz (consumer tax advisory, Spain)

- Positioning: online Spanish tax advisory for individuals and autónomos;
  handles the annual income tax return and other Hacienda/Seguridad Social
  procedures; human advisors on paid plans.
  Source: <https://taxdown.es/sobre-taxdown>
- `Luz` is marketed as "el primer chat experto fiscal de España, de acceso
  gratuito": 24/7 Q&A, plain language ("en cristiano"), step-by-step guidance.
  Vendor claims on the page: 345,922 tax questions resolved, 2M returns filed,
  4.7/5 in app stores.
  Source: <https://taxdown.es/asesor-ia>
- Pricing published on the site: simple return from €35/year (PRO), €45/year
  (LIVE), €65/year (FULL); autónomo plans €29.90/month and €59.90/month;
  gestoría fiscal services quoted from €35 to €250+.
  Sources: <https://taxdown.es/precios>, <https://taxdown.es/asesoria-gestoria/fiscal>
- Trust signals: Colaborador Social de la Agencia Tributaria; up to €1,000
  coverage for errors caused by TaxDown.
  Source: <https://taxdown.es/sobre-taxdown>
- Observation: the consumer chat is positioned on speed and plain language. Its
  public page does not advertise article-level citations, source freshness, or
  a verification/abstention policy. That is the gap this product should own.

### Maite.ai (legal AI for lawyers and legal departments)

- Positioning: "copiloto legal" for lawyers, legal departments, asesorías and
  public administrations; jurisprudence search (2.5M+), document analysis,
  legal drafting, conversational interface.
  Source: <https://www.maite.ai/>
- Claims 3M+ legal documents; security posture includes RGPD/LOPDGDD
  compliance, EU servers, no training on user data, pseudonymization, and
  no sharing of user data. Free tier: 20 interactions.
  Source: <https://www.maite.ai/>
- Target user is the professional, not the taxpayer. It is a comparable for
  citation/traceability discipline, document handling, and privacy posture —
  not a direct consumer substitute.

### Prudencia.ai / Observatorio Legal benchmark

- Observatorio Legal published a 2026 benchmark of 15 Spanish legal AI
  assistants: 90 items, 4,050 runs, 2,774 citations checked one by one.
  Source: <https://observatorio.legal/benchmark-asistentes-legales>
- A vendor-authored comparison reports: Prudencia 90.6 vs Maite 87.0 on the
  Índice de Fiabilidad Jurídica; hallucination 2.6% vs 2.4%; first response
  3.1s vs 5.8s; source reliability ~97%. The same article warns that differences
  under 5 points are not conclusive.
  Source: <https://prudencia.ai/blog/prudencia-ai-vs-maite-ai/>
- Implication: "high source reliability" and "low hallucination" are now
  table stakes for professional legal AI in Spain; a consumer product that
  cites nothing will be judged against these numbers.

### Declarando (autónomos: software + asesoría)

- Positioning: software with tax advisory for autónomos; claims €150M+ saved
  in taxes; covers invoicing, IVA and IRPF.
  Sources: <https://declarando.es/>, <https://declarando.es/precios>
- Implication: autónomo tax advice is bundled with bookkeeping/invoicing.
  A chat-only product should not pretend to replace that workflow; it should
  answer questions and hand off.

### Aranzadi CISS K+ Fiscal (professional fiscal AI)

- Positioning: fiscal and tax solution with AI for professional firms; demo-led.
  Source: <https://www.aranzadilaley.es/productos/ciss-fiscal> (Aranzadi LA LEY)
- Implication: the professional end of the market is already served with
  paywalled doctrine and databases. The consumer end is where a grounded,
  free/transparent assistant can differentiate.

## 3. Regulatory constraints relevant to the product

- **EU AI Act, Article 50 transparency**: AI systems interacting directly with
  natural persons must disclose that they are AI, unless obvious. The
  transparency obligations apply from 2 August 2026.
  Sources: <https://artificialintelligenceact.eu/article/50/>,
  <https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act>
- **GDPR / LOPDGDD**: tax questions reveal income, family, health, residence.
  Data minimisation, purpose limitation, and a lawful basis are required. The
  AEPD publishes guidance on AI transparency and data quality.
  Sources: <https://www.aepd.es/prensa-y-comunicacion/blog/inteligencia-artificial-transparencia>,
  <https://www.aepd.es/guias/calidad-datos-inteligencia-artificial.pdf>
- **Not a filing agent**: filing an IRPF return on someone's behalf is a
  separate activity (Colaborador Social / representación). The MVP must not
  claim to file, sign, or represent.
- **BOE reuse**: attribute the source, do not distort the text, do not imply
  official endorsement; consolidated text is informative, not the official
  gazette version.

## 4. Product implications

1. **Citation-first is the wedge.** Every substantive answer should carry the
   BOE article/block, a link, and the last-update date. If retrieval does not
   support an answer, the product must say so rather than generate.
2. **Freshness is a feature.** Surface the corpus `fecha_actualizacion` and
   the tax year; warn when the question is about a different year.
3. **Plain language + legal precision.** TaxDown wins on "en cristiano";
   Maite/Prudencia win on traceability. Combine both: explain simply, link to
   the exact precept.
4. **Consumer, not professional.** No document-heavy workflow in v1; one
   question at a time, short answers, mobile-first.
5. **Privacy by default.** Do not ask for DNI/NIE, IBAN, payroll PDFs, or
   account credentials. Do not persist conversations in v1.
6. **Human escalation, not autonomous filing.** Offer a handoff when the case
   is complex, ambiguous, or high-stakes.
7. **Scope discipline.** IRPF (Renta 2025) is the MVP; IVA, autónomos quotas,
   ISD, ITP, non-residents, and regional scales are explicitly out of scope
   until a later spec.

## 5. Sources (accessed 2026-10-22)

- BOE open-data API: <https://www.boe.es/datosabiertos/api/api.php>
- BOE consolidated-legislation API PDF: <https://www.boe.es/datosabiertos/documentos/APIconsolidada.pdf>
- BOE consolidated-text disclaimer: <https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820>
- BOE reuse conditions: <https://www.boe.es/informacion/aviso_legal/index.php#reutilizacion>
- Ley 35/2006 (IRPF): <https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764>
- AEAT Manual Renta 2025, gravamen estatal: <https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/gravamen-base-liquidable-general/gravamen-estatal.html>
- TaxDown about: <https://taxdown.es/sobre-taxdown>
- TaxDown Luz: <https://taxdown.es/asesor-ia>
- TaxDown pricing: <https://taxdown.es/precios>
- Maite.ai: <https://www.maite.ai/>
- Observatorio Legal benchmark: <https://observatorio.legal/benchmark-asistentes-legales>
- Prudencia vs Maite comparison: <https://prudencia.ai/blog/prudencia-ai-vs-maite-ai/>
- Declarando: <https://declarando.es/>
- Aranzadi CISS K+ Fiscal: <https://www.aranzadilaw.es/productos/ciss-fiscal>
- EU AI Act Art. 50: <https://artificialintelligenceact.eu/article/50/>
- European Commission AI Act transparency FAQ: <https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act>
- AEPD AI transparency: <https://www.aepd.es/prensa-y-comunicacion/blog/inteligencia-artificial-transparencia>
- AEPD AI data quality: <https://www.aepd.es/guias/calidad-datos-inteligencia-artificial.pdf>
