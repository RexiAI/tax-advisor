import { ChatScreen } from '@/components/ChatScreen';
import { readBounds } from '@/config/env';
import { createCorpusLoader } from '@/server/corpus-loader';

const corpus = createCorpusLoader();

export default function Page() {
  const bounds = readBounds();
  const loaded = corpus();
  const metadata = loaded.ok
    ? { taxYear: loaded.corpus.artifact.taxYear, generatedAt: loaded.corpus.artifact.generatedAt }
    : { taxYear: bounds.corpusTaxYear, generatedAt: '' };

  return <ChatScreen corpus={metadata} maxChars={bounds.maxMessageChars} />;
}
