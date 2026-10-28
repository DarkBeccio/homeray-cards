# Changelog

## 1.0.2 - 2026-10-28

- Issues card: when the latest integration check fails, the summary no longer says "All good"; it shows "Check incomplete" and how old the previous result is.
- Issues card: several low-battery alarms of the same device count once.
- Issues card: the "other areas" chip counts areas, not devices.
- Issues card: an older integration answer arriving after a newer one is ignored.
- Issues card: the battery panel is titled "Low batteries", since binary alarms have no percentage.
- Issues card: the layout follows the width of the card, not of the window, so it stays readable in a narrow column.
- Automatic tests (`tests/cards.test.js`) and checks on every push.

## 1.0.1 - 2026-10-28

- Issues card: when the integrations cannot be read, or are still loading, the card says so instead of showing "All good". A failed later check keeps the previous result with a note.
- Issues card: editing the card options no longer clears the integration errors until the next check.
- Issues card: binary battery sensors that report "low" are now listed, without counting a device twice.
- Issues card: `exclude_label` now hides the device from updates and batteries too, not only from "not responding".
- Options are validated with clear errors: `battery` 0–100 (0 is now kept), `rows` 1 or more, gauge `min`/`max`/`warn`/`bad` numbers with `max` greater than `min`, `decimals` 0–6.
- Gauge card: opens with the keyboard (Enter/Space), shows a focus ring and reads the unit to screen readers; sensor values like "12abc" are no longer read as numbers.
- Timers are cleared when the card is removed.
- README: the "not responding" rule now describes exactly what the card checks.

## 1.0.0 - 2026-10-27

- First release: `homeray-issues-card` (issues dashboard) and `homeray-gauge-card` (ring gauge).
- English and Italian, picked from the Home Assistant language.
