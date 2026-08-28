try{
const compactSuffixes = [
  "",
  "K",
  "M",
  "B",
  "T",
  "Qd",
  "Qi",
  "Sx",
  "Sp",
  "Oc",
  "No",
  "Dc",
  "UDc",
  "DDc",
  "TDc",
  "QaD",
  "QiD",
  "SxD",
  "SpD",
  "OcD",
  "NoD",
  "Vg",
  "UVg",
  "DVg",
  "TVg",
  "Qag",
  "Qig",
  "Sxg",
  "Spg",
  "Ocg",
  "Nog",
  "Dcg",
  "UDcg",
  "DDcg",
  "TDcg",
  "Qadcg",
  "Qidcg",
  "Sxdcg",
  "Spdcg",
  "Odcg",
  "Nodcg"
];

const illionUnitPrefixes = ["", "U", "D", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
const illionTensPrefixes = { 4: "Qag", 5: "Qig", 6: "Sxg", 7: "Spg", 8: "Ocg", 9: "Nog" };

for (let group = compactSuffixes.length; group <= 111; group += 1) {
  let suffix;
  if (group < 100) {
    const tens = Math.floor(group / 10);
    const units = group % 10;
    suffix = `${illionUnitPrefixes[units]}${illionTensPrefixes[tens]}`;
  } else if (group < 110) {
    suffix = `${illionUnitPrefixes[group - 100]}Ce`;
  } else {
    suffix = `${group === 110 ? "De" : "UDe"}Ce`;
  }
  compactSuffixes.push(suffix);
}

const formatter = {
  format(value) {
    const num = new Decimal(value);

    if (num.isZero()) return "0";
    if (!num.isFinite()) return num.isNegative() ? "-Infinity" : "Infinity";

    let exponent = 0;
    let scaled = num.abs();
    while (scaled.gte(1000)) {
      scaled = scaled.div(1000);
      exponent += 1;
    }

    const suffix = exponent < compactSuffixes.length
      ? compactSuffixes[exponent]
      : `e${exponent * 3}`;

    const decimals = scaled.gte(100) ? 0 : scaled.gte(10) ? 1 : 2;
    const formatted = scaled.toDecimalPlaces(decimals).toString();
    return `${num.isNegative() ? "-" : ""}${formatted}${suffix}`;
  }
};
/**
 * @type {HTMLCanvasElement} canv
 */
const canv = document.getElementById("canvas");
const sz = canv.getBoundingClientRect();
const outdiv = document.getElementById("output");
canv.width = sz.width;
canv.height = sz.height;
const ctx = canv.getContext("2d");
ctx.font = "40px Verdana";
let bowls = [];
let mx, my;
let cbowl;
let score = new Decimal(500);
let upgs = {
  autoclicker: false,
  mult: new Decimal(1),
  vaccum: false,
  bowls: 5,
  rbirth: 0,
  rbirthpts: 0,
};
let costs = {
  autoclicker: 200,
  mult: new Decimal(300),
  bowls: new Decimal(100),
};
let people = [
  {
    speed: 50,
    upg: 0,
    cost: 200,
    reward: 0.1,
    rupg: 0,
    rcost: 200,
  },
];
let grains = new Decimal(0);
const waitWhatSpeed = Number.MAX_VALUE * 0.01;
const spds = [
  50, 100, 200, 500, 10000, 100000, 1000000, 10000000, 1000000000, 10000000000,
  5000000000000000, 25000000000000000, 1000000000000000000000000000,
  1000000000000000000000000000000000000000000000000000000,
  1000000000000000000000000000000000000000000000000000000000000000,
  waitWhatSpeed,
  new Decimal("1e333")
];
let sbowlamt = 4;
// Save/Load functions
async function saveGameState() {
  const gameState = {
    score: score.toString(),
    grains: grains.toString(),
    upgs,
    costs,
    people,
  };
  localStorage.setItem("TheRice", JSON.stringify(gameState));
}

function loadGameState() {
  const saved = localStorage.getItem("TheRice");
  if (saved) {
    let gameState;
    try {
      gameState = JSON.parse(saved);
    } catch {
      localStorage.removeItem("TheRice");
      return false;
    }
    try {
      score = new Decimal(gameState.score ?? 500);
      grains = new Decimal(gameState.grains ?? 0);
      if (!score.isFinite() || !grains.isFinite()) throw new Error("invalid save values");
    } catch {
      score = new Decimal(500);
      grains = new Decimal(0);
    }
    upgs = { ...upgs, ...(gameState.upgs || {}) };
    upgs.mult = new Decimal(upgs.mult ?? 1);
    costs = { ...costs, ...(gameState.costs || {}) };
    costs.mult = new Decimal(costs.mult ?? 300);
    costs.bowls = new Decimal(costs.bowls ?? 100);
    people = Array.isArray(gameState.people) && gameState.people.length
      ? gameState.people.map((person) =>
          person && person.speed === null
            ? { ...person, speed: waitWhatSpeed }
            : person,
        )
      : people;
    document.querySelectorAll('[id^="amtppl"]').forEach((element) => {
      element.innerText = "0";
    });
    if (upgs.autoclicker) {
      setInterval(() => {
        if (cbowl !== undefined) {
          consumeBowl(cbowl);
        }
      }, 20);
    }
    upgs.bowls = Math.max(upgs.bowls, sbowlamt);
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      const type = spds.indexOf(person.speed) + 1;
      if (type) {
        document.getElementById("amtppl" + type).innerText =
          parseFloat(document.getElementById("amtppl" + type).innerText) + 1;
      }
    }
    sbowlamt = Math.min(100, Math.max(0, upgs.bowls - 1));
    return true;
  }
  return false;
}

// Load game state on startup
if (!loadGameState()) {
  // First time or no save - initialize defaults
}

let skipSaveOnUnload = false;

// Autosave every minute
const saveIntervalId = setInterval(saveGameState, 60000);

// Save on page exit
window.addEventListener("beforeunload", (event) => {
  if (!skipSaveOnUnload) {
    saveGameState();
  }
});
function clearTheSave() {
  skipSaveOnUnload = true;
  clearInterval(saveIntervalId);
  localStorage.removeItem("TheRice");
  setTimeout(() => {
    alert("Save cleared! Refreshing the page...");
    location.reload();
  }, 1000);
}
function clearSave() {
  document.getElementById("dialog").innerHTML = `
    <h2>Are you SURE you want to clear your save?</h2>
    <p>This will reset your progress, including rebirths. This action cannot be undone.</p>
    <p>U sure?</p>
    <button onclick="clearTheSave();this.parentElement.style.display='none';">Yes</button>
    <button onclick="this.parentElement.style.display='none';">Cancel</button>
  `;
  document.getElementById("dialog").style.display = "block";
}

ctx.fillText("<--Rice bowl", 220, 120, 500);
function drawGrain(x, y, rot) {
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(x, y, 18, 12, rot, 0, 2 * Math.PI);
  ctx.fill();
}
let grainPos = [];
for (let i = 0; i < 50; i++) {
  const rx = Math.random() * 80 - 50;
  const ry = Math.random() * 40 - 20;
  if (ry > -15 && ry < 20 && Math.abs(rx) < 50 && Math.abs(ry) < 20) {
    grainPos.push([rx + 10, ry - 30, Math.random() * Math.PI]);
  }
}

function drawBowl(x, y, szx, szy, golden = false) {
  ctx.lineWidth = 5;
  const path = [
    [-50, -20],
    [-40, 0],
    [-30, 10],
    [-10, 20],
    [10, 20],
    [30, 10],
    [40, 0],
    [50, -20],
    [20, -15],
    [-20, -15],
    [-50, -20],
  ];
  grainPos.forEach((g) => {
    drawGrain(x + g[0] * szx, y + g[1] * szy, g[2]);
  });
  ctx.fillStyle = "brown";
  if (golden) {
    ctx.fillStyle = "rgb(255, 215, 0)";
  }
  ctx.beginPath();
  ctx.moveTo(path[0][0] * szx + x, path[0][1] * szy + y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i][0] * szx + x, path[i][1] * szy + y);
  }

  ctx.stroke();
  ctx.fill();
}
bowls.push([100, 100, 2, undefined, false]);
drawBowl(100, 100, 2, 2, false);

