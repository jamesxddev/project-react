# Proposal

## Why

Entertainment can play music, but it has nowhere to watch a game. A Pickleball page under that menu shows a looping doubles rally on a court the user can zoom, drawn in the browser, with no account or backend.

## What Changes

- Add **Pickleball** as the second child of **Entertainment**, directly under **Music**, with a CircleDot icon from the existing icon library. Selecting it opens `/entertainment/pickleball`. While that page is current, Entertainment stays expanded, Pickleball is the selected item, and the header title is Pickleball. The icon matches the other menu icons in hover, active color, and light and dark mode. Music and every other menu item stay as they are. The route uses the app's existing GitHub Pages router setup.
- The page body is an angled overhead view of the reference court: a blue court with white baselines, sidelines, centerline, and service boxes; a green kitchen along both sides of the net; a net the players never pass through; wooden benches; a low fence; two plants; and a sign that reads **PICKLEBALL COURT**. Four named blocky players stand in doubles, each with a paddle and a name label: Esemem and Esopi on the far side, DaVinci and Fern on the near side. A ring marks the player about to hit. Court colors stay the reference colors in both themes. On a narrow screen the court scales down to fit and the zoom controls stay on screen. The likes, comments, and other social chrome in the reference photo are not part of the page.
- While the page is open, a doubles rally loops. Players step toward the ball, only the hitter swings, and the ball arcs over the net and bounces in the opposite court. One rally is a serve from behind the baseline into the diagonal service box, a return, an approach, two dinks, and a point the receiver does not reach. After a short reset the players walk back, the winning side's score increases by one from **0–0**, and the other side serves. Feet stay on that player's side of the court. Rally timing, positions, the hitter, and the score live in plain functions of elapsed time. Leaving the route stops the animation. With reduced motion the page shows the ready court, the four players, and the ball at rest above the center, and it does not play the rally.
- **Zoom in**, **Zoom out**, and **Reset** are icon buttons with accessible names over the court. The default view shows the full court, benches, fence, plants, and sign. Zoom moves the camera closer or farther between a near limit and a far limit, keeps the court centered, and disables the button that would pass a limit. The pointer wheel, a pinch, and **+** / **−** use the same limits. Zoom changes only the camera. It does not restart the rally or move the players.
- Out of scope: controlling a player, playing against the computer, singles, a second court, more than four players, sound, accounts, saved matches, online play, and copying the social-app frame from the reference photo.

## Capabilities

### New Capabilities

- `pickleball`: The Pickleball child under Entertainment, the `/entertainment/pickleball` page, the court scene, the looping doubles rally and score, and camera zoom.

### Modified Capabilities

None. `openspec list --specs` is empty. Entertainment's existing Music child lives only on the `music-player` change (`entertainment-menu`), not under `openspec/specs/`. This change specifies the new child on `pickleball` so it does not add a second entertainment-menu capability.

## Impact

- Extends the sidebar and the header title map, and adds the `/entertainment/pickleball` route beside Music. A new page module owns the court, the rally, and the zoom controls. Rally and zoom rules stay in plain functions, covered by unit tests for serve placement, the hitter through one rally, the score after a point, and the zoom limits.
- No backend, database, API, or new deploy pipeline. The match is drawn in the browser. Light and dark mode and the existing shell already exist; the page uses them, including a narrow layout that scales the court.
- Music and the other existing routes keep their current behavior. Publishing stays on the current GitHub Pages setup.
