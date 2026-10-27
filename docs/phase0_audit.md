# FrameLine Phase 0 Ingestion Audit

**Audit Date:** 2026-10-28  
**Scope:** `src/fetch.py`, `src/extract.py`, `data/rss_feeds.json`, `test_run.py`, `dignose.py`  
**SRD sections reviewed:** §5 (Technology Stack), §6 FR-2 & FR-3, §8 (Non-functional Requirements)

---

## 1. Function-by-Function Inventory

### `src/fetch.py`

#### `HEADERS` (module-level constant)

```python
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...Chrome/120..."}
```

| Item | Detail |
|---|---|
| Purpose | Provides a browser-impersonation User-Agent for all outbound HTTP requests |
| **Gap (FR-2)** | SRD §6 FR-2 requires a *descriptive* User-Agent identifying the project. A spoofed Chrome UA is not descriptive and may violate some publishers' ToS. Should be replaced with something like `FrameLine/1.0 (research prototype; …)`. |

---

#### `fetch_from_feed(feed_url, limit=10)`

| Aspect | Detail |
|---|---|
| **Purpose** | Fetch a single RSS feed URL, parse with feedparser, return up to `limit` normalised entry dicts |
| **Returns** | `list[dict]` — each dict has keys: `title`, `url`, `published`, `summary`, `source` |
| **Timeout** | `requests.get(…, timeout=15)` — 15 s connect+read timeout ✅ FR-2 |
| **HTTP error handling** | `response.raise_for_status()` — raises on 4xx/5xx, caught by broad `except Exception` ✅ |
| **Per-feed isolation** | Errors return `[]` — feed failure does not propagate ✅ FR-2 |
| **Feedparser bozo** | Checked: if `feed.bozo AND no entries`, logs and returns `[]` ✅ |
| **`published` field** | Returns `entry.get("published", "")` — raw feedparser string, **not parsed to datetime** ⚠️ |
| **`source` field** | Uses `feed.feed.get("title", feed_url)` — feed-channel title, not the config-provided publisher name ⚠️ |
| **Missing fields** | No `publisher` (config name), no `source_country`, no `retrieved_at`, no `extraction_status`, no `language` — all required by SRD §7 data contract |
| **Deduplication** | None — SRD FR-2 requires dedup by canonical URL ⚠️ |

**Bugs / gaps identified:**
1. **Date field not parsed** — `published` is a raw RFC-2822 string. Downstream code that tries to sort or compare dates will silently get wrong results or crash. `feedparser` already provides `published_parsed` (a `time.struct_time`); using it would be safer.
2. **`source` ignores config name** — the feed-channel title may differ from the configured publisher name used in the UI.
3. **No `retrieved_at`** — required by SRD §7.
4. **No `extraction_status`** — required by SRD §7 and FR-3.

---

#### `fetch_all_feeds(feeds_dict, limit_per_feed=5)`

| Aspect | Detail |
|---|---|
| **Purpose** | Iterate over a `{country: [urls]}` dict, call `fetch_from_feed` for each URL, accumulate per-country article lists |
| **Returns** | `dict[str, list[dict]]` — country → articles |
| **Per-feed isolation** | Inner `fetch_from_feed` already returns `[]` on failure; `fetch_all_feeds` continues ✅ |
| **Status recording** | Only prints; no status dict returned ⚠️ — SRD FR-2: "Continue when an individual feed fails and **record its status**" |
| **Deduplication** | None across URLs in same country ⚠️ |

---

### `src/extract.py`

#### `extract_article(url)`

| Aspect | Detail |
|---|---|
| **Purpose** | Download a full article page via trafilatura, extract body text and metadata |
| **Returns** | `dict` with keys: `url`, `title`, `author`, `date`, `text`, `error` |
| **`error` key** | Always present (None on success, string on failure) ✅ — caller can always check |
| **Download failure** | Returns `{"error": "download_failed", …}` ✅ |
| **Extraction failure** | Returns `{"error": "extraction_failed", …}` ✅ |
| **Unknown exceptions** | Caught by outer `try/except`, returns `{"error": str(e), …}` ✅ |
| **Timeout** | `trafilatura.fetch_url` uses its own internal timeout (default ~10 s) — not explicitly set ⚠️ |
| **`extraction_status` label** | **Absent** — the function returns an `error` field but does not return a standardised `extraction_status` string (`"successful"` / `"partial"` / `"unavailable"`) as required by FR-3 and SRD §7 ⚠️ |
| **`publisher` / `source_country`** | Not in returned dict — must be injected by caller ⚠️ |
| **`retrieved_at`** | Not in returned dict ⚠️ |
| **Paywall handling** | Graceful — no bypass attempted ✅ FR-3 |
| **No new dependencies** | Only trafilatura ✅ |

