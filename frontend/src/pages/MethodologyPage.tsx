import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, Languages, ShieldAlert } from 'lucide-react';

const HELSINKI_CARDS = [
  ['OPUS-MT · German', 'Apache-2.0', 'https://huggingface.co/Helsinki-NLP/opus-mt-de-en'],
  ['OPUS-MT · French', 'Apache-2.0', 'https://huggingface.co/Helsinki-NLP/opus-mt-fr-en'],
  ['OPUS-MT · Spanish', 'Apache-2.0', 'https://huggingface.co/Helsinki-NLP/opus-mt-es-en'],
  ['OPUS-MT · Russian', 'CC-BY-4.0', 'https://huggingface.co/Helsinki-NLP/opus-mt-ru-en'],
  ['OPUS-MT · Hindi', 'Apache-2.0', 'https://huggingface.co/Helsinki-NLP/opus-mt-hi-en'],
  ['OPUS-MT · Italian', 'Apache-2.0', 'https://huggingface.co/Helsinki-NLP/opus-mt-it-en'],
  ['OPUS-MT · Portuguese / Romance', 'Apache-2.0', 'https://huggingface.co/Helsinki-NLP/opus-mt-ROMANCE-en'],
];

export function MethodologyPage() {
  return <main className="methodology-shell">
    <header className="coverage-topbar"><Link className="coverage-brand" to="/"><span><BookOpen size={16}/></span>FRAME<span>LINE</span></Link><div className="coverage-breadcrumb"><span>FIELD 04</span><i/> METHODS & LIMITATIONS</div><Link className="new-search" to="/map"><ArrowLeft size={14}/> Back to coverage</Link></header>
    <section className="methodology-hero"><div className="coverage-kicker"><i/> TRANSPARENT BY DESIGN <i/></div><h1>How the coverage is <em>prepared.</em></h1><p>Translation supports reading across languages. Originals remain intact and linked to their publishers.</p></section>
    <div className="methodology-grid">
      <section className="method-card method-overview"><div className="method-icon"><Languages size={17}/></div><span className="section-label">MACHINE TRANSLATION</span><h2>Per-language model routing</h2><p>FrameLine translates article titles and RSS summaries into English for display. It preserves each original title and summary. Translation is not used as evidence that a source supports or opposes a position.</p><div className="routing-list"><div><strong>Hindi · Russian · Italian</strong><span>NLLB-200-distilled-600M · selected after sample quality review</span></div><div><strong>Other languages with OPUS-MT</strong><span>Helsinki-NLP OPUS-MT</span></div><div><strong>No Helsinki model available</strong><span>NLLB fallback</span></div></div></section>
      <section className="method-card method-license"><div className="method-icon"><ShieldAlert size={17}/></div><span className="section-label">LICENSES & USE</span><h2>Review model terms before deployment</h2><p>Licenses apply to the individual model checkpoint. Check the model card for current terms and attribution details.</p><div className="license-callout"><strong>NLLB · CC-BY-NC-4.0</strong><span>The model card describes NLLB as research-use and says it is not released for production deployment.</span><a href="https://huggingface.co/facebook/nllb-200-distilled-600M" target="_blank" rel="noreferrer">NLLB model card <ArrowUpRight size={13}/></a></div><div className="license-callout"><strong>Helsinki-NLP · per-model licenses</strong><span>Most configured OPUS-MT models list Apache-2.0; the Russian-to-English model lists CC-BY-4.0.</span></div></section>
      <section className="method-card method-models"><span className="section-label">CONFIGURED OPUS-MT MODEL CARDS</span><div className="model-link-list">{HELSINKI_CARDS.map(([name, license, href]) => <a key={href} href={href} target="_blank" rel="noreferrer"><span>{name}<small>{license}</small></span><ArrowUpRight size={13}/></a>)}</div></section>
      <section className="method-card method-limits"><span className="section-label">LIMITATIONS & FAILURE HANDLING</span><ul><li>Translations can change nuance, omit context, or mistranslate names and military or political terms.</li><li>RSS titles and summaries are short and may be malformed or encoding-corrupted. Translation quality has not been independently scored against human references.</li><li>FrameLine shows the original text alongside any machine translation. If a model fails, the alternate available backend is tried; if both fail, the original remains and the UI marks translation unavailable.</li><li>Translated titles link to the original publisher article. They are reading aids, not a substitute for the source.</li></ul></section>
    </div>
    <footer className="coverage-footer"><span>FRAMELINE / METHODS & LIMITATIONS</span><Link to="/">NEW QUERY <ArrowLeft size={12}/></Link></footer>
  </main>;
}
