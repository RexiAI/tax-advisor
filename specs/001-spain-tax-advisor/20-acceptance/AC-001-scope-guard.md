# AC-001 / Task 11 — Out-of-scope guard and official-body routing

## AC-001-55 — A VAT question is refused and routed to the AEAT

Given the message `¿Cuánto IVA tengo que pagar por mi factura?`
When the turn resolves
Then `kind` is `'out_of_scope'`
And the response names the topic as IVA in Spanish and names `Agencia Tributaria`
And the fake adapter's call count is `0`
And the response contains no citation, tax rate, deadline or article number

## AC-001-56 — Regional taxes are routed to the comunidad autónoma

Given messages asking about `ITP`, `ISD` (sucesiones y donaciones) and `IBI`, one per case
When each turn resolves
Then each returns `kind: 'out_of_scope'`
And each names the corresponding `comunidad autónoma` tax authority rather than the AEAT
And the adapter call count is `0` for all three

## AC-001-57 — Social Security, non-residents and company tax are routed, not answered

Given messages about `cuota de autónomos`/Seguridad Social, about non-resident income tax, and about
`Impuesto sobre Sociedades`, one per case
When each turn resolves
Then the first names `Tesorería General de la Seguridad Social`
And the second and third name `Agencia Tributaria`
And each returns `kind: 'out_of_scope'` with `errorCode` absent and no citations

## AC-001-58 — A filing request is out of scope, and out-of-scope wins a mixed message

Given the message `Hazme la declaración de la renta de 2024`
Then `kind` is `'out_of_scope'`, the reason code is `filing_request`, and no filing, signing or
representation is offered
And given the message `¿Puedo deducir el alquiler y cuánto IVA pago?`
Then `kind` is `'out_of_scope'` and the reason code is `iva`
And no scenario in this file produces a citation
