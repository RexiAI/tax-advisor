/**
 * Prompt assembly (Task 8).
 *
 * The system message is exactly `SYSTEM_POLICY` — user text cannot reach it by
 * construction, because the assembler only ever puts the constant there. The
 * user message and every retrieved passage go into the `user` role wrapped in
 * explicit delimiters, and untrusted content is preserved verbatim: the input
 * screen does not strip or rewrite instructions found inside it.
 */

import type { LlmMessage, LlmRequest } from '../llm/types';
import { SYSTEM_POLICY } from './system-policy';

export interface PassageForPrompt {
  readonly passageId: string;
  readonly text: string;
}

export interface AssembleInput {
  readonly message: string;
  readonly passages: readonly PassageForPrompt[];
}

const USER_MESSAGE_OPEN = '<<<USER_MESSAGE>>>';
const USER_MESSAGE_CLOSE = '<<<END USER_MESSAGE>>>';
const PASSAGE_CLOSE = '<<<END PASSAGE>>>';

function passageOpenTag(passageId: string): string {
  return `<<<PASSAGE id=${passageId}>>>>`;
}

function renderPassage(passage: PassageForPrompt): string {
  return `${passageOpenTag(passage.passageId)}\n${passage.text}\n${PASSAGE_CLOSE}`;
}

export function assembleRequest(input: AssembleInput): LlmRequest {
  const sections = [
    ...input.passages.map(renderPassage),
    `${USER_MESSAGE_OPEN}\n${input.message}\n${USER_MESSAGE_CLOSE}`,
  ];
  const messages: LlmMessage[] = [{ role: 'user', content: sections.join('\n\n') }];
  return { system: SYSTEM_POLICY, messages };
}
