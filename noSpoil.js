// Hide drive outcome + play count until the drive finishes
(function () {
  let pendingOutcome = null;
  let spoilerPatched = false;

  function patch() {
    if (spoilerPatched) return;
    const orig = window.processDrive;
    if (typeof orig !== "function") return;

    // Intercept processDrive: strip spoiler lines after it runs is hard.
    // Replace processDrive entirely by wrapping generation.
    // Easier: monkey-patch playLog.push during processDrive.

    window.processDrive = function () {
      if (!window.game || game.gameOver) return orig.apply(this, arguments);

      const pushed = [];
      const realPush = game.playLog.push.bind(game.playLog);
      game.playLog.push = function () {
        for (let i = 0; i < arguments.length; i++) {
          const line = arguments[i];
          // Swallow spoiler headers and detailed dice during resolve
          if (typeof line === "string") {
            if (/DRIVE RESULT:/i.test(line)) {
              // stash for later
              pendingOutcome = line;
              continue;
            }
            if (/^Dice:/i.test(line)) {
              realPush("Dice rolled");
              continue;
            }
            if (/Off \d+ vs Def \d+/i.test(line) && /———/.test(line)) {
              pendingOutcome = line;
              continue;
            }
          }
          realPush(line);
        }
        return game.playLog.length;
      };

      try {
        orig.apply(this, arguments);
      } finally {
        game.playLog.push = realPush;
      }

      // Ensure neutral header exists
      const last = game.playLog[game.playLog.length - 1];
      if (!game.playLog.some(l => l === "——— Drive underway ———")) {
        // insert near end before any plays if missing
        realPush("——— Drive underway ———");
      }

      // Fix status text so it never shows "Play X of Y"
      const status = document.getElementById("drive-status");
      if (status) {
        const obs = new MutationObserver(() => {
          if (/of \d+|\d+\/\d+/.test(status.textContent || "")) {
            if (/Auto/i.test(status.textContent || "")) {
              status.textContent = "Auto-playing…";
            } else {
              status.textContent = "Press Next Play for the next snap";
            }
          }
        });
        obs.observe(status, { childList: true, characterData: true, subtree: true });
        // immediate fix
        if (/of \d+|\d+\/\d+/.test(status.textContent || "")) {
          status.textContent = "Press Next Play for the next snap";
        }
      }

      if (typeof updateUI === "function") updateUI();
    };

    // When drive ends, reveal outcome once
    const prevUpdate = window.updateUI;
    if (typeof prevUpdate === "function" && !prevUpdate.__noSpoil) {
      window.updateUI = function () {
        prevUpdate.apply(this, arguments);
        const status = document.getElementById("drive-status");
        if (status && /of \d+|\d+\/\d+/.test(status.textContent || "")) {
          status.textContent = /Auto/i.test(status.textContent)
            ? "Auto-playing…"
            : "Press Next Play for the next snap";
        }
      };
      window.updateUI.__noSpoil = true;
    }

    // Reveal stashed outcome when controls go idle after a drive
    const statusEl = document.getElementById("drive-status");
    if (statusEl) {
      const idleObs = new MutationObserver(() => {
        const t = statusEl.textContent || "";
        if (pendingOutcome && /Roll dice/i.test(t)) {
          if (window.game && game.playLog) {
            // Only add if not already present at end
            const already = game.playLog.slice(-5).some(l => /DRIVE RESULT:/i.test(l || ""));
            if (!already) {
              game.playLog.push(pendingOutcome);
              pendingOutcome = null;
              if (typeof updateUI === "function") updateUI();
            } else {
              pendingOutcome = null;
            }
          }
        }
      });
      idleObs.observe(statusEl, { childList: true, characterData: true, subtree: true });
    }

    spoilerPatched = true;
  }

  // Continuous status sanitizer
  function sanitizeStatus() {
    const status = document.getElementById("drive-status");
    if (!status) return;
    const t = status.textContent || "";
    if (/Play \d+ of \d+/i.test(t) || /\(\d+\/\d+\)/.test(t)) {
      status.textContent = /Auto/i.test(t)
        ? "Auto-playing…"
        : "Press Next Play for the next snap";
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(patch, 0);
    setTimeout(patch, 100);
    setTimeout(patch, 300);
    setInterval(sanitizeStatus, 200);
  });
})();
