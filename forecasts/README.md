# Forecast log

Append-only. **Never edit or delete a line.** The value of this file is that it
cannot be rewritten after the fact — that is the entire product.

## Schema (`log.jsonl`, one JSON object per line)

| field | meaning |
|---|---|
| `issued` | date the forecast was made. Never backdate. |
| `model` | model version. Bump on any change to features or method. |
| `market` | `city.district.assetType.dealType` |
| `horizon_months` | only `12` is validated. Do not log 3 or 6. |
| `target_date` | the month whose index will score this line |
| `spread_dev_pct` | 월세−전세 스프레드의 장기평균 대비 괴리, the model's only input |
| `point_pct` | point forecast, % change in the jeonse index |
| `band80` | 10th–90th percentile of historical forecast residuals |
| `published` | whether it was shown to users |
| `benchmark_naive_pct` | what "no change" predicted — always 0 for this model |
| `outcome_pct` | **filled in at `target_date`**, never before |
| `error_pct` / `naive_error_pct` | filled in at `target_date` |

## Publication rule

Publish only when **`band80` excludes zero.** If the band spans zero the model
has no information, and the honest output is "전망 없음". As of 2026-08-29 this
rule silences 3 of 4 markets — that is the rule working, not failing.

Never attach a forecast to a building or a listing. Market level only.
Write "추세", not "예측".

## Scoring

At each `target_date`, append `outcome_pct`, `error_pct` and `naive_error_pct`
to that line's record and publish the running scorecard. Score every logged
forecast, including the unpublished ones — hiding the withheld ones would make
the scorecard flattering and useless.

## Kill switch

If, over the last **8 scored forecasts**, mean `error_pct` ≥ mean
`naive_error_pct`, stop publishing and say so on the page. Restart only after a
model change that is itself backtested. Automating this is the point: a
forecaster who decides case by case whether to keep going does not have a
kill switch.

## Evidence behind `ec-v1`

Mechanism, stated before testing: 전월세전환율이 4.6~4.9%에 3년째 고정돼 있어
전세와 월세는 무한히 발산할 수 없다. 괴리가 벌어지면 되돌아온다.

Walk-forward, out of sample, 60 evaluations across four districts:

| | 오차수정 | 무변화 | 평균추세 | 모멘텀 |
|---|---|---|---|---|
| 강남 | 2.56 | 4.92 | 3.40 | 12.25 |
| 노원 | 2.66 | 4.77 | 3.11 | 15.79 |
| 송파 | 4.45 | 8.41 | 5.43 | 10.82 |
| 관악 | 4.19 | 6.41 | 5.61 | 11.21 |
| **pooled** | **3.47** | **6.13** | **4.39** | **12.52** |

Beats "no change" by 43% and "average drift" by 21%, in all four markets.

**Falsification that was run and failed.** The same error-correction method
applied to *district-versus-Seoul-average* gaps does **not** work: pooled 6.82
against 6.13 for no change. Regional gaps have no pinning constraint, so nothing
pulls them back. The method only works where a real ratio ties two series
together — which is why the mechanism has to be argued before it is tested.

## Known limits

- 60 evaluations, overlapping windows; effective sample is smaller than 60.
- Four districts, apartments only, one 5-year window containing one cycle.
- The 2022–23 jeonse crash dominates the fitted coefficient. The next cycle is
  the real test.
- Treat `ec-v1` as a hypothesis under test, not a validated model, until the
  scorecard has at least 8 scored entries.
