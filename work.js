import { TEAMS, DB, VENUES, H2H, S } from "./data.js";
import { fUrl, fImg, findCombo, rr, calculateMatchups } from "./fun.js";

// HTML এর onclick এ ব্যবহার করার জন্য ফাংশনগুলোকে গ্লোবাল window অবজেক্টে যুক্ত করে নিচ্ছি
window.mv = mv;
window.togT = togT;
window.doneGroups = doneGroups;
window.doneThird = doneThird;
window.pickW = pickW;
window.pFinal = pFinal;
window.advanceR32 = advanceR32;
window.advanceR16 = advanceR16;
window.advanceQF = advanceQF;
window.advanceSF = advanceSF;
window.openModal = openModal;
window.closeModal = closeModal;
window.makeCard = makeCard;
window.init = init;
window.showTeamInfo = showTeamInfo;
window.showH2H = showH2H;
window.closeStatModal = closeStatModal;
window.dlPC = dlPC;
window.resetAll = resetAll;
window.goPhase = goPhase;

function init() {
  S.groups = {};
  TEAMS.forEach((t) => {
    if (!S.groups[t.group]) S.groups[t.group] = [];
    S.groups[t.group].push({ ...t });
  });
  renderGroups();
}

function renderGroups() {
  const g = document.getElementById("groupsGrid");
  g.innerHTML = "";
  const pc = ["p1", "p2", "p3", "p4"],
    pl = ["1st", "2nd", "3rd", "4th"];
  Object.keys(S.groups)
    .sort()
    .forEach((gr) => {
      const ts = S.groups[gr];
      const c = document.createElement("div");
      c.className = "gc";
      c.innerHTML = `<div class="gh"><h3>GROUP ${gr}</h3><small>Rank</small></div><div class="gb" id="gb-${gr}">${ts.map((t, i) => `<div class="gt ${pc[i]}"><div class="gbs"><button class="gbb" onclick="mv('${gr}',${i},-1)" ${i === 0 ? "disabled" : ""}>▲</button><button class="gbb" onclick="mv('${gr}',${i},1)" ${i === 3 ? "disabled" : ""}>▼</button></div>${fImg(t.name)}<span class="gn">${t.name}</span><span class="gbg">${pl[i]}</span></div>`).join("")}</div>`;
      g.appendChild(c);
    });
}

function mv(gr, i, d) {
  const a = S.groups[gr],
    ni = i + d;
  if (ni < 0 || ni >= a.length) return;
  [a[i], a[ni]] = [a[ni], a[i]];
  const pc = ["p1", "p2", "p3", "p4"],
    pl = ["1st", "2nd", "3rd", "4th"];
  document.getElementById(`gb-${gr}`).innerHTML = a
    .map(
      (t, i) =>
        `<div class="gt ${pc[i]}"><div class="gbs"><button class="gbb" onclick="mv('${gr}',${i},-1)" ${i === 0 ? "disabled" : ""}>▲</button><button class="gbb" onclick="mv('${gr}',${i},1)" ${i === 3 ? "disabled" : ""}>▼</button></div>${fImg(t.name)}<span class="gn">${t.name}</span><span class="gbg">${pl[i]}</span></div>`,
    )
    .join("");
}

function doneGroups() {
  renderThird(
    Object.keys(S.groups)
      .sort()
      .map((g) => S.groups[g][2]),
  );
  goPhase(1);
}

function renderThird(thirds) {
  S.thirdSel = [];
  document.getElementById("selCount").textContent = "Selected: 0 / 8";
  document.getElementById("comboInfo").innerHTML = "";
  const g = document.getElementById("thirdGrid");
  g.innerHTML = "";
  thirds.forEach((t) => {
    const d = document.createElement("div");
    d.className = "tc";
    d.id = `tc-${t.id}`;
    d.onclick = () => togT(t.id, d);
    d.innerHTML = `${fImg(t.name)}<div style="flex:1"><div class="tn">${t.name}</div><div class="tgrp">Group ${t.group}</div></div><span class="tck">✓</span>`;
    g.appendChild(d);
  });
}

function togT(id, el) {
  if (S.thirdSel.includes(id)) {
    S.thirdSel = S.thirdSel.filter((x) => x !== id);
    el.classList.remove("sel");
  } else {
    if (S.thirdSel.length >= 8) {
      notify("Max 8!", "err");
      return;
    }
    S.thirdSel.push(id);
    el.classList.add("sel");
  }
  const c = S.thirdSel.length;
  const sc = document.getElementById("selCount");
  sc.textContent = `Selected: ${c} / 8`;
  sc.style.color = c === 8 ? "var(--green)" : "var(--gold)";
  if (c === 8) {
    const r = findCombo(S.thirdSel);
    document.getElementById("comboInfo").innerHTML = r
      ? `<div class="ci">✓ Combination: <strong>${r[0]}</strong> — Draw ready!</div>`
      : `<div class="ci" style="color:var(--red);border-color:var(--red)">⚠ No match found</div>`;
  } else document.getElementById("comboInfo").innerHTML = "";
}

function doneThird() {
  if (S.thirdSel.length !== 8) {
    notify("Select exactly 8!", "err");
    return;
  }
  const r = findCombo(S.thirdSel);
  if (!r) {
    notify("No combination found!", "err");
    return;
  }
  S.comboRow = r;
  buildMatches();
  renderBracket("r32");
  goPhase(2);
}

function buildMatches() {
  S.matchups = calculateMatchups(S.comboRow, S.groups);
  S.wins = {};
}

// ===== BRACKET RENDERING =====