**Bugs / gaps:**
1. **No `extraction_status` label** — the SRD and FR-3 require `"successful"`, `"partial"`, or `"unavailable"`. The current `error: None/str` is sufficient to derive this but is not explicitly labelled.
2. **Trafilatura timeout not configured** — on a slow or hanging server, `fetch_url` can block beyond 15 s.
3. **`metadata.title` access without fallback attribute check** — if `trafilatura.extract_metadata` returns an object without `.title` (e.g. an older trafilatura version), this raises `AttributeError`. Guarded only by the outer `except Exception`, which is acceptable but could mask the real shape of partial results.

---

### `data/rss_feeds.json` — Feed configuration

| Region | URL | Notes |
|---|---|---|
| USA | `http://rss.cnn.com/rss/edition_world.rss` | HTTP (not HTTPS) — may redirect or be blocked |
| USA | `http://feeds.foxnews.com/foxnews/world` | HTTP — Fox News RSS historically unreliable |
| China | `http://www.xinhuanet.com/english/rss.xml` | HTTP — Xinhua RSS is commonly dead/blocked from non-CN IPs |
| Russia | `https://tass.com/rss/v2.xml` | HTTPS — verify; TASS intermittently blocks foreign IPs |
| UK | `http://feeds.bbci.co.uk/news/world/rss.xml` | HTTP — BBC redirects to HTTPS; feedparser handles redirects |
| India | `https://www.thehindu.com/news/feeder/default.rss` | HTTPS — generally reliable |
| Middle East | `https://www.aljazeera.com/xml/rss/all.xml` | HTTPS — generally reliable |

**Config-level gaps:**
- No `disabled` flag / `reason` field — dead feeds cannot be annotated in-place.
- No `publisher_name` field separate from country key — used as display name in SRD.
- No `language` field — required by SRD §7 data contract.
- All HTTP URLs should be upgraded to HTTPS equivalents where available.

---

### `test_run.py` (debug script)

| Aspect | Detail |
|---|---|
| **Purpose** | Quick smoke test: fetch 3 feeds (BBC, NYT, AJ), extract first article per feed |
| **Feed set** | Hardcoded; does not use `data/rss_feeds.json` ⚠️ |
| **NYT feed** | `https://rss.nytimes.com/services/xml/rss/nyt/World.xml` — NYT RSS typically requires a registered account; likely returns 0 entries or HTTP 4xx |
| **BBC URL** | `http://` not `https://` — same as config |
| **Error reporting** | Prints full `extracted` dict for debugging ✅ |
| **Crash safety** | No top-level try/except — a crash in `fetch_all_feeds` would abort the whole script ⚠️ |

---

### `dignose.py` (debug script)

| Aspect | Detail |
|---|---|
| **Purpose** | Single-feed diagnostic: fetch BBC world RSS via feedparser directly (no requests), print diagnostics |
| **Note** | Uses `feedparser.parse(url)` directly — **bypasses the HEADERS/User-Agent** set in `src/fetch.py` ⚠️ |
| **Error handling** | Top-level `try/except` with traceback ✅ |
| **Bozo** | Checked and printed ✅ |

---

## 2. SRD Requirements Compliance Matrix

