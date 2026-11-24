# Design

## Context

Entertainment is a sidebar group whose only child is Music. `src/shell/Sidebar.tsx` forces that group open with `isMusicRoute` (`/entertainment/music` and paths under it) and collapses the manual open flag when the user leaves a music path. `src/shell/Header.tsx` uses the same predicate, so any music path is titled Music. `isMusicRoute` does not match `/entertainment/pickleball`, and the header falls through to Home for an unknown path. `src/App.tsx` renders pages in `AppShell`'s `<main className="shell-body">`. An active music queue still mounts `PlayerChrome` and shrinks that outlet. Icons come from `lucide-react`. `src/main.tsx` uses `BrowserRouter` with `import.meta.env.BASE_URL`, and the Pages build still copies `index.html` to `dist/404.html`. Vitest is the test runner. There is no canvas or 3D dependency. See proposal.md for why this page exists, and `specs/pickleball/spec.md` for the behavior.

## Goals / Non-Goals

**Goals:**

- Add Pickleball as the second Entertainment child without treating that route as Music.
- Keep the rally, the score, and the zoom limits in pure functions of elapsed time and a zoom value.
- Draw one angled court in the outlet, and stop that draw when the route unmounts.
- Leave the music player chrome, the other routes, and the Pages fallback alone.

**Non-Goals:**

- A scene graph, a physics engine, or a new 3D package.
- Running the rally from `AppShell`, or preserving the score after the user leaves the route.
- Sound, input that moves a player, or storage.

## Decisions

### Entertainment gains one child, and Music stays Music

Export `pickleballPath` as `/entertainment/pickleball` from `src/pickleball/paths.ts`. The Entertainment child list is Music, then Pickleball. Pickleball is a `NavLink` with the Lucide `CircleDot` icon and the existing `nav-link nav-child` classes, so hover, stroke, accent color, and both themes come from the current nav CSS.

The forced-open check becomes "music route or pickleball path." Leaving either path still clears the manual open flag. `isMusicRoute` is unchanged, so Search and playlist URLs stay titled Music, `data-music-nav` stays off on Pickleball, and the player chrome does not treat this page as the music screen. The header title map gains `Pickleball` for `pickleballPath`. The route is `entertainment/pickleball` beside the music routes.

A second entertainment-menu spec was rejected because `openspec/specs` has no such capability. Folding Pickleball into `isMusicRoute` was rejected because the header would read Music.

### One pure rally, sampled by elapsed time

`src/pickleball/rally.ts` has no React and no canvas. Court space is feet: x is the camera's right (−10 to 10), y is far-positive (baselines at ±22, net at 0, kitchen at |y| ≤ 7). Service boxes sit between the kitchen and the baseline, split at x = 0. Camera-right is the right side in the reference, which is Esopi's and Fern's side.

`sampleRally(elapsedMs)` returns the score, the hitter, whether a paddle is in a swing, each player's position and facing, and the ball position plus its shadow point. The same input returns the same value. A rally is a fixed list of beats with durations. Tests import those boundaries instead of copying milliseconds.

The opening rally, far team serving:

1. Esopi serves from behind the far baseline (y > 22). The ball lands in the near-right service box (x > 0, between the near kitchen and the near baseline), the box in front of Fern.
2. Fern hits cross-court. The ball lands on the far-left side, in front of Esemem.
3. Esemem hits it back. Both teams step toward the kitchen.
4. Two dinks, DaVinci then Esopi. Each dink is short and low. The hitter's feet stay at |y| ≥ 7 until that ball's bounce, and may move inside the kitchen only after the bounce.
5. DaVinci hits a deeper ball past Esopi. Esopi steps toward it and stays short of the landing. The ball bounces twice on the far side. The near score increases by one when the second bounce finishes.
6. All four walk to their ready spots. The next rally starts.

The following rally mirrors that exchange: Fern serves from behind the near baseline into the far-right service box, Esopi returns cross-court, DaVinci approaches, Esemem then Fern dink, and Esemem hits the winner past Fern. The far score increases by one. The two scripts then repeat. Score during a rally is the points already finished. Opening the page at elapsed 0 is the start of Esopi's serve at 0–0.

Those landing boxes follow the spec's named boxes (Fern receives the first serve, Esopi's side receives the second). Swapping them onto the opposite half to make a geometric diagonal was rejected because Fern would no longer be the player at the first bounce.

`restFrame()` is the ready spots, no swing, score 0–0, and the ball held above the court center. Reduced motion draws that frame and never calls `sampleRally`.

A physics engine was rejected because the spec is a scripted loop, and a simulation would make the hitter and the landing unrepeatable.

### The clock belongs to the page

`src/pages/PickleballPage.tsx` owns the route. While it is mounted and reduced motion is off, `requestAnimationFrame` sets elapsed to `now - start` and draws `sampleRally`. Cleanup cancels the frame. Unmounting is what stops the rally; the loop is not registered on `AppShell`. The next mount uses a new start, so the score is 0–0 again.