function renderBracket(phase) {
  const cfg = {
    r32: {
      leftM: [74, 77, 73, 75, 83, 84, 81, 82],
      rightM: [76, 78, 79, 80, 86, 88, 85, 87],
      label: "Round of 32",
      cid: "r32root",
    },
    r16: {
      leftM: [89, 90, 93, 94],
      rightM: [91, 92, 95, 96],
      label: "Round of 16",
      cid: "r16root",
    },
    qf: {
      leftM: [97, 98],
      rightM: [99, 100],
      label: "Quarter Finals",
      cid: "qfroot",
    },
    sf: { leftM: [101], rightM: [102], label: "Semi Finals", cid: "sfroot" },
  }[phase];

  const c = document.getElementById(cfg.cid);
  c.innerHTML = "";
  const r = document.createElement("div");
  r.className = "bracket-root";
  r.style.cssText =
    "display:flex;align-items:center;justify-content:center;gap:60px;width:max-content;margin:0 auto;";

  const ls = buildSide(cfg.leftM, phase, "left");
  const ct = buildCenter(phase);
  const rs = buildSide(cfg.rightM, phase, "right");

  r.appendChild(ls);
  r.appendChild(ct);
  r.appendChild(rs);
  c.appendChild(r);
}

function buildSide(matches, phase, side) {
  const w = document.createElement("div");
  w.className = "side-wrap " + (side === "left" ? "left-col" : "right-col");
  matches.forEach((mn) => {
    w.appendChild(makeMatchCard(mn, phase, side));
  });
  return w;
}

// ===== MATCH CARD — সব পরিবর্তন এখানে =====
function makeMatchCard(matchNum, phase, side) {
  const m = S.matchups[matchNum];
  const c = document.createElement("div");
  c.className = "b-match";
  c.style.position = "relative";

  if (!m || !m.t1 || !m.t2) {
    c.innerHTML = `<div style="height:72px;opacity:0.3;border:1px dashed rgba(201,168,76,0.2);border-radius:6px;"></div>`;
    return c;
  }

  const win = S.wins[matchNum];

  // ---- Match Number Label ----
  // Left column: match number on the LEFT outside edge
  // Right column: match number on the RIGHT outside edge
  const mnLabel = document.createElement("div");
  mnLabel.className = "match-num-label";
  if (side === "left") {
    mnLabel.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);right:calc(100% + 10px);font-size:0.72rem;font-weight:bold;color:rgba(201,168,76,0.75);white-space:nowrap;pointer-events:none;letter-spacing:0.5px;";
  } else {
    mnLabel.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);left:calc(100% + 10px);font-size:0.72rem;font-weight:bold;color:rgba(201,168,76,0.75);white-space:nowrap;pointer-events:none;letter-spacing:0.5px;";
  }
  mnLabel.textContent = `M${matchNum}`;
  c.appendChild(mnLabel);

  // ---- Team Rows ----
  [m.t1, m.t2].forEach((team, ti) => {
    const row = document.createElement("div");
    const isWin = win && win.id === team.id;
    row.className = "b-team" + (isWin ? " win" : "");
    row.onclick = () => pickW(matchNum, team.id, phase);

    // Crown BEFORE info button (left of info btn)
    const crownHtml = isWin ? `<span class="wc">👑</span>` : "";

    row.innerHTML =
      `${fImg(team.name, "fl-sm")}` +
      `<span class="tn">${team.name}</span>` +
      crownHtml +
      `<span class="info-btn" onclick="event.stopPropagation(); showTeamInfo('${team.id}')">i</span>`;

    c.appendChild(row);

    if (ti === 0) {
      const vs = document.createElement("div");
      vs.className = "b-vs";
      vs.textContent = "VS";
      c.appendChild(vs);
    }
  });

  // ---- Eye Button — inside match card, positioned on inner edge ----
  const eye = document.createElement("div");
  eye.className = "eye-btn";
  eye.innerHTML = "👁";

  // Left column: eye btn on RIGHT inner edge of card — card থেকে আলাদা রাখতে right:-32px
  // Right column: eye btn on LEFT inner edge of card — card থেকে আলাদা রাখতে left:-32px
  if (side === "left") {
    eye.style.cssText =
      "position:absolute;top:50%;transform:translateY(-50%);right:-32px;width:26px;height:26px;border-radius:50%;background:rgba(46,204,113,0.12);border:1.5px solid rgba(46,204,113,0.5);color:var(--green);font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 8px rgba(46,204,113,0.25);transition:all .15s;user-select:none;z-index:10;";
  } else {
    eye.style.cssText =
      "position:absolute;top:50%;transform:translateY(-50%);left:-32px;width:26px;height:26px;border-radius:50%;background:rgba(46,204,113,0.12);border:1.5px solid rgba(46,204,113,0.5);color:var(--green);font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 8px rgba(46,204,113,0.25);transition:all .15s;user-select:none;z-index:10;";
  }

  // Event listener দিয়ে attach করছি — onclick attribute এর বদলে
  eye.addEventListener("click", (e) => {
    e.stopPropagation();
    showH2H(matchNum);
  });

  c.appendChild(eye);
  return c;
}

