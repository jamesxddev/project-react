# Spec Delta

## Purpose

Let people run a repeating work block and a short rest from the Health menu, then start that same pair again later, without an account or a server.

## ADDED Requirements

### Requirement: Work Timer sits under Protein Calculator
The Health menu SHALL list Work Timer indented directly under Protein Calculator. Work Timer SHALL show a timer icon before its label. That icon SHALL use the same icon set, hover behavior, selected color, and light and dark treatment as the other menu icons. Activating Work Timer SHALL open `/health/work-timer`. Protein Calculator SHALL remain the Health child above Work Timer, and every other existing menu item SHALL keep its current order and destination.

#### Scenario: Work Timer follows Protein Calculator
- **WHEN** Health is expanded
- **THEN** Protein Calculator is listed under Health
- **THEN** Work Timer is the next item, indented under Health
- **THEN** a timer icon is shown immediately before the Work Timer label

#### Scenario: Work Timer opens its page
- **WHEN** the user activates Work Timer
- **THEN** the app shows the Work Timer page at `/health/work-timer`

#### Scenario: Other destinations stay in place
- **WHEN** the sidebar lists primary navigation
- **THEN** Protein Calculator still opens `/health/protein-calculator`
- **THEN** Home, Projects, Settings, and the other existing items keep their current order and destinations

### Requirement: The active Work Timer page keeps Health open
While `/health/work-timer` is the current page, Health SHALL stay expanded and Work Timer SHALL be the selected navigation item. The header SHALL show Work Timer as the current page title. Opening or refreshing `/health/work-timer` on the published site SHALL show this page.

#### Scenario: Direct visit selects Work Timer
- **WHEN** the current page is `/health/work-timer`
- **THEN** Health is expanded
- **THEN** Work Timer is shown as selected
- **THEN** the header title is Work Timer

#### Scenario: Published route loads the page
- **WHEN** the user opens or refreshes `/health/work-timer` on the published site
- **THEN** the Work Timer page is shown

### Requirement: Default page sections
The default page at `/health/work-timer` SHALL stack three sections from top to bottom: an add control, Active Timer, then Recent Timers. The add control SHALL be the first control on the page, SHALL show a plus icon, and SHALL sit at the top of the page. With no timer playing or paused, Active Timer SHALL show the line "No timer playing." With no saved timers, Recent Timers SHALL show the line "No recent timers." The page SHALL stay readable in light mode and in dark mode on desktop, tablet, and mobile. On a narrow screen the three sections SHALL stay stacked and the add control SHALL remain at the top.

#### Scenario: Empty page
- **WHEN** the user opens `/health/work-timer` with nothing stored
- **THEN** the first control is the add control with a plus icon
- **THEN** Active Timer shows "No timer playing."
- **THEN** Recent Timers shows "No recent timers."

#### Scenario: Narrow layout stays stacked
- **WHEN** the user views the default page on a narrow screen
- **THEN** the add control, Active Timer, and Recent Timers are stacked in that order
- **THEN** the add control remains at the top

#### Scenario: Both themes stay readable
- **WHEN** the user views the default page in light mode and in dark mode
- **THEN** the add control, section labels, and empty lines remain readable in both themes

### Requirement: Create form
Activating the add control SHALL open a small form with two required number fields: Work minutes, defaulting to 30, and Rest minutes, defaulting to 2. Each value SHALL be a whole number from 1 through 99. An empty value, a fraction, or a value outside that range SHALL show an inline message on that field, and SHALL NOT start a timer or change Active Timer or Recent Timers.

#### Scenario: Defaults are shown
- **WHEN** the user opens the create form
- **THEN** Work minutes is 30
- **THEN** Rest minutes is 2

#### Scenario: Invalid values do not start
- **WHEN** the user submits a work or rest value that is empty, not a whole number, less than 1, or greater than 99
- **THEN** an inline message is shown on that field
- **THEN** no timer starts
- **THEN** Active Timer and Recent Timers are unchanged

#### Scenario: Boundary values are accepted
- **WHEN** the user starts a timer with work minutes 1 and rest minutes 99
- **THEN** the timer starts
- **THEN** no inline validation message is shown

