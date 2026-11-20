## User Story: Work Timer under Health

**As a** user of the web app,
**I want** a Work Timer page under the Health menu that loops a focus block and a short rest,
**So that** I can work for a set stretch and then stand up and walk before the next block starts.

---

### Scope

1. Add a child menu named **Work Timer** inside the existing **Health** menu, directly under **Protein Calculator**.
2. Create a **Work Timer** page at `/health/work-timer`.
3. The default page shows, from top to bottom: a **+** button, the **Active Timer**, then **Recent Timers**.
4. The **+** button starts a new loop timer. Work defaults to **30 minutes** and rest defaults to **2 minutes**.
5. Opening a timer shows a full-screen countdown in **MM:SS** (`00:00`), with a work phase and a rest phase that repeat until the user stops.
6. Each recent timer has a **play** button that runs that same work and rest pair again from the start.

This is a static React app. Timers live in the browser. There is no backend, account, or sync.

---

### Sidebar

| Order | Menu               | Type            | Icon (suggested) | Route                        |
|-------|--------------------|-----------------|------------------|------------------------------|
| 2     | Health             | Parent (expand) | Heart / Pulse    | —                            |
| 2.1   | Protein Calculator | Child           | Calculator       | `/health/protein-calculator` |
| 2.2   | Work Timer         | Child           | Timer            | `/health/work-timer`         |

Use the existing icon library (Lucide). Health already exists; add Work Timer as its second child. Leave every other menu item unchanged.

---

### Acceptance Criteria

#### Sidebar — Work Timer

- [ ] **Work Timer** appears indented under **Health**, directly below **Protein Calculator**, with a Timer icon before the label.
- [ ] Clicking **Work Timer** opens `/health/work-timer`.
- [ ] When the Work Timer page is active, **Health** stays expanded and **Work Timer** is highlighted as active.
- [ ] The header title on that route is **Work Timer**.
- [ ] The icon matches the other menu icons: same library, hover behavior, active color, and light and dark mode.
- [ ] The route works on GitHub Pages with the app's existing router setup.

#### Default page

The default page is the list at `/health/work-timer`. Sections stack in this order:

1. A **+** button with a plus icon, aligned to the top of the page.
2. **Active Timer** — the timer that is playing or paused right now.
3. **Recent Timers** — timers the user has run before. Each row has a play icon button.

- [ ] The **+** button is the first control on the page and shows a plus icon.
- [ ] With nothing running, **Active Timer** shows a short empty line: "No timer playing."
- [ ] With nothing saved, **Recent Timers** shows a short empty line: "No recent timers."
- [ ] While a timer is playing, **Active Timer** shows the phase icon, the phase name (**Work** or **Rest**), and the remaining time in `00:00`.
- [ ] While a timer is paused, **Active Timer** stays in that section and shows **Paused** with the frozen remaining time.
- [ ] Clicking the active timer opens the timer screen.
- [ ] A recent row shows the work length and the rest length (for example, **30:00 work · 02:00 rest**) and a play icon button.
- [ ] Recent rows are ordered by last played, newest first.
- [ ] The same work and rest lengths appear once. Playing or creating that pair again moves the existing row to the top and updates when it was last played.
- [ ] The list keeps the **10** most recent pairs. A new pair past that drops the oldest.
- [ ] **Play** on a recent row starts that pair from the beginning of **Work** and opens the timer screen.
- [ ] Only one timer is active. Starting another timer stops the one that was playing or paused and leaves both pairs in Recent Timers.
- [ ] The default page uses the existing light and dark theme tokens.
- [ ] The layout works on desktop, tablet, and mobile. On a narrow screen the three sections stay stacked and the **+** button remains at the top.

#### Create a timer (+)

- [ ] **+** opens a small form with two fields:

| Field          | Type   | Default | Rules                                      |
|----------------|--------|---------|--------------------------------------------|
| Work minutes   | Number | 30      | Whole minutes, 1–99                        |
| Rest minutes   | Number | 2       | Whole minutes, 1–99                        |

- [ ] Both fields are required. An empty or out-of-range value shows an inline message, and nothing starts.
- [ ] **Start** saves the pair, makes it the active timer at the beginning of **Work**, adds or updates it in Recent Timers, and opens the timer screen.
- [ ] **Cancel** closes the form and leaves the active timer and the recent list unchanged.

#### Timer screen