function buildCenter(phase) {
  const d = document.createElement("div");
  d.className = "b-final-col";
  if (phase === "sf") {
    const fb = document.createElement("div");
    fb.className = "b-final-box";
    fb.style.minWidth = "180px";
    const m = S.matchups[103];
    if (m && m.t1 && m.t2) {
      const w = S.wins[103];
      fb.innerHTML = `<div class="b-final-label">🏆 FINAL 🏆</div><div class="b-final-team ${w && w.id === m.t1.id ? "win" : ""}" onclick="pFinal('${m.t1.id}')">${fImg(m.t1.name, "fl-sm")}<span class="tn">${m.t1.name}</span>${w && w.id === m.t1.id ? '<span class="wc">👑</span>' : ""}</div><div class="b-final-vs">⚽ VS ⚽</div><div class="b-final-team ${w && w.id === m.t2.id ? "win" : ""}" onclick="pFinal('${m.t2.id}')">${fImg(m.t2.name, "fl-sm")}<span class="tn">${m.t2.name}</span>${w && w.id === m.t2.id ? '<span class="wc">👑</span>' : ""}</div>`;
    } else {
      fb.innerHTML = `<div class="b-final-label">🏆 FINAL 🏆</div><div style="color:var(--dim);font-size:0.72rem;padding:10px;">TBD vs TBD</div>`;
    }
    d.appendChild(fb);
  } else {
    const lbl = document.createElement("div");
    lbl.style.cssText =
      "font-size:0.75rem;color:rgba(201,168,76,0.4);letter-spacing:1px;text-transform:uppercase;padding:20px 0;";
    lbl.textContent = "VS";
    d.appendChild(lbl);
  }
  return d;
}

function pickW(num, tid, phase) {
  const m = S.matchups[num];
  if (!m) return;
  S.wins[num] = m.t1.id === tid ? m.t1 : m.t2;
  renderBracket(phase);
}

function pFinal(tid) {
  const m = S.matchups[103];
  if (!m) return;
  S.wins[103] = m.t1.id === tid ? m.t1 : m.t2;
  renderBracket("sf");
  renderFinalCard();
  document.getElementById("champBox").style.display = "block";
  document.getElementById("champName").innerHTML =
    `${fImg(S.wins[103].name, "fl-lg")}<span style="margin-left:8px">${S.wins[103].name}</span>`;
  document.getElementById("genBtn").style.display = "inline-block";
}

function renderFinalCard() {
  const fc = document.getElementById("finalCard");
  const m = S.matchups[103];
  if (!m || !m.t1 || !m.t2) {
    fc.innerHTML = "";
    return;
  }
  const w = S.wins[103];
  fc.innerHTML = `<div class="b-final-label" style="font-size:.7rem;letter-spacing:2px;">🏆 THE FINAL — Match 103 🏆</div><div class="b-final-team ${w && w.id === m.t1.id ? "win" : ""}" onclick="pFinal('${m.t1.id}')">${fImg(m.t1.name, "fl-lg")}<span class="tn">${m.t1.name}</span>${w && w.id === m.t1.id ? '<span class="wc" style="font-size:1rem;">👑</span>' : ""}</div><div class="b-final-vs">⚽ VS ⚽</div><div class="b-final-team ${w && w.id === m.t2.id ? "win" : ""}" onclick="pFinal('${m.t2.id}')">${fImg(m.t2.name, "fl-lg")}<span class="tn">${m.t2.name}</span>${w && w.id === m.t2.id ? '<span class="wc" style="font-size:1rem;">👑</span>' : ""}</div>`;
}

// ===== ADVANCE FUNCTIONS =====

function advanceR32() {
  const nums = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88];
  if (!nums.every((n) => S.wins[n])) {
    notify("Pick all R32 winners!", "err");
    return;
  }
  S.matchups[89] = { t1: S.wins[74], t2: S.wins[77] };
  S.matchups[90] = { t1: S.wins[73], t2: S.wins[75] };
  S.matchups[91] = { t1: S.wins[76], t2: S.wins[78] };
  S.matchups[92] = { t1: S.wins[79], t2: S.wins[80] };
  S.matchups[93] = { t1: S.wins[83], t2: S.wins[84] };
  S.matchups[94] = { t1: S.wins[81], t2: S.wins[82] };
  S.matchups[95] = { t1: S.wins[86], t2: S.wins[88] };
  S.matchups[96] = { t1: S.wins[85], t2: S.wins[87] };
  [89, 90, 91, 92, 93, 94, 95, 96].forEach((n) => delete S.wins[n]);
  renderBracket("r16");
  goPhase(3);
}

function advanceR16() {
  const nums = [89, 90, 91, 92, 93, 94, 95, 96];
  if (!nums.every((n) => S.wins[n])) {
    notify("Pick all R16 winners!", "err");
    return;
  }
  S.matchups[97] = { t1: S.wins[89], t2: S.wins[90] };
  S.matchups[98] = { t1: S.wins[93], t2: S.wins[94] };
  S.matchups[99] = { t1: S.wins[91], t2: S.wins[92] };
  S.matchups[100] = { t1: S.wins[95], t2: S.wins[96] };
  [97, 98, 99, 100].forEach((n) => delete S.wins[n]);
  renderBracket("qf");
  goPhase(4);
}

function advanceQF() {
  const nums = [97, 98, 99, 100];
  if (!nums.every((n) => S.wins[n])) {
    notify("Pick all QF winners!", "err");
    return;
  }
  S.matchups[101] = { t1: S.wins[97], t2: S.wins[98] };
  S.matchups[102] = { t1: S.wins[99], t2: S.wins[100] };
  [101, 102].forEach((n) => delete S.wins[n]);
  renderBracket("sf");
  goPhase(5);
}

function advanceSF() {
  if (!S.wins[101] || !S.wins[102]) {
    notify("Pick both SF winners!", "err");
    return;
  }
  S.matchups[103] = { t1: S.wins[101], t2: S.wins[102] };
  delete S.wins[103];

  const champBox = document.getElementById("champBox");
  const genBtn = document.getElementById("genBtn");
  const champName = document.getElementById("champName");
  if (champBox) champBox.style.display = "none";
  if (genBtn) genBtn.style.display = "none";
  if (champName) champName.innerHTML = "";

  renderFinalCard();
  goPhase(6);
}

