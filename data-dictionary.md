# Data Dictionary — bins.csv / data.json

This file explains every field in the bin fill dataset, so anyone opening it
for the first time knows exactly what each column means and what values are
allowed.

| Field | Type | Meaning | Allowed values | Example |
|---|---|---|---|---|
| `reading_id` | string | Unique ID for this one reading (one row = one reading) | `R001`–`R999` | `R014` |
| `bin_id` | string | Which physical bin produced the reading | `BIN001`–`BIN010` | `BIN004` |
| `ward` | string | Municipal ward/zone the bin sits in | `Ward 1`–`Ward 5` | `Ward 3` |
| `fill_pct` | integer or empty | How full the bin was at the time of recording | `0`–`100`. Empty means the sensor failed to report a value for that reading. Values outside 0–100 are physically impossible and mark a faulty/glitched reading. | `82` |
| `last_emptied` | datetime string (`YYYY-MM-DD HH:MM`) | The last time a collection crew emptied this bin | Any valid date/time, always ≤ `recorded_at` | `2026-07-20 08:00` |
| `recorded_at` | datetime string (`YYYY-MM-DD HH:MM`) | When this specific reading was taken by the sensor | Any valid date/time | `2026-07-24 07:40` |

## Deliberate "awkward" rows included in this dataset

These were added on purpose, as required by the assessment, so the dashboard
and the sensing logic have real edge cases to handle instead of only clean data:

1. **Missing value** — row `bin_id = BIN004`, `fill_pct` is blank. Represents
   a sensor that failed to report a reading. The dashboard must show this as
   "No reading" rather than treating it as `0`.
2. **Out-of-range value** — row `bin_id = BIN007`, `fill_pct = 178`. Physically
   impossible (bins can't be 178% full). Represents a wiring fault or sensor
   glitch. The dashboard must flag it rather than silently plot it.
3. **Stuck/faulty sensor** — `bin_id = BIN009` reports `fill_pct = 50` across
   four consecutive readings while time clearly moves on and every other bin's
   readings change normally. A real bin's fill level does not stay perfectly
   flat for that long — this is what a stuck sensor looks like, and it's the
   case the smoothing/plausibility logic in Task 4 is built to catch.
4. **Second out-of-range value (added for the Level 2 on-spot exam)** — row
   `reading_id = R043`, `bin_id = BIN010`, `fill_pct = 250`. A second, more
   extreme impossible value used to demonstrate that a broken-sensor reading
   is treated as a fault and sorted to the bottom of the list, not mistaken
   for the most urgent bin. See `ONSPOT-CHANGES.md` for the full walkthrough.

## Status thresholds (used by `script.js`)

| Status | Condition | Notes |
|---|---|---|
| OK | `fill_pct < 60` | green |
| Filling up | `60 ≤ fill_pct < 75` | amber |
| Needs collection | `fill_pct ≥ 75` | red — **changed from 85% during the Level 2 on-spot exam**, see `ONSPOT-CHANGES.md` |
| Flagged | `fill_pct` missing, or outside `0`–`100` | purple — treated as a sensor fault, never as a real measurement |

## Derived figure shown on the Detail view

`days_since_emptied` = (today's date − `last_emptied` date), in whole days.
Calculated in `script.js` as:

```js
const days = Math.floor((new Date() - new Date(lastEmptied)) / (1000 * 60 * 60 * 24));
```

This is the number a sanitation supervisor cares about most: a bin that has
gone unemptied for many days, combined with a high fill percentage, is the
one that should be collected first.
