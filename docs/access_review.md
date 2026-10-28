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