function goPhase(n) {
  document
    .querySelectorAll(".phase")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(`ph-${n}`).classList.add("active");
  document.querySelectorAll(".si").forEach((s, i) => {
    s.classList.remove("active", "done");
    if (i < n) s.classList.add("done");
    if (i === n) s.classList.add("active");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== MODAL =====

function openModal() {
  if (!S.wins[103]) {
    notify("Pick Final winner!", "err");
    return;
  }
  document.getElementById("nameModal").classList.add("show");
  document.getElementById("nameInput").focus();
}

function closeModal() {
  document.getElementById("nameModal").classList.remove("show");
}

document.getElementById("nameInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") makeCard();
});

function notify(msg, t = "info") {
  const el = document.getElementById("notif");
  el.textContent = msg;
  el.className = `notif ${t} show`;
  setTimeout(() => el.classList.remove("show"), 3000);
}

// ===== STAT MODAL =====

function closeStatModal() {
  const bg = document.getElementById("statModalBg");
  if (bg) {
    bg.classList.remove("show");
    // একটু delay দিয়ে display none করি transition এর জন্য
    setTimeout(() => { if (!bg.classList.contains("show")) bg.style.display = "none"; }, 300);
  }
}

function showStatModal(html) {
  let bg = document.getElementById("statModalBg");
  if (!bg) {
    bg = document.createElement("div");
    bg.id = "statModalBg";
    bg.className = "stat-modal-bg";
    document.body.appendChild(bg);
  }
  bg.innerHTML = `<div class="stat-modal">${html}</div>`;
  bg.style.display = "flex";
  // force reflow
  bg.offsetHeight;
  bg.classList.add("show");

  // backdrop click to close
  bg.onclick = (e) => {
    if (e.target === bg) closeStatModal();
  };
}

// ===== TEAM INFO POPUP =====

function na(v, fallback = "N/A") {
  return v === null || v === undefined || v === "" ? fallback : v;
}

function titleCaseNamePart(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/(^|[\s\-'’])([^\s\-'’])/g, (match, sep, char) => sep + char.toLocaleUpperCase("en"));
}