- [ ] The screen shows the remaining time in **minutes:seconds**, zero-padded, as `00:00` (examples: `30:00`, `02:00`, `00:03`).
- [ ] The screen shows the phase name and one phase icon:
  - **Work** uses a work icon (suggested: Briefcase) and the line "Focus on your work."
  - **Rest** uses a rest icon (suggested: Footprints) and the line "Stand up and walk."
- [ ] **Work** fills the screen with a calm green background for the whole work block except the last 3 seconds.
- [ ] When **3 seconds** remain in **Work** (`00:03`, `00:02`, `00:01`), the background flashes a calm red.
- [ ] At `00:00` of **Work**, the phase becomes **Rest**, the clock resets to the rest length (default `02:00`), the rest icon and line appear, and the background becomes a steady calm blue.
- [ ] When **3 seconds** remain in **Rest**, the background flashes a calm green so the return to work is visible.
- [ ] At `00:00` of **Rest**, the phase becomes **Work** again, the clock resets to the full work length (default `30:00`), and the calm green work screen returns.
- [ ] The loop repeats until the user pauses or stops.
- [ ] The flash is a slow pulse between the phase color and the warning color, about once per second. With reduced motion, those 3 seconds use a steady warning color and do not pulse.
- [ ] The phase colors cover the timer screen in both light and dark mode so the phase stays obvious.
- [ ] The digits stay large enough to read across the room on desktop and still fit on a narrow screen.

#### Timer controls

Shown on the timer screen:

| Control | When                         | Result                                                                 |
|---------|------------------------------|------------------------------------------------------------------------|
| Pause   | Playing                      | Freezes the clock. The background stays the current phase color and does not flash. |
| Resume  | Paused                       | Continues from the frozen time. The last-3-seconds flash applies again if still inside that window. |
| Stop    | Playing or paused            | Ends the session, clears **Active Timer**, leaves the pair in **Recent Timers**, and returns to the default page. |

- [ ] Pause, Resume, and Stop are icon buttons with accessible names.
- [ ] Stop on the first second of a brand-new timer still keeps that pair in Recent Timers.

#### Saved data

Store timers in `localStorage` under the key `work-timer`.

```json
{
  "recent": [
    {
      "id": "timer-id",
      "workSeconds": 1800,
      "restSeconds": 120,
      "lastPlayedAt": "2026-11-20T00:00:00.000Z"
    }
  ],
  "active": {
    "timerId": "timer-id",
    "phase": "work",
    "remainingSeconds": 1800,
    "status": "playing",
    "updatedAt": "2026-11-20T00:00:00.000Z"
  }
}
```

- [ ] `workSeconds` and `restSeconds` are the full phase lengths. Defaults are `1800` and `120`.
- [ ] `phase` is `work` or `rest`. `status` is `playing` or `paused`.
- [ ] `active` is `null` when nothing is playing or paused.
- [ ] Ids are unique strings generated in the browser. Timestamps are ISO-8601.
- [ ] If the stored value is missing or invalid, start with an empty recent list and no active timer.
- [ ] A reload restores Recent Timers and the active session from the saved remaining time. It does not skip ahead for time spent while the tab was closed.
- [ ] Countdown, phase changes, the 3-second warning, and the recent-list rules live in plain functions that can be unit tested without rendering the page.

---

### Out of Scope

- More than one running timer
- Sound, notifications, or changing the browser tab title
- Naming a timer, editing a saved pair, or deleting a recent row
- Extra phases beyond work and rest
- Session history, streaks, or stats
- Accounts and syncing timers across devices

---

### Definition of Done

- [ ] **Work Timer** is under **Health** and `/health/work-timer` renders inside the existing shell.
- [ ] The default page shows the **+** button, then **Active Timer**, then **Recent Timers** with a play button on each row.
- [ ] A new timer defaults to 30 minutes of work and 2 minutes of rest, and those values can be changed before start.
- [ ] The timer screen counts down in `00:00`, uses a calm green work screen, flashes calm red for the last 3 seconds of work, then runs the rest screen, and loops.
- [ ] Work and rest each show their own icon and line.
- [ ] Pause, resume, and stop behave as specified, and recent timers survive a reload.
- [ ] Unit tests cover defaults, the work-to-rest and rest-to-work transitions, the last-3-seconds warning, and recent-list ordering.
- [ ] Light mode, dark mode, and a narrow viewport were checked on the default page and the timer screen.
- [ ] Protein Calculator and the other existing routes still behave as before.
