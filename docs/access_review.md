# RSS Article Access Review

**Checked:** 2026-10-28  
**Test location:** India-based network egress  

`fulltext_allowed` is true only when the sampled article path was allowed by
`robots.txt` and the publisher terms review did not prohibit the limited
automated extraction. A feed can remain enabled for RSS metadata while
`fulltext_allowed` is false.

| Publisher | Article-path robots result | Terms URL | fulltext_allowed | Reason |
|---|---|---|---|---|
| CNN | Article request was intermittent; permission not confirmed | https://www.cnn.com/terms | false | Article access was blocked/intermittent and terms permission was not confirmed. |
| Fox News | Allowed in the probe; feed host had no restrictive robots file | https://www.foxnews.com/terms-of-use | false | Earlier timeout and terms permission for automated article extraction were not confirmed. |
| NPR | Allowed for the sampled article | https://www.npr.org/about-npr/179876898/terms-of-use | false | Terms restrict scraping or republishing content; RSS metadata only. |
| The New York Times | Allowed for the sampled article | https://www.nytimes.com/content/help/rights/terms/terms-of-service.html | false | Terms restrict automated access to content; RSS metadata only. |
| Xinhua | Not applicable; feed endpoint returned HTTP 404 | Not located during review | false | Feed is disabled because the verified endpoint was unavailable. |
| CGTN | Allowed for the sampled path | https://www.cgtn.com/terms-of-use | false | Terms prohibit automated data gathering and extraction; feed-only. |
| Global Times | Allowed for the sampled article | Not located during review | false | No confirmed terms permission for automated extraction. |
| China Daily | Not applicable; feed endpoint returned HTTP 404 | Not located during review | false | Feed is disabled because the verified endpoint was unavailable. |
| China Daily China | Not applicable; feed endpoint returned HTTP 404 | Not located during review | false | Feed is disabled because the verified endpoint was unavailable. |
| TASS | Article access returned HTTP 403 | Not located during review | false | Access was denied in both verification rounds. |
| The Moscow Times | Allowed for the sampled article | https://www.themoscowtimes.com/terms | false | Terms page was unavailable during review; permission for automated extraction was not confirmed. |
| RT | Allowed for the sampled article | https://www.rt.com/terms-and-conditions/ | false | Terms page could not be confirmed for the tested host; permission was not confirmed. |
| RIA Novosti | Allowed for the sampled article | https://ria.ru/docs/about/copyright.html | false | Feed is disabled because the feed language is Russian and needs translation. |
| Vedomosti | Allowed for the sampled article | https://www.vedomosti.ru/about/terms | false | Feed is disabled because the feed language is Russian and needs translation. |
| Meduza | Allowed for the sampled article | https://meduza.io/en/pages/terms | false | Feed is disabled because the feed language is Russian and needs translation. |
| Interfax | Article access returned HTTP 403 | Not located during review | false | Access was denied in both verification rounds. |
| BBC News | Allowed for the sampled article paths | https://www.bbc.co.uk/usingthebbc/terms/ | true | Robots allowed the sampled article paths and the terms review found no prohibition for this limited extraction check. |
| The Guardian | Allowed for the sampled article | https://www.theguardian.com/help/terms-of-service | false | Article automation permission was not confirmed; RSS metadata only. |
| Sky News | Allowed for the sampled article path | Not located during review | false | Feed is disabled because both verified feeds had fewer than 10 entries. |
| Sky News Top | Allowed for the sampled article path | Not located during review | false | Feed is disabled because both verified feeds had fewer than 10 entries. |
| The Hindu | Allowed for the sampled article | https://www.thehindu.com/terms-and-conditions/ | false | Robots allowed the path, but terms permission for automated extraction was not confirmed. |
| The Indian Express | Allowed for the sampled article | https://indianexpress.com/terms-and-conditions/ | false | Robots allowed the path, but terms permission for automated extraction was not confirmed. |
| Al Jazeera | Allowed for the sampled article | https://www.aljazeera.com/terms-and-conditions/ | false | Robots allowed the path, but terms permission for automated extraction was not confirmed. |
| The Jerusalem Post | Allowed for the sampled article | Not located during review | false | Robots allowed the path, but terms permission for automated extraction was not confirmed. |
| The New Arab | Allowed for the sampled article | Not located during review | false | Robots allowed the path, but terms permission for automated extraction was not confirmed. |
| Middle East Eye | Allowed for the sampled article | https://www.middleeasteye.net/terms-and-conditions | false | Robots allowed the path, but terms permission for automated extraction was not confirmed. |

## Phase 6A additions (2026-10-29)

Candidates were fetched twice with the descriptive FrameLine user agent, with a
60-second interval between rounds. Article-path permission was not inferred from
RSS access. `fulltext_allowed` remains false for every addition because terms
permission for automated article extraction was not clearly confirmed in this
review. In several cases the publisher's robots endpoint returned 403; that is
recorded as unavailable evidence, not as permission. Feed metadata may still be
used under the RSS endpoint's observed availability; article extraction remains
off.

