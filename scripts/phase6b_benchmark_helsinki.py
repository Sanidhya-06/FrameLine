"""Resume CPU Helsinki/OPUS headline translation benchmarks, checkpointing each batch."""
import json
import os
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "benchmarks" / "benchmark_helsinki.json"
NLLB = ROOT / "benchmark_nllb.json"
MODELS = {
    "de": "Helsinki-NLP/opus-mt-de-en",
    "fr": "Helsinki-NLP/opus-mt-fr-en",
    "es": "Helsinki-NLP/opus-mt-es-en",
    "ru": "Helsinki-NLP/opus-mt-ru-en",
    "hi": "Helsinki-NLP/opus-mt-hi-en",
    "it": "Helsinki-NLP/opus-mt-it-en",
    "pt": "Helsinki-NLP/opus-mt-ROMANCE-en",
}


def save(data):
    fd, name = tempfile.mkstemp(prefix="benchmark_helsinki_", suffix=".tmp", dir=OUT.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(data, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
        os.replace(name, OUT)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def main(languages):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(OUT.read_text(encoding="utf-8"))
    originals = json.loads(NLLB.read_text(encoding="utf-8"))["samples"]
    data.setdefault("models", {}).update(MODELS)
    for lang in languages:
        model_name = MODELS[lang]
        texts = [item["original"] for item in originals[lang]]
        data.setdefault("fixture_counts", {})[lang] = len(texts)
        data.setdefault("runs", {})[lang] = {"model": model_name, "count": 0, "status": "loading"}
        data.setdefault("samples", {})[lang] = []
        save(data)
        try:
            import torch
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

            torch.set_num_threads(min(4, os.cpu_count() or 1))
            start = time.perf_counter()
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to("cpu").eval()
            load_seconds = time.perf_counter() - start
            run = data["runs"][lang]
            run.update(status="running", load_seconds=round(load_seconds, 3), translate_seconds=0.0, headlines_per_second=0.0)
            save(data)
            translation_start = time.perf_counter()
            translated = []
            with torch.inference_mode():
                for offset in range(0, len(texts), 5):
                    batch = texts[offset:offset + 5]
                    tokens = tokenizer(batch, return_tensors="pt", padding=True, truncation=True, max_length=256)
                    output = model.generate(**tokens, max_new_tokens=128, num_beams=1)
                    translated.extend(tokenizer.batch_decode(output, skip_special_tokens=True))
                    elapsed = time.perf_counter() - translation_start
                    data["samples"][lang] = [
                        {"original": source, "translation": target}
                        for source, target in zip(texts[:len(translated)], translated)
                    ]
                    run.update(count=len(translated), status="running", translate_seconds=round(elapsed, 3), headlines_per_second=round(len(translated) / elapsed, 3) if elapsed else 0.0)
                    save(data)
                    print(f"{lang}: checkpoint {len(translated)}/{len(texts)}", flush=True)
            elapsed = time.perf_counter() - translation_start
            run.update(count=len(translated), status="complete", translate_seconds=round(elapsed, 3), headlines_per_second=round(len(texts) / elapsed, 3) if elapsed else 0.0)
            save(data)
            print(f"{lang}: complete; load={load_seconds:.3f}s, CPU={len(texts)/elapsed:.3f} headlines/s, fixtures={len(texts)}", flush=True)
            del model, tokenizer
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception as exc:
            data["runs"][lang].update(status="error", error=f"{type(exc).__name__}: {exc}")
            save(data)
            print(f"{lang}: ERROR {type(exc).__name__}: {exc}", flush=True)


if __name__ == "__main__":
    requested = sys.argv[1:] or ["ru", "it", "pt"]
    main(requested)
