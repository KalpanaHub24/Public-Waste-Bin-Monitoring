# On-Spot Changes Log — SIH 2026 Level 2

## Change 1 — Threshold change (8 marks)

**What changed:** the "needs collection" (critical) threshold.

| | Before | After |
|---|---|---|
| Value | `fill_pct >= 85` | `fill_pct >= 75` |
| Where | hardcoded `85` inline in `classify()`, `script.js` | named constant `CRITICAL_THRESHOLD = 75` at the top of `script.js` |

**Why 75 and not some other number:** trucks take time to reach a bin after
it's flagged, so waiting until 85% risks the bin overflowing before
collection arrives. Flagging earlier, at 75%, gives the crew a buffer.

**How to show it reacting:** Bins `BIN002` (75%), `BIN004` (75%), and
`BIN008` (76%) sit between the old and new threshold. Before the change
they showed an amber "Filling up" badge; after the change they show a red
"Needs collection" badge and sort to the top of the list. Open the
dashboard, sort is automatic (most-urgent-first), so these three bins are
now visibly at/near the top instead of in the middle.

**One line to change it again:** edit `CRITICAL_THRESHOLD` at the top of
`script.js` — every badge, gauge colour, dropdown filter, and sort order
in the whole app reads from that single constant, so nothing else needs
to be touched.

---

## Change 2 — Handle a broken sensor reading (12 marks)

**The bug that existed before:** the list was sorted by
`fill_pct` directly. A broken sensor reporting something like `178%` is
numerically bigger than any real reading, so it sorted straight to the
**top** of the list — the dashboard would show a faulty bin as the single
most urgent bin in the city. That is a false alarm.

**The fix:** added a `sortPriority()` function that first asks
`classify()` whether a reading is a real measurement or a flagged
fault (missing value, or a value outside 0–100%). Flagged readings are
now given the lowest possible priority (`-1`) so they always sink to the
**bottom** of the list, never the top, and are shown with a purple
"Flagged" badge and an explanation in their detail view instead of being
treated as a real fill level.

**Live demo included:** a fresh test row was added to `data.json` /
`bins.csv` — `reading_id R043`, `bin_id BIN010`, `fill_pct 250` (physically
impossible). To demonstrate live:
1. Open the dashboard, search `BIN010`.
2. Point out the badge says **Flagged** ("Implausible (250%)"), not
   "Needs collection", even though 250 is the largest number in the
   dataset.
3. Clear the search — note BIN010's 250% reading sits near the **bottom**
   of the sorted list, not the top.
4. Click into it — the detail view shows a purple warning note explaining
   the reading was excluded rather than acted on.

**Same protection already exists on the sensor side too:** in
`wokwi/sketch.ino`, `takeReading()` checks the raw distance against
`MIN_VALID_CM` / `MAX_VALID_CM` *before* the value is even converted to a
percentage or added to the smoothing history — so a physically impossible
distance never reaches the dashboard at all. The dashboard-side fix above
covers the case where a bad value still makes it into the data (e.g. a
different faulty sensor model, manual data entry, or a corrupted reading).
