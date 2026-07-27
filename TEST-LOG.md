# Test Log — Task 5 Integration & Testing

Fill this in yourself after you actually click through your running site —
these are the exact checks the assessment asks for, with the expected
result noted so you know what "correct" looks like.

## 1. End-to-end main flow
- [ ] Open `index.html`. List loads within ~1 second, count reads
      "Showing 43 of 43 records".
- [ ] Type a bin ID (e.g. `BIN004`) into search → list narrows live,
      count updates, no button press needed.
- [ ] Change the Ward dropdown → list narrows, count updates.
- [ ] Click a row → detail view opens, showing that bin's derived
      figure at the top.
- [ ] Click "Back to list" → returns to the filtered list, filters
      still applied.

## 2. Normal / extreme / faulty cases
| Case | Bin | Expected behaviour | Result |
|---|---|---|---|
| Normal reading | BIN001 | Shows green "OK" or amber "Filling up" badge, gauge bar matches % | |
| Missing value | BIN004 | Shows "No reading", purple "Flagged" badge, gauge shows 0 with flag note in detail view | |
| Out-of-range value (178%) | BIN007 | Flagged badge, detail view shows the flag-note warning, NOT treated as a normal 178% fill | |
| Out-of-range value (250%) | BIN010 | Flagged badge, sorts to the BOTTOM of the list (not the top) — this is the on-spot Change 2 test case | |
| Stuck sensor (4× fill_pct=50) | BIN009 | Each individual reading looks "normal" on its own — note in this log that a stuck sensor is only visible by comparing consecutive `recorded_at` values by hand, which is why Task 4's smoothing logic exists on the device side | |

## 3. Offline / local behaviour
- [ ] Disconnect Wi-Fi / turn off network, reload the page.
- [ ] Expected: `error-state` message appears ("Couldn't load bin
      data…") instead of a blank white page, because `fetch()` fails
      and is caught.
- [ ] Reconnect, reload → data loads normally again.

## 4. Manual calculation check
Pick one row, e.g. `last_emptied = 2026-07-20 08:00`, checked against
today's date. Calculate days-since-emptied by hand and compare to the
number shown at the top of the Detail view. Write the two numbers here
and confirm they match: ____________

## 5. Loading / empty / error states
- [ ] Loading: briefly visible on first load ("Loading bin readings…").
- [ ] Empty: search for a nonsense string like `zzzzz` → "No readings
      match your search or filters." appears, table disappears.
- [ ] Error: rename `data.json` temporarily and reload → error message
      appears, page never left blank. Rename it back afterward.

## 6. On-spot changes (Level 2, see `ONSPOT-CHANGES.md` for full detail)
- [ ] **Change 1 — threshold:** `BIN002`, `BIN004` (75%) and `BIN008` (76%)
      show a red "Needs collection" badge, not amber — confirms
      `CRITICAL_THRESHOLD` is now 75, not 85.
- [ ] **Change 2 — broken sensor:** search `BIN010` → badge reads
      "Flagged (Implausible 250%)". Clear the search → `BIN010`'s 250%
      reading sits near the bottom of the sorted list, not the top —
      confirms the fault is no longer causing a false alarm.
