import { createChatRouteHandler } from '@/server/chat-route';
import { createDefaultDeps } from '@/server/deps';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const POST = createChatRouteHandler(createDefaultDeps());

export { POST };
