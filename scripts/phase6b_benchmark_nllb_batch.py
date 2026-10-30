"""Compare NLLB batched greedy decoding with the saved Phase 6B samples."""
import json
import os
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "benchmark_nllb.json"
OUT = ROOT / "docs" / "benchmarks" / "benchmark_nllb_batch.json"
LANGS = {"hi": "hin_Deva", "ru": "rus_Cyrl"}
BATCH_SIZE = 16


def save(data):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix="benchmark_nllb_batch_", suffix=".tmp", dir=OUT.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(data, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
        os.replace(name, OUT)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def main():
    import torch
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

    torch.set_num_threads(min(4, os.cpu_count() or 1))
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "model": source["model"],
        "decoding": {"num_beams": 1, "batch_size": BATCH_SIZE, "device": "cpu", "max_new_tokens": 128},
        "prior_run_settings": "Not recorded in benchmark_nllb.json; comparisons to prior throughput/outputs are indicative, not controlled.",
        "runs": {},
        "samples": {},
    }
    start = time.perf_counter()
    tokenizer = AutoTokenizer.from_pretrained(source["model"])
    model = AutoModelForSeq2SeqLM.from_pretrained(source["model"]).to("cpu").eval()
    load_seconds = time.perf_counter() - start
    data["load_seconds"] = round(load_seconds, 3)
    save(data)
    for lang, source_code in LANGS.items():
        examples = source["samples"][lang]
        originals = [entry["original"] for entry in examples]
        tokenizer.src_lang = source_code
        target_id = tokenizer.convert_tokens_to_ids("eng_Latn")
        started = time.perf_counter()
        outputs = []
        with torch.inference_mode():
            for offset in range(0, len(originals), BATCH_SIZE):
                batch = originals[offset:offset + BATCH_SIZE]
                tokens = tokenizer(batch, return_tensors="pt", padding=True, truncation=True, max_length=256)
                generated = model.generate(**tokens, forced_bos_token_id=target_id, num_beams=1, max_new_tokens=128)
                outputs.extend(tokenizer.batch_decode(generated, skip_special_tokens=True))
                elapsed = time.perf_counter() - started
                pairs = [{"original": a, "translation": b, "prior_translation": examples[i]["translation"]}
                         for i, (a, b) in enumerate(zip(originals[:len(outputs)], outputs))]
                data["samples"][lang] = pairs
                data["runs"][lang] = {"count": len(outputs), "status": "running", "batch_size": BATCH_SIZE,
                                      "num_beams": 1, "translate_seconds": round(elapsed, 3),
                                      "headlines_per_second": round(len(outputs) / elapsed, 3) if elapsed else 0.0,
                                      "changed_vs_prior": sum(p["translation"] != p["prior_translation"] for p in pairs)}
                save(data)
                print(f"{lang}: checkpoint {len(outputs)}/{len(originals)}", flush=True)
        elapsed = time.perf_counter() - started
        data["runs"][lang].update(status="complete", count=len(originals), translate_seconds=round(elapsed, 3),
                                  headlines_per_second=round(len(originals) / elapsed, 3) if elapsed else 0.0)
        save(data)
        print(f"{lang}: complete; CPU={len(originals)/elapsed:.3f} headlines/s, changed_vs_prior={data['runs'][lang]['changed_vs_prior']}/{len(originals)}", flush=True)
    print(f"shared model load={load_seconds:.3f}s; batch={BATCH_SIZE}; beams=1", flush=True)


if __name__ == "__main__":
    main()
