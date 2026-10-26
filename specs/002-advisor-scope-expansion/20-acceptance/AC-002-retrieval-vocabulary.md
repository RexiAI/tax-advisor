# AC-002: Recuperación: vocabulario coloquial → vocabulario normativo

## AC-002-34 — La pregunta de alta recupera el artículo censal y el turno lo cita
Given the committed corpus `corpus/corpus.json` (not the fixture corpus)
And the message «Quiero darme de alta de autónomo. Guíame»
When evidence is built with the configured top-K and minimum score
Then the bundle is `sufficient`
And the bundle carries the passage `BOE-A-2007-15984#a9` (artículo 9 de RD 1065/2007, declaración censal de alta)
And the bundle has at most `retrievalTopK` passages
When a turn's model cites `BOE-A-2007-15984#a9`
Then the turn returns `kind: 'answer'`
And its citations include `BOE-A-2007-15984#a9`
And the cited norm is `BOE-A-2007-15984`

## AC-002-35 — La pregunta de inicio de IVA recupera la obligación y el turno responde con el disclaimer
Given the committed corpus `corpus/corpus.json`
And the message «¿Cuándo empiezo a presentar el IVA si soy autónomo?»
When evidence is built with the configured top-K and minimum score
Then the bundle is `sufficient`
And it contains at least one `BOE-A-1992-28740` (Ley 37/1992) passage whose text uses the filing-obligation vocabulary (declaraciones-liquidaciones, plazos o sujetos pasivos)
And the retrieval for that message includes Ley 37/1992, not only LGSS cese-de-actividad passages
When a turn's model cites that Ley 37/1992 obligation passage
Then the turn returns `kind: 'answer'`
And its citations include that passage, whose norm is `BOE-A-1992-28740`
And the response carries a `scopeDisclaimer`
