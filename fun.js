import { FLAGS, TEAMS, CT } from "./data.js";

// পতাকার ইউআরএল জেনারেট করার হেল্পার ফাংশন
export const fUrl = (n) =>
  (FLAGS[n] || "https://flagcdn.com/w40/un.png").replace("w40", "w80");

// পতাকার ইমেজ ট্যাগ জেনারেট করার হেল্পার ফাংশন
export const fImg = (n, c = "fl") =>
  `<img src="${FLAGS[n] || "https://flagcdn.com/w40/un.png"}" class="${c}" alt="${n}" onerror="this.style.opacity='.2'">`;

// নির্বাচিত ৩য় দলের কম্বিনেশন খোঁজার লজিক
export function findCombo(selectedIds) {
  const k = selectedIds
    .map((id) => TEAMS.find((x) => x.id === id)?.group || "")
    .sort()
    .join("");
  return CT.find((r) => r[0] === k) || null;
}

// ক্যানভাসে রাউন্ডেড রেক্ট্যাঙ্গেল তৈরির হেল্পার ফাংশন
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ম্যাচআপ তৈরির পিওর লজিক (গ্লোবাল স্টেট মিউটেট না করে রেজাল্ট রিটার্ন করে)
export function calculateMatchups(comboRow, groups) {
  const getT = (g, p) => groups[g] ? groups[g][p] : null;
  const res3 = (code) => getT(code.replace("3", ""), 2);
  
  const r = comboRow;
  const cm = {
    "1A": r[1], "1B": r[2], "1D": r[3], "1E": r[4],
    "1G": r[5], "1I": r[6], "1K": r[7], "1L": r[8],
  };
  const t3 = (k) => res3(cm[k]);
  
  const matchups = {};
  matchups[73] = { t1: getT("A", 1), t2: getT("B", 1) };
  matchups[74] = { t1: getT("E", 0), t2: t3("1E") };
  matchups[75] = { t1: getT("F", 0), t2: getT("C", 1) };
  matchups[76] = { t1: getT("C", 0), t2: getT("F", 1) };
  matchups[77] = { t1: getT("I", 0), t2: t3("1I") };
  matchups[78] = { t1: getT("E", 1), t2: getT("I", 1) };
  matchups[79] = { t1: getT("A", 0), t2: t3("1A") };
  matchups[80] = { t1: getT("L", 0), t2: t3("1L") };
  matchups[81] = { t1: getT("D", 0), t2: t3("1D") };
  matchups[82] = { t1: getT("G", 0), t2: t3("1G") };
  matchups[83] = { t1: getT("K", 1), t2: getT("L", 1) };
  matchups[84] = { t1: getT("H", 0), t2: getT("J", 1) };
  matchups[85] = { t1: getT("B", 0), t2: t3("1B") };
  matchups[86] = { t1: getT("J", 0), t2: getT("H", 1) };
  matchups[87] = { t1: getT("K", 0), t2: t3("1K") };
  matchups[88] = { t1: getT("D", 1), t2: getT("G", 1) };
  
  return matchups;
}