| Publisher | Article-path robots result | Terms / ownership evidence | fulltext_allowed | Reason |
|---|---|---|---|---|
| Deutsche Welle | robots.txt HTTP 200; path-level allowance not established here | https://www.dw.com/en/about-dw | false | Terms permission for automated extraction not confirmed. |
| France 24 | robots.txt HTTP 403 | https://www.francemediasmonde.com/en/ | false | Robots unavailable and terms permission not confirmed. |
| RFI | robots.txt HTTP 403 | https://www.francemediasmonde.com/en/ | false | Robots unavailable and terms permission not confirmed. |
| The Japan Times | robots.txt HTTP 403 | https://www.japantimes.co.jp/about-us/ | false | Robots unavailable and terms permission not confirmed. |
| Daily Sabah | robots.txt HTTP 200; path-level allowance not established here | https://www.dailysabah.com/about-us | false | Terms permission not confirmed. |
| Anadolu Agency | robots.txt HTTP 200; path-level allowance not established here | https://www.aa.com.tr/en/corporate/about-us (HTTP 200) | false | Ownership page verified; terms permission for automation not confirmed. |
| Daily Maverick | robots.txt HTTP 403 | https://www.dailymaverick.co.za/about/ | false | Robots unavailable and terms permission not confirmed. |
| Premium Times | robots.txt HTTP 200; path-level allowance not established here | https://www.premiumtimesng.com/ (HTTP 200) | false | Terms permission not confirmed. |
| Africanews | robots.txt HTTP 200; path-level allowance not established here | https://www.euronews.com/about | false | Ownership source; terms permission not confirmed. |
| ABC Australia | robots.txt HTTP 200; path-level allowance not established here | https://about.abc.net.au/ (HTTP 200) | false | Terms permission not confirmed. |
| SBS News | robots.txt HTTP 200; path-level allowance not established here | https://www.sbs.com.au/aboutus/ (HTTP 200) | false | Terms permission not confirmed. |
| RNZ | robots.txt HTTP 200; path-level allowance not established here | https://www.rnz.co.nz/about (HTTP 200) | false | Terms permission not confirmed. |
| CNA | robots.txt HTTP 200; path-level allowance not established here | https://www.channelnewsasia.com/about-us (HTTP 200) | false | Terms permission not confirmed. |
| RTÉ | robots.txt HTTP 200; path-level allowance not established here | https://about.rte.ie/ | false | Terms/ownership page request was blocked; permission not confirmed. |
| Agência Brasil | robots.txt HTTP 200; path-level allowance not established here | https://agenciabrasil.ebc.com.br/ | false | Terms permission not confirmed; homepage request timed out during verification. |
| tagesschau | robots.txt HTTP 200; path-level allowance not established here | https://www.tagesschau.de/unternehmen/ | false | Translation required; terms permission not confirmed. |
| ZEIT Online | robots.txt HTTP 200; path-level allowance not established here | https://www.zeit.de/impressum/index | false | Translation required; terms permission not confirmed. |
| Le Monde | robots.txt HTTP 200; path-level allowance not established here | https://www.lemonde.fr/en/about-us/ | false | Translation required; terms permission not confirmed. |
| franceinfo | robots.txt HTTP 200; path-level allowance not established here | https://www.francetelevisions.fr/ | false | Translation required; terms permission not confirmed. |
| El País | robots.txt HTTP 200; path-level allowance not established here | https://elpais.com/estaticos/aviso-legal/ | false | Translation required; terms permission not confirmed. |
| ANSA | robots.txt HTTP 200; path-level allowance not established here | https://www.ansa.it/english/about_us.html | false | Translation required; terms permission not confirmed. |
| Folha de S.Paulo | robots.txt HTTP 200; path-level allowance not established here | https://www1.folha.uol.com.br/internacional/en/about/ | false | Translation required; terms permission not confirmed. |
| Amar Ujala | robots.txt HTTP 200; path-level allowance not established here | https://www.amarujala.com/about-us | false | Hindi feed; translation required and terms permission not confirmed. |

The failed original candidates are recorded disabled in `data/rss_feeds.json`
with dated, exact verification outcomes: Euronews (200 with 50 entries, then
timeout), NHK World (404/404), Asahi English (404/404), Arab News (403/403), The
National (404/404), TRT World (404/404), CBC (timeout/timeout), Korea Herald
(200/200 but zero entries), El Universal (404/404), and Al Arabiya (403/403).
Official alternatives were also tested twice: Euronews World News and Korea
Herald National passed (200/200, 50 entries each); CBC Top Stories timed out
twice; Arab News World and Al Arabiya English RSS returned 403 twice. The two
passing alternatives are recorded disabled pending feed selection. The VOA URL
in the directory is malformed and was excluded from probing.

All `ownership_note` URLs retained in the config were requested and returned
HTTP 200 (including redirects). Notes whose pages remained blocked or returned
errors were removed. State/public ownership descriptions are factual: Anadolu
Agency is state-owned; Daily Sabah is published by Turkuvaz Media Group (private
ownership; no state ownership asserted); France 24 and RFI are part of the
publicly funded France Médias Monde; DW is a public broadcaster funded from the
German federal budget; CGTN is operated by state media group China Media Group;
RT is Russian state-funded; Global Times is owned by People's Daily.

Africanews is labelled `region_scope: "pan-African"`, stored in the clearly
labelled `Pan-African` bucket, and has no country ISO code. This keeps the source
out of country-level map groupings instead of assigning it to the Republic of
the Congo.
