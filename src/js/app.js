/**
 * Study Timer — a plain-JS Pomodoro timer.
 * No frameworks, no external dependencies.
 */
(function () {
  "use strict";

  // ---------- Config ----------
  const DURATIONS = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  const MODE_LABELS = {
    focus: "Focus Session",
    short: "Short Break",
    long: "Long Break",
  };

  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 90; // matches r="90" in the SVG

  // ---------- State ----------
  let currentMode = "focus";
  let secondsRemaining = DURATIONS.focus;
  let timerId = null;
  let isRunning = false;
  let sessionCount = 0;

  // ---------- DOM references ----------
  const timeDisplay = document.getElementById("timeDisplay");
  const modeLabel = document.getElementById("modeLabel");
  const progressCircle = document.getElementById("progressCircle");
  const startPauseBtn = document.getElementById("startPauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const sessionCountEl = document.getElementById("sessionCount");
  const soundToggle = document.getElementById("soundToggle");
  const notifyToggle = document.getElementById("notifyToggle");
  const modeButtons = document.querySelectorAll(".modes__btn");

  progressCircle.style.strokeDasharray = String(CIRCLE_CIRCUMFERENCE);

  // ---------- Persisted preferences ----------
  function loadPrefs() {
    try {
      const raw = localStorage.getItem("study-timer:prefs");
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (typeof prefs.sound === "boolean") soundToggle.checked = prefs.sound;
      if (typeof prefs.notify === "boolean") notifyToggle.checked = prefs.notify;
      if (typeof prefs.sessionCount === "number") {
        sessionCount = prefs.sessionCount;
        sessionCountEl.textContent = String(sessionCount);
      }
    } catch (err) {
      // Corrupt or unavailable storage — fall back to defaults silently.
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(
        "study-timer:prefs",
        JSON.stringify({
          sound: soundToggle.checked,
          notify: notifyToggle.checked,
          sessionCount: sessionCount,
        })
      );
    } catch (err) {
      // Ignore write failures (e.g. private browsing storage limits).
    }
  }

  // ---------- Rendering ----------
  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  function render() {
    timeDisplay.textContent = formatTime(secondsRemaining);
    modeLabel.textContent = MODE_LABELS[currentMode];
    document.title = `${formatTime(secondsRemaining)} — ${MODE_LABELS[currentMode]}`;

    const total = DURATIONS[currentMode];
    const elapsed = total - secondsRemaining;
    const offset = CIRCLE_CIRCUMFERENCE * (1 - elapsed / total);
    progressCircle.style.strokeDashoffset = String(offset);

    startPauseBtn.textContent = isRunning ? "Pause" : "Start";
  }

  function setActiveModeButton() {
    modeButtons.forEach((btn) => {
      const active = btn.dataset.mode === currentMode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
  }

  // ---------- Mode switching ----------
  function switchMode(mode, { autoStart = false } = {}) {
    if (!DURATIONS.hasOwnProperty(mode)) return;
    stopTimer();
    currentMode = mode;
    secondsRemaining = DURATIONS[mode];
    setActiveModeButton();
    render();
    if (autoStart) startTimer();
  }

  // ---------- Timer control ----------
  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    timerId = setInterval(tick, 1000);
    render();
  }

  function pauseTimer() {
    isRunning = false;
    clearInterval(timerId);
    timerId = null;
    render();
  }

  function stopTimer() {
    isRunning = false;
    clearInterval(timerId);
    timerId = null;
  }

  function resetTimer() {
    stopTimer();
    secondsRemaining = DURATIONS[currentMode];
    render();
  }

  function tick() {
    secondsRemaining -= 1;
    if (secondsRemaining <= 0) {
      completeSession();
      return;
    }
    render();
  }

  function completeSession() {
    stopTimer();
    secondsRemaining = 0;
    render();

    playChime();
    notify();

    if (currentMode === "focus") {
      sessionCount += 1;
      sessionCountEl.textContent = String(sessionCount);
      savePrefs();
      // Every 4th focus session earns a long break, otherwise a short one.
      const nextMode = sessionCount % 4 === 0 ? "long" : "short";
      switchMode(nextMode);
    } else {
      switchMode("focus");
    }
  }

  // ---------- Notification sound (Web Audio API, no external asset) ----------
  let audioCtx = null;

  function playChime() {
    if (!soundToggle.checked) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      [880, 1108.73].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.18;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch (err) {
      // Web Audio unsupported or blocked — fail silently.
    }
  }

  // ---------- Browser notifications ----------
  function notify() {
    if (!notifyToggle.checked) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      const finishedMode = currentMode;
      new Notification("Study Timer", {
        body: `${MODE_LABELS[finishedMode]} complete!`,
        tag: "study-timer",
      });
    }
  }

  function requestNotificationPermission() {
    if (!("Notification" in window)) {
      notifyToggle.checked = false;
      notifyToggle.disabled = true;
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        notifyToggle.checked = permission === "granted";
        savePrefs();
      });
    } else if (Notification.permission === "denied") {
      notifyToggle.checked = false;
    }
  }

  // ---------- Event wiring ----------
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchMode(btn.dataset.mode));
  });

  startPauseBtn.addEventListener("click", () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener("click", resetTimer);

  soundToggle.addEventListener("change", savePrefs);
  notifyToggle.addEventListener("change", () => {
    if (notifyToggle.checked) {
      requestNotificationPermission();
    }
    savePrefs();
  });

  // ---------- Init ----------
  loadPrefs();
  setActiveModeButton();
  render();
})();
