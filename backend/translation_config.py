"""Language-to-backend routing, based on the Phase 6B headline benchmark."""

HELSINKI_MODELS: dict[str, str] = {
    "de": "Helsinki-NLP/opus-mt-de-en",
    "fr": "Helsinki-NLP/opus-mt-fr-en",
    "es": "Helsinki-NLP/opus-mt-es-en",
    "ru": "Helsinki-NLP/opus-mt-ru-en",
    "hi": "Helsinki-NLP/opus-mt-hi-en",
    "it": "Helsinki-NLP/opus-mt-it-en",
    "pt": "Helsinki-NLP/opus-mt-ROMANCE-en",
}
NLLB_MODEL = "facebook/nllb-200-distilled-600M"
NLLB_SOURCE_CODES: dict[str, str] = {
    "de": "deu_Latn", "fr": "fra_Latn", "es": "spa_Latn", "ru": "rus_Cyrl",
    "hi": "hin_Deva", "it": "ita_Latn", "pt": "por_Latn",
    "ar": "arb_Arab", "ja": "jpn_Jpan", "ko": "kor_Hang", "zh": "zho_Hans",
    "tr": "tur_Latn", "nl": "nld_Latn", "pl": "pol_Latn", "uk": "ukr_Cyrl",
    "ur": "urd_Arab", "fa": "pes_Arab", "bn": "ben_Beng", "th": "tha_Thai",
    "vi": "vie_Latn", "id": "ind_Latn", "sw": "swh_Latn", "el": "ell_Grek",
    "cs": "ces_Latn", "ro": "ron_Latn", "sv": "swe_Latn", "da": "dan_Latn",
    "fi": "fin_Latn", "no": "nob_Latn", "he": "heb_Hebr", "hu": "hun_Latn",
    "bg": "bul_Cyrl", "sr": "srp_Cyrl", "hr": "hrv_Latn", "sk": "slk_Latn",
    "ms": "zsm_Latn", "ta": "tam_Taml", "te": "tel_Telu", "mr": "mar_Deva",
}

# Overrides for demonstrated quality gaps. Unlisted supported Helsinki languages
# use OPUS-MT; unsupported Helsinki languages resolve to NLLB.
TRANSLATION_BACKEND_BY_LANGUAGE: dict[str, str] = {
    "hi": "nllb",
    "ru": "nllb",
    "it": "nllb",
}


def resolve_backend(language: str) -> str:
    lang = language.strip().lower().split("-")[0].split("_")[0]
    if lang in TRANSLATION_BACKEND_BY_LANGUAGE:
        return TRANSLATION_BACKEND_BY_LANGUAGE[lang]
    return "helsinki" if lang in HELSINKI_MODELS else "nllb"


def fallback_backend(language: str, backend: str) -> str | None:
    lang = language.strip().lower().split("-")[0].split("_")[0]
    other = "nllb" if backend == "helsinki" else "helsinki"
    if other == "nllb":
        return other if lang in NLLB_SOURCE_CODES else None
    return other if lang in HELSINKI_MODELS else None
