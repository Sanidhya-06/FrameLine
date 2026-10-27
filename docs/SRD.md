# FrameLine — Software Requirements Specification
**Final Working Prototype | Version 2.0**

**Product:** Cross-source news framing exploration platform  
**Frontend:** React 18 + TypeScript + Vite  
**Backend:** Python + FastAPI  
**Data:** Real RSS feeds and real article retrieval  
**Primary visual reference:** The four user-provided FrameLine reference images

## 1. Purpose

This SRD defines the final working FrameLine prototype. FrameLine lets users search for a news event, retrieve real coverage from configured publishers, explore coverage geographically, inspect article evidence, and compare how sources frame the event.

The interface must closely reproduce the visual direction and composition of the four supplied reference images. These images are the primary design authority. Do not replace their style with a generic SaaS dashboard or a conventional news website.

## 2. Scope

### Included in the final prototype
- React frontend with responsive layouts and animated transitions.
- Real RSS feed retrieval from configurable publishers and source regions.
- Topic relevance filtering over retrieved RSS entries.
- Article metadata and full-text extraction where accessible.
- Interactive world map based on real retrieved coverage.
- Country/source coverage panels with real article records.
- Side-by-side comparison of two selected country/source groups.
- Three primary NLP signals: semantic framing deviation, target-specific stance, and sentiment.
- Two additional exploratory signals: entity/descriptor analysis and verb-charge analysis, when implemented and available.
- Methodology and limitations view.
- Loading, partial-results, no-results, and error states.
- SQLite cache with configurable TTL.
- Clearly disclosed unavailable signals; no fabricated live results.

### Excluded
- A composite bias score or “bias percentage”.
- Claims that a publisher represents the whole country or its population.
- Automated fact-checking or determining which side is correct.
- User accounts and authentication.
- Guaranteed real-time breaking-news coverage.
- A long-range historical archive. Time Rewind remains “Coming Soon” unless a dependable historical source is integrated.
- Paid API dependencies.
- Human-labeling workflow or model training as a requirement for the working prototype.

## 3. Required visual design: reference images are authoritative

The user supplied four reference images. Implement the following sequence and visual language, matching their layout, atmosphere, color balance, density, and overall composition as closely as possible.

### Screen A — Search / entry experience (reference images 1 and 2)
- Use a dark, immersive, retro-futuristic intelligence-room atmosphere.
- Layered monitor/news panels and subtle technical details frame a central search experience.
- Use deep navy/charcoal, cyan/electric blue, and restrained magenta accents.
- Include the FrameLine wordmark, a clear “How is the world framing this story?” headline, a topic search field, and clickable example queries.
- Add subtle ambient movement, depth, and restrained glow.
- Keep text and controls crisp and readable. Do not turn the design into pixel-art, a game UI, or a generic dashboard.
- Match the references' composition rather than merely borrowing their colors.

### Screen B — News collection (reference image 3)
- Show a cinematic collection animation with floating/translucent news windows or cards being selected and gathered.
- Include source labels, small data fragments, motion paths, a central focal point, and a clear current stage.
- Use Framer Motion for staggered movement, scale, opacity, and depth.
- Stages should reflect real backend progress where available, such as “Connecting to feeds”, “Retrieving headlines”, “Checking topic relevance”, “Extracting article text”, and “Preparing coverage map”.
- Do not fake live progress. If the backend cannot report detailed progress, label the animation as a visual transition and show truthful status text.
- Respect reduced-motion settings and avoid unnecessary waiting.

### Screen C — Interactive global map (reference image 4)
- Make the world map the main visual centerpiece.
- Render real geographic boundaries with `react-simple-maps`; do not use a static image as the map.
- Use a dark background, fine cyan borders, glowing/bright coverage regions, restrained network details, and a clear selected-country state.
- Only highlight countries/regions for which the current query has actual retrieved coverage.
- Provide a compact legend, country hover tooltip, zoom/reset controls, and an accessible country list alternative.
- Do not use map colors to assert support/opposition unless a target-specific stance result is available and its meaning is clearly explained.
- Keep map, controls, typography, and surrounding panels faithful to the reference image’s balance and visual density.

