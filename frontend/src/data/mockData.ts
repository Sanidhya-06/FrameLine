// ============================================
// FRAMELINE MOCK DATA
// All data is SIMULATED. For demonstration only.
// ============================================

import type { CountryCoverage } from '../types';

export const MOCK_COVERAGE: Record<string, CountryCoverage> = {
  USA: {
    code: 'USA',
    code2: 'US',
    name: 'United States',
    articleCount: 48,
    sources: ['The New York Times', 'Washington Post', 'CNN', 'Fox News', 'NPR'],
    framingSummary:
      'US coverage emphasises economic impact and domestic political ramifications, often framing the issue through a partisan lens. National security concerns and bilateral trade deficits are recurring focal points.',
    stance: 'critical',
    sentiment: 'mixed',
    illustrativeFramingDeviation: 72,
    framingSignals: [
      { label: 'Economic focus', value: 85, color: 'cyan' },
      { label: 'Political framing', value: 78, color: 'blue' },
      { label: 'National interest', value: 64, color: 'magenta' },
    ],
    articles: [
      {
        id: 'us-1',
        headline: 'Trade Deficit Widens as Tariff Pressure Mounts on Key Partners',
        source: 'The New York Times',
        country: 'United States',
        date: 'Oct 22, 2026',
        summary:
          'American officials intensify rhetoric around trade imbalances as bilateral negotiations stall, with economists warning of supply-chain disruption across multiple sectors.',
      },
      {
        id: 'us-2',
        headline: 'Senate Hearings Examine Strategic Implications of Diplomatic Rift',
        source: 'Washington Post',
        country: 'United States',
        date: 'Oct 21, 2026',
        summary:
          'Bipartisan concern grows on Capitol Hill as defence analysts testify about long-term geopolitical consequences of the ongoing dispute.',
      },
      {
        id: 'us-3',
        headline: 'American Businesses Caught in the Crossfire of Global Tensions',
        source: 'NPR',
        country: 'United States',
        date: 'Oct 20, 2026',
        summary:
          'Small and mid-size exporters report uncertainty as policy guidance shifts, with chamber groups calling for clearer frameworks for international commerce.',
      },
    ],
  },

  CHN: {
    code: 'CHN',
    code2: 'CN',
    name: 'China',
    articleCount: 41,
    sources: ['Global Times', 'Xinhua', 'China Daily', 'CGTN', "People's Daily"],
    framingSummary:
      'Chinese state-aligned media frames the situation as external interference in sovereign affairs. Emphasis is placed on multilateral dialogue, national resilience, and economic self-sufficiency as long-term strategic goals.',
    stance: 'diplomatic',
    sentiment: 'neutral',
    illustrativeFramingDeviation: 81,
    framingSignals: [
      { label: 'Sovereignty framing', value: 92, color: 'cyan' },
      { label: 'Multilateralism', value: 74, color: 'blue' },
      { label: 'Economic resilience', value: 69, color: 'cyan' },
    ],
    articles: [
      {
        id: 'cn-1',
        headline: 'China Reaffirms Commitment to Dialogue Amid Escalating Pressure',
        source: 'Xinhua',
        country: 'China',
        date: 'Oct 22, 2026',
        summary:
          'Ministry of Foreign Affairs spokesperson calls for de-escalation through established multilateral channels, while emphasising China\'s "principled position" on core interests.',
      },
      {
        id: 'cn-2',
        headline: 'Domestic Industry Shows Resilience Despite External Headwinds',
        source: 'Global Times',
        country: 'China',
        date: 'Oct 21, 2026',
        summary:
          'Economic data cited by state media points to continued growth in key manufacturing sectors, framed as evidence of the country\'s strategic independence.',
      },
      {
        id: 'cn-3',
        headline: 'BRICS Partners Rally Around Shared Development Principles',
        source: 'China Daily',
        country: 'China',
        date: 'Oct 19, 2026',
        summary:
          'Coverage highlights solidarity among emerging economy blocs as an alternative framework to Western-led institutions, positioning China as a stabilising multilateral force.',
      },
    ],
  },

  RUS: {
    code: 'RUS',
    code2: 'RU',
    name: 'Russia',
    articleCount: 33,
    sources: ['TASS', 'RT', 'Rossiyskaya Gazeta', 'Interfax', 'Kommersant'],
    framingSummary:
      'Russian coverage presents the geopolitical situation as driven by Western expansionism. State media consistently frames domestic policy as a defensive response to external provocation, with strong sovereignty messaging.',
    stance: 'skeptical',
    sentiment: 'negative',
    illustrativeFramingDeviation: 88,
    framingSignals: [
      { label: 'Anti-Western framing', value: 88, color: 'magenta' },
      { label: 'Security narrative', value: 82, color: 'cyan' },
      { label: 'Historical context', value: 71, color: 'blue' },
    ],
    articles: [
      {
        id: 'ru-1',
        headline: 'Moscow Denounces "Unprecedented Pressure" from Western Bloc',
        source: 'TASS',
        country: 'Russia',
        date: 'Oct 23, 2026',
        summary:
          'Official statements characterise sanctions as a form of economic warfare, with the Kremlin calling on neutral nations to reject what it describes as coercive multilateral pressure.',
      },
      {
        id: 'ru-2',
        headline: 'Historical Parallels Drawn as NATO Posture Shifts Eastward',
        source: 'RT',
        country: 'Russia',
        date: 'Oct 21, 2026',
        summary:
          'State-aligned analysts frame current developments within a decades-long pattern of Western encroachment, arguing Russia\'s position is a "natural and necessary" sovereign response.',
      },
      {
        id: 'ru-3',
        headline: 'Russia Eyes Deeper Economic Ties with Asia-Pacific Partners',
        source: 'Interfax',
        country: 'Russia',
        date: 'Oct 20, 2026',
        summary:
          'Trade delegations signal a strategic pivot toward non-Western markets, framed as a demonstration of Russia\'s capacity to adapt and thrive outside Western economic frameworks.',
      },
    ],
  },

  GBR: {
    code: 'GBR',
    code2: 'GB',
    name: 'United Kingdom',
    articleCount: 27,
    sources: ['BBC News', 'The Guardian', 'The Times', 'Financial Times', 'Sky News'],
    framingSummary:
      'British coverage tends toward analytical neutrality with emphasis on diplomatic process and institutional frameworks. Brexit-related economic vulnerabilities add a distinctive domestic filter to international trade stories.',
    stance: 'neutral',
    sentiment: 'neutral',
    illustrativeFramingDeviation: 44,
    framingSignals: [
      { label: 'Diplomatic process', value: 76, color: 'blue' },
      { label: 'Institutional framing', value: 68, color: 'cyan' },
      { label: 'Post-Brexit lens', value: 55, color: 'magenta' },
    ],
    articles: [
      {
        id: 'gb-1',
        headline: 'UK Seeks Independent Role as Tensions Test Transatlantic Cohesion',
        source: 'BBC News',
        country: 'United Kingdom',
        date: 'Oct 22, 2026',
        summary:
          'Post-Brexit Britain positions itself as a potential mediator, with the Foreign Office seeking to balance alliance commitments with emerging trade priorities in the Indo-Pacific.',
      },
      {
        id: 'gb-2',
        headline: 'Financial Markets Signal Caution as Diplomatic Rhetoric Sharpens',
        source: 'Financial Times',
        country: 'United Kingdom',
        date: 'Oct 21, 2026',
        summary:
          'Sterling and FTSE indices reflect investor uncertainty as British firms with significant cross-border supply chains assess exposure to potential secondary sanctions.',
      },
      {
        id: 'gb-3',
        headline: 'Whitehall Weighs Options as G7 Partners Diverge on Response Strategy',
        source: 'The Guardian',
        country: 'United Kingdom',
        date: 'Oct 19, 2026',
        summary:
          'Senior diplomatic sources describe internal debate within the UK government about how closely to align with the American position versus pursuing a distinctive European-adjacent approach.',
      },
    ],
  },

  IND: {
    code: 'IND',
    code2: 'IN',
    name: 'India',
    articleCount: 31,
    sources: ['The Hindu', 'Times of India', 'NDTV', 'Hindustan Times', 'The Wire'],
    framingSummary:
      'Indian coverage reflects a strategic non-alignment posture, presenting India as a pivotal swing actor. Coverage emphasises India\'s independent foreign policy traditions and its interests in maintaining beneficial ties with multiple global blocs.',
    stance: 'diplomatic',
    sentiment: 'neutral',
    illustrativeFramingDeviation: 38,
    framingSignals: [
      { label: 'Strategic autonomy', value: 88, color: 'cyan' },
      { label: 'Multi-alignment', value: 77, color: 'blue' },
      { label: 'Economic opportunity', value: 62, color: 'cyan' },
    ],
    articles: [
      {
        id: 'in-1',
        headline: 'India Walks Diplomatic Tightrope as Global Powers Seek Alliance Commitments',
        source: 'The Hindu',
        country: 'India',
        date: 'Oct 23, 2026',
        summary:
          'New Delhi signals it will maintain strategic autonomy, with External Affairs Ministry emphasising India\'s tradition of non-alignment and its role as an independent voice in multilateral forums.',
      },
      {
        id: 'in-2',
        headline: 'Indian Exporters Eye Opportunity Amid Supply-Chain Realignment',
        source: 'Times of India',
        country: 'India',
        date: 'Oct 21, 2026',
        summary:
          'Business analysts highlight sectors where Indian manufacturers could benefit from a reshuffling of global production networks as established trade relationships are renegotiated.',
      },
      {
        id: 'in-3',
        headline: "India's G20 Legacy Shapes Its Response to Current Geopolitical Flux",
        source: 'NDTV',
        country: 'India',
        date: 'Oct 19, 2026',
        summary:
          'Analysis draws on India\'s recent G20 presidency as context for understanding how New Delhi views its role as a bridge between developed and developing world perspectives on the crisis.',
      },
    ],
  },

  CAN: {
    code: 'CAN',
    code2: 'CA',
    name: 'Canada',
    articleCount: 19,
    sources: ['CBC News', 'Globe and Mail', 'Toronto Star', 'National Post', 'CTV News'],
    framingSummary:
      'Canadian coverage closely mirrors US framing on security issues but diverges on trade, reflecting distinct economic interests and a more multilateralist foreign policy tradition. Coverage also highlights domestic political sensitivities around sovereignty.',
    stance: 'supportive',
    sentiment: 'mixed',
    illustrativeFramingDeviation: 51,
    framingSignals: [
      { label: 'Multilateralism', value: 71, color: 'blue' },
      { label: 'Trade sovereignty', value: 65, color: 'cyan' },
      { label: 'Alliance alignment', value: 58, color: 'magenta' },
    ],
    articles: [
      {
        id: 'ca-1',
        headline: 'Ottawa Signals Support for Allies While Guarding Trade Autonomy',
        source: 'Globe and Mail',
        country: 'Canada',
        date: 'Oct 22, 2026',
        summary:
          'Canadian officials walk a careful line, endorsing the broader democratic coalition position while making clear that Canadian economic interests require distinct bilateral arrangements.',
      },
      {
        id: 'ca-2',
        headline: 'Canadian Resources Sector Watches for Impact on Export Agreements',
        source: 'CBC News',
        country: 'Canada',
        date: 'Oct 20, 2026',
        summary:
          'Energy, mining, and agricultural industries seek clarity from Ottawa on whether evolving international sanctions regimes could affect existing long-term supply contracts.',
      },
      {
        id: 'ca-3',
        headline: 'Parliamentary Debate Reveals Divide on How Hawkishly Canada Should Respond',
        source: 'Toronto Star',
        country: 'Canada',
        date: 'Oct 19, 2026',
        summary:
          'House of Commons debate reflects tensions between the government\'s instinct for multilateral solidarity and opposition parties\' push for a more assertive and independently defined Canadian stance.',
      },
    ],
  },

  DEU: {
    code: 'DEU',
    code2: 'DE',
    name: 'Germany',
    articleCount: 22,
    sources: ['Der Spiegel', 'Frankfurter Allgemeine Zeitung', 'ARD', 'Die Zeit', 'Handelsblatt'],
    framingSummary:
      'German coverage reflects the country\'s unique position as Europe\'s largest economy with deep trade ties to multiple global powers. Energy security and economic interdependence are dominant themes.',
    stance: 'neutral',
    sentiment: 'neutral',
    illustrativeFramingDeviation: 42,
    framingSignals: [
      { label: 'Economic interdependence', value: 83, color: 'cyan' },
      { label: 'EU solidarity', value: 72, color: 'blue' },
      { label: 'Energy security', value: 79, color: 'magenta' },
    ],
    articles: [
      {
        id: 'de-1',
        headline: 'Berlin Weighs Economic Costs of Deeper Alliance Commitments',
        source: 'Der Spiegel',
        country: 'Germany',
        date: 'Oct 22, 2026',
        summary:
          'German industry leaders warn that accelerated decoupling could impose significant costs on manufacturing sectors reliant on complex cross-border supply chains.',
      },
      {
        id: 'de-2',
        headline: 'Europe Looks to Germany to Bridge Transatlantic-Asian Policy Gap',
        source: 'Die Zeit',
        country: 'Germany',
        date: 'Oct 20, 2026',
        summary:
          'As tensions mount, analysts point to Germany\'s relationships with both Washington and Beijing as a potential asset for a coordinated European diplomatic initiative.',
      },
    ],
  },

  FRA: {
    code: 'FRA',
    code2: 'FR',
    name: 'France',
    articleCount: 18,
    sources: ['Le Monde', 'Le Figaro', 'France 24', 'Liberation', 'BFM TV'],
    framingSummary:
      'French coverage consistently emphasises European strategic autonomy and Macron\'s vision for an independent EU foreign policy. Coverage frequently challenges the binary framing of the situation.',
    stance: 'skeptical',
    sentiment: 'mixed',
    illustrativeFramingDeviation: 55,
    framingSignals: [
      { label: 'EU autonomy', value: 91, color: 'cyan' },
      { label: 'Diplomatic leadership', value: 74, color: 'blue' },
      { label: 'Critical of blocs', value: 63, color: 'magenta' },
    ],
    articles: [
      {
        id: 'fr-1',
        headline: 'Paris Calls for European Voice Independent of Washington Consensus',
        source: 'Le Monde',
        country: 'France',
        date: 'Oct 23, 2026',
        summary:
          'President emphasises the need for a distinctly European diplomatic path, resisting pressure to simply align with US-led coalition frameworks without adequate EU agency.',
      },
      {
        id: 'fr-2',
        headline: 'French Firms Navigate Regulatory Complexity as Sanctions Landscape Shifts',
        source: 'Le Figaro',
        country: 'France',
        date: 'Oct 20, 2026',
        summary:
          'Legal and compliance departments at major French corporations scramble to assess extraterritorial risk as the sanctions environment evolves with minimal advance guidance.',
      },
    ],
  },
};

// Sorted list of countries with coverage, for easy access
export const COVERED_COUNTRIES = Object.keys(MOCK_COVERAGE);

export const EXAMPLE_QUERIES = [
  'USâ€“China trade tensions',
  'Russiaâ€“Ukraine war',
  'Indiaâ€“Canada diplomatic relations',
  'Global climate negotiations',
  'Middle East ceasefire talks',
  'Taiwan Strait military exercises',
];

export const LOADING_STAGES = [
  'Initializing global search',
  'Scanning news sources',
  'Collecting regional coverage',
  'Organizing articles by source',
  'Preparing the world map',
];
