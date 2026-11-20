# Proposal

## Why

Health can estimate daily protein, but it gives no way to work for a set stretch and then stand up before the next block. A Work Timer on that same menu runs a repeating focus and rest loop in the browser, with no account or backend.

## What Changes

- Add **Work Timer** as the second child of **Health**, directly under **Protein Calculator**, with a Timer icon from the existing icon library. Selecting it opens `/health/work-timer`. While that page is current, Health stays expanded, Work Timer is the selected item, and the header title is Work Timer. Every other menu item stays as it is. The route uses the app's existing GitHub Pages router setup.
- The default page stacks three sections: a **+** button, **Active Timer**, then **Recent Timers**. Empty states read "No timer playing." and "No recent timers."
- **+** opens a small form. Work minutes default to 30 and rest minutes default to 2. Both are required whole minutes from 1 to 99. Invalid values show an inline message and start nothing. **Start** begins that pair at the start of Work, records it in Recent Timers, and opens the timer screen. **Cancel** closes the form and leaves the active timer and recent list unchanged.
- The timer screen shows a zero-padded `00:00` countdown. **Work** uses a work icon and "Focus on your work." on a calm green background, and flashes a calm red for the last 3 seconds. At `00:00` it becomes **Rest**, resets to the rest length, shows a rest icon and "Stand up and walk." on a steady calm blue background, and flashes a calm green for the last 3 seconds of rest. At `00:00` of rest it returns to a full work block. The loop continues until the user pauses or stops. The flash is a slow pulse about once per second; reduced motion uses a steady warning color. Phase colors cover the screen in light and dark mode, and the digits stay readable on a wide screen and fit on a narrow one.
- **Pause** freezes the clock and stops the flash. **Resume** continues from that time, including the last-3-seconds flash when still inside that window. **Stop** ends the session, clears Active Timer, leaves the pair in Recent Timers, and returns to the default page. Those controls are icon buttons with accessible names. Stopping in the first second of a new timer still keeps the pair.
- Each recent row shows the work and rest lengths (for example, **30:00 work · 02:00 rest**) and a play button. Rows are unique by that pair, ordered by last played, newest first, and capped at 10. Play starts that pair from the beginning of Work and opens the timer screen. Only one timer is active; starting another stops the one that was playing or paused and leaves both pairs in the list. The active row shows the phase, remaining time, and **Paused** when frozen. Clicking it opens the timer screen.
- Timers persist in `localStorage` under `work-timer`. Lengths are stored in seconds (defaults 1800 and 120). A reload restores Recent Timers and the active session from the saved remaining time and does not skip ahead for time the tab was closed. Missing or invalid storage starts empty. Countdown, phase changes, the 3-second warning, and recent-list rules live in plain functions that can be unit tested without rendering the page.
- Out of scope: more than one running timer, sound, notifications, tab-title changes, naming, editing, or deleting a pair, extra phases, session history, streaks, stats, accounts, and sync.

## Capabilities

### New Capabilities

- `work-timer`: The Work Timer child under Health, the `/health/work-timer` page, the work and rest loop, the active timer, the recent list, and browser storage.

### Modified Capabilities

None. `openspec list --specs` is empty. Health's existing child and the shared menu-icon treatment live only on the `protein-calculator` change (`health-menu`, `menu-icons`), not under `openspec/specs/`. This change specifies the new child on `work-timer` so it does not add a second health-menu capability.

## Impact

- Extends the sidebar and adds the `/health/work-timer` route beside the existing Health route. A new page module owns the list, the create form, and the timer screen. Phase and recent-list rules stay in plain functions, covered by unit tests for defaults, both phase transitions, the last-3-seconds warning, and recent-list ordering.
- Persistence is one `localStorage` key. No backend, database, API, or new deploy pipeline. Light and dark mode and the existing shell already exist; the page and timer screen use them, including a narrow stacked layout.
- Protein Calculator and the other existing routes keep their current behavior. Publishing stays on the current GitHub Pages setup.
