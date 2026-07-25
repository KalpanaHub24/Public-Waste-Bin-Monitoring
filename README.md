# Bin Watch — Public Waste Bin Fill Monitoring and Collection Planning

**SIH 2026 Internal Practical Assessment — Kalpana L, Reg 411723106037, PSVPEC ECE**

## The problem, in two lines
Garbage trucks currently visit every public bin on a fixed route regardless
of how full each one actually is, so busy bins overflow while nearly-empty
bins get emptied anyway — wasting fuel and crew time and causing complaints.

## How to run this
1. Download or clone this repository.
2. Open the folder in VS Code (or any editor).
3. Open `index.html` directly in a browser — **or**, to avoid any browser
   `fetch()` restrictions on local files, run a tiny local server from the
   project folder:
   ```
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000` in your browser.
4. To run the sensing-node simulation: open [wokwi.com](https://wokwi.com),
   start a new ESP32 project, and paste in `wokwi/sketch.ino` (or import
   `wokwi/diagram.json` for the wiring). Open the Serial Monitor to see
   simulated readings print every 5 seconds.

## What every field means
See [`data/data-dictionary.md`](data/data-dictionary.md) for the full table.
In short: each row is one `reading_id` for one `bin_id`, in a `ward`, with a
`fill_pct` (0–100, or empty if the sensor failed), plus `last_emptied` and
`recorded_at` timestamps.

## How the derived figure is calculated
The Detail view shows **days since last emptied**, calculated as:
```js
Math.floor((today - last_emptied_date) / (1000 * 60 * 60 * 24))
```
This is the number a sanitation supervisor cares about most — a bin that's
both high-fill *and* long-unemptied is the one to send a truck to first.

## Project structure
```
waste-bin-dashboard/
├── index.html              # list view + detail view + all UI states
├── style.css                # styling (traffic-light fill gauge is the signature element)
├── script.js                 # data loading, search/filter, detail rendering
├── data.json                  # 42 readings the dashboard actually loads
├── data/
│   ├── bins.csv                # same dataset in CSV form (Task 1 source)
│   └── data-dictionary.md      # field-by-field explanation + awkward cases
├── wokwi/
│   ├── sketch.ino               # ESP32 simulation (Task 4)
│   └── diagram.json             # virtual wiring for Wokwi
├── TEST-LOG.md                 # Task 5 test results
└── README.md                    # this file
```

## Design notes
- Status is derived from `fill_pct` using one shared function
  (`classify()` in `script.js`) so the list badges, gauge colors, and
  detail-view flag notice can never disagree with each other.
- The three deliberate "awkward" rows (missing value, out-of-range value,
  stuck sensor) are documented in `data/data-dictionary.md` and are what
  Task 5's testing checklist exercises.
- The list defaults to sorting by fill level, most-urgent bin first —
  matching the actual goal of the dashboard (help the supervisor decide
  what to collect first).

## What is not finished
- The ESP32 sketch does not send readings over Wi-Fi to the dashboard
  automatically (out of scope for this Easy-level assessment) — it prints
  each reading as JSON to the Serial Monitor, in the same field-name shape
  as `data.json`, to show the two halves of the project are compatible.
- The Wokwi sketch fakes its own clock with `millis()` since the simulator
  has no real network time by default; a real deployment would sync time
  over Wi-Fi (NTP) instead.
- No authentication/login — out of scope for an Easy-level assessment.

## Demo video
https://drive.google.com/file/d/1gwbq8dkx_6G2M1as9R-lS2o2HPq2z5kg/view?usp=drive_link
