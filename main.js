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
];

const formatter = {
  format(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "Infinity";

    const negative = num < 0;
    const abs = Math.abs(num);

    if (abs < 1000) {
      return `${negative ? "-" : ""}${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }

    let suffixIndex = 0;
    let scaled = abs;

    while (scaled >= 1000 && suffixIndex < compactSuffixes.length - 1) {
      scaled /= 1000;
      suffixIndex++;
    }

    const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    const formatted = scaled.toLocaleString("en-US", {
      minimumFractionDigits: decimals > 0 ? 1 : 0,
      maximumFractionDigits: decimals,
    });
    
    return `${negative ? "-" : ""}${formatted}${compactSuffixes[suffixIndex]}`;
  },
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
let score = 500;
let upgs = {
  autoclicker: false,
  mult: 1,
  vaccum: false,
  bowls: 5,
  rbirth: 0,
  rbirthpts: 0,
};
let costs = {
  autoclicker: 200,
  mult: 300,
  bowls: 100,
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
let grains = 0;
const spds = [
  50, 100, 200, 500, 10000, 100000, 1000000, 10000000, 1000000000, 10000000000,
  5000000000000000, 25000000000000000, 1000000000000000000000000000,
  1000000000000000000000000000000000000000000000000000000,
  1000000000000000000000000000000000000000000000000000000000000000,
  Infinity
];
let sbowlamt = 4;
// Save/Load functions
function saveGameState() {
  const gameState = {
    score,
    grains,
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
    score = typeof gameState.score === "number" && Number.isFinite(gameState.score)
      ? gameState.score
      : 500;
    grains = typeof gameState.grains === "number" && Number.isFinite(gameState.grains)
      ? gameState.grains
      : 0;
    upgs = { ...upgs, ...(gameState.upgs || {}) };
    costs = { ...costs, ...(gameState.costs || {}) };
    people = Array.isArray(gameState.people) && gameState.people.length
      ? gameState.people
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

// Autosave every 5 seconds
const saveIntervalId = setInterval(saveGameState, 5000);

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
  const amount = Math.round(50 * upgs.mult * sz * 0.66 * (b[4] ? 100 : 1));

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
  if (score >= costs.mult) {
    upgs.mult *= 1.5;
    score -= costs.mult;
    costs.mult = Math.round(300 * upgs.mult * 1.1);
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
  if (score >= costs.bowls) {
    score -= costs.bowls;
    costs.bowls = Math.round(costs.bowls * 1.1);
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
  while (score >= costs.bowls) {
    score -= costs.bowls;
    costs.bowls = Math.round(costs.bowls * 1.1);
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
  if (score >= 200 && !upgs.autoclicker) {
    upgs.autoclicker = true;
    score -= 200;
    setInterval(() => {
      if (cbowl !== undefined) {
        consumeBowl(cbowl);
      }
    }, 20);
  }
});
document.getElementById("vaccum").addEventListener("click", () => {
  if (score >= 10000 && !upgs.vaccum) {
    score -= 10000;
    upgs.vaccum = true;
  }
});

let lastGrainConsumptionTime = performance.now();
let grainAccumulator = 0;
document.getElementById("buy1").addEventListener("click", () => {
  if (score >= 500) {
    score -= 500;
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
  if (score >= 1500) {
    score -= 1500;
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
  if (score >= 2500) {
    score -= 2500;
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
  if (score >= 5000) {
    score -= 5000;
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
  if (score >= 100000) {
    score -= 100000;
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
  if (score >= 1000000) {
    score -= 1000000;
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
  if (score >= 100000000) {
    score -= 100000000;
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
  if (score >= 10000000000) {
    score -= 10000000000;
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
  if (score >= 100000000000) {
    score -= 100000000000;
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
  if (score >= 1000000000000) {
    score -= 1000000000000;
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
  if (score >= 1000000000000000) {
    score -= 1000000000000000;
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
  if (score >= 1000000000000000000) {
    score -= 1000000000000000000;
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
  if (score >= 10000000000000000000000000) {
    score -= 10000000000000000000000000;
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
  if (score >= 100000000000000000000000000000) {
    score -= 100000000000000000000000000000;
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
  if (score >= 1000000000000000000000000000000000000000000000000000000000000) {
    score -= 1000000000000000000000000000000000000000000000000000000000000;
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
  //cost: 50 NoD
  //speed: 1 Vg
  if (score >= 1e73) {
    score -= 1e73;
    people.push({
      speed: Infinity,
      upg: 0,
      cost: 200,
      reward: 10000000,
      rupg: 0,
      rcost: 200,
    });

    let n = 16;
    document.getElementById("amtppl" + n).innerText =
      parseFloat(document.getElementById("amtppl" + n).innerText) + 1;
  }
});
function rebirth() {
  if (score >= 1e72*(upgs.rbirth+1)) {
    const rebirthScore = score;
    upgs.autoclicker = false;
    upgs.mult = 1;
    upgs.vaccum = false;
    upgs.bowls = 5;
    bowls = [];
    score = 500;
    grains = 0;
    costs = {
      autoclicker: 200,
      mult: 300,
      bowls: 100,
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
    upgs.rbirthpts += rebirthScore / 1e71*(upgs.rbirth+1);
    saveGameState();
    location.reload();
  }
}
document.getElementById("rebirthbtn").addEventListener("click", () => {
  document.getElementById("dialog").innerHTML = `
    <h2>Are you SURE you want to rebirth?</h2>
    <p>This will clear your save, but it will give you rebirth bonuses (x2 score multiplier for first rebirth, then adds +x1 score multiplier per rebirth) and rebirth points, which will have functionality later.</p>
    <p>U sure?</p>
    <p>Note: will cost ${1e72*(upgs.rbirth*0.25+1)} points to rebirth, and you will lose all your progress.</p>
    <p>You have ${upgs.rbirthpts} rebirth points, and will receive ${score/1e71*(upgs.rbirth+1)} points upon rebirth.</p>
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

  score += 500;
});
let pp = "";

Array.from(document.querySelectorAll("#pinpad button")).forEach((elmnt) => {
  elmnt.onclick = () => {
    const txt = elmnt.textContent.trim();

    if (txt === "<") {
      pp = pp.slice(0, -1);
    } else if (txt === "↵") {
      if (pp === "800867") {
        score += 1e100;
        alert("stop abusing this")
      }
      if (pp === "19472"){
        score += 100000
      }
      if (pp === "011235"){
        score = Infinity
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
        grains += a.amount;
        lastGrainConsumptionTime = nowAnim;
        grainAccumulator = 0;
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
  if (grains > 0) {
    const now = performance.now();
    const elapsedMs = now - lastGrainConsumptionTime;
    // Sum up speeds from all people (consumption rate)
    const totalSpeed = people.reduce((sum, p) => sum + p.speed, 0);
    const grainConsumptionRate = totalSpeed / 1000; // grains per ms
    grainAccumulator += elapsedMs * grainConsumptionRate;

    if (grainAccumulator >= 1) {
      const grainsConsumed = Math.min(Math.floor(grainAccumulator), grains);
      grains -= grainsConsumed;
      grainAccumulator -= grainsConsumed;
      const rewardRate = people.reduce(
        (sum, person) => sum + person.speed * person.reward,
        0,
      );
      score += (rewardRate / totalSpeed) * grainsConsumed * (upgs.rbirth*0.25 + 1);
      score = (Math.round(score * 100) / 100);
      lastGrainConsumptionTime = now;
    }
  }
  const totalSpeed = people.reduce((sum, p) => sum + p.speed, 0);
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
  if (score >= 100000){
    canv.style.backgroundColor = "gold";
  }
  if (score >= 1000000000000000000000){
    canv.style.backgroundImage = "linear-gradient(135deg, red, orange, yellow, rgb(0, 255, 0), blue, violet)";
  }
  requestAnimationFrame(run);
}

run();

}catch(e){
  alert(e)
}