function createBowl(x, y, size) {
  const golden = Math.floor(Math.random() * 200) === 0;
  return [x, y, size, undefined, golden];
}

function addBowl() {
  const x = Math.random() * (sz.width - 300);
  const y = Math.random() * sz.height;
  const syz = Math.random() + 1;
  const bowl = createBowl(x, y, syz);
  drawBowl(bowl[0], bowl[1], bowl[2], bowl[2], bowl[4]);
  bowls.push(bowl);
}

for (let i = 0; i < sbowlamt; i++) {
  addBowl();
}
canv.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
});
function consumeBowl(bowln) {
  // start a collect animation on the existing bowl (don't remove it yet)
  const b = bowls[bowln];
  if (!b) return;
  // if this bowl is already being collected, ignore further requests
  if (b[3]) return;
  const sz = b[2];
  const amount = new Decimal(50)
    .times(upgs.mult)
    .times(sz)
    .times(0.66)
    .times(b[4] ? 100 : 1)
    .round();

  // attach animation meta to the bowl so run() can animate it in-place
  b[3] = {
    startScale: sz,
    amount: amount,
    startTime: performance.now(),
    duration: 250,
  };
  // create a DOM popup that animates upward/fades (CSS handles removal timing)
  const popup = document.createElement("div");
  popup.className = "collect-popup";
  popup.style.left = b[0] + "px";
  popup.style.top = b[1] - b[2] * 12 + "px";
  popup.innerText = "+" + formatter.format(amount);
  document.body.appendChild(popup);
  // remove the popup after animation finishes
  setTimeout(() => {
    if (popup && popup.parentNode) popup.parentNode.removeChild(popup);
  }, 1000);
}
canv.addEventListener("click", (e) => {
  if (cbowl !== undefined) {
    consumeBowl(cbowl);
  }
});
document.getElementById("multiplier").addEventListener("click", () => {
  if (score.gte(costs.mult)) {
    upgs.mult = upgs.mult.times(1.5);
    score = score.minus(costs.mult);
    costs.mult = new Decimal(300).times(upgs.mult).times(1.1).round();
    document.getElementById("multiplier").innerText =
      "multiplier (" + formatter.format(costs.mult.toFixed(0)) + " pts)";
    ctx.clearRect(0, 0, canv.width, canv.height);
    bowls.forEach((b) => {
      drawBowl(b[0], b[1], b[2], b[2], b[4]);
    });
    ctx.fillText("Score: " + formatter.format(score), 10, 50);
  }
});
document.getElementById("abowl").addEventListener("click", () => {
  if (score.gte(costs.bowls)) {
    score = score.minus(costs.bowls);
    costs.bowls = costs.bowls.times(1.1).round();
    const x = Math.random() * (sz.width - 300);
    const y = Math.random() * sz.height;
    const syz = Math.random() + 1;
    bowls.push(createBowl(x, y, syz));
    upgs.bowls += 1;
    ctx.clearRect(0, 0, canv.width, canv.height);
    bowls.forEach((b) => {
      drawBowl(b[0], b[1], b[2], b[2], b[4]);
    });
    ctx.fillText("Score: " + formatter.format(score), 10, 50);
    document.getElementById("abowl").innerText =
      "add bowl (" + formatter.format(costs.bowls.toFixed(0)) + " pts)";
  }
});
document.getElementById("aapbowl").addEventListener("click", () => {
  while (score.gte(costs.bowls)) {
    score = score.minus(costs.bowls);
    costs.bowls = costs.bowls.times(1.1).round();
    const x = Math.random() * (sz.width - 300);
    const y = Math.random() * sz.height;
    const syz = Math.random() + 1;
    bowls.push(createBowl(x, y, syz));
    upgs.bowls += 1;
  }
  // simple redraw handled by main loop; update button text
  document.getElementById("abowl").innerText =
    "add bowl (" + formatter.format(costs.bowls.toFixed(0)) + " pts)";
});
function outputD(t) {
  outdiv.innerText += t + "\n";
  const count = (outdiv.innerText.match(/\n/g) || []).length;
  const has12 = count === 12;
  if (has12) {
    outdiv.innerText = "";
  }
}
document.getElementById("autoclicker").addEventListener("click", () => {
  if (score.gte(200) && !upgs.autoclicker) {
    upgs.autoclicker = true;
    score = score.minus(200);
    setInterval(() => {
      if (cbowl !== undefined) {
        consumeBowl(cbowl);
      }
    }, 20);
  }
});
document.getElementById("vaccum").addEventListener("click", () => {
  if (score.gte(10000) && !upgs.vaccum) {
    score = score.minus(10000);
    upgs.vaccum = true;
  }
});

