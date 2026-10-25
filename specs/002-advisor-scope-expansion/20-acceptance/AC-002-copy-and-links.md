# AC-002: Corregir la copia de rechazo y los enlaces externos de Notice

## AC-002-27 — La copia de rechazo deja de decir «aquí solo explico el IRPF»
Given `scopeResponse` in `src/service/answer-question.ts`
When a message matches a remaining out-of-scope topic
Then the produced `explanation` names the topic and its competent body
And it does not contain «aquí solo explico el IRPF» nor «explico el IRPF»
And a test asserts the string «explico el IRPF» does not appear in an `out_of_scope` payload

## AC-002-28 — Los enlaces externos de Notice llevan target/rel y el mailto no
Given the `Notice` component in `src/components/Notice/Notice.tsx`
When it renders an `<a>` whose `href` starts with `http://` or `https://`
Then that `<a>` carries `target="_blank"` and `rel="noopener noreferrer"`
And when it renders the handoff `<a>` whose `href` starts with `mailto:`
Then that `<a>` carries neither `target` nor `rel`
