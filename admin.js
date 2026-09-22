function $(id) {
  return document.getElementById(id);
}
let password = "";

async function adminFetch(url, options = {}) {
  if (!password) throw new Error("Admin authentication required");

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${password}`,
    },
  });
}
async function loadLeaderboard() {
  const res = await fetch(
    "/.netlify/functions/leaderboard?limit=" + encodeURIComponent(100),
  );
  if (!res.ok) throw new Error(`Leaderboard request failed: ${res.status}`);
  const leaderboardData = await res.json();
  const leaderboard = $("leaderboard");
  leaderboard.replaceChildren();

  for (const score of leaderboardData) {
    const item = document.createElement("li");
    item.append(
      "Name: ",
      score.name,
      ", Score: ",
      score.scoreText || score.score || "0",
      " ",
    );
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete item";
    delBtn.onclick = async () => {
      const deleteRes = await adminFetch("/.netlify/functions/scoreDel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: score.name }),
      });
      if (!deleteRes.ok)
        throw new Error(`Delete request failed: ${deleteRes.status}`);
      if (!deleteRes.ok) alert(`Delete request failed: ${deleteRes.status}`);
      item.remove();
    };
    item.appendChild(delBtn);
    leaderboard.appendChild(item);
  }
}
// Keep this list in sync with DEFAULT_PRICES in the game's main.js.
const PRICE_FIELDS = [
  { key: "autoclicker", label: "Autoclicker" },
  { key: "vaccum", label: "Vacuum" },
  { key: "multBase", label: "Multiplier - base cost" },
  { key: "multScale", label: "Multiplier - cost scale" },
  { key: "bowlsBase", label: "Bowl - base cost" },
  { key: "bowlsScale", label: "Bowl - cost scale" },
  { key: "buy1", label: "Add person" },
  { key: "buy2", label: "Add Mexican" },
  { key: "buy3", label: "Add Japanese" },
  { key: "buy4", label: "Add Asian" },
  { key: "buy5", label: "Add Steven He" },
  { key: "buy6", label: "Add Uncle Roger" },
  { key: "buy7", label: "Add Great Uncle Roger" },
  { key: "buy8", label: "Add Beijing Corn" },
  { key: "buy9", label: "Add me" },
  { key: "buy10", label: "Add oliver" },
  { key: "buy11", label: "Add Inari" },
  { key: "buy12", label: "Add the magic of science" },
  { key: "buy13", label: "good job" },
  { key: "buy14", label: "good job 2" },
  { key: "buy15", label: "average chicken nugget" },
  { key: "buy16", label: "Wait, what?" },
  { key: "buy17", label: "ayoooooo theres somthing wrong" },
  { key: "buy18", label: "please stop" },
  { key: "buy19", label: "unloc tacoes" },
  { key: "rebirthBase", label: "Rebirth - base cost" },
  { key: "tacoTreeBase", label: "Taco tree - base cost" },
  { key: "tacoTreeUpgradeScale", label: "Taco tree - upgrade cost scale" },
  { key: "tacoPlantScale", label: "Taco tree - plant cost scale" },
  { key: "tacoSpeedBonus", label: "Taco tree - speed bonus per level" },
];

async function loadCosts() {
  const res = await fetch("/.netlify/functions/costs");
  const current = res.ok ? await res.json() : {};
  const list = $("costs");
  list.replaceChildren();

  for (const field of PRICE_FIELDS) {
    const item = document.createElement("li");
    const label = document.createElement("label");
    label.append(field.label + ": ");
    const input = document.createElement("input");
    input.type = "text";
    input.id = "cost-" + field.key;
    input.placeholder = "(default)";
    input.value = current[field.key] ?? "";
    label.appendChild(input);
    item.appendChild(label);
    list.appendChild(item);
  }
}
async function saveCosts() {
  const values = {};
  for (const field of PRICE_FIELDS) {
    const input = $("cost-" + field.key);
    if (input.value.trim() !== "") values[field.key] = input.value.trim();
  }

  const res = await adminFetch("/.netlify/functions/costsUpdate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    alert(`Save failed: ${res.status}`);
    return;
  }
  alert("Costs saved.");
}

async function sendPass() {
  const input = $("password");
  const value = input.value;
  if (!value) return;

  const res = await fetch("/.netlify/functions/adminpasstest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });

  if (res.ok && (await res.json()).agreed === true) {
    password = value;
    $("blocker").style.display = "none";
    await loadLeaderboard();
    await loadCosts();
  } else {
    input.value = "";
    input.focus();
    alert("Incorrect password.");
  }
}

$("passbtn").addEventListener("click", sendPass);
$("password").addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendPass();
});
$("savecosts").addEventListener("click", saveCosts);
