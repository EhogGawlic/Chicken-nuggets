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
    const res = await fetch("/.netlify/functions/leaderboard")
    if (!res.ok) throw new Error(`Leaderboard request failed: ${res.status}`)
    const leaderboardData = await res.json()
    const leaderboard = $("leaderboard")
    leaderboard.replaceChildren()

    for (const score of leaderboardData){
        const item = document.createElement("li")
        item.append("Name: ", score.name, ", Score: ", score.scoreText || score.score || "0", " ")
        const delBtn = document.createElement("button")
        delBtn.textContent = "Delete item"
        delBtn.onclick = async () => {
            const deleteRes = await adminFetch("/.netlify/functions/scoreDel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: score.name })
            })
            if (!deleteRes.ok) throw new Error(`Delete request failed: ${deleteRes.status}`)
            if (!deleteRes.ok) alert(`Delete request failed: ${deleteRes.status}`)
            item.remove()
        }
        item.appendChild(delBtn)
        leaderboard.appendChild(item)
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