`matchMedia('(prefers-reduced-motion: reduce)')` is read on mount and on `change`. When it matches, no frame is scheduled and the canvas shows `restFrame()`. A hidden tab may deliver a late frame; drawing from elapsed time jumps to the correct beat, which this spec wants. The work timer's refusal to catch up does not apply here.

### Zoom is a scale around the court center

`src/pickleball/camera.ts` holds the zoom value and nothing about the rally. Default scale is 1. The near limit is 2. The far limit is 0.7. A button step is 0.15. `zoomIn` and `zoomOut` return the clamped value. A control is disabled when a step would not change the value.

The pointer wheel over the court and a two-pointer pinch apply a ratio through the same clamp. `+` and `−` (and `=` / `_`) call the same steps while the page is mounted, unless the event target is an input, textarea, select, or contenteditable element, or Ctrl, Meta, or Alt is held. Reset sets the scale to 1.

The page keeps the scale in a ref that the frame reads, and in state so the buttons can disable. Changing it does not reset `start`. The rally module never reads the scale.

CSS `transform: scale` on a snapshot was rejected because the players and the ball have to move, and wheel limits would fight page scroll. A perspective camera was rejected because the reference is an oblique view: zooming is a larger or smaller drawing of the same center, and zooming out reveals more floor.

### One canvas in the outlet

The page fills `.shell-body` with a canvas and a corner stack of icon buttons (`ZoomIn`, `ZoomOut`, `RotateCcw`) named "Zoom in", "Zoom out", and "Reset". A scoreboard over the canvas names "Esemem · Esopi" and "DaVinci · Fern" with their scores. The scoreboard uses the theme tokens on a translucent panel so it stays readable in both themes. Its text updates only when the score changes, not on every frame. The canvas is `aria-hidden`. The buttons and the scoreboard are the accessible surface.

`drawCourt` projects feet through a fixed oblique matrix, scaled by the zoom and by the canvas size so the default view fits the full court, both benches, the fence, both plants, and the full **PICKLEBALL COURT** sign. The reference photo crops that sign and adds likes and comments; those are not drawn. Zooming in enlarges the same center. Zooming out shrinks it and shows more of the blue-gray floor. A `ResizeObserver` refits the canvas on a narrow outlet, including when the music player bar has reserved space. The buttons stay in the corner, outside the scaled drawing.

Scene colors are constants, not theme tokens: blue court, green kitchen, white lines, wood benches, gray fence, green plants, white ball, orange ring under the player about to hit. During the reset beat the ring sits under the next server. Players are stacked boxes with the spec's hair and shirt colors, a paddle that rotates only while that player's swing flag is set, and a name drawn above the head. The ball's shadow is the same x,y at height 0. The net is a band on y = 0 that is drawn before the players so a player is never painted crossing it; the sampled feet never change sign of y during a point.

Three.js was rejected. The testable behavior is the sample and the zoom clamp, the figures are boxes, and the app has no 3D stack.

### Tests stay off the canvas

`src/pickleball/rally.test.ts` covers the opening serve landing inside the near-right service box, Fern then Esemem then DaVinci as the hitters of the opening rally, the near score after that point, Fern's serve into the far-right box, the far score after the second point, and `restFrame()` at 0–0 with the ball above center. `src/pickleball/camera.test.ts` covers the default, both limits, a disabled extra step, reset, and a wheel or pinch ratio that cannot pass a limit. `src/shell/Sidebar.test.tsx` and the header assertion gain the child under Music, the forced-open group on `/entertainment/pickleball`, and the title Pickleball. A page render asserts the three accessible button names and that a reduced-motion match draws without starting a frame. No browser runner. `npm test` is the existing Vitest script.

## Risks / Trade-offs

- [An oblique canvas is a simpler picture than the reference render] → The spec's objects are boxes, lines, and a sign. Drawing those as projected boxes matches the reference without a scene graph. A 3D package can replace `drawCourt` later without changing `sampleRally`.
- [A late frame after a hidden tab jumps the rally forward] → Elapsed time is the source of truth in this spec. Pausing while hidden would desync the sample from the visit clock.
- [React Strict Mode mounts the effect twice in development] → Cleanup cancels the frame. The second mount starts a new clock at 0–0.
- [The music player bar shortens the outlet] → The canvas fits the outlet it is given. The page does not hide `PlayerChrome`.
- [Wheel zoom fights page scroll] → The wheel listener is non-passive and only on the court, and it calls `preventDefault`.
- [`isMusicRoute` stays narrow] → Pickleball must be added everywhere the Entertainment group is forced open. Missing one of those sites collapses the group or titles the page Home. The sidebar test covers the forced-open path and the title.

## Migration Plan

1. Add the path, the rally sample, the camera clamp, and their unit tests.
2. Add the page, the canvas draw, the route, the header title, and the second Entertainment child.
3. Confirm `npm test` and `npm run build`. The build still emits `dist/404.html`.
4. Merging to `main` publishes through the existing workflow. No Pages setting changes.
5. Rollback is reverting the commit. There is no stored pickleball data.

## Open Questions

None. The child is beside Music, the rally is a pure function of elapsed time, zoom is a clamped scale that does not reset that clock, and the picture is a canvas in the outlet.
