# Study Timer

A clean, dependency-free Pomodoro study timer built with plain HTML, CSS, and JavaScript. Track focus sessions, short breaks, and long breaks with a visual countdown ring, optional sound chime, and optional browser notifications.

## Features

- 25-minute focus session, 5-minute short break, 15-minute long break
- Start, pause, and reset controls
- Session counter (every 4th completed focus session triggers a long break)
- Optional notification sound, synthesized with the Web Audio API — no audio file needed
- Optional browser notifications when a session ends
- Clean, responsive design that adapts to light/dark system theme
- Preferences persisted locally (no backend, no accounts)
- Zero dependencies, zero build step

## Setup

No installation required. This is a static site.

```bash
git clone https://github.com/Srijjit-V/study-timer.git
cd study-timer
open index.html
```

Or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Usage

1. Choose a mode: **Focus**, **Short Break**, or **Long Break**.
2. Press **Start** to begin the countdown.
3. **Pause** stops the countdown without resetting it; **Reset** restores the current mode's full duration.
4. Toggle **Notification sound** and **Browser notifications** as desired. Enabling browser notifications will prompt for permission the first time.
5. Completed focus sessions increment the counter at the bottom; every 4th one automatically switches to a long break.

## Development

No build tooling — edit `index.html`, `src/css/style.css`, or `src/js/app.js` directly and reload the page.

Validation:

```bash
node --check src/js/app.js
```

## Project structure

```
index.html          Entry point / markup
src/css/style.css    All styling (responsive, light/dark aware)
src/js/app.js        Timer logic, notifications, sound, persistence
```
