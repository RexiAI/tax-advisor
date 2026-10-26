# AC-003: The boundary note is rendered

## AC-003-10 — AnswerBlock renders the note
Given an AnswerResponse whose boundaryNote equals IBI_BOUNDARY_NOTE
When AnswerBlock renders the response
Then the note text "Tu pregunta menciona el IBI. Sus normas propias no están cubiertas por el corpus que este asesor cita, así que no puedo confirmar nada sobre él." is visible
And the note is rendered as an info notice titled "Sobre el IBI de tu pregunta"

## AC-003-11 — insufficient_evidence renders the note
Given an InsufficientEvidenceResponse whose boundaryNote equals IBI_BOUNDARY_NOTE
And whose explanation is the text "No he encontrado suficiente información"
When abstentionNotice(response) produces a NoticeProps and the Notice renders
Then the abstention notice's body paragraph matches a substring or regex of the note — e.g. /Sus normas propias no están cubiertas por el corpus/ — via a matcher scoped to the rendered Notice (toHaveTextContent, or getByText with a regex), not an exact getByText
And the explanation "No he encontrado suficiente información" is present in the same body paragraph
And the handoff action and the AI disclaimer remain present

Why this is not an exact getByText: the note and the explanation share one body paragraph (the
composition is "explanation\n\nboundaryNote"), so the element's normalized text is never equal to
the note string alone; an exact getByText(IBI_BOUNDARY_NOTE) would fail. Assert a substring/regex of
the rendered notice body instead.