| Requirement | Status | Notes |
|---|---|---|
| **FR-2** Timeouts | ✅ Partial | `fetch_from_feed` has 15s timeout; `trafilatura.fetch_url` uses internal default |
| **FR-2** Descriptive User-Agent | ❌ Gap | Current UA is a spoofed Chrome string, not project-identifying |
| **FR-2** Per-feed error handling | ✅ | Errors return `[]`; run continues |
| **FR-2** Status recording | ⚠️ Gap | Printed to stdout only; not returned or persisted |
| **FR-2** Deduplication | ❌ Missing | Not implemented |
| **FR-2** Partial results | ✅ | `fetch_all_feeds` always returns what succeeded |
| **FR-3** Trafilatura extraction | ✅ | Implemented |
| **FR-3** `extraction_status` labels | ❌ Missing | `error` field present but status string absent |
| **FR-3** Graceful paywall/failure | ✅ | Returns error dict without raising |
| **FR-3** No bypass of access controls | ✅ | No bypass attempted |
| **§7** `retrieved_at` field | ❌ Missing | Not added by fetch or extract |
| **§7** `source_country` field | ❌ Missing | Not propagated from config |
| **§7** `extraction_status` field | ❌ Missing | See FR-3 above |
| **§7** `language` field | ❌ Missing | Not detected or configured |
| **§8** Feed failure does not crash | ✅ | Confirmed |
| **§8** Module separation | ✅ | fetch/extract are separate modules |

---

## 3. Gaps and Suspected Bugs (Priority Order)

### Blockers (fixed in Phase 0)

| # | Issue | File | Fix |
|---|---|---|---|
| B1 | User-Agent is a spoofed browser string, not descriptive | `src/fetch.py` | Replace with `FrameLine/1.0 (…)` UA |
| B2 | `dignose.py` bypasses HEADERS entirely (feedparser direct parse) | `dignose.py` | Use `requests` + `HEADERS` then pass bytes to feedparser |
| B3 | Dead feeds (Xinhua HTTP, likely Fox HTTP) block the run for 15 s each with no payoff | `data/rss_feeds.json` | Disable with reason field after confirming |
| B4 | `test_run.py` has no top-level error handling — one crash stops the script | `test_run.py` | Wrap in try/except |

### Non-blockers (left for later phases)

| # | Issue | File | Recommendation |
|---|---|---|---|
| N1 | `published` returned as raw string; `published_parsed` not used | `src/fetch.py` | Use `published_parsed` → ISO-8601 string |
| N2 | No `extraction_status` label on extract result | `src/extract.py` | Add `"successful"/"partial"/"unavailable"` |
| N3 | No `retrieved_at` timestamp | `src/fetch.py`, `src/extract.py` | Add `datetime.utcnow().isoformat()` |
| N4 | No deduplication by URL | `src/fetch.py` | Deduplicate in `fetch_all_feeds` |
| N5 | No `source_country` / `publisher` propagation | `src/fetch.py` | Accept from caller and inject |
| N6 | `trafilatura.fetch_url` timeout not configurable | `src/extract.py` | Pass `config` object with timeout |
| N7 | Feed config has no `disabled`, `language`, or `publisher_name` fields | `data/rss_feeds.json` | Extend schema |
| N8 | `src/config.py` is empty | `src/config.py` | Move feed config loading here |
| N9 | `test_run.py` uses hardcoded feeds, not `rss_feeds.json` | `test_run.py` | Point to canonical config |

---

## 4. Status Label Definition (FR-3)

The following rule is used throughout Phase 0 to classify article extraction:

| Status | Rule |
|---|---|
| `successful` | `error` is `None` AND `len(text) >= 200` characters |
| `partial` | `error` is `None` AND `0 < len(text) < 200` characters |
| `unavailable` | `error` is non-null OR `text` is empty/None |

Threshold of **200 characters** chosen as the minimum meaningful article body (roughly 2–3 sentences). This is documented here and in the smoke test.

---

## 5. What Phase 0 Fixed

All four blockers resolved. One additional blocker (N6 trafilatura timeout) was promoted and fixed.