### Requirement: Start and cancel
Start SHALL save the work and rest pair, make it the active timer at the beginning of Work with the full work length remaining, add or update that pair in Recent Timers, and open the timer screen. Cancel SHALL close the form and SHALL leave the active timer and the recent list unchanged.

#### Scenario: Start opens the timer at the beginning of Work
- **WHEN** the user starts the default form
- **THEN** the active timer is in the Work phase
- **THEN** the remaining time is 30:00
- **THEN** the timer screen is shown
- **THEN** Recent Timers includes 30:00 work and 02:00 rest

#### Scenario: Cancel leaves the lists unchanged
- **WHEN** a timer is paused and the user opens the create form and then cancels
- **THEN** the form closes
- **THEN** the paused timer is still the active timer
- **THEN** Recent Timers is unchanged

### Requirement: Timer screen shows the phase
The timer screen SHALL show the remaining time as zero-padded minutes and seconds in the form `00:00`. It SHALL show the phase name and one phase icon. Work SHALL use a work icon and the line "Focus on your work." Rest SHALL use a different rest icon and the line "Stand up and walk." The digits SHALL be large enough to read across the room on a desktop and SHALL still fit on a narrow screen.

#### Scenario: Work copy
- **WHEN** the timer screen is in Work with 30 minutes remaining
- **THEN** the clock shows 30:00
- **THEN** the phase name is Work
- **THEN** one work icon is shown
- **THEN** the line "Focus on your work." is shown

#### Scenario: Rest copy
- **WHEN** the timer screen is in Rest with 2 minutes remaining
- **THEN** the clock shows 02:00
- **THEN** the phase name is Rest
- **THEN** one rest icon is shown
- **THEN** the line "Stand up and walk." is shown

#### Scenario: Seconds are zero-padded
- **WHEN** 3 seconds remain
- **THEN** the clock shows 00:03

### Requirement: Phase colors and the last three seconds
During Work, except for the last 3 seconds, the timer screen SHALL be filled with a calm green background. While 3, 2, or 1 seconds remain in Work, the background SHALL flash a calm red. During Rest, except for the last 3 seconds, the timer screen SHALL be filled with a steady calm blue background. While 3, 2, or 1 seconds remain in Rest, the background SHALL flash a calm green. The flash SHALL pulse between the phase color and the warning color about once per second. When the user prefers reduced motion, those 3 seconds SHALL use a steady warning color and SHALL NOT pulse. The phase color SHALL cover the timer screen in both light mode and dark mode. At 4 or more seconds remaining, the background SHALL stay the steady phase color.

#### Scenario: Work is green before the warning
- **WHEN** Work has 4 or more seconds remaining
- **THEN** the timer screen background is a steady calm green

#### Scenario: Work flashes red in the last three seconds
- **WHEN** Work has 3, 2, or 1 seconds remaining and reduced motion is off
- **THEN** the background pulses between calm green and calm red about once per second

#### Scenario: Rest is blue before the warning
- **WHEN** Rest has 4 or more seconds remaining
- **THEN** the timer screen background is a steady calm blue

#### Scenario: Rest flashes green in the last three seconds
- **WHEN** Rest has 3, 2, or 1 seconds remaining and reduced motion is off
- **THEN** the background pulses between calm blue and calm green about once per second

#### Scenario: Reduced motion holds a steady warning color
- **WHEN** 3, 2, or 1 seconds remain and the user prefers reduced motion
- **THEN** the background is a steady warning color
- **THEN** the background does not pulse

#### Scenario: Phase color covers both themes
- **WHEN** the user views the timer screen in light mode and in dark mode
- **THEN** the phase color covers the timer screen in both themes

### Requirement: Work and rest loop
When a playing Work phase reaches zero, the phase SHALL become Rest, the clock SHALL reset to that pair's full rest length, and the rest icon, rest line, and calm blue background SHALL appear. When a playing Rest phase reaches zero, the phase SHALL become Work, the clock SHALL reset to that pair's full work length, and the calm green work screen SHALL return. The loop SHALL continue until the user pauses or stops. A one-minute work and one-minute rest pair SHALL reset to 01:00 at each change of phase.