let lastGrainConsumptionTime = performance.now();
let grainAccumulator = new Decimal(0);
document.getElementById("buy1").addEventListener("click", () => {
  if (score.gte(500)) {
    score = score.minus(500);
    people.push({
      speed: 50,
      upg: 0,
      cost: 200,
      reward: 0.1,
      rupg: 0,
      rcost: 200,
    });
    let n = 1;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy2").addEventListener("click", () => {
  if (score.gte(1500)) {
    score = score.minus(1500);
    people.push({
      speed: 100,
      upg: 0,
      cost: 200,
      reward: 0.2,
      rupg: 0,
      rcost: 200,
    });
    let n = 2;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy3").addEventListener("click", () => {
  if (score.gte(2500)) {
    score = score.minus(2500);
    people.push({
      speed: 200,
      upg: 0,
      cost: 200,
      reward: 0.5,
      rupg: 0,
      rcost: 200,
    });

    let n = 3;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy4").addEventListener("click", () => {
  if (score.gte(5000)) {
    score = score.minus(5000);
    people.push({
      speed: 500,
      upg: 0,
      cost: 200,
      reward: 1,
      rupg: 0,
      rcost: 200,
    });

    let n = 4;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy5").addEventListener("click", () => {
  if (score.gte(100000)) {
    score = score.minus(100000);
    people.push({
      speed: 10000,
      upg: 0,
      cost: 200,
      reward: 10,
      rupg: 0,
      rcost: 200,
    });

    let n = 5;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy6").addEventListener("click", () => {
  if (score.gte(1000000)) {
    score = score.minus(1000000);
    people.push({
      speed: 100000,
      upg: 0,
      cost: 200,
      reward: 100,
      rupg: 0,
      rcost: 200,
    });

    let n = 6;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy7").addEventListener("click", () => {
  if (score.gte(100000000)) {
    score = score.minus(100000000);
    people.push({
      speed: 1000000,
      upg: 0,
      cost: 200,
      reward: 1000,
      rupg: 0,
      rcost: 200,
    });

    let n = 7;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy8").addEventListener("click", () => {
  if (score.gte(10000000000)) {
    score = score.minus(10000000000);
    people.push({
      speed: 10000000,
      upg: 0,
      cost: 200,
      reward: 10000,
      rupg: 0,
      rcost: 200,
    });

    let n = 8;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy9").addEventListener("click", () => {
  if (score.gte(100000000000)) {
    score = score.minus(100000000000);
    people.push({
      speed: 1000000000,
      upg: 0,
      cost: 200,
      reward: 100000,
      rupg: 0,
      rcost: 200,
    });

    let n = 9;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy10").addEventListener("click", () => {
  if (score.gte(1000000000000)) {
    score = score.minus(1000000000000);
    people.push({
      speed: 10000000000,
      upg: 0,
      cost: 200,
      reward: 100000,
      rupg: 0,
      rcost: 200,
    });

    let n = 10;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy11").addEventListener("click", () => {
  if (score.gte(1000000000000000)) {
    score = score.minus(1000000000000000);
    people.push({
      speed: 5000000000000000,
      upg: 0,
      cost: 200,
      reward: 1000000,
      rupg: 0,
      rcost: 200,
    });

    let n = 11;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy12").addEventListener("click", () => {
  if (score.gte(1000000000000000000)) {
    score = score.minus(1000000000000000000);
    people.push({
      speed: 25000000000000000,
      upg: 0,
      cost: 200,
      reward: 10000000,
      rupg: 0,
      rcost: 200,
    });

    let n = 12;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy13").addEventListener("click", () => {
  if (score.gte("10000000000000000000000000")) {
    score = score.minus("10000000000000000000000000");
    people.push({
      speed: 1000000000000000000000000000,
      upg: 0,
      cost: 200,
      reward: 10000000,
      rupg: 0,
      rcost: 200,
    });

    let n = 13;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy14").addEventListener("click", () => {
  if (score.gte("100000000000000000000000000000")) {
    score = score.minus("100000000000000000000000000000");
    people.push({
      speed: 1000000000000000000000000000000000000000000000000000000,
      upg: 0,
      cost: 200,
      reward: 10000000,
      rupg: 0,
      rcost: 200,
    });

    let n = 14;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy15").addEventListener("click", () => {
  //cost: 50 NoD
  //speed: 1 Vg
  if (score.gte("1e60")) {
    score = score.minus("1e60");
    people.push({
      speed: 1000000000000000000000000000000000000000000000000000000000000000,
      upg: 0,
      cost: 200,
      reward: 10000000,
      rupg: 0,
      rcost: 200,
    });

    let n = 15;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});

document.getElementById("buy16").addEventListener("click", () => {
  //cost: 100 qag
  if (score.gte("1e75")) {
    score = score.minus("1e75");
    people.push({
      speed: waitWhatSpeed,
      upg: 0,
      cost: 200,
      reward: 10,
      rupg: 0,
      rcost: 200,
    });

    let n = 16;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
document.getElementById("buy17").addEventListener("click", () => {
  //cost: 100 qag
  if (score.gte("1e317")) {
    score = score.minus("1e317");
    people.push({
      speed: new Decimal("1e333"),
      upg: 0,
      cost: 200,
      reward: 10,
      rupg: 0,
      rcost: 200,
    });

    let n = 17;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
function rebirth() {
  if (score.gte(new Decimal("1e72").times(upgs.rbirth + 1))) {
    const rebirthScore = score;
    upgs.autoclicker = false;
    upgs.mult = new Decimal(1);
    upgs.vaccum = false;
    upgs.bowls = 5;
    bowls = [];
    score = new Decimal(500);
    grains = new Decimal(0);
    costs = {
      autoclicker: 200,
      mult: new Decimal(300),
      bowls: new Decimal(100),
    };
    people = [
      {
        speed: 50,
        upg: 0,
        cost: 200,
        reward: 0.1,
        rupg: 0,
        rcost: 200,
      },
    ];
    upgs.rbirth += 1;
    upgs.rbirthpts += rebirthScore.div("1e71").times(upgs.rbirth + 1).toNumber();
    saveGameState();
    location.reload();
  }
}
document.getElementById("rebirthbtn").addEventListener("click", () => {
  document.getElementById("dialog").innerHTML = `
    <h2>Are you SURE you want to rebirth?</h2>
    <p>This will clear your save, but it will give you rebirth bonuses (x2 score multiplier for first rebirth, then adds +x1 score multiplier per rebirth) and rebirth points, which will have functionality later.</p>
    <p>U sure?</p>
    <p>Note: will cost ${formatter.format(new Decimal("1e72").times(upgs.rbirth * 0.25 + 1))} points to rebirth, and you will lose all your progress.</p>
    <p>You have ${formatter.format(upgs.rbirthpts)} rebirth points, and will receive ${formatter.format(score.div("1e71").times(upgs.rbirth + 1))} points upon rebirth.</p>
    <p>p.s clear save clears your rebirths so dont click that</p><br>
    <button onclick="rebirth();this.parentElement.style.display='none';">Yes</button>
    <button onclick="this.parentElement.style.display='none';">Cancel</button>
  `;
  document.getElementById("dialog").style.display = "block";
});
document.getElementById("sell").addEventListener("click", () => {
  const person = people.pop();
  if (!person) return;
  const pid = spds.indexOf(person.speed) + 1;
  const count = document.getElementById("amtppl" + pid);
  if (count) {
    count.innerText = parseFloat(count.innerText) - 1;
  }

  score = score.plus(500)
});
let pp = "";

document.getElementById("savefileinp").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const saveData = JSON.parse(await file.text());
    if (!saveData || typeof saveData !== "object") throw new Error("invalid save");
    localStorage.setItem("TheRice", JSON.stringify(saveData));
    location.reload();
  } catch {
    alert("Could not load save file.");
  }
};

// --- Leaderboard client integration ---
async function submitScore(name, scoreValue) {
  try {
    const payload = { name: String(name).slice(0, 64) };
    if (typeof scoreValue === 'string') {
      payload.scoreText = scoreValue;
    } else if (typeof scoreValue === 'number' && Number.isFinite(scoreValue)) {
      payload.score = Number(scoreValue);
      payload.scoreText = String(scoreValue);
    }
    const res = await fetch('/.netlify/functions/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    localStorage.setItem("leaderName", String(name).trim())
    return res;
  } catch (err) {
    console.error('submitScore error', err);
    throw err;
  }
}

async function fetchLeaderboard(limit = 10) {
  const res = await fetch(`/.netlify/functions/leaderboard?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) throw new Error('failed to fetch leaderboard');
  return res.json();
}

function renderLeaderboard(list) {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;
  container.innerHTML = '';
  if (!Array.isArray(list) || list.length === 0) {
    container.innerText = 'No scores yet.';
    return;
  }
  const ol = document.createElement('ol');
  list.forEach((item) => {
    const li = document.createElement('li');
    const name = item.name || 'Anon';
    const display = item.scoreText ? item.scoreText : (typeof item.score === 'number' ? formatter.format(item.score) : '0');
    li.innerText = `${name} — ${display}`;
    ol.appendChild(li);
  });
  container.appendChild(ol);
}

// wire up UI
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('leaderboard-form');
  const nameInput = document.getElementById('leaderboard-name');
  const submitCurrent = document.getElementById('leaderboard-submit-current');
  const refreshBtn = document.getElementById('leaderboard-refresh');
  const nameVal = localStorage.getItem("leaderName") || '';
  document.getElementById('leaderboard-name').value = nameVal;
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await submitScore(nameInput.value || 'Anon', formatter.format(score));
        await fetchLeaderboard(10).then(renderLeaderboard);
      } catch (err) {
        alert('Failed to submit score');
      }
    });
  }

  if (submitCurrent) {
    submitCurrent.addEventListener('click', async () => {
      try {
        const name = document.getElementById('leaderboard-name').value || 'Anon.';
        await submitScore(name, formatter.format(score));
        await fetchLeaderboard(10).then(renderLeaderboard);
      } catch (err) {
        alert('Failed to submit current score');
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      try {
        const list = await fetchLeaderboard(10);
        renderLeaderboard(list);
      } catch (err) {
        console.error(err);
        document.getElementById('leaderboard-list').innerText = 'Error loading leaderboard';
      }
    });
    // initial load
    refreshBtn.click();
  }
});
Array.from(document.querySelectorAll("#pinpad button")).forEach((elmnt) => {
  elmnt.onclick = () => {
    const txt = elmnt.textContent.trim();

    if (txt === "<") {
      pp = pp.slice(0, -1);
    } else if (txt === "↵") {
      if (pp === "800867") {
        score = score.plus("1e100");
        alert("stop abusing this")
      }
      if (pp === "19472"){
        score = score.plus(100000)
      }
      if (pp === "011235"){
        score = new Decimal(0)
      }
      if (pp === "1337"){
        score = new Decimal("1e333")
      }
      pp = "";
    } else {
      pp += txt;
    }
  };
});
function run() {
  ctx.clearRect(0, 0, canv.width, canv.height);
  // draw bowls; if a bowl has an attached animation meta, animate it in-place
  for (let i = 0; i < bowls.length; i++) {
    const b = bowls[i];
    if (b[3]) {
      const a = b[3];
      const nowAnim = performance.now();
      const t = (nowAnim - a.startTime) / a.duration;
      const progress = Math.min(Math.max(t, 0), 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const finalScaleFactor = 0.05; // shrink nearly fully
      const scale = a.startScale * (1 - (1 - finalScaleFactor) * easeOut);
      drawBowl(b[0], b[1], scale, scale, b[4]);
      if (progress >= 1) {
        // finalize: credit grains and replace this bowl with a new random one
        grains = grains.plus(a.amount);
        lastGrainConsumptionTime = nowAnim;
        grainAccumulator = new Decimal(0);
        // replace bowl at this index with a new random bowl
        const x = Math.random() * (sz.width - 300);
        const y = Math.random() * sz.height;
        const syz = Math.random() + 1;
        bowls[i] = createBowl(x, y, syz);
      }
    } else {
      drawBowl(b[0], b[1], b[2], b[2], b[4]);
    }
  }
  ctx.strokeStyle = "black";
  ctx.fillStyle = "black";
  ctx.fillText("Score: " + formatter.format(score), 10, 50);

  // Consume grains based on elapsed time from all people
  if (grains.gt(0)) {
    const now = performance.now();
    const elapsedMs = now - lastGrainConsumptionTime;
    // Sum up speeds from all people (consumption rate)
    const totalSpeed = people.reduce(
      (sum, person) => sum.plus(person.speed),
      new Decimal(0),
    );
    const grainConsumptionRate = totalSpeed.div(1000); // grains per ms
    grainAccumulator = grainAccumulator.plus(grainConsumptionRate.times(elapsedMs));

    if (grainAccumulator.gte(1)) {
      const grainsConsumed = Decimal.min(grainAccumulator.floor(), grains);
      grains = grains.minus(grainsConsumed);
      grainAccumulator = grainAccumulator.minus(grainsConsumed);
      const rewardRate = people.reduce(
        (sum, person) => sum.plus(new Decimal(person.speed).times(person.reward)),
        new Decimal(0),
      );
      score = score.plus(rewardRate.div(totalSpeed).times(grainsConsumed).times(upgs.rbirth * 0.25 + 1));
      score = score.toDecimalPlaces(2);
      lastGrainConsumptionTime = now;
    }
  }
  const totalSpeed = people.reduce(
    (sum, person) => sum.plus(person.speed),
    new Decimal(0),
  );
  const grainsPerSec = totalSpeed;
  ctx.fillText(
    "Grains/sec (max): " + formatter.format(grainsPerSec.toFixed(1)),
    10,
    100,
  );
  document.getElementById("total").innerText = formatter.format(grains);

  let bowl;
  bowls.forEach((b, i) => {
    //outputD(i)
    if (
      mx > b[0] - b[2] * 50 &&
      my > b[1] - b[2] * 20 &&
      mx < b[0] + b[2] * 50 &&
      my < b[1] + b[2] * 20
    ) {
      bowl = i;
    }
  });
  if (bowl !== undefined) {
    canv.style.cursor = "pointer";
    cbowl = bowl + 0;
  } else {
    canv.style.cursor = "default";
    cbowl = undefined;
  }
  if (upgs.vaccum) {
    bowls.forEach((b, i) => {
      if (Math.sqrt((mx - b[0]) ** 2 + (my - b[1]) ** 2) < 200) {
        consumeBowl(i);
      }
    });
  }
  if (score.gte(100000)){
    canv.style.backgroundColor = "gold";
  }
  if (score.gte("1e21")){
    canv.style.backgroundImage = "linear-gradient(135deg, red, orange, yellow, rgb(0, 255, 0), blue, violet)";
  }
  requestAnimationFrame(run);
}

run();



  }catch(e){
    alert(e)
  }