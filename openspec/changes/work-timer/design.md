# Design

## Context

Health is already a sidebar group. `src/shell/Sidebar.tsx` forces that group open only when the path is `/health/protein-calculator`, and it collapses the group when the user leaves that path. `src/shell/Header.tsx` maps that path to the header title. `src/App.tsx` renders it inside `AppShell`, whose `<main className="shell-body">` is the outlet. Icons already come from `lucide-react`. `src/main.tsx` uses `BrowserRouter` with `import.meta.env.BASE_URL`, and the Pages build still copies `index.html` to `dist/404.html`. Vitest is already the test runner. Music persistence parses `localStorage` through an injectable storage object and returns an empty value when the stored text is missing or invalid. See proposal.md for why this timer exists, and `specs/work-timer/spec.md` for the behavior.

## Goals / Non-Goals

**Goals:**

- Add Work Timer as the second Health child without a new router or icon package.
- Keep countdown, phase changes, the last-3-seconds warning, and recent-list rules in pure functions.
- Persist the spec's `work-timer` document and restore the saved remaining time with no catch-up.
- Cover the outlet with the phase color while leaving the sidebar selection and header title in place.

**Non-Goals:**

- A countdown route, a global timer provider, or ticking while another page is open.
- Deriving remaining time from `updatedAt` or from wall-clock time.
- Sound, notifications, tab-title changes, naming, editing, deleting, or a second running timer.
- Changing the music player chrome or the GitHub Pages fallback.

## Decisions

### The same Health group gains one child

Export `workTimerPath` as `/health/work-timer` beside `proteinCalculatorPath`. Treat either path as a Health route. `healthForced` is true for both, so Work Timer keeps the group open and selected the same way Protein Calculator does. Leaving a Health route still clears the manual open flag.

The child list order is Protein Calculator, then Work Timer. Work Timer is a `NavLink` with the Lucide `Timer` icon and the existing `nav-link nav-child` classes, so hover scale, stroke, accent color, and light and dark mode come from the current nav CSS. The header title map gains `Work Timer` for that path.

A separate Health spec delta was rejected because `openspec/specs` has no `health-menu` capability to modify. A new icon package was rejected because Lucide is already the sidebar set.

### One route, two views

`src/pages/WorkTimerPage.tsx` owns the route `health/work-timer`. A local flag chooses the list or the timer screen. Start, play, and activating the active row set that flag. Stop clears it and returns to the list. Refresh always paints the list, with the restored active row when one exists.

A nested countdown route was rejected because the spec restores the session on the default page and does not require the timer screen to survive refresh. A full-viewport layer was rejected because it would cover the sidebar and header, which must stay showing Work Timer as selected.

The timer screen fills `.shell-body`. Phase color is the background of that view. The shell, including the music player chrome, stays mounted.

### Pure timer rules

`src/health/work-timer.ts` holds the types and the rules. No React.

- A recent entry is `{ id, workSeconds, restSeconds, lastPlayedAt }`. An active session is `{ timerId, phase, remainingSeconds, status, updatedAt }` or `null`. `phase` is `work` or `rest`. `status` is `playing` or `paused`.
- `formatClock` prints zero-padded `MM:SS`.
- `isWarning` is true only when remaining seconds are 3, 2, or 1.
- `tick` subtracts one second while playing. When remaining is 1, that step lands on the other phase at that pair's full length, with the warning off. The stored state never sits on 0. The screen therefore goes from `00:01` to the next phase's full clock, which is the spec's reset at `00:00`.
- `upsertRecent` matches on `workSeconds` and `restSeconds`, updates `lastPlayedAt`, moves that row to the front, and keeps 10 rows. A new pair uses `crypto.randomUUID()`.
- `startPair` and `playRecent` upsert the pair, set the only active session to Work at the full work length and `playing`, and leave every other pair in `recent`.
- `pause` sets `paused` and keeps `remainingSeconds`. `resume` sets `playing` without changing remaining. `stop` sets `active` to `null` and leaves `recent` as it is.
- Minute fields accept only whole numbers from 1 through 99. Empty, fractional, and out-of-range values are invalid. Defaults are 30 and 2, stored as 1800 and 120 seconds.

### Storage does not catch up

`src/health/work-timer-storage.ts` follows the music storage shape: `parseWorkTimer`, `loadWorkTimer`, and `saveWorkTimer`, with an injectable `getItem` / `setItem`. The key is `work-timer`. Missing text, invalid JSON, or a value that fails the shape check returns `{ recent: [], active: null }`. Timestamps are `new Date().toISOString()`.

Reload uses `active.remainingSeconds` as stored. `updatedAt` is written and never subtracted. A wall-clock delta was rejected because a closed or throttled tab would skip ahead, which the spec forbids.

The page writes storage on start, play, pause, resume, stop, and each tick.

### The clock lives on this page

While the page is mounted, status is `playing`, and `document.visibilityState` is `visible`, a `setInterval` of 1000ms calls `tick` and saves. The effect clears the interval on cleanup. `visibilitychange` to `hidden` clears it and saves the current remaining time. Becoming visible starts the interval again from that saved value and does not subtract the hidden time.

The interval does not move to `AppShell`. Leaving `/health/work-timer` unmounts the page, so other routes do not consume remaining time, and a playing session is still there when the user comes back. An app-wide provider was rejected because the spec does not ask the timer to run off this page.

### Screen, form, and controls

The list is a column: a plus button (`aria-label` "Add timer"), Active Timer, then Recent Timers. Empty copy is the spec text. The active row is a button showing the phase icon, Work or Rest, the clock, and the word Paused when status is paused. Lucide icons are `Briefcase` and `Footprints`. Each recent row shows `formatClock(workSeconds) work · formatClock(restSeconds) rest` and a play icon button named "Play".

The create form is an inline panel, not a route. Fields are controlled number inputs. Validation runs on Start. An invalid field sets `aria-invalid` and shows its message under the field. Cancel closes the panel and does not write state.

The timer screen shows one phase icon, the phase name, the spec line ("Focus on your work." or "Stand up and walk."), and the clock at `clamp(4.5rem, 16vw, 9rem)` so it stays large on a desktop and fits a narrow width. Pause, Resume, and Stop are icon buttons with those accessible names. Pause is shown only while playing. Resume is shown only while paused. Stop is shown in both. Pause drops the warning class so the background stays the phase color. Resume inside the last 3 seconds adds the warning class again.

### Phase color is not the theme accent

`src/index.css` gains timer variables on both themes: a calm green for work, a calm blue for rest, a calm red for the work warning, and a calm green for the rest warning, plus a light text color that stays readable on those fills. The timer view sets its background from the phase. The warning animation alternates the phase color and the warning color over about one second. `@media (prefers-reduced-motion: reduce)` turns the animation off and holds the warning color. The list keeps using the existing theme tokens.

Reusing `--accent` was rejected because the accent is blue and would not distinguish work, rest, and the warning.

### Tests stay on the pure module and the sidebar

`src/health/work-timer.test.ts` covers the default lengths, a one-second step that is not a warning, a warning at 3, 2, and 1 seconds, both phase transitions, pause and resume, stop keeping the row, unique pairs, newest-first order, the 10-row cap, invalid storage, and a restore that returns the saved remaining time after a later timestamp. `src/shell/Sidebar.test.tsx` gains the Work Timer child under Protein Calculator, the forced-open group, and the header title. No browser runner. The existing `npm test` script already runs Vitest, including on the Pages workflow.

## Risks / Trade-offs

- [A one-second interval drifts] → The spec counts steps, not wall-clock catch-up. Drift is accepted. Correcting from `Date.now()` was rejected because it skips ahead after sleep.
- [A hidden tab can fire a throttled interval in a burst] → Hide clears the interval and saves the current second. Visible resumes from that second.
- [React Strict Mode can mount the effect twice] → The effect returns a cleanup that clears the interval.
- [Other routes freeze a playing timer] → That matches "do not skip ahead" with a page-owned clock. The active row is still there on return. A shell provider would tick during Protein Calculator, which this design does not do.
- [Refresh closes the timer screen] → The list shows the restored session. The user opens the screen again from the active row. A second route would keep the screen, and the spec does not require that.
- [The outlet is not the browser viewport] → The sidebar and header remain visible, which the selection and title requirements need. The phase color still covers the timer view.
- [A bad `work-timer` value would crash the page] → The parser returns the empty state.

## Migration Plan

1. Add the pure module, its storage helper, and the unit tests.
2. Add the page, the route, the header title, the second Health child, and the timer CSS.
3. Confirm `npm test` and `npm run build`. The build still emits `dist/404.html`.
4. Merging to `main` publishes through the existing workflow. No Pages setting changes.
5. Rollback is reverting the commit. There is no server data. A leftover `work-timer` key in the browser is unused after rollback and can stay.

## Open Questions

None. The child placement, the single route, the page-owned clock, and the refusal to catch up from timestamps are decided above.