#### Scenario: Work ends and rest begins
- **WHEN** a playing default timer reaches 00:00 during Work
- **THEN** the phase becomes Rest
- **THEN** the clock shows 02:00
- **THEN** the rest icon and "Stand up and walk." are shown
- **THEN** the background is a steady calm blue

#### Scenario: Rest ends and work begins
- **WHEN** a playing default timer reaches 00:00 during Rest
- **THEN** the phase becomes Work
- **THEN** the clock shows 30:00
- **THEN** the work icon and "Focus on your work." are shown
- **THEN** the background is a steady calm green

#### Scenario: A custom pair uses its own lengths
- **WHEN** a playing timer of 1 minute work and 1 minute rest reaches 00:00 during Work
- **THEN** the phase becomes Rest
- **THEN** the clock shows 01:00

#### Scenario: The loop does not stop by itself
- **WHEN** a playing timer finishes Rest and the user has not paused or stopped
- **THEN** Work starts again at that pair's full work length

### Requirement: Pause, resume, and stop
The timer screen SHALL show Pause while the timer is playing, Resume while it is paused, and Stop while it is playing or paused. Each SHALL be an icon button with an accessible name. Pause SHALL freeze the remaining time. While paused, the background SHALL stay the current phase color and SHALL NOT flash, including during the last 3 seconds. Resume SHALL continue from the frozen time, and the last-3-seconds flash SHALL apply again when the frozen time is still inside that window. Stop SHALL end the session, clear Active Timer, leave the pair in Recent Timers, and return to the default page. Stopping during the first second of a timer that just started SHALL still leave that pair in Recent Timers.

#### Scenario: Pause freezes the clock and the color
- **WHEN** the user pauses Work at 00:02
- **THEN** the remaining time stays 00:02
- **THEN** the background stays calm green
- **THEN** the background does not flash
- **THEN** Resume is available

#### Scenario: Resume continues inside the warning window
- **WHEN** the user resumes a timer paused at 00:02 during Work
- **THEN** the countdown continues from 00:02
- **THEN** the last-3-seconds flash applies again

#### Scenario: Stop returns to the list
- **WHEN** the user stops a playing or paused timer
- **THEN** Active Timer shows "No timer playing."
- **THEN** the pair remains in Recent Timers
- **THEN** the default page is shown

#### Scenario: An immediate stop keeps the new pair
- **WHEN** the user stops a timer during its first second
- **THEN** that work and rest pair remains in Recent Timers

### Requirement: Active timer summary
While a timer is playing, Active Timer SHALL show that phase's icon, the phase name Work or Rest, and the remaining time in `00:00`. While a timer is paused, Active Timer SHALL keep that timer in the section and SHALL show Paused with the frozen remaining time. Activating the active timer SHALL open the timer screen. A playing timer SHALL reduce its remaining time by one second for each second that passes. A paused timer SHALL NOT reduce its remaining time.

#### Scenario: Playing summary
- **WHEN** a timer is playing Work with 25 minutes and 10 seconds remaining and the user is on the default page
- **THEN** Active Timer shows the work icon, the name Work, and 25:10

#### Scenario: Paused summary
- **WHEN** a timer is paused during Rest with 01:30 remaining
- **THEN** Active Timer shows Paused and 01:30
- **THEN** the remaining time does not decrease

#### Scenario: The summary opens the timer screen
- **WHEN** the user activates the active timer
- **THEN** the timer screen is shown

### Requirement: Recent timers
Each recent row SHALL show that pair's full work length and full rest length in zero-padded minutes and seconds, in the form `30:00 work · 02:00 rest`, and a play icon button. Rows SHALL be ordered by last played, newest first. The same work length and rest length SHALL appear only once. Playing or creating that pair again SHALL move the existing row to the top and SHALL update when it was last played. The list SHALL keep the 10 most recently played pairs. Adding a new pair beyond 10 SHALL drop the oldest. Play SHALL start that pair from the beginning of Work and SHALL open the timer screen.

#### Scenario: A row shows the pair and a play control
- **WHEN** Recent Timers contains the default pair
- **THEN** that row shows 30:00 work · 02:00 rest
- **THEN** that row has a play icon button