function playerDisplayName(player) {
  if (!player) return "N/A";

  const firstNames = String(player.firstNames || "").trim();
  const lastNames = String(player.lastNames || "").trim();

  if (firstNames && lastNames) {
    return `${firstNames} ${titleCaseNamePart(lastNames)}`;
  }

  const raw = String(player.name || "").trim();
  const match = raw.match(/^([A-ZÀ-ÖØ-Þ\-'’ ]{2,})\s+(.+)$/);
  if (match) {
    return `${match[2].trim()} ${titleCaseNamePart(match[1])}`;
  }

  return na(raw);
}

function pctPart(v, total) {
  const n = Number(v);
  const t = Number(total);
  if (!Number.isFinite(n) || !Number.isFinite(t) || t <= 0) return 0;
  return Math.max(0, Math.min(100, (n / t) * 100));
}

function recordHtml(title, record) {
  const r = record || {};
  const played = na(r.m);
  const wins = na(r.w);
  const draws = na(r.d);
  const losses = na(r.l);
  const hasNumbers = [r.m, r.w, r.d, r.l].every((x) => Number.isFinite(Number(x)));

  return `
    <div class="stat-box">
      <h4>${title}</h4>
      <div class="stats-bar-row">
        <div class="stats-mini"><div class="stats-mini-val" style="color:#fff">${played}</div><div class="stats-mini-lbl">Played</div></div>
        <div class="stats-mini"><div class="stats-mini-val" style="color:#2ecc71">${wins}</div><div class="stats-mini-lbl">Won</div></div>
        <div class="stats-mini"><div class="stats-mini-val" style="color:#f1c40f">${draws}</div><div class="stats-mini-lbl">Drawn</div></div>
        <div class="stats-mini"><div class="stats-mini-val" style="color:#e74c3c">${losses}</div><div class="stats-mini-lbl">Lost</div></div>
      </div>
      ${
        hasNumbers
          ? `<div class="win-bar-wrap">
              <div class="win-bar-seg" style="width:${pctPart(r.w, r.m).toFixed(1)}%;background:#2ecc71;" title="Wins"></div>
              <div class="win-bar-seg" style="width:${pctPart(r.d, r.m).toFixed(1)}%;background:#f1c40f;" title="Draws"></div>
              <div class="win-bar-seg" style="width:${pctPart(r.l, r.m).toFixed(1)}%;background:#e74c3c;" title="Losses"></div>
            </div>`
          : `<div class="source-note">Verified aggregate record is not loaded yet. Add a sourced record to data.js before showing this as a fact.</div>`
      }
      ${r.source || r.status ? `<div class="source-note">Source: ${na(r.source, "Verified data")} ${r.status ? `• ${r.status}` : ""}</div>` : ""}
    </div>`;
}

function showTeamInfo(tid) {
  const t = TEAMS.find((x) => x.id === tid);
  if (!t) return;
  const d = DB[tid];
  if (!d) return;

  const players = Array.isArray(d.players) ? d.players : [];
  const squadHtml = players.length
    ? players.map((p) => `
        <span class="squad-player">
          <strong>${playerDisplayName(p)}</strong>
          <small>#${na(p.no)} • ${na(p.pos)} • ${na(p.club)}</small>
          <small>DOB: ${na(p.dob)} • Age: ${na(p.age)} • Height: ${na(p.heightCm)} cm</small>
        </span>`).join("")
    : (d.sq || "").split(",").map((name) => name.trim()).filter(Boolean).map((name) => `<span class="squad-player">${name}</span>`).join("");

  let html = `
    <button class="close-btn" onclick="closeStatModal()">✕</button>
    <h3>${fImg(t.name, "fl-sm")} ${t.name}</h3>`;

  html += `
    <div class="stat-box">
      <h4>📊 Team Overview</h4>
      <div class="stat-row"><span class="label">Official Name</span><span class="value">${na(d.officialName, t.name)}</span></div>
      <div class="stat-row"><span class="label">FIFA Code</span><span class="value">${na(d.fifaCode)}</span></div>
      <div class="stat-row"><span class="label">🏆 FIFA Ranking</span><span class="value rank-badge">${d.rank ? `#${d.rank}` : "N/A"}</span></div>
      <div class="stat-row"><span class="label">💰 Market Value</span><span class="value" style="color:#f1c40f">${na(d.val)}</span></div>
      <div class="stat-row"><span class="label">👔 Manager</span><span class="value">${na(d.mgr)}</span></div>
      <div class="stat-row"><span class="label">Avg Age</span><span class="value">${Number.isFinite(Number(d.avgAge)) ? Number(d.avgAge).toFixed(2) : "N/A"}</span></div>
      <div class="stat-row"><span class="label">Avg Height</span><span class="value">${Number.isFinite(Number(d.avgHeightCm)) ? Number(d.avgHeightCm).toFixed(2) + " cm" : "N/A"}</span></div>
    </div>`;

  html += recordHtml("🌍 All-Time International Record", d.s);
  html += recordHtml("🏆 FIFA World Cup Record", d.ws);

  html += `
    <div class="stat-box">
      <h4>👥 2026 World Cup Squad</h4>
      <div class="squad-grid">${squadHtml}</div>
    </div>
    <div class="source-note">
      Squad/manager/age/height: FIFA official squad list. Ranking: ${na(d.rankSource)}. Market value: ${na(d.marketSource)}.
      ${na(d.dataStatus, "")}
    </div>`;

  showStatModal(html);
}

// ===== H2H POPUP =====

function h2hLookup(id1, id2) {
  const direct = H2H?.[`${id1}-${id2}`];
  if (direct) return { ...direct, flipped: false };
  const reverse = H2H?.[`${id2}-${id1}`];
  if (reverse) {
    return {
      matches: reverse.matches,
      t1Wins: reverse.t2Wins,
      draws: reverse.draws,
      t2Wins: reverse.t1Wins,
      source: reverse.source,
      status: reverse.status,
      flipped: true,
    };
  }
  return null;
}

function h2hBarHtml(label1, label2, h) {
  const total = Number(h.matches);
  const w1 = Number(h.t1Wins);
  const d = Number(h.draws);
  const w2 = Number(h.t2Wins);
  if (![total, w1, d, w2].every(Number.isFinite)) {
    return `<div class="source-note">Verified H2H numbers are not available for this pair yet.</div>`;
  }
  if (total <= 0) {
    return `<div class="stats-bar-row">
        <div class="stats-mini"><div class="stats-mini-val" style="color:#fff">0</div><div class="stats-mini-lbl">Played</div></div>
        <div class="stats-mini"><div class="stats-mini-val" style="color:#2ecc71">0</div><div class="stats-mini-lbl">${label1}</div></div>
        <div class="stats-mini"><div class="stats-mini-val" style="color:#f1c40f">0</div><div class="stats-mini-lbl">Draws</div></div>
        <div class="stats-mini"><div class="stats-mini-val" style="color:#3498db">0</div><div class="stats-mini-lbl">${label2}</div></div>
      </div>
      <div class="source-note">No previous meetings found in the verified H2H file. Source: ${na(h.source, "Verified data")} ${h.status ? `• ${h.status}` : ""}</div>`;
  }
  return `
    <div class="h2h-bar-label">
      <span style="color:#2ecc71">${label1}: ${w1}</span>
      <span style="color:#f1c40f">Draws: ${d}</span>
      <span style="color:#3498db">${label2}: ${w2}</span>
    </div>
    <div class="h2h-bar-wrap">
      <div style="width:${pctPart(w1, total)}%;background:#2ecc71;height:100%;border-radius:4px 0 0 4px;transition:width .5s"></div>
      <div style="width:${pctPart(d, total)}%;background:#f1c40f;height:100%;transition:width .5s"></div>
      <div style="width:${pctPart(w2, total)}%;background:#3498db;height:100%;border-radius:0 4px 4px 0;transition:width .5s"></div>
    </div>
    <div class="source-note">Source: ${na(h.source, "Not set")} ${h.status ? `• ${h.status}` : ""}</div>`;
}

function showH2H(mn) {
  const m = S.matchups[mn];
  if (!m || !m.t1 || !m.t2) return;
  const d1 = DB[m.t1.id],
    d2 = DB[m.t2.id];
  if (!d1 || !d2) return;

  const v = VENUES[Math.floor(Math.random() * VENUES.length)];
  const h = h2hLookup(m.t1.id, m.t2.id);
  const rankBetter1 = Number(d1.rank || 999) < Number(d2.rank || 999);

  let html = `<button class="close-btn" onclick="closeStatModal()">✕</button>`;
  html += `<h3>⚔️ Match ${mn} Preview</h3>`;

  html += `<div class="h2h-teams-row">
    <div class="h2h-team-card">
      <div class="h2h-flag">${fImg(m.t1.name, "fl-lg")}</div>
      <div class="h2h-team-name">${m.t1.name}</div>
      <div class="h2h-rank ${rankBetter1 ? "rank-better" : ""}">${d1.rank ? `#${d1.rank}` : "N/A"} FIFA</div>
      <div class="h2h-val">${na(d1.val)}</div>
      <div class="source-note">Avg age ${Number.isFinite(Number(d1.avgAge)) ? Number(d1.avgAge).toFixed(2) : "N/A"} • Avg height ${Number.isFinite(Number(d1.avgHeightCm)) ? Number(d1.avgHeightCm).toFixed(2) + " cm" : "N/A"}</div>
    </div>
    <div class="h2h-vs-center">
      <div class="h2h-vs-icon">⚽</div>
      <div class="h2h-vs-txt">VS</div>
      <div class="h2h-vs-icon">⚽</div>
    </div>
    <div class="h2h-team-card">
      <div class="h2h-flag">${fImg(m.t2.name, "fl-lg")}</div>
      <div class="h2h-team-name">${m.t2.name}</div>
      <div class="h2h-rank ${!rankBetter1 ? "rank-better" : ""}">${d2.rank ? `#${d2.rank}` : "N/A"} FIFA</div>
      <div class="h2h-val">${na(d2.val)}</div>
      <div class="source-note">Avg age ${Number.isFinite(Number(d2.avgAge)) ? Number(d2.avgAge).toFixed(2) : "N/A"} • Avg height ${Number.isFinite(Number(d2.avgHeightCm)) ? Number(d2.avgHeightCm).toFixed(2) + " cm" : "N/A"}</div>
    </div>
  </div>`;

  html += `<div class="stat-box">
    <h4>🤝 Verified Head to Head</h4>
    ${
      h
        ? h2hBarHtml(m.t1.name, m.t2.name, h)
        : `<div class="source-note">No H2H record object was found for this pair. Please check Head to Head.xlsx import and team ID mapping.</div>`
    }
  </div>`;

  html += `<div class="stat-grid">
    <div class="stat-box" style="text-align:center">
      <h4 style="justify-content:center;font-size:0.78rem">👔 Manager</h4>
      <div style="font-size:0.88rem;color:#fff;font-weight:600">${na(d1.mgr)}</div>
      <div style="font-size:0.68rem;color:var(--dim);margin-top:2px">${m.t1.name}</div>
    </div>
    <div class="stat-box" style="text-align:center">
      <h4 style="justify-content:center;font-size:0.78rem">👔 Manager</h4>
      <div style="font-size:0.88rem;color:#fff;font-weight:600">${na(d2.mgr)}</div>
      <div style="font-size:0.68rem;color:var(--dim);margin-top:2px">${m.t2.name}</div>
    </div>
  </div>`;

  html += `<div class="stat-box">
    <h4>🏟️ Match Venue</h4>
    <div class="stat-row"><span class="label">Stadium</span><span class="value">${na(v.std)}</span></div>
    <div class="stat-row"><span class="label">City</span><span class="value">${na(v.city)}</span></div>
    <div class="stat-row"><span class="label">Location</span><span class="value">${na(v.loc)}</span></div>
    <div class="stat-row"><span class="label">Capacity</span><span class="value">${na(v.cap)}</span></div>
    <div class="stat-row"><span class="label">Avg Temp</span><span class="value">${v.weather?.tempC ?? "N/A"}°C</span></div>
    <div class="stat-row"><span class="label">Humidity</span><span class="value">${v.weather?.humidityPct ?? "N/A"}%</span></div>
    <div class="stat-row"><span class="label">Wind Speed</span><span class="value">${v.weather?.windKmh ?? "N/A"} km/h</span></div>
    <div class="source-note">${na(v.weatherNote, "")}</div>
  </div>`;

  showStatModal(html);
}

// ===== PHOTOCARD =====

async function makeCard() {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) {
    notify("Enter your name!", "err");
    return;
  }
  S.name = name;
  closeModal();
  document.getElementById("lbg").classList.add("show");
  await loadFlags();
  try {
    drawPhotocard();
  } catch (e) {
    console.error(e);
    notify("Error!", "err");
  }
  document.getElementById("lbg").classList.remove("show");
}

async function loadFlags() {
  const names = new Set();
  for (let n = 73; n <= 103; n++) {
    const m = S.matchups[n];
    if (m) {
      if (m.t1) names.add(m.t1.name);
      if (m.t2) names.add(m.t2.name);
    }
  }
  if (S.wins[103]) names.add(S.wins[103].name);
  await Promise.allSettled(
    [...names].map(
      (n) =>
        new Promise((res) => {
          if (S.imgCache[n]) return res();
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            S.imgCache[n] = img;
            res();
          };
          img.onerror = () => res();
          img.src = fUrl(n);
        }),
    ),
  );
}

function drawPhotocard() {
  const C = document.getElementById("cvs");
  const ctx = C.getContext("2d");
  // H = bracket area + small bottom padding — R32 bracket পুরোটা দেখাবে
  // R32H = 1260px, y_start = 205px → content goes to 1465px
  const W = 2400,
    H = 1505;
  C.width = W;
  C.height = H;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#07111f");
  bg.addColorStop(0.5, "#0c1c33");
  bg.addColorStop(1, "#071120");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = "#4a7ab5";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "rgba(201,168,76,0.55)";
  ctx.lineWidth = 2;
  rr(ctx, 8, 8, W - 16, H - 16, 10);
  ctx.stroke();
  ctx.restore();

  let y = 20;
  const hg = ctx.createLinearGradient(0, y, W, y + 80);
  hg.addColorStop(0, "rgba(5,13,26,0.9)");
  hg.addColorStop(1, "rgba(13,31,60,0.9)");
  ctx.fillStyle = hg;
  ctx.fillRect(0, y, W, 80);
  ctx.font = "bold 38px Arial";
  ctx.fillStyle = "#c9a84c";
  ctx.textAlign = "center";
  ctx.fillText("FIFA WORLD CUP 2026", W / 2, y + 40);
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("PREDICTION SIMULATOR BY TANVIR AHMED", W / 2, y + 65);

  y += 85;
  const g2 = ctx.createLinearGradient(0, y, W, y);
  g2.addColorStop(0, "transparent");
  g2.addColorStop(0.1, "rgba(201,168,76,0.55)");
  g2.addColorStop(0.9, "rgba(201,168,76,0.55)");
  g2.addColorStop(1, "transparent");
  ctx.fillStyle = g2;
  ctx.fillRect(0, y, W, 1);

  y += 15;
  const bW = 400,
    bX = (W - bW) / 2;
  ctx.save();
  rr(ctx, bX, y, bW, 50, 25);
  const bg3 = ctx.createLinearGradient(bX, y, bX + bW, y + 50);
  bg3.addColorStop(0, "rgba(201,168,76,0.08)");
  bg3.addColorStop(0.5, "rgba(201,168,76,0.2)");
  bg3.addColorStop(1, "rgba(201,168,76,0.08)");
  ctx.fillStyle = bg3;
  ctx.fill();
  ctx.strokeStyle = "rgba(201,168,76,0.65)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.font = "11px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("PREDICTED BY", W / 2, y + 16);
  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(S.name, W / 2, y + 38);

  y += 65;
  const g3 = ctx.createLinearGradient(0, y, W, y);
  g3.addColorStop(0, "transparent");
  g3.addColorStop(0.1, "rgba(201,168,76,0.55)");
  g3.addColorStop(0.9, "rgba(201,168,76,0.55)");
  g3.addColorStop(1, "transparent");
  ctx.fillStyle = g3;
  ctx.fillRect(0, y, W, 1);

  y += 20;

  // ===== PHOTOCARD LAYOUT CONSTANTS =====
  const TW = 160;    // team card width — 155 → 160 (yellow space ব্যবহার, gap 101px ok)
  const TH = 54;     // team card height বাড়ানো হয়েছে (50 → 54) — font বড় করার জায়গা
  const VS = 18;     // VS gap between two teams
  const MH = TH * 2 + VS;   // total match height = 126px
  const COL_GAP = 75;        // gap between round columns
  const PX = 140;            // left/right page padding

  // Column X positions
  const r32LX = PX;
  const r32RX = W - PX - TW;
  const r16LX = r32LX + TW + COL_GAP;
  const r16RX = r32RX - TW - COL_GAP;
  const qfLX  = r16LX + TW + COL_GAP;
  const qfRX  = r16RX - TW - COL_GAP;
  const sfLX  = qfLX  + TW + COL_GAP;
  const sfRX  = qfRX  - TW - COL_GAP;
  const finX  = (W - TW) / 2;  // center

  // ===== HELPER: Draw one team slot =====
  function drawTeamSlot(cx, cy, cw, ch, team, isWin) {
    ctx.save();
    rr(ctx, cx, cy, cw, ch, 5);
    if (isWin) {
      const wg = ctx.createLinearGradient(cx, cy, cx + cw, cy);
      wg.addColorStop(0, "rgba(201,168,76,0.22)");
      wg.addColorStop(1, "rgba(201,168,76,0.08)");
      ctx.fillStyle = wg;
      ctx.fill();
      ctx.strokeStyle = "rgba(201,168,76,0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(12,24,46,0.92)";
      ctx.fill();
      // ✅ পরাজিত দলের border আলাদা রঙে — background এর সাথে মিশে না যায়
      ctx.strokeStyle = "rgba(180,150,60,0.55)";  // subtle gold border
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();

    const fi = S.imgCache[team.name];
    const fW = 26, fH = 17, pad = 8;  // flag বড় করা হয়েছে (22→26, 14→17)
    const icy = cy + ch / 2;
    if (fi) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx + pad, icy - fH / 2, fW, fH);
      ctx.clip();
      ctx.drawImage(fi, cx + pad, icy - fH / 2, fW, fH);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cx + pad, icy - fH / 2, fW, fH);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(cx + pad, icy - fH / 2, fW, fH);
    }

    // Team name — font বড় করা হয়েছে (14 → 16px)
    let nm = team.name;
    const maxW = cw - pad * 2 - fW - 6 - (isWin ? 16 : 0);
    ctx.font = isWin ? "bold 16px Arial" : "16px Arial";  // 14 → 16px
    while (ctx.measureText(nm).width > maxW && nm.length > 2)
      nm = nm.slice(0, -1);
    if (nm !== team.name) nm = nm.slice(0, -1) + "…";
    ctx.fillStyle = isWin ? "#c9a84c" : "rgba(255,255,255,0.92)";
    ctx.textAlign = "left";
    ctx.fillText(nm, cx + pad + fW + 6, icy + 6);
    if (isWin) {
      ctx.font = "12px serif";
      ctx.textAlign = "right";
      ctx.fillText("👑", cx + cw - 5, icy + 6);
    }
  }

  // ===== HELPER: Draw one match (2 teams + VS divider + match number) =====
  function drawMatch(cx, cy, mn, side) {
    const m = S.matchups[mn];
    if (!m || !m.t1 || !m.t2) {
      ctx.save();
      rr(ctx, cx, cy, TW, MH, 5);
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      return;
    }
    const win = S.wins[mn];
    drawTeamSlot(cx, cy, TW, TH, m.t1, win && win.id === m.t1.id);

    // VS divider line
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + TH + VS / 2);
    ctx.lineTo(cx + TW - 8, cy + TH + VS / 2);
    ctx.stroke();
    ctx.restore();

    drawTeamSlot(cx, cy + TH + VS, TW, TH, m.t2, win && win.id === m.t2.id);

    // Match number label
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "rgba(201,168,76,0.65)";
    const mTxt = `M${mn}`;
    const mY = cy + MH / 2 + 6;
    if (side === "left") {
      ctx.textAlign = "right";
      ctx.fillText(mTxt, cx - 14, mY);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(mTxt, cx + TW + 14, mY);
    }
  }

  // ===== DRAW ALL ROUNDS =====

  // R32 — 8 matches each side
  const GAP_R32 = 36;   // 34 → 36 (TH বাড়ার সাথে সামঞ্জস্য)
  const R32H = 8 * MH + 7 * GAP_R32;

  for (let i = 0; i < 8; i++) {
    drawMatch(r32LX, y + i * (MH + GAP_R32), [74, 77, 73, 75, 83, 84, 81, 82][i], "left");
    drawMatch(r32RX, y + i * (MH + GAP_R32), [76, 78, 79, 80, 86, 88, 85, 87][i], "right");
  }

  // R16 — 4 matches each side, vertically centered vs R32
  const GAP_R16 = 110;
  const R16H = 4 * MH + 3 * GAP_R16;
  const r16OY = y + (R32H - R16H) / 2;
  for (let i = 0; i < 4; i++) {
    drawMatch(r16LX, r16OY + i * (MH + GAP_R16), [89, 90, 93, 94][i], "left");
    drawMatch(r16RX, r16OY + i * (MH + GAP_R16), [91, 92, 95, 96][i], "right");
  }

  // QF — 2 matches each side
  const GAP_QF = 250;
  const QFH = 2 * MH + GAP_QF;
  const qfOY = y + (R32H - QFH) / 2;
  drawMatch(qfLX, qfOY,             97,  "left");
  drawMatch(qfLX, qfOY + MH + GAP_QF, 98, "left");
  drawMatch(qfRX, qfOY,             99,  "right");
  drawMatch(qfRX, qfOY + MH + GAP_QF, 100, "right");

  // SF — 1 match each side, vertically centered
  const sfOY = y + (R32H - MH) / 2;
  drawMatch(sfLX, sfOY, 101, "left");
  drawMatch(sfRX, sfOY, 102, "right");

  // ===== FINAL BOX — center, vertically aligned with SF =====
  const fm = S.matchups[103];
  if (fm && fm.t1 && fm.t2) {
    const finCardW = TW + 28;
    const fX = finX - 14;  // slight left shift to center the wider card
    const finCardH = MH + 26;

    ctx.save();
    ctx.shadowColor = "rgba(201,168,76,0.55)";
    ctx.shadowBlur = 20;
    rr(ctx, fX, sfOY, finCardW, finCardH, 8);
    const fg = ctx.createLinearGradient(fX, sfOY, fX + finCardW, sfOY + finCardH);
    fg.addColorStop(0, "rgba(22,42,78,0.98)");
    fg.addColorStop(1, "rgba(10,22,46,0.98)");
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(201,168,76,0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // "FINAL" label
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "#c9a84c";
    ctx.textAlign = "center";
    ctx.fillText("🏆 FINAL 🏆", fX + finCardW / 2, sfOY + 15);

    // Team 1
    drawTeamSlot(fX + 5, sfOY + 19, finCardW - 10, TH, fm.t1,
      S.wins[103] && S.wins[103].id === fm.t1.id);

    // Divider
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fX + 10, sfOY + 19 + TH + 2);
    ctx.lineTo(fX + finCardW - 10, sfOY + 19 + TH + 2);
    ctx.stroke();
    ctx.restore();

    // Team 2
    drawTeamSlot(fX + 5, sfOY + 19 + TH + VS, finCardW - 10, TH, fm.t2,
      S.wins[103] && S.wins[103].id === fm.t2.id);
  }

  // ===== CHAMPION BOX — Final Box এর ঠিক নিচে (লাল মার্কার পজিশন) =====
  // sfOY = SF match এর Y, finCardH = Final box এর height
  const finCardHForChamp = MH + 26;
  const champY = sfOY + finCardHForChamp + 35;
  if (S.wins[103]) {
    const ch = S.wins[103];
    const cbW = 420, cbX = (W - cbW) / 2;
    ctx.save();
    rr(ctx, cbX, champY, cbW, 68, 30);
    ctx.shadowColor = "rgba(201,168,76,0.55)";
    ctx.shadowBlur = 16;
    const cg = ctx.createLinearGradient(cbX, champY, cbX + cbW, champY + 68);
    cg.addColorStop(0, "rgba(201,168,76,0.18)");
    cg.addColorStop(0.5, "rgba(201,168,76,0.38)");
    cg.addColorStop(1, "rgba(201,168,76,0.18)");
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    ctx.fillText("🏆  MY PREDICTED WORLD CUP CHAMPION  🏆", W / 2, champY + 18);

    const fi = S.imgCache[ch.name];
    const fW = 24, fH = 16;
    ctx.font = "bold 20px Arial";
    const nm = ch.name;
    const nmW = ctx.measureText(nm).width;
    const totalW = fW + 8 + nmW;
    const sx = (W - totalW) / 2;
    if (fi) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, champY + 28, fW, fH);
      ctx.clip();
      ctx.drawImage(fi, sx, champY + 28, fW, fH);
      ctx.restore();
    }
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(nm, sx + fW + 8, champY + 44);
  }

  const img = document.getElementById("pcImg");
  img.src = C.toDataURL("image/png");
  const pv = document.getElementById("pcPreview");
  pv.style.display = "block";
  pv.scrollIntoView({ behavior: "smooth" });
}

function dlPC() {
  const C = document.getElementById("cvs");
  const a = document.createElement("a");
  a.download = `WC2026_${S.name.replace(/[^\w]/g, "_")}.png`;
  a.href = C.toDataURL("image/png");
  a.click();
  notify("Downloading!", "ok");
}

function resetAll() {
  if (!confirm("Reset all predictions?")) return;
  S.thirdSel = [];
  S.comboRow = null;
  S.matchups = {};
  S.wins = {};
  S.name = "";
  document.getElementById("pcPreview").style.display = "none";
  document.getElementById("pcImg").src = "";
  document.getElementById("champBox").style.display = "none";
  document.getElementById("genBtn").style.display = "none";
  document.getElementById("nameInput").value = "";
  document.getElementById("comboInfo").innerHTML = "";
  init();
  goPhase(0);
  notify("Reset!", "ok");
}

init();
