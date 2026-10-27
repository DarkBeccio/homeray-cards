# Changelog

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