#### Scenario: Newest played pair is first
- **WHEN** the user plays an older pair after a newer pair exists
- **THEN** the pair just played is the first row
- **THEN** its last-played time is updated

#### Scenario: The same pair is not duplicated
- **WHEN** the user creates or plays a work and rest pair that is already in Recent Timers
- **THEN** Recent Timers still contains that pair once
- **THEN** that row is first

#### Scenario: The eleventh pair drops the oldest
- **WHEN** Recent Timers already holds 10 pairs and the user starts a new pair
- **THEN** Recent Timers holds 10 pairs
- **THEN** the pair with the oldest last-played time is gone
- **THEN** the new pair is first

#### Scenario: Play restarts Work
- **WHEN** the user activates play on a recent row of 30:00 work and 02:00 rest
- **THEN** the timer screen opens at the beginning of Work
- **THEN** the clock shows 30:00

### Requirement: Only one timer is active
Starting a timer SHALL stop any timer that was playing or paused. The stopped pair SHALL remain in Recent Timers, and the newly started pair SHALL also remain in Recent Timers. The newly started timer SHALL be the only active timer, at the beginning of Work.

#### Scenario: A new timer replaces the active one
- **WHEN** a timer is playing or paused and the user starts or plays a different pair
- **THEN** the previous timer is no longer active
- **THEN** both pairs are in Recent Timers
- **THEN** the new timer is active at the beginning of Work

### Requirement: Saved timers
Timers SHALL be stored in the browser under the key `work-timer`. Each recent entry SHALL include a unique string id generated in the browser, `workSeconds` and `restSeconds` as the full phase lengths, and `lastPlayedAt` as an ISO-8601 timestamp. The default pair SHALL store `workSeconds` 1800 and `restSeconds` 120. The active session SHALL include `timerId`, `phase` of `work` or `rest`, `remainingSeconds`, `status` of `playing` or `paused`, and `updatedAt` as an ISO-8601 timestamp. `active` SHALL be null when nothing is playing or paused. If the stored value is missing, not readable as that shape, or otherwise invalid, the app SHALL start with an empty recent list and no active timer.

#### Scenario: A started default timer is stored
- **WHEN** the user starts the default timer
- **THEN** `work-timer` stores a recent entry with workSeconds 1800, restSeconds 120, a unique id, and an ISO-8601 lastPlayedAt
- **THEN** active stores that timer id, phase work, remainingSeconds 1800, status playing, and an ISO-8601 updatedAt

#### Scenario: Nothing active stores null
- **WHEN** the user stops the active timer
- **THEN** active is null
- **THEN** the pair remains in recent

#### Scenario: Invalid storage starts empty
- **WHEN** the stored `work-timer` value is missing or invalid
- **THEN** Recent Timers is empty
- **THEN** there is no active timer

### Requirement: Reload restores the saved remaining time
A reload SHALL restore Recent Timers and the active session from the saved remaining time. It SHALL NOT reduce that remaining time by time spent while the tab was closed.

#### Scenario: Closed time is not consumed
- **WHEN** a playing timer is saved with remainingSeconds 100 and the tab stays closed long enough for that time to have elapsed
- **THEN** after reload the active remaining time is still 100 seconds
- **THEN** Recent Timers is restored

### Requirement: Timer rules can be checked without the page
The countdown step, the work-to-rest and rest-to-work transitions, the last-3-seconds warning, and the recent-list ordering, uniqueness, and 10-item cap SHALL be determined from their inputs alone. Those outcomes SHALL be the same whether or not the page is open.

#### Scenario: A countdown step does not need the page
- **WHEN** a playing Work timer with 5 seconds remaining advances one second
- **THEN** the remaining time is 4 seconds
- **THEN** the warning is not active

#### Scenario: Three seconds remaining is a warning
- **WHEN** a playing timer has 3, 2, or 1 seconds remaining
- **THEN** the last-3-seconds warning is active for that phase

#### Scenario: Zero remaining changes phase
- **WHEN** a playing Work timer with 1800 work seconds and 120 rest seconds advances from 1 remaining second to zero
- **THEN** the phase is rest
- **THEN** the remaining time is 120 seconds
- **THEN** the warning is not active