| Fix | File | Detail |
|---|---|---|
| **B1** User-Agent | `src/fetch.py` | Replaced Chrome spoof with `FrameLine/1.0 (academic news-framing research prototype; https://github.com/Sanidhya-06/FrameLine) python-requests/2.x feedparser/6.x` |
| **B2** `dignose.py` bypass | `dignose.py` | Now uses `requests.get(url, headers=HEADERS, timeout=15)` then passes `.content` to `feedparser.parse()` |
| **B3** Dead feeds | `data/rss_feeds.json` | Migrated to structured format `{url, publisher, language, enabled, disabled_reason}`. Fox News (`timeout`) and Xinhua (`HTTP 404`) disabled with reasons. `fetch_all_feeds` updated to honour the `enabled` flag while remaining backward-compatible with the old plain-string format. |
| **B4** `test_run.py` crash | `test_run.py` | `fetch_all_feeds` and `extract_article` calls wrapped in `try/except`; now uses canonical `data/rss_feeds.json` instead of hardcoded URLs. |
| **N6 (promoted)** Trafilatura hang | `src/extract.py` | `trafilatura.fetch_url` has no configurable timeout in older versions and blocks indefinitely. Replaced with `requests.get(url, timeout=12)` + pass HTML to `trafilatura.extract()`. Also added `extraction_status` label (`successful`/`partial`/`unavailable`) per FR-3. |
| **Filename bug** | `scripts/phase0_extract.py` | URL query strings (`?at_medium=RSS`) produced Windows-invalid filenames (`OSError: [Errno 22]`). Fixed using `urllib.parse.urlparse` to strip query/fragment and `re.sub` to remove all invalid chars before building fixture paths. |

## 6. Feed Report (docs/feed_report.csv)

| Region | Publisher | Status | Entries | Title% | URL% | Summary% | Date% | Time(s) |
|---|---|---|---|---|---|---|---|---|
| USA | CNN | ✅ 200 | 29 | 100% | 100% | 69% | 79% | 1.66 |
| USA | Fox News | ❌ timeout | 0 | — | — | — | — | 15.07 |
| China | Xinhua | ❌ 404 | 0 | — | — | — | — | 0.56 |
| Russia | TASS | ✅ 200 | 100 | 100% | 100% | 100% | 100% | 1.88 |
| UK | BBC News | ✅ 200 | 23 | 100% | 100% | 100% | 100% | 0.80 |
| India | The Hindu | ✅ 200 | 60 | 100% | 100% | 65% | 100% | 0.69 |
| Middle East | Al Jazeera | ✅ 200 | 25 | 100% | 100% | 100% | 100% | 0.72 |

**Working: 5/7 feeds (5 regions).** Fox News disabled (timeout). Xinhua disabled (HTTP 404).

Note: TASS returned 100 entries initially but 0 on re-fetch — intermittent (likely rate-limiting or geo-filtering by session). Marked unreliable.

## 7. Extraction Report (docs/extraction_report.csv)

21 articles sampled across 5 working regions.

| Publisher | Successful | Partial | Unavailable | Notes |
|---|---|---|---|---|
| India (The Hindu) | 5/5 | 0 | 0 | Excellent — all metadata present |
| Middle East (Al Jazeera) | 5/5 | 0 | 0 | Excellent — all metadata present |
| UK (BBC) | 1/5 | 0 | 4 | BBC blocks FrameLine UA (`connection_error`/`timeout`) |
| USA (CNN) | 1/5 | 0 | 4 | CNN blocks non-browser UAs; one live-blog URL succeeded |
| Russia (TASS) | 0/1 | 0 | 1 | Feed returned 0 entries on re-fetch; no articles to sample |

**Overall: 12/21 successful (57%), 0 partial, 9 unavailable (43%).**

The 9 unavailable articles are all due to publisher-side blocking (CNN/BBC reject the FrameLine UA) or feed instability (TASS). This is expected and compliant with SRD FR-3: "Handle paywalls, blocked sites … gracefully. Do not bypass access controls."

## 8. What Was Left Unfixed (deferred to later phases)

| # | Issue | Reason for deferral |
|---|---|---|
| N1 | `published` returned as raw RFC-2822 string | Requires downstream schema change |
| N2 | No `retrieved_at` timestamp | Requires data contract change |
| N3 | No `source_country` / `publisher` propagation in `fetch_from_feed` return | Requires caller refactor |
| N4 | No URL deduplication across feeds | No duplicates observed in Phase 0; low priority |
| N5 | `src/config.py` is empty | Deferred — feed loading config belongs in later backend integration |
| N6 | BBC/CNN block FrameLine UA | Cannot be fixed without bypassing access controls (SRD forbids it) |
