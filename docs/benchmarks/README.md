# Phase 6B translation benchmark

Benchmark result files:

- `benchmark_helsinki.json` contains the original German/French/Spanish/Hindi runs and the resumed Russian/Italian/Portuguese runs.
- `benchmark_nllb_batch.json` contains NLLB CPU results for Hindi and Russian using `num_beams=1` and batch size 16, with the old translations alongside them.
- `../../benchmark_nllb.json` is the earlier NLLB baseline. Its generation settings were not recorded, so throughput comparisons to that run are indicative rather than controlled.

All Python benchmark commands use `..\..\venv\Scripts\python.exe`. Set `HF_HOME` to a drive with sufficient free space before loading the models. Translation latency and model-load time vary with cache state and hardware; the benchmark records model-load time separately from headline throughput.

## Helsinki and NLLB comparison

| Language | Samples | Helsinki load seconds | Helsinki headlines/second | NLLB headlines/second |
|---|---:|---:|---:|---:|
| German | 30 | 78.214 | 4.058 | 0.525 |
| French | 20 | 80.416 | 2.707 | 0.327 |
| Spanish | 24 | 72.019 | 4.269 | 0.443 |
| Russian | 30 | 81.212 | 1.804 | 0.334 baseline; 0.642 with batch 16, beams 1 |
| Hindi | 30 | 73.529 | 2.726 | 0.383 baseline; 0.849 with batch 16, beams 1 |
| Italian | 30 | 114.732 | 2.752 | 0.600 |
| Portuguese | 30 | 9.178 | 1.932 | 0.486 |

The saved NLLB baseline reports a 12.497-second shared model load. The batch-16 rerun loaded the relocated-cache snapshot in 8.017 seconds. Helsinki load times include the observed `from_pretrained` startup on each recorded run; first-time downloads and cache state differed, so these are not clean cold-start comparisons.

The Helsinki Russian and Italian samples showed more serious mistranslations and less fluent phrasing than their NLLB comparisons, so both route to NLLB alongside Hindi. Portuguese remains on Helsinki because its sample originals contain visible character-encoding corruption, which prevents a fair model-quality judgment. These judgments are based on a small headline sample, not a human-rated translation evaluation.

NLLB batch-size-16 decoding translated all 30 Hindi samples identically to the saved baseline and changed 2 of 30 Russian outputs. Both Russian differences completed text that had been truncated in the old output. This is a sample review, not evidence of zero quality loss across all headlines.

There is no declared Arabic-language fixture. Arabic falls back to NLLB if an Arabic article is encountered; that language path has not been fixture-benchmarked.

## Licenses

- NLLB-200-distilled-600M: **CC-BY-NC-4.0**. Its model card describes it as research-use and says it is not released for production deployment.
- Helsinki OPUS-MT licenses are per checkpoint. Configured German, French, Spanish, Hindi, Italian, and Romance models list **Apache-2.0**; Russian-to-English lists **CC-BY-4.0**.
- See the `/methodology` page and linked model cards for the deployment-time disclosures.
