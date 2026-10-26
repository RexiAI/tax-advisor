# AC-003: Expense deductibility questions mentioning IBI are not refused

## AC-003-01 — The verbatim sentence is not refused
Given the message "dime si me puedo deducir la luz, agua e ibi si me doy de alta de autonomo"
When classifyScope(message) runs
Then it returns null
And answerQuestion({ message }, deps with a citing fake adapter) does not return kind "out_of_scope"
And the fake adapter's callCount is 1

## AC-003-02 — A question about the IBI itself is still refused
Given the message "¿Cuánto es el IBI de mi vivienda?"
When classifyScope(message) runs
Then it returns a match with reasonCode "ibi", label "el IBI", and officialBody "la autoridad tributaria de tu comunidad autónoma"
And answerQuestion({ message }, deps with a fake adapter) returns kind "out_of_scope" with reasonCode "ibi"
And the fake adapter's callCount is 0

## AC-003-03 — An IBI-deductibility-only question is not refused
Given the message "¿Puedo deducirme el IBI?"
When classifyScope(message) runs
Then it returns null

## AC-003-04 — The rest of the guard is unchanged
Given the messages:
  - "¿Puedes presentarme la declaración y decirme cuánto es el IBI?"
  - "¿Cómo tributan los rendimientos del alquiler de bienes inmuebles?"
  - "¿Puedo deducirme el ITP?"
  - "¿Puedo deducirme el ISD?"
  - "Soy no residente y tengo una casa en España"
  - "¿Cómo tributa el Impuesto sobre Sociedades?"
When classifyScope runs on each message
Then the filing request classifies as "filing_request" (first match wins over the IBI mention)
And the "bienes inmuebles" rental question returns null (reaches IRPF retrieval)
And the ITP and ISD expense questions classify as "itp" and "isd" respectively (the deductibility exemption does not extend to them)
And non-residents and company tax classify as "non_residents" and "company_tax" respectively

## AC-003-12 — The `desgravar` synonym is not refused
Given the message "¿Me puedo desgravar el IBI?"
When classifyScope(message) runs
Then it returns null

## AC-003-13 — A third-person `desgrava` question is still about the IBI and refused
Given the message "¿Cuánto desgrava el IBI en mi ayuntamiento?"
When classifyScope(message) runs
Then it returns a match with reasonCode "ibi", label "el IBI", and officialBody "la autoridad tributaria de tu comunidad autónoma"
And answerQuestion({ message }, deps with a fake adapter) returns kind "out_of_scope" with reasonCode "ibi"
And the fake adapter's callCount is 0

Reading encoded: `desgrava` is third-person — the IBI is the subject, and "cuánto … en mi
ayuntamiento" asks how much the IBI is (municipalities set its rate), so this is a question about
the IBI itself, not about the taxpayer deducting an expense. The third-person form is therefore
excluded from the deductibility signal and the turn is still refused.

## AC-003-14 — `descontar` is not a deductibility signal and does not exempt an IBI mention
Given the message "¿Puedo descontar el IVA de una factura que incluye el IBI?"
When classifyScope(message) runs
Then it returns a match with reasonCode "ibi"

Reading encoded: `descontar` means "subtract/discount" (as in `descontar el IVA de una factura`),
not "deduct an expense from IRPF", so it is not a deductibility signal and does not exempt the IBI
mention from the guard.
