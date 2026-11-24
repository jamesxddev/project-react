# Spec Delta

## Purpose

Let people open Pickleball under Entertainment and watch a looping doubles rally on a court they can zoom, without controlling a player.

## ADDED Requirements

### Requirement: Pickleball sits under Music
The Entertainment menu SHALL list Pickleball indented directly under Music. Pickleball SHALL show a circle-dot icon immediately before its label. That icon SHALL use the same icon set, hover behavior, selected color, and light and dark treatment as the other menu icons. Activating Pickleball SHALL open `/entertainment/pickleball`. Music SHALL remain the Entertainment child above Pickleball, and every other existing menu item SHALL keep its current label, order, and destination.

#### Scenario: Pickleball follows Music
- **WHEN** Entertainment is expanded
- **THEN** Music is listed under Entertainment
- **THEN** Pickleball is the next item, indented under Entertainment
- **THEN** a circle-dot icon is shown immediately before the Pickleball label

#### Scenario: Pickleball opens its page
- **WHEN** the user activates Pickleball
- **THEN** the app shows the Pickleball page at `/entertainment/pickleball`

#### Scenario: Other destinations stay in place
- **WHEN** the sidebar lists primary navigation
- **THEN** Music still opens `/entertainment/music`
- **THEN** Home, Health, Projects, Settings, and the other existing items keep their current order and destinations

#### Scenario: The icon matches the rest of the menu
- **WHEN** the user points at Pickleball, and when Pickleball is selected, in light mode and in dark mode
- **THEN** the Pickleball icon follows the same hover behavior, active color, and visibility as the other menu icons

### Requirement: The active Pickleball page keeps Entertainment open
While `/entertainment/pickleball` is the current page, Entertainment SHALL stay expanded and Pickleball SHALL be the selected navigation item. The header SHALL show Pickleball as the current page title. Opening or refreshing `/entertainment/pickleball` on the published site SHALL show this page.

#### Scenario: Direct visit selects Pickleball
- **WHEN** the current page is `/entertainment/pickleball`
- **THEN** Entertainment is expanded
- **THEN** Pickleball is shown as selected
- **THEN** the header title is Pickleball

#### Scenario: Published route loads the page
- **WHEN** the user opens or refreshes `/entertainment/pickleball` on the published site
- **THEN** the Pickleball page is shown

### Requirement: The court scene fills the page
The Pickleball page body SHALL be an angled overhead view with the court centered. The scene SHALL show a blue court with white baselines, sidelines, a centerline, and service boxes; a green kitchen along both sides of the net; a net across the middle of the court; wooden benches along the sides; a low fence around the court; two green plants by the fence; and a sign on the right that reads **PICKLEBALL COURT**. The page SHALL NOT show likes, comments, or other social-app chrome from the reference picture. The page shell SHALL use the existing light and dark theme. The court, kitchen, and sign SHALL keep those reference colors in both themes so the court stays readable. On a narrow screen the court SHALL scale down to fit the page, and the zoom controls SHALL remain on screen.

#### Scenario: The reference court is visible
- **WHEN** the user opens `/entertainment/pickleball` at the default zoom
- **THEN** the view is an angled overhead view with the court centered
- **THEN** the blue court, white court lines, green kitchen, net, benches, fence, two plants, and the **PICKLEBALL COURT** sign are visible
- **THEN** no likes, comments, or social-app frame are shown

#### Scenario: Court colors survive both themes
- **WHEN** the user views the court in light mode and in dark mode
- **THEN** the court stays blue and the kitchen stays green in both themes
- **THEN** the court lines and the sign remain readable in both themes

#### Scenario: A narrow screen keeps the court and the controls
- **WHEN** the user views the page on a narrow screen
- **THEN** the court is scaled down so it fits
- **THEN** the zoom controls remain on screen

### Requirement: Four named players stand in doubles
The court SHALL show exactly four blocky players, each with a paddle and a name label that follows that player. Esemem and Esopi SHALL be the far team. DaVinci and Fern SHALL be the near team. At the ready positions, Esemem SHALL stand far left with dark hair in a bun, a blue shirt, and dark pants; Esopi SHALL stand far right with brown hair, a white shirt, and dark pants; DaVinci SHALL stand near left-center with dark hair, a white shirt, and dark pants; and Fern SHALL stand near right with green hair, a blue shirt, and dark pants. A ring SHALL mark the player who is about to hit. No other players SHALL appear.

#### Scenario: Ready positions and teams
- **WHEN** the rally is at the ready positions
- **THEN** Esemem is far left and Esopi is far right
- **THEN** DaVinci is near left-center and Fern is near right
- **THEN** each player shows a paddle and a name label of Esemem, Esopi, DaVinci, or Fern

