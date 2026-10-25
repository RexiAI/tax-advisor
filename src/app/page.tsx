import { ChatScreen } from '@/components/ChatScreen';
import { readBounds } from '@/config/env';
import { getSharedCorpus } from '@/server/corpus-loader';

export default function Page() {
  const bounds = readBounds();
  const loaded = getSharedCorpus();
  const metadata = loaded.ok
    ? { taxYear: loaded.corpus.artifact.taxYear, generatedAt: loaded.corpus.artifact.generatedAt }
    : { taxYear: bounds.corpusTaxYear, generatedAt: '' };

  return <ChatScreen corpus={metadata} maxChars={bounds.maxMessageChars} />;
}
