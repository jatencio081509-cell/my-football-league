// Draft board + sim UI + reset season stats
(function () {
  function DS() { return window.DraftSystem; }

  let filterYear = null;
  let selectedOffseasonYear = null;
  let selectedDraftRound = 1;

  function createDraftScreen() {
    const screen = document.getElementById("draft-screen");
    if (!screen) return null;

    screen.innerHTML = '';

    const header = document.createElement("div");
    header.className = "standings-header";
    header.innerHTML = '<div><h2 id="draft-title">Draft</h2><p class="empty-note" id="draft-subtitle">Prospect pipeline & annual draft</p></div><div class="draft-header-actions"><button type="button" id="reset-player-stats-btn" class="btn danger small">Reset Season Stats</button></div>';
    screen.appendChild(header);

    const tabsDiv = document.createElement("div");
    tabsDiv.className = "draft-tabs";
    tabsDiv.innerHTML = '<button type="button" class="draft-tab active" data-tab="pipeline">Prospect Pipeline</button><button type="button" class="draft-tab" data-tab="board">Draft Board</button><button type="button" class="draft-tab" data-tab="order">Draft Order</button><button type="button" class="draft-tab" data-tab="offseason">Offseason Overview</button><button type="button" class="draft-tab" data-tab="hof">Hall of Fame</button><button type="button" class="draft-tab" data-tab="retire">Retirement Rules</button>';
    screen.appendChild(tabsDiv);

    const pipelinePanel = document.createElement("div");
    pipelinePanel.id = "draft-tab-pipeline";
    pipelinePanel.className = "draft-tab-panel";
    pipelinePanel.innerHTML = '<div class="draft-year-filters" id="draft-year-filters"></div><div class="table-wrapper"><table class="standings-table"><thead><tr><th>#</th><th>Name</th><th>Pos</th><th>Age</th><th>Level</th><th>School</th><th>Ht</th><th>Wt</th><th>Rating</th><th>Draft Year</th><th>Proj</th></tr></thead><tbody id="draft-prospect-body"></tbody></table></div>';
    screen.appendChild(pipelinePanel);

    const boardPanel = document.createElement("div");
    boardPanel.id = "draft-tab-board";
    boardPanel.className = "draft-tab-panel hidden";
    boardPanel.innerHTML = '<div id="draft-lock-msg" class="week-lock-banner"></div><div class="draft-controls"><button type="button" id="draft-start-btn" class="btn primary">Start Draft</button><button type="button" id="draft-next-btn" class="btn" disabled>Next Pick</button><button type="button" id="draft-sim-round-btn" class="btn" disabled>Sim Round</button><button type="button" id="draft-end-btn" class="btn danger" disabled>End of Draft</button></div><div id="draft-status" class="draft-status">—</div><div class="draft-board-grid"><div><h3>On the clock</h3><div id="draft-on-clock" class="draft-on-clock">—</div><h3>Recent picks</h3><div id="draft-recent" class="draft-recent"></div></div><div><h3>Best available</h3><div id="draft-best" class="draft-best"></div></div></div>';
    screen.appendChild(boardPanel);

    const orderPanel = document.createElement("div");
    orderPanel.id = "draft-tab-order";
    orderPanel.className = "draft-tab-panel hidden";
    orderPanel.innerHTML = '<div class="draft-order"><h3>Draft Order</h3><div id="draft-order-rounds" class="draft-order-rounds"><button type="button" class="draft-round-btn active" data-round="1">Round 1</button><button type="button" class="draft-round-btn" data-round="2">Round 2</button><button type="button" class="draft-round-btn" data-round="3">Round 3</button><button type="button" class="draft-round-btn" data-round="4">Round 4</button><button type="button" class="draft-round-btn" data-round="5">Round 5</button><button type="button" class="draft-round-btn" data-round="6">Round 6</button><button type="button" class="draft-round-btn" data-round="7">Round 7</button></div><div id="draft-order-content" class="draft-order-content"></div></div>';
    screen.appendChild(orderPanel);

    const offseasonPanel = document.createElement("div");
    offseasonPanel.id = "draft-tab-offseason";
    offseasonPanel.className = "draft-tab-panel hidden";
    offseasonPanel.innerHTML = '<div class="offseason-overview"><h3>Offseason Overview</h3><div id="offseason-year-selector" class="offseason-year-selector"></div><div id="offseason-content"><div class="offseason-section"><h4>Top 10 Draft Picks</h4><div id="offseason-draft-picks" class="offseason-draft-picks"></div></div><div class="offseason-section"><h4>Rating Changes</h4><div id="offseason-rating-changes" class="offseason-rating-changes"></div></div><div class="offseason-section"><h4>Retirements & Career-Ending Injuries</h4><div id="offseason-retirements" class="offseason-retirements"></div></div></div></div>';
    screen.appendChild(offseasonPanel);

    const hofPanel = document.createElement("div");
    hofPanel.id = "draft-tab-hof";
    hofPanel.className = "draft-tab-panel hidden";
    hofPanel.innerHTML = '<div class="hall-of-fame"><h3>Hall of Fame</h3><div class="hof-stats"><div class="hof-stat-box"><div class="hof-stat-number" id="hof-total-members">0</div><div class="hof-stat-label">Total Members</div></div><div class="hof-stat-box"><div class="hof-stat-number" id="hof-recent-inductees">0</div><div class="hof-stat-label">Recent Inductees</div></div></div><div class="hof-filters"><select id="hof-position-filter" class="hof-filter-select"><option value="all">All Positions</option><option value="QB">Quarterbacks</option><option value="RB">Running Backs</option><option value="WR">Wide Receivers</option><option value="TE">Tight Ends</option><option value="OL">Offensive Linemen</option><option value="DL">Defensive Linemen</option><option value="LB">Linebackers</option><option value="CB">Cornerbacks</option><option value="S">Safeties</option><option value="K">Kickers</option><option value="P">Punters</option></select></div><div id="hof-members-list" class="hof-members-list"></div></div>';
    screen.appendChild(hofPanel);

    const retirePanel = document.createElement("div");
    retirePanel.id = "draft-tab-retire";
    retirePanel.className = "draft-tab-panel hidden";
    retirePanel.innerHTML = '<div class="award-projections"><h3>When players retire</h3><p>After the League Championship, the offseason runs automatically when you finish the draft (or you can process rules here).</p><ul class="draft-rules"><li><strong>Age 30–31:</strong> small chance (~4%)</li><li><strong>Age 32–33:</strong> moderate (~10%)</li><li><strong>Age 34–35:</strong> higher (~22%)</li><li><strong>Age 36–37:</strong> high (~45%)</li><li><strong>Age 38+:</strong> very high (~75%)</li><li><strong>Elite players (90+ OVR)</strong> stick around longer; low-rated vets leave sooner.</li></ul><h3>Career-ending injuries</h3><p>Yes. A small share of injuries (especially knee / concussion / big hits) can end a career immediately. Those players are removed in the offseason.</p><button type="button" id="run-offseason-btn" class="btn primary">Run offseason (retirements + age prospects)</button><div id="offseason-log" class="offseason-log"></div></div>';
    screen.appendChild(retirePanel);

    return screen;
  }

  function renderDraftOrder() {
    const DS = window.DraftSystem;
    if (!DS) return;

    const roundButtons = document.querySelectorAll(".draft-round-btn");
    const content = document.getElementById("draft-order-content");

    if (roundButtons.length === 0 || !content) {
      return;
    }

    roundButtons.forEach(btn => {
      btn.classList.toggle("active", parseInt(btn.dataset.round, 10) === selectedDraftRound);
      btn.addEventListener("click", () => {
        selectedDraftRound = parseInt(btn.dataset.round, 10);
        renderDraftOrder();
      });
    });

    const order = DS.buildDraftOrder();

    const roundPicks = order.map((team, index) => {
      const overallPick = (selectedDraftRound - 1) * 32 + index + 1;
      return {
        pick: index + 1,
        overall: overallPick,
        team: teamName(team),
        teamKey: teamKey(team)
      };
    });

    content.innerHTML = "";
    let tableHTML = '<div class="draft-order-table"><table class="standings-table"><thead><tr><th>Pick</th><th>Overall</th><th>Team</th><th>Record</th><th>Needs</th></tr></thead><tbody>';
    
    roundPicks.forEach(pick => {
      const standings = typeof loadStandings === "function" ? loadStandings() : {};
      const teamRecord = standings[pick.teamKey] || { wins: 0, losses: 0, ties: 0 };
      const record = teamRecord.wins + "-" + teamRecord.losses + "-" + teamRecord.ties;
      const roster = ROSTERS[pick.teamKey] || [];
      const positionCounts = {};
      roster.forEach(p => {
        positionCounts[p.position] = (positionCounts[p.position] || 0) + 1;
      });
      const needs = Object.entries(positionCounts).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([pos, count]) => pos + "(" + count + ")").join(", ");
      tableHTML += '<tr><td class="draft-pick-number">' + pick.pick + '</td><td class="draft-overall-number">' + pick.overall + '</td><td class="team-cell">' + pick.team + '</td><td>' + record + '</td><td class="team-needs">' + (needs || "Balanced") + '</td></tr>';
    });
    
    tableHTML += '</tbody></table></div><div class="draft-order-info"><p class="empty-note">Draft order is determined by regular season record (worst to best). Playoff teams pick after non-playoff teams, with Super Bowl loser picking last and winner picking 32nd.</p></div>';
    content.innerHTML = tableHTML;
  }

  function renderHallOfFame() {
    const HOF = window.HallOfFame;
    if (!HOF) return;

    const positionFilter = document.getElementById("hof-position-filter");
    const totalMembers = document.getElementById("hof-total-members");
    const recentInductees = document.getElementById("hof-recent-inductees");
    const membersList = document.getElementById("hof-members-list");

    if (!positionFilter || !totalMembers || !recentInductees || !membersList) {
      return;
    }

    const members = HOF.getMembers();
    const total = members.length;
    const recent = members.filter(m => m.inductYear === new Date().getFullYear()).length;

    totalMembers.textContent = total;
    recentInductees.textContent = recent;

    const filterPos = positionFilter.value;
    const filteredMembers = filterPos === "all" ? members : members.filter(m => m.position === filterPos);

    let memberCards = "";
    filteredMembers.forEach(member => {
      const ratingClass = member.peakRating >= 90 ? "rating-high" : member.peakRating >= 80 ? "rating-mid" : "rating-low";
      const careerEnd = member.careerEnd || "Present";
      const teamsStr = member.teams ? member.teams.join(", ") : "Unknown";
      const awardsStr = member.awards && member.awards.length > 0 ? member.awards.join(", ") : "None";
      memberCards += '<div class="hof-member-card"><div class="hof-member-header"><div class="hof-member-name">' + member.name + '</div><div class="hof-member-position">' + member.position + '</div></div><div class="hof-member-details"><div class="hof-detail"><strong>Inducted:</strong> ' + member.inductYear + '</div><div class="hof-detail"><strong>Career:</strong> ' + member.careerStart + '–' + careerEnd + '</div><div class="hof-detail"><strong>Seasons:</strong> ' + member.seasons + '</div><div class="hof-detail"><strong>Peak Rating:</strong> <span class="' + ratingClass + '">' + member.peakRating + '</span></div><div class="hof-detail"><strong>Teams:</strong> ' + teamsStr + '</div><div class="hof-detail"><strong>Awards:</strong> ' + awardsStr + '</div><div class="hof-detail"><strong>Championships:</strong> ' + (member.championships || 0) + '</div><div class="hof-detail"><strong>HOF Score:</strong> ' + (member.hofScore || 0) + '</div></div></div>';
    });

    membersList.innerHTML = '<div class="hof-grid">' + memberCards + '</div>';

    if (!positionFilter._hofListener) {
      positionFilter.addEventListener("change", () => {
        renderHallOfFame();
      });
      positionFilter._hofListener = true;
    }
  }

  function renderOffseasonOverview() {
    const DS = window.DraftSystem;
    if (!DS) return;

    const yearSelector = document.getElementById("offseason-year-selector");
    const draftPicksEl = document.getElementById("offseason-draft-picks");
    const ratingChangesEl = document.getElementById("offseason-rating-changes");
    const retirementsEl = document.getElementById("offseason-retirements");

    if (!yearSelector || !draftPicksEl || !ratingChangesEl || !retirementsEl) {
      return;
    }

    const history = DS.getOffseasonHistory() || [];
    const years = history.map(h => h.year).sort((a, b) => b - a);

    if (selectedOffseasonYear == null && years.length > 0) {
      selectedOffseasonYear = years[years.length - 1];
    }

    if (years.length > 0) {
      const yearButtons = years.map(y => {
        const isActive = y === selectedOffseasonYear ? "active" : "";
        return '<button type="button" class="offseason-year-btn ' + isActive + '" data-year="' + y + '">' + y + '</button>';
      }).join("");
      yearSelector.innerHTML = yearButtons;
    } else {
      yearSelector.innerHTML = '<p class="empty-note">No offseason data available yet. Complete a draft to see overview.</p>';
    }

    yearSelector.querySelectorAll(".offseason-year-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedOffseasonYear = parseInt(btn.getAttribute("data-year"), 10);
        renderOffseasonOverview();
      });
    });

    if (years.length === 0) {
      draftPicksEl.innerHTML = '<p class="empty-note">No data available</p>';
      ratingChangesEl.innerHTML = '<p class="empty-note">No data available</p>';
      retirementsEl.innerHTML = '<p class="empty-note">No data available</p>';
      return;
    }

    const overview = history.find(h => h.year === selectedOffseasonYear);
    if (!overview) return;

    if (overview.draftPicks.length > 0) {
      const pickRows = overview.draftPicks.map(pick => {
        const ratingClass = pick.rating >= 85 ? "rating-high" : pick.rating >= 70 ? "rating-mid" : "rating-low";
        return '<tr><td>' + pick.overall + '</td><td>' + pick.round + '</td><td>' + pick.team + '</td><td>' + pick.player + '</td><td>' + pick.position + '</td><td class="' + ratingClass + '">' + pick.rating + '</td><td>' + pick.school + '</td></tr>';
      }).join("");
      draftPicksEl.innerHTML = '<table class="standings-table"><thead><tr><th>Overall</th><th>Round</th><th>Team</th><th>Player</th><th>Pos</th><th>Rating</th><th>School</th></tr></thead><tbody>' + pickRows + '</tbody></table>';
    } else {
      draftPicksEl.innerHTML = '<p class="empty-note">No draft picks recorded</p>';
    }

    if (overview.ratingChanges.length > 0) {
      const changeRows = overview.ratingChanges.map(change => {
        const ratingClass = change.newRating >= 85 ? "rating-high" : change.newRating >= 70 ? "rating-mid" : "rating-low";
        const changeClass = change.change > 0 ? "rating-increase" : "rating-decrease";
        const changeSign = change.change > 0 ? "+" : "";
        return '<tr><td>' + change.player + '</td><td>' + change.team + '</td><td>' + change.position + '</td><td>' + change.oldRating + '</td><td class="' + ratingClass + '">' + change.newRating + '</td><td class="' + changeClass + '">' + changeSign + change.change + '</td></tr>';
      }).join("");
      ratingChangesEl.innerHTML = '<table class="standings-table"><thead><tr><th>Player</th><th>Team</th><th>Pos</th><th>Old</th><th>New</th><th>Change</th></tr></thead><tbody>' + changeRows + '</tbody></table>';
    } else {
      ratingChangesEl.innerHTML = '<p class="empty-note">No significant rating changes</p>';
    }

    if (overview.retirements.length > 0) {
      const retirementRows = overview.retirements.map(ret => {
        const teamName = typeof ret.team === "object" ? (ret.team.name || ret.team.city + " " + ret.team.mascot) : ret.team;
        return '<tr><td>' + ret.player.name + '</td><td>' + teamName + '</td><td>' + ret.player.position + '</td><td>' + ret.player.age + '</td><td>' + ret.reason + '</td></tr>';
      }).join("");
      retirementsEl.innerHTML = '<table class="standings-table"><thead><tr><th>Player</th><th>Team</th><th>Pos</th><th>Age</th><th>Reason</th></tr></thead><tbody>' + retirementRows + '</tbody></table>';
    } else {
      retirementsEl.innerHTML = '<p class="empty-note">No retirements this offseason</p>';
    }
  }

  function renderPipeline() {
    const DS = window.DraftSystem;
    if (!DS) return;

    const yearFilters = document.getElementById("draft-year-filters");
    const tbody = document.getElementById("draft-prospect-body");

    if (!yearFilters || !tbody) {
      return;
    }

    let prospects = DS.loadProspects();
    if (!prospects || prospects.length === 0) {
      prospects = DS.generateProspects(true);
    }

    const years = [...new Set(prospects.map(p => p.draftYear || 1))].sort((a, b) => a - b);

    if (filterYear == null && years.length > 0) {
      filterYear = years[0];
    }

    if (years.length > 0) {
      const yearButtons = years.map(y => {
        const isActive = y === filterYear ? "active" : "";
        return '<button type="button" class="draft-year-btn ' + isActive + '" data-year="' + y + '">' + y + '</button>';
      }).join("");
      yearFilters.innerHTML = yearButtons;
    } else {
      yearFilters.innerHTML = '<p class="empty-note">No prospects yet. Generate prospects to start.</p>';
    }

    yearFilters.querySelectorAll(".draft-year-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        filterYear = parseInt(btn.getAttribute("data-year"), 10);
        renderPipeline();
      });
    });

    const filtered = filterYear ? prospects.filter(p => (p.draftYear || 1) === filterYear) : prospects;
    tbody.innerHTML = filtered.map((p, i) => {
      const ratingClass = p.rating >= 85 ? "rating-high" : p.rating >= 70 ? "rating-mid" : "rating-low";
      return '<tr><td>' + (i + 1) + '</td><td>' + p.name + '</td><td>' + p.position + '</td><td>' + p.age + '</td><td>' + (p.level || "N/A") + '</td><td>' + (p.school || "N/A") + '</td><td>' + (p.height || "N/A") + '</td><td>' + (p.weight || "N/A") + '</td><td class="' + ratingClass + '">' + p.rating + '</td><td>' + (p.draftYear || 1) + '</td><td>' + (p.projPick || "—") + '</td></tr>';
    }).join("");
  }

  function renderBoard() {
    const DS = window.DraftSystem;
    if (!DS) return;

    const status = document.getElementById("draft-status");
    const onClock = document.getElementById("draft-on-clock");
    const recent = document.getElementById("draft-recent");
    const best = document.getElementById("draft-best");
    const lockMsg = document.getElementById("draft-lock-msg");

    if (!status || !onClock || !recent || !best) return;

    const st = DS.getState();
    if (!st) {
      status.textContent = "Draft not started";
      onClock.textContent = "—";
      recent.innerHTML = "";
      best.innerHTML = "";
      if (lockMsg) lockMsg.textContent = "";
      return;
    }

    if (lockMsg) {
      lockMsg.textContent = DS.isLocked() ? "Draft is locked. Complete championship to unlock." : "";
    }

    const pick = st.picks[st.currentPick];
    if (pick) {
      status.textContent = "Round " + pick.round + ", Pick " + pick.pick + " of " + st.picks.length;
      onClock.textContent = teamName(pick.team) + " (" + pick.pick + ")";
    } else {
      status.textContent = "Draft complete";
      onClock.textContent = "—";
    }

    recent.innerHTML = st.drafted.slice(-5).reverse().map(d => '<div class="draft-pick-line"><span class="draft-ov">#' + d.overall + '</span> ' + teamName(d.team) + ' — ' + d.player.name + ' (' + d.player.position + ', ' + d.player.rating + ')</div>').join("");

    const remaining = DS.getRemainingProspects(st);
    best.innerHTML = remaining.slice(0, 10).map(p => '<div class="draft-pick-line">' + p.name + ' (' + p.position + ', ' + p.rating + ')</div>').join("");
  }

  function renderAll() {
    createDraftScreen();
    setTimeout(() => {
      renderPipeline();
    }, 50);
  }

  function bind() {
    const screen = createDraftScreen();
    if (!screen) return;

    function setupTabs() {
      const tabs = document.querySelectorAll(".draft-tab");
      const panels = document.querySelectorAll(".draft-tab-panel");

      tabs.forEach(tab => {
        tab.onclick = function() {
          const target = tab.dataset.tab;
          tabs.forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          panels.forEach(p => p.classList.add("hidden"));
          const targetPanel = document.getElementById("draft-tab-" + target);
          if (targetPanel) {
            targetPanel.classList.remove("hidden");
            if (target === "pipeline") {
              setTimeout(renderPipeline, 10);
            }
            if (target === "board") renderBoard();
            if (target === "order") renderDraftOrder();
            if (target === "offseason") renderOffseasonOverview();
            if (target === "hof") renderHallOfFame();
          }
        };
      });
    }

    setupTabs();

    const resetBtn = document.getElementById("reset-player-stats-btn");
    if (resetBtn) {
      resetBtn.onclick = function() {
        if (confirm("Clear all player stats for this season?")) {
          localStorage.removeItem("mfl-player-stats");
          if (confirm("Also clear injuries?")) {
            localStorage.removeItem("mfl-injuries");
          }
          alert("Season stats reset.");
        }
      };
    }

    const start = document.getElementById("draft-start-btn");
    const next = document.getElementById("draft-next-btn");
    const simRound = document.getElementById("draft-sim-round-btn");
    const end = document.getElementById("draft-end-btn");

    if (start) start.onclick = function() {
      if (!DS()) return;
      const st = DS().startDraft();
      renderBoard();
      if (next) next.disabled = false;
      if (simRound) simRound.disabled = false;
      if (end) end.disabled = false;
      if (start) start.disabled = true;
    };

    if (next) next.onclick = function() {
      let st = DS().getState();
      if (!st) return;
      DS().nextPick(st);
      renderBoard();
      if (st.currentPick >= st.picks.length) {
        if (next) next.disabled = true;
        if (simRound) simRound.disabled = true;
      }
    };

    if (simRound) simRound.onclick = function() {
      let st = DS().getState();
      if (!st) return;
      DS().simRound(st);
      renderBoard();
      if (st.currentPick >= st.picks.length) {
        if (next) next.disabled = true;
        if (simRound) simRound.disabled = true;
      }
    };

    if (end) end.onclick = function() {
      let st = DS().getState();
      if (!st) return;
      DS().endDraft(st);
      renderBoard();
      const retired = DS().processOffseason();
      DS().ageProspects();
      DS().clearChampionshipFlag();
      const overview = DS().generateOffseasonOverview(st, retired);
      DS().saveOffseasonOverview(overview);
      const log = document.getElementById("offseason-log");
      if (log) {
        const logHTML = "<p><strong>Offseason complete.</strong> " + retired.length + " players left the league.</p>" +
          retired.slice(0, 30).map(r =>
            "<div>" + teamName(r.team) + " — " + r.player.name + " (" + r.player.position + ", " + r.player.age + ") · " + r.reason + "</div>"
          ).join("");
        log.innerHTML = logHTML;
      }
      alert("Draft complete. " + retired.length + " players retired or left due to career-ending injuries.");
    };

    const off = document.getElementById("run-offseason-btn");
    if (off) off.onclick = function() {
      if (!confirm("Process retirements and age prospects now?")) return;
      const retired = DS().processOffseason();
      DS().ageProspects();
      const log = document.getElementById("offseason-log");
      if (log) {
        const logHTML = retired.map(r =>
          "<div>" + teamName(r.team) + " — " + r.player.name + " (" + r.player.position + ", age " + r.player.age + ") · " + r.reason + "</div>"
        ).join("") || "<p>No retirements.</p>";
        log.innerHTML = logHTML;
      }
    };

    if (typeof window.showScreen === "function") {
      const originalShowScreen = window.showScreen;
      window.showScreen = function(screenId) {
        originalShowScreen.apply(this, arguments);
        if (screenId === "draft-screen") {
          renderAll();
          setTimeout(setupTabs, 50);
        }
      };
      window.showScreen.__draft = true;
    }
  }

  window.markLeagueChampionshipComplete = function () {
    if (window.DraftSystem) window.DraftSystem.markChampionshipDone();
  };

  window.addEventListener("DOMContentLoaded", () => {
    bind();
    setTimeout(bind, 100);

    if (document.getElementById("draft-ui-style")) return;
    const s = document.createElement("style");
    s.id = "draft-ui-style";
    const cssText = ".draft-tabs { display: flex; gap: 8px; margin: 12px 0 16px; flex-wrap: wrap; }" +
      ".draft-tab { background: #122438; border: 1px solid #1E7B44; color: #a8bdd0; font-weight: 800; font-size: 0.8rem; padding: 8px 14px; border-radius: 999px; cursor: pointer; }" +
      ".draft-tab.active { background: linear-gradient(135deg, #1E7B44, #1D70B8); color: #fff; border-color: transparent; }" +
      ".draft-year-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }" +
      ".draft-year-btn { background: #0d1a24; border: 1px solid #6b8499; color: #a8bdd0; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.8rem; }" +
      ".draft-year-btn.active { border-color: #FDB813; color: #FDB813; }" +
      ".draft-controls { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }" +
      ".draft-status { color: #FDB813; font-weight: 700; margin-bottom: 12px; }" +
      ".draft-board-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }" +
      "@media (max-width: 800px) { .draft-board-grid { grid-template-columns: 1fr; } }" +
      ".draft-on-clock { background: #122438; border: 2px solid #FDB813; border-radius: 10px; padding: 14px; font-weight: 800; margin-bottom: 14px; }" +
      ".draft-pick-line { padding: 6px 0; border-bottom: 1px solid rgba(30,123,68,0.25); font-size: 0.88rem; color: #a8bdd0; }" +
      ".draft-ov { color: #FDB813; font-weight: 800; margin-right: 6px; }" +
      ".draft-rules { color: #a8bdd0; line-height: 1.5; }" +
      ".offseason-log { margin-top: 12px; max-height: 240px; overflow: auto; font-size: 0.85rem; color: #a8bdd0; }" +
      ".draft-header-actions { display: flex; gap: 8px; }" +
      ".offseason-overview { padding: 12px 0; }" +
      ".offseason-year-selector { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }" +
      ".offseason-year-btn { background: #0d1a24; border: 1px solid #6b8499; color: #a8bdd0; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.8rem; }" +
      ".offseason-year-btn.active { border-color: #FDB813; color: #FDB813; }" +
      ".offseason-section { margin-bottom: 20px; }" +
      ".offseason-section h4 { color: #FDB813; margin-bottom: 8px; font-size: 1rem; }" +
      ".offseason-draft-picks, .offseason-rating-changes, .offseason-retirements { font-size: 0.85rem; color: #a8bdd0; }" +
      ".rating-increase { color: #4ade80; font-weight: bold; }" +
      ".rating-decrease { color: #f87171; font-weight: bold; }" +
      ".hall-of-fame { padding: 12px 0; }" +
      ".hof-stats { display: flex; gap: 16px; margin-bottom: 16px; }" +
      ".hof-stat-box { background: #122438; border: 1px solid #1E7B44; border-radius: 8px; padding: 12px 20px; text-align: center; min-width: 120px; }" +
      ".hof-stat-number { font-size: 1.8rem; font-weight: 800; color: #FDB813; }" +
      ".hof-stat-label { font-size: 0.8rem; color: #a8bdd0; margin-top: 4px; }" +
      ".hof-filters { margin-bottom: 16px; }" +
      ".hof-filter-select { background: #0d1a24; border: 1px solid #6b8499; color: #a8bdd0; padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; }" +
      ".hof-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 12px; }" +
      ".hof-member-card { background: #122438; border: 1px solid #1E7B44; border-radius: 10px; padding: 16px; transition: transform 0.2s, box-shadow 0.2s; }" +
      ".hof-member-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(30, 123, 68, 0.3); }" +
      ".hof-member-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(30, 123, 68, 0.3); }" +
      ".hof-member-name { font-size: 1.1rem; font-weight: 800; color: #fff; }" +
      ".hof-member-position { background: linear-gradient(135deg, #1E7B44, #1D70B8); color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }" +
      ".hof-member-details { font-size: 0.85rem; color: #a8bdd0; }" +
      ".hof-detail { margin-bottom: 6px; display: flex; justify-content: space-between; }" +
      ".hof-detail strong { color: #FDB813; }" +
      ".draft-order { padding: 12px 0; }" +
      ".draft-order-rounds { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }" +
      ".draft-round-btn { background: #0d1a24; border: 1px solid #6b8499; color: #a8bdd0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; }" +
      ".draft-round-btn.active { border-color: #FDB813; color: #FDB813; background: rgba(253, 184, 19, 0.1); }" +
      ".draft-order-content { margin-top: 12px; }" +
      ".draft-pick-number { color: #FDB813; font-weight: 800; width: 50px; }" +
      ".draft-overall-number { color: #a8bdd0; font-weight: 700; width: 60px; }" +
      ".team-needs { font-size: 0.8rem; color: #6b8499; }" +
      ".draft-order-info { margin-top: 16px; padding: 12px; background: rgba(30, 123, 68, 0.1); border-radius: 8px; }";
    s.textContent = cssText;
    document.head.appendChild(s);
  });
})();