# AC-003: Deterministic IBI boundary note

## AC-003-05 — The constant names IBI and cites nothing
Given the committed constant IBI_BOUNDARY_NOTE
Then it equals "Tu pregunta menciona el IBI. Sus normas propias no están cubiertas por el corpus que este asesor cita, así que no puedo confirmar nada sobre él."
And it contains the literal "IBI"
And it matches /no están cubiert|no puedo confirmar/
And it contains no citation marker "[^p:"
And it matches neither /%\s*\d|\d\s*%/ nor /art(?:ículo|\.)\s*\d/i

## AC-003-06 — An answered turn with an IBI mention carries the note
Given the message "dime si me puedo deducir la luz, agua e ibi si me doy de alta de autonomo"
And a fake adapter that cites a retrieved passage
When answerQuestion runs
Then the response kind is "answer"
And response.boundaryNote equals IBI_BOUNDARY_NOTE
And every citation's passageId is present in the retrieved evidence bundle (no citation points at an IBI passage)

## AC-003-07 — The note is deterministic and model-independent
Given the message "dime si me puedo deducir la luz, agua e ibi si me doy de alta de autonomo"
And one fake adapter whose answer text never mentions IBI, and another whose answer text does mention IBI
When answerQuestion runs once with each adapter
Then both responses carry boundaryNote equal to IBI_BOUNDARY_NOTE
And the note value is identical across both (it is the committed constant, not derived from model output)

## AC-003-08 — IBI-deductibility-only is not refused and claims no corpus support
Given the message "¿Puedo deducirme el IBI?"
And a fake adapter that would cite a retrieved passage
When answerQuestion runs
Then the response kind is "answer" or "insufficient_evidence", never "out_of_scope" and never "guide"
And response.boundaryNote equals IBI_BOUNDARY_NOTE
And when the kind is "answer", every citation's passageId resolves to a norm in ALLOWED_NORMS (no citation supports the IBI, which has no passage in the corpus)

## AC-003-09 — The note is absent on a plain answer and on a refusal
Given the message "¿Puedo deducirme el alquiler de mi vivienda habitual?" and a citing fake adapter
When answerQuestion runs
Then the response kind is "answer"
And response.boundaryNote is undefined

Given the message "¿Cuánto es el IBI de mi vivienda?"
When answerQuestion runs
Then the response kind is "out_of_scope"
And the response carries no boundaryNote field