#### Scenario: The next hitter is marked
- **WHEN** a player is about to hit
- **THEN** a ring is shown at that player's feet
- **THEN** the other three players do not show that ring

### Requirement: The user watches and does not play
The page SHALL play the match for the user. The user SHALL NOT control a player, choose a shot, or play against the computer. The page SHALL NOT offer a second court, singles, more than four players, sound, accounts, saved matches, or online play.

#### Scenario: No play controls
- **WHEN** the user is on `/entertainment/pickleball`
- **THEN** the page offers no control that moves a player or chooses a shot
- **THEN** the only view controls are zoom in, zoom out, and reset

### Requirement: A doubles rally loops
While the page is open and the user has not requested reduced motion, the four players SHALL play a repeating doubles rally. Players SHALL step toward the ball. Waiting players SHALL shift their weight. Only the player who is hitting SHALL swing, and that paddle SHALL return to a ready pose after the swing. The ball SHALL be a small white sphere with a shadow on the court. It SHALL arc, cross above the net, and bounce inside the opposite court. During a point, each player's feet SHALL stay on that player's side of the court, and no player SHALL pass through the net. A serve SHALL start from behind the server's baseline and SHALL land in the diagonal service box. The loop SHALL NOT stop on its own. After each point the players SHALL walk back to their ready spots, the winning side's score SHALL increase by one, and the next rally SHALL start.

#### Scenario: Only the hitter swings
- **WHEN** one player is hitting the ball
- **THEN** that player swings a paddle
- **THEN** the other three players do not swing
- **THEN** the hitter's paddle returns to a ready pose after the swing

#### Scenario: The ball crosses and bounces in court
- **WHEN** a shot is played during a rally
- **THEN** the ball arcs over the net
- **THEN** the ball bounces inside the opposite court
- **THEN** a shadow on the court shows the ball's height

#### Scenario: Feet stay on one side
- **WHEN** a point is in progress
- **THEN** each player remains on that player's own side of the net
- **THEN** no player passes through the net

#### Scenario: The loop continues after a point
- **WHEN** a point ends and the players have returned to their ready spots
- **THEN** the winning side's score is one higher
- **THEN** another rally starts without a user action

### Requirement: The opening rally
The first rally SHALL be played by the far team serving. Esopi SHALL serve from behind the far baseline, and the ball SHALL bounce in the near right service box. Fern SHALL step to that bounce and hit cross-court so the ball bounces on the far side. Esemem SHALL move to the ball and hit it back, and both teams SHALL step up toward the kitchen line. The ball SHALL then cross the net twice as a short, low dink. During each dink, the hitter SHALL stay behind the kitchen line until the ball has bounced, and MAY step in only after that bounce. DaVinci SHALL then hit a deeper ball past Esopi. Esopi SHALL move toward that ball and SHALL NOT reach it. The ball SHALL bounce twice, and the rally SHALL end. The near team's score SHALL increase by one.

#### Scenario: The serve lands in the near right service box
- **WHEN** the opening rally starts
- **THEN** Esopi is behind the far baseline
- **THEN** Esopi swings
- **THEN** the ball bounces in the near right service box

#### Scenario: The return and the approach
- **WHEN** the serve has bounced in the near right service box
- **THEN** Fern steps to the bounce and hits cross-court
- **THEN** the ball bounces on the far side
- **THEN** Esemem moves to the ball and hits it back
- **THEN** both teams step toward the kitchen line

#### Scenario: Dinks stay behind the kitchen until the bounce
- **WHEN** a dink is hit in the opening rally
- **THEN** the ball crosses the net as a short, low shot
- **THEN** the hitter is behind the kitchen line until the ball has bounced

#### Scenario: DaVinci wins the opening point
- **WHEN** the opening rally reaches its last shot
- **THEN** DaVinci hits a deeper ball past Esopi
- **THEN** Esopi moves toward the ball and does not reach it
- **THEN** the ball bounces twice
- **THEN** the near team's score increases by one

### Requirement: The sides alternate serves and points
After the near team wins a point, the next rally SHALL be served by Fern from behind the near baseline into the far right service box. That rally SHALL be the same kind of exchange: a serve, a return, an approach toward the kitchen, two dinks, and a point the receiving side does not reach. The far team SHALL win that point, and the far team's score SHALL increase by one. The two rallies SHALL then repeat, with Esopi serving the rallies the near team wins and Fern serving the rallies the far team wins. The score SHALL start at 0–0 when the page opens.

#### Scenario: Fern serves the second rally
- **WHEN** the near team has just won the opening point and the players are back at their ready spots
- **THEN** Fern serves from behind the near baseline
- **THEN** the serve bounces in the far right service box

