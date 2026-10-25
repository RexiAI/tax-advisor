# AC-002: Ampliar el registro de normas permitidas (ids verificados)

## AC-002-01 — El registro contiene las dos normas IRPF y las seis normas nuevas verificadas
Given the allowed-norm registry `ALLOWED_NORMS` in `src/domain/allowed-norms.ts`
When the registry is read
Then it contains exactly eight entries
And the six new entries are, verbatim, the `normId`/`normTitle` pairs verified against boe.es (Ley 58/2003 → BOE-A-2003-23186, RD 1065/2007 → BOE-A-2007-15984, RD Leg. 8/2015 LGSS → BOE-A-2015-11724, RD 84/1996 → BOE-A-1996-4447, Ley 37/1992 IVA → BOE-A-1992-28740, RD Leg. 1175/1990 IAE → BOE-A-1990-23930)

## AC-002-02 — Un pasaje de una norma nueva se acepta y uno de una norma no listada se rechaza
Given `isAllowedNorm` gates passage creation
And `ALLOWED_NORMS` includes the six new norms
When a passage is created with the `normId` of one of the new norms (e.g. `BOE-A-1992-28740`)
Then `createPassage` returns `ok: true`
When a passage is created with a `normId` not in `ALLOWED_NORMS` (e.g. `BOE-A-2004-4214`)
Then `createPassage` returns `ok: false` with error `unsupported_norm`

## AC-002-03 — El TRLRHL queda fuera y los identificadores enlazan al texto consolidado
Given the allowed-norm registry
Then `ALLOWED_NORMS` does not contain `BOE-A-2004-4214` (TRLRHL, que aloja el IBI)
And for every entry, `boeSourceUrl(normId)` resolves to `https://www.boe.es/buscar/act.php?id=<normId>`
