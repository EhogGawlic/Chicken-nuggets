function generateSaveFile(gameState){
    return JSON.stringify(gameState);
}
function downloadSaveFile(saveData, filename){
    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function loadSaveFile(file){

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
}