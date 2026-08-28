function $(id){
    return document.getElementById(id)
}
let password = ""

async function adminFetch(url, options = {}){
    if (!password) throw new Error("Admin authentication required")

    return fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${password}`
        }
    })
}
async function loadLeaderboard(){
    const res = await fetch("https://https://thericegame.netlify.app/.netlify/functions/leaderboard")
    const leaderboardData = await res.json()
    for (score in leaderboardData){
        //example: {"_id":"6a90a424418e4613ac7de527","name":"ur boi ehag","createdAt":"2026-08-27T20:55:00.966Z","score":225,"scoreText":"225TCe","scoreOrder":311.35218251811136}
        const item = document.createElement("li")
        item.innerHTML=`<b>Name:</b> ${score.name}, <b>Score:</b> ${score.scoreText} | <button id="delete${score.name}">Delete item</button>`
        const delBtn = $("delete"+score.name)
        delBtn.onclick=()=>{
            adminFetch("https://https://thericegame.netlify.app/.netlify/functions/scoreDel", {
                body: JSON.parse({name:score.name})
            })
        }
        $("leaderboard").appendChild(item)
    }

}
async function sendPass(){
    const input = $("password")
    const value = input.value
    if (!value) return

    const res = await fetch("/.netlify/functions/adminpasstest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value })
    })

    if (res.ok && (await res.json()).agreed === true){
        password = value
        $("blocker").style.display = "none"
        await loadLeaderboard()
    } else {
        input.value = ""
        input.focus()
        alert("Incorrect password.")
    }
}

$("passbtn").addEventListener("click", sendPass)
$("password").addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendPass()
})
