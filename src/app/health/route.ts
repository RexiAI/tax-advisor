import { createHealthHandler } from '@/server/health-route';
import { createDefaultDeps } from '@/server/deps';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GET = createHealthHandler(createDefaultDeps());

export { GET };
