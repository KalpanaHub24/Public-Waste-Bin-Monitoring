# Test Log — Task 5 Integration & Testing

Fill this in yourself after you actually click through your running site —
these are the exact checks the assessment asks for, with the expected
result noted so you know what "correct" looks like.

## 1. End-to-end main flow
- [x ] Open `index.html`. List loads within ~1 second, count reads
      "Showing 42 of 42 records".
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
