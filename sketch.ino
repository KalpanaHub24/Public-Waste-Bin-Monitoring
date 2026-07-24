/* ===========================================================
   Bin Watch — sensing node (Wokwi / ESP32 simulation)
   ---------------------------------------------------------
   Simulates an ultrasonic distance sensor mounted at the top
   of a bin. Distance to trash = how empty it is, so fill_pct
   is calculated from that distance.

   Requirements satisfied here (matches the problem statement):
   - Non-blocking timing using millis(), NOT delay()
   - Plausibility check that rejects impossible readings
   - Smoothing (moving average) so one spike isn't mistaken
     for a real change
   - Output uses the SAME field names as data.json / bins.csv
     so this "plugs into" the dashboard
   =========================================================== */

#include <Arduino.h>

// ---------- Pins (HC-SR04 ultrasonic sensor, simulated in Wokwi) ----------
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// ---------- Bin physical setup ----------
const float BIN_HEIGHT_CM = 60.0;   // distance from sensor to bottom of empty bin
const float MIN_VALID_CM  = 2.0;    // anything closer than this is implausible
const float MAX_VALID_CM  = 400.0;  // HC-SR04 max usable range

// ---------- Identity (matches bin_id / ward in the dataset) ----------
const char* BIN_ID = "BIN011";
const char* WARD    = "Ward 2";

// ---------- Non-blocking timing state ----------
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL_MS = 5000; // take a reading every 5 seconds

// ---------- Smoothing state (simple moving average) ----------
const int SMOOTHING_WINDOW = 5;
int fillHistory[SMOOTHING_WINDOW];
int historyCount = 0;
int historyIndex = 0;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  for (int i = 0; i < SMOOTHING_WINDOW; i++) fillHistory[i] = -1;
  Serial.println("Bin Watch sensing node started.");
}

void loop() {
  // ---- Non-blocking schedule: check the clock, never freeze with delay() ----
  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;
    takeReading();
  }

  // Other work (network checks, button reads, etc.) could run freely
  // here because loop() is never blocked.
}

void takeReading() {
  float distanceCm = readUltrasonicDistanceCm();

  // ---- Plausibility check: reject impossible physical readings ----
  if (distanceCm < MIN_VALID_CM || distanceCm > MAX_VALID_CM) {
    Serial.println("{\"bin_id\":\"" + String(BIN_ID) +
                    "\",\"error\":\"implausible_reading\",\"raw_distance_cm\":" +
                    String(distanceCm, 1) + "}");
    return; // discard — do not feed a bad value into the smoothing history
  }

  // Convert distance-to-trash into a fill percentage.
  // Closer distance = fuller bin.
  int rawFillPct = (int) ((1.0 - (distanceCm / BIN_HEIGHT_CM)) * 100.0);
  rawFillPct = constrain(rawFillPct, 0, 100);

  // ---- Smoothing: push into circular buffer, then average ----
  fillHistory[historyIndex] = rawFillPct;
  historyIndex = (historyIndex + 1) % SMOOTHING_WINDOW;
  if (historyCount < SMOOTHING_WINDOW) historyCount++;

  int smoothedFillPct = movingAverage();

  // ---- Output: same field names as bins.csv / data.json ----
  String recordedAt = fakeTimestamp(); // Wokwi has no RTC by default; see README
  String json = "{";
  json += "\"bin_id\":\"" + String(BIN_ID) + "\",";
  json += "\"ward\":\"" + String(WARD) + "\",";
  json += "\"fill_pct\":" + String(smoothedFillPct) + ",";
  json += "\"raw_fill_pct\":" + String(rawFillPct) + ",";
  json += "\"recorded_at\":\"" + recordedAt + "\"";
  json += "}";

  Serial.println(json);
}

// Simulated ultrasonic read. In real Wokwi wiring this pulses TRIG and
// times ECHO; kept here as a clearly-labelled simulation function so the
// plausibility/smoothing logic above is easy to test with the Serial Monitor.
float readUltrasonicDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout, non-blocking-safe
  if (duration == 0) {
    return -1; // sensor timeout -> will fail the plausibility check on purpose
  }
  float distanceCm = duration * 0.0343 / 2.0;
  return distanceCm;
}

int movingAverage() {
  long sum = 0;
  for (int i = 0; i < historyCount; i++) sum += fillHistory[i];
  return (int) (sum / historyCount);
}

// Wokwi simulations don't have real network time by default.
// This produces a readable placeholder timestamp using millis().
// Swap for NTP (real Wi-Fi time) once this runs on real hardware — see README.
String fakeTimestamp() {
  unsigned long totalSeconds = millis() / 1000;
  unsigned long h = (totalSeconds / 3600) % 24;
  unsigned long m = (totalSeconds / 60) % 60;
  unsigned long s = totalSeconds % 60;
  char buf[9];
  sprintf(buf, "%02lu:%02lu:%02lu", h, m, s);
  return "2026-07-24 " + String(buf); // demo date + running clock
}