### Visual acceptance rule
The four references are not loose inspiration. They are the target visual direction. Before finishing, compare each implemented screen against its corresponding reference and adjust composition, spacing, contrast, panel density, typography, and motion. Avoid substituting a generic template. If exact pixel matching is impossible because the references are screenshots, reproduce their key layout and visual hierarchy as closely as practical.

## 4. User journey and routes

1. User enters a topic or selects an example.
2. Frontend validates the query and navigates to the collection screen.
3. Backend retrieves actual RSS entries and filters them for topic relevance.
4. Article extraction and available analysis run.
5. Results page displays real coverage on the world map.
6. Selecting a country/source group opens its article and signal panel.
7. User can select a second group for side-by-side comparison.
8. User can start a new search or open methodology.

Routes:
- `/` — search entry.
- `/loading` — collection/transition screen.
- `/map` — results map.
- `/country/:code` — country/source details.
- `/compare` — compare two selections.
- `/methodology` — methods, sources, and limitations.

Time Rewind may be visible as “Coming Soon”; it must not imply historical data exists when it does not.

## 5. Technology stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | UI and client behavior |
| Routing | React Router v6 | Screen navigation |
| Styling | Tailwind CSS | Consistent responsive styles |
| Animation | Framer Motion | Search and collection transitions |
| Map | react-simple-maps | Interactive geographic display |
| Charts | Recharts, only where useful | Small signal summaries |
| State | Zustand or React Context | Query, results, selected/compared countries |
| API | Python + FastAPI | Query orchestration and response schemas |
| RSS | requests + feedparser | Real feed retrieval |
| Extraction | trafilatura | Article text and metadata |
| NLP | Hugging Face Transformers, sentence-transformers, spaCy and documented rules | Independent analysis signals |
| Cache | SQLite | Reusable results with configurable TTL |

Preserve and reuse existing working ingestion code, including `src/fetch.py` and `src/extract.py`, after inspecting it. Do not create a duplicate app or delete useful existing files without a reason.

## 6. Functional requirements

### FR-1: Topic search
- Accept a user-entered topic/event and example queries.
- Support Enter and button submission.
- Reject blank input.
- Preserve the query through loading, map, country details, and comparison.
- Clearly report when no relevant articles are found.

### FR-2: Real RSS retrieval
- Load configured feeds with source name and source country/region metadata.
- Retrieve current entries from real feeds, using timeouts and a descriptive User-Agent.
- Filter retrieved entries by query relevance because many RSS feeds do not provide arbitrary topic search.
- Deduplicate entries by canonical URL and, where useful, normalized title.
- Continue when an individual feed fails and record its status.
- Return partial results if only some feeds succeed.
- Distinguish source country/region from article stance or national public opinion.

### FR-3: Article extraction
- Attempt full-text extraction using Trafilatura for accessible article URLs.
- Preserve title, publisher, URL, publication date, RSS summary, and retrieval metadata.
- Handle paywalls, blocked sites, short text, JavaScript-only pages, and network failures gracefully.
- Keep an article card available when full text fails, if RSS metadata exists.
- Clearly label full-text extraction as successful, partial, or unavailable.
- Do not bypass access controls.

### FR-4: Reference-summary generation
- Generate a reference summary from relevant retrieved articles only if the selected summarization model is available.
- The initially planned candidate is `google/flan-t5-base`.
- Record the method and number of source articles used.
- Call it a “reference summary” or “baseline”, not a guaranteed neutral truth.
- If generation fails, explain that semantic deviation is unavailable or use a documented fallback without implying neutrality.