#### Scenario: The far team wins the second point
- **WHEN** the second rally ends
- **THEN** the far team's score increases by one
- **THEN** the near team's score is unchanged from the end of the opening rally

#### Scenario: The score starts level
- **WHEN** the user opens `/entertainment/pickleball`
- **THEN** the scoreboard shows 0–0

### Requirement: A scoreboard stays readable over the court
The page SHALL show a scoreboard over the scene naming the far team as Esemem and Esopi and the near team as DaVinci and Fern, with each team's score. The scoreboard SHALL stay readable over the court in light mode and in dark mode.

#### Scenario: Both teams are named
- **WHEN** the user views the Pickleball page
- **THEN** the scoreboard shows Esemem and Esopi on one side
- **THEN** the scoreboard shows DaVinci and Fern on the other side
- **THEN** each side shows its score

### Requirement: Rally state follows elapsed time
While the page is open and reduced motion is off, the hitter, each player's position, the ball, and the score SHALL be determined by the elapsed time of the visit. The same elapsed time SHALL produce the same hitter, positions, and score, and that result SHALL be decidable without drawing the court.

#### Scenario: The same moment plays the same way
- **WHEN** two visits are compared at the same elapsed time during a rally
- **THEN** both show the same hitter
- **THEN** both show the same player positions and the same score

### Requirement: The rally runs only while the page is open
The rally SHALL advance only while `/entertainment/pickleball` is the current page. Leaving that route SHALL stop the rally so it does not keep advancing. Opening the page SHALL start the score at 0–0 and begin the opening rally.

#### Scenario: Leaving stops the rally
- **WHEN** the user leaves `/entertainment/pickleball` during a rally
- **THEN** the rally stops advancing

#### Scenario: Returning starts from the opening score
- **WHEN** the user opens `/entertainment/pickleball` again
- **THEN** the score is 0–0
- **THEN** the opening rally is playing or ready to play

### Requirement: Reduced motion shows a still court
When the user prefers reduced motion, the page SHALL show the ready court, the four players at their ready spots, and the ball at rest above the center of the court. It SHALL NOT play the rally, move the players, or change the score. The score SHALL stay 0–0.

#### Scenario: Reduced motion does not play
- **WHEN** the user opens `/entertainment/pickleball` with reduced motion preferred
- **THEN** the four players are at their ready spots
- **THEN** the ball is at rest above the center of the court
- **THEN** the score stays 0–0
- **THEN** no player swings and the ball does not travel

### Requirement: Zoom changes only the camera
The page SHALL show Zoom in, Zoom out, and Reset as icon buttons with accessible names, placed over the court. The default view SHALL show the full court, benches, fence, plants, and sign. Zoom in SHALL move the camera closer so the players, paddles, ball, net, and kitchen stay recognizable. Zoom out SHALL move the camera back so more of the floor around the fence is visible. The court SHALL stay centered while zooming. Zoom SHALL stop at a near limit and a far limit. The control that would pass a limit SHALL be disabled. Reset SHALL return to the default view. The pointer wheel over the court, a pinch on a touch screen, **+**, and **−** SHALL zoom between the same limits. **+** and **−** SHALL apply only while the page is open and the user is not typing in another control. Zoom SHALL NOT restart the rally, move the players, or change the score.

#### Scenario: Default view frames the whole court
- **WHEN** the user opens the page and has not zoomed
- **THEN** the full court, benches, fence, plants, and sign are visible

#### Scenario: Zoom in and zoom out stay centered
- **WHEN** the user zooms in and then zooms out
- **THEN** the camera moves closer and then farther
- **THEN** the court remains centered
- **THEN** the players, paddles, ball, net, and kitchen stay recognizable at the closer view
- **THEN** the farther view shows more floor around the fence than the default view

#### Scenario: Limits disable the extra step
- **WHEN** the camera is at the near limit
- **THEN** Zoom in is disabled
- **WHEN** the camera is at the far limit
- **THEN** Zoom out is disabled

#### Scenario: Reset restores the default view
- **WHEN** the user has zoomed in and then activates Reset
- **THEN** the view returns to the default framing

#### Scenario: Wheel, pinch, and keys use the same limits
- **WHEN** the user scrolls the pointer wheel over the court, pinches the court, or presses **+** or **−** while the page is open and focus is not in another control
- **THEN** the camera zooms between the same near and far limits as the buttons

#### Scenario: Zoom leaves the rally alone
- **WHEN** the user zooms during a rally
- **THEN** the hitter, player positions, ball, and score continue as they would have without the zoom
- **THEN** the rally does not restart