### FR-5: Semantic framing deviation
- Use `sentence-transformers/all-MiniLM-L6-v2` or a documented compatible embedding model to compare article text with the reference summary.
- Expose the raw similarity/distance method and, if normalized for display, explain the normalization.
- Do not call the value a bias percentage.
- Explain that semantic difference can reflect topic emphasis, article length, or additional facts, not necessarily bias.
- If no valid baseline or article text exists, mark the signal unavailable.

### FR-6: Target-specific stance
- Use a suitable Hugging Face stance/NLI model or documented classification method.
- Define the target explicitly for every stance result, for example “stance toward the proposed sanctions”.
- Return supported labels and confidence only when the model provides interpretable scores.
- Do not interpret stance toward a policy as stance toward a whole country.
- If a suitable model is not available or the target is ambiguous, return “Unavailable” or “Uncertain”, not an invented label.

### FR-7: Sentiment
- Use a suitable Hugging Face sentiment classifier, such as a compatible RoBERTa-based model.
- Return positive, neutral, or negative tone where supported, with confidence if available.
- State that sentiment is emotional tone, not political stance or bias.
- Handle long texts using a documented chunking/aggregation method or analyze a clearly identified excerpt.

### FR-8: Entity and descriptor analysis
- Use spaCy or a suitable NER pipeline to identify people, organizations, places, and countries.
- Extract descriptors and nearby language only where the implementation can support it.
- Display examples from the article text so users can inspect the evidence.
- Do not claim that extracted descriptors are unfair or false solely because they are emotionally charged.

### FR-9: Verb-charge analysis
- Use a documented lexicon or method to identify potentially charged verbs and calculate an exploratory ratio.
- Display the detected verbs and context.
- Document the lexicon, denominator, and known limitations.
- Mark the signal unavailable if the required parser/lexicon is missing.
- Do not present the ratio as a validated bias measure.

### FR-10: Country/source aggregation
- Group articles using configured publisher/source country metadata.
- Display article count, source names, publication dates, and article records.
- Aggregate independent signal summaries only when the sample size and method are disclosed.
- Do not equate the source country with the article’s political position or the opinions of its residents.
- Show “insufficient coverage” when data is too sparse for meaningful aggregation.

### FR-11: Interactive map
- Render an actual geographic map.
- Highlight only countries with real retrieved coverage for the current query.
- Show a tooltip with country/source name and actual article count.
- Clicking a country updates the detail panel and route.
- Include zoom/reset controls, legend, keyboard-accessible alternatives, and empty states.
- Do not display pre-filled mock results in normal operation.

### FR-12: Country details
- Display country/source group, article count, source list, and real article cards.
- Article cards include title, publisher, date when available, RSS summary or extracted snippet, extraction status, and original URL.
- Display available independent signals, their evidence, method, and limitations.
- Mark unavailable signals explicitly.
- Include the disclaimer: results describe the sources analyzed, not the country as a whole.

### FR-13: Comparison
- Allow selection of two countries/source groups with real retrieved coverage.
- Display article evidence and available signals side by side.
- Show sample counts and missing-data notices.
- Do not declare a winner, infer truth, or imply that one source’s framing is automatically correct.

### FR-14: Methodology and transparency
- Provide a methodology screen reachable from the main UI.
- Explain retrieval sources, query filtering, extraction status, model names/versions, signal definitions, baseline provenance, and limitations.
- Disclose translation if added.
- Clearly distinguish real retrieved data from any development-only fixtures.
- No composite bias/framing score in this prototype.

### FR-15: Loading and errors
- Display truthful retrieval/processing status where possible.
- Continue after individual feed failures.
- Show partial-results, no-results, model-unavailable, extraction-failure, and service-error states.
- Allow retry and new search.
- Use motion as visual communication, not as a substitute for status reporting.

### FR-16: API and cache
- `POST /analyze`: accepts a query and returns query status, articles, country coverage, available signals, and methodology version.
- `GET /methodology`: returns methodology information.
- `GET /health`: returns service status.
- Use typed request/response schemas.
- SQLite cache may use a configurable TTL (default 24 hours); cache keys should account for normalized query and methodology/config version.
- Return useful error codes and avoid leaking secrets.
- The frontend shall communicate with FastAPI; it must not fetch RSS feeds directly.

## 7. Data contract

Each article should include, where available:
- `article_id`, `title`, `url`, `publisher`, `source_country`, `published_at`
- `rss_summary`, `article_text` or excerpt
- `retrieved_at`, `extraction_status`, `language`, `translation_status`

Each signal should include:
- `signal_name`, `status`, `value` or label
- `method`, `confidence` when supported
- `target` for stance
- `evidence` and `limitations`

Each country/source group should include:
- `country_code` or group identifier, `display_name`
- `article_count`, `sources`, `coverage_status`, `articles`
- available aggregate signals and limitations

Do not fabricate values when data or a model output is missing.

## 8. Non-functional requirements
- Responsive desktop/tablet/mobile layout.
- Keyboard-accessible controls, visible focus, readable contrast, reduced-motion support.
- Feed and extraction failures must not crash the full query.
- Keep frontend, ingestion, extraction, analysis, aggregation, API, and cache modules separate.
- Document setup, environment variables, model downloads, and run commands.
- Pin compatible dependencies after testing.
- Prefer free/open-source tools; document CPU/RAM expectations and hosting constraints.
- Respect publisher access controls and terms; link to original reporting and do not present scraped text as original FrameLine reporting.

## 9. Acceptance criteria

The prototype is accepted when:
1. React frontend and FastAPI backend run with documented commands.
2. A user can submit a real topic query.
3. Configured RSS feeds are contacted and their success/failure status is recorded.
4. Returned headlines are filtered for topic relevance and deduplicated.
5. Accessible articles are extracted; inaccessible articles remain visible with an accurate status when metadata exists.
6. The collection screen leads to results without inventing live progress.
7. The world map highlights only locations with real coverage in the current results.
8. Selecting a country opens actual article cards and source details.
9. Comparison uses the actual current result set.
10. Each displayed NLP signal is generated by its implemented method and includes a limitation note.
11. Failed/unimplemented signals are marked unavailable.
12. No composite bias score or bias percentage is shown.
13. Methodology is accessible.
14. Empty, partial, invalid, and error states are handled.
15. The four reference images have been used to review and refine the screen layouts; the UI is not a generic dashboard.
16. Existing useful ingestion code is preserved and reused where appropriate.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| RSS feeds break or rate-limit | Timeouts, per-feed status, configurable alternatives, partial results |
| Topic is not in recent RSS entries | Explain RSS-window limitation and show no-results state; do not imply exhaustive search |
| Full text is blocked | Retain RSS metadata/snippet and label extraction status |
| Translation changes nuance | Preserve original text and disclose translation |
| Baseline is not neutral | Call it a reference summary and record provenance |
| Semantic deviation is mistaken for bias | Explain its interpretation and limitations |
| Stance model is target-mismatched | Require explicit target and allow uncertain/unavailable output |
| Source country is mistaken for public opinion | Attribute findings to named sources |
| Models are too heavy for deployment | Lazy-load, document resource needs, choose compatible smaller models if necessary |
| Historical data is unavailable | Keep Time Rewind as Coming Soon |

## 11. Future phases

**Validation phase:** Optional research milestone to assess individual signals against independent human judgments. It is not required for the application to retrieve news and display exploratory model outputs.

**Composite score:** Not part of this prototype. Consider only after a defensible validation process; do not ship if validation is inadequate.

**Time Rewind:** Add only when a reliable historical archive is available.

## 12. Final definition

FrameLine is a working prototype when users can search a topic and see real RSS-derived coverage, inspect available article text, explore coverage on a world map, compare source groups, and view clearly qualified independent NLP signals. The interface must closely follow the four provided reference images. The product must communicate uncertainty honestly and must never invent news, analysis results, or coverage.
