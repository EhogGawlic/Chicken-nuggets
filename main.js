/**
 * @type {HTMLCanvasElement} canv
 */
const canv = document.getElementById("canvas")
const sz = canv.getBoundingClientRect()
const outdiv = document.getElementById("output")
canv.width=sz.width
canv.height=sz.height
const ctx = canv.getContext("2d")
ctx.font = "40px Verdana"
let bowls = []
let mx,my
let cbowl
let score = 500
let upgs = {
    autoclicker: false,
    mult: 1,
    vaccum: false
}
let costs = {
    autoclicker: 200,
    mult: 300,
    bowls:100
}
let people = [
    {
        speed: 150,
        upg: 0,
        cost: 200,
        reward: 0.1,
        rupg: 0,
        rcost: 200
    }
]
let grains = 0

// Save/Load functions
function saveGameState() {
    const gameState = {
        score,
        grains,
        upgs,
        costs,
        people
    }
    localStorage.setItem('TheRice', JSON.stringify(gameState))
}

function loadGameState() {
    const saved = localStorage.getItem('TheRice')
    if (saved) {
        const gameState = JSON.parse(saved)
        score = gameState.score
        grains = gameState.grains
        upgs = gameState.upgs
        costs = gameState.costs
        people = gameState.people
        if (upgs.autoclicker){
            setInterval(()=>{
                if (cbowl !== undefined){
                    consumeBowl(cbowl)
                }
            },20)
        }
        return true
    }
    return false
}

// Load game state on startup
if (!loadGameState()) {
    // First time or no save - initialize defaults
}

let skipSaveOnUnload = false

// Autosave every 5 seconds
const saveIntervalId = setInterval(saveGameState, 5000)

// Save on page exit
window.addEventListener('beforeunload', (event) => {
    if (!skipSaveOnUnload) {
        saveGameState()
    }
})

function clearSave(){
    skipSaveOnUnload = true
    clearInterval(saveIntervalId)
    localStorage.removeItem('TheRice')
    setTimeout(()=>{
        alert("Save cleared! Refreshing the page...")
        location.reload()
    },1000)
}

ctx.fillText("<--Rice bowl", 220, 120, 500)
function drawGrain(x,y,rot){
    ctx.fillStyle="white"
    ctx.beginPath()
    ctx.ellipse(x,y,18,12,rot,0,2*Math.PI)
    ctx.fill()
}
let grainPos=[

]
for (let i = 0; i < 50; i++){
    const rx = Math.random()*80-50
    const ry = Math.random()*40-20
    if (ry > -15 && ry < 20 && Math.abs(rx) < 50 && Math.abs(ry) < 20){
        grainPos.push([rx+10,ry-30,Math.random()*Math.PI])
    }
}

function drawBowl(x,y,szx,szy){
    ctx.lineWidth=5
    const path = [
        [-50,-20],
        [-40,0],
        [-30,10],
        [-10,20],
        [10,20],
        [30,10],
        [40,0],
        [50,-20],
        [20,-15],
        [-20,-15],
        [-50,-20]
    ]
    grainPos.forEach(g=>{
        drawGrain(x+g[0]*szx,y+g[1]*szy,g[2])
    })
    ctx.fillStyle="brown"
    ctx.beginPath()
    ctx.moveTo(path[0][0]*szx+x,path[0][1]*szy+y)
    for (let i = 1; i < path.length; i++){
        ctx.lineTo(path[i][0]*szx+x,path[i][1]*szy+y)
    }

    ctx.stroke()
    ctx.fill()
    }
bowls.push([100,100,2])
drawBowl(100,100,2,2)

function addBowl(){
    const x = Math.random()*(sz.width-300)
    const y = Math.random()*sz.height
    const syz = Math.random()+1
    drawBowl(x,y,syz,syz)
    bowls.push([x,y,syz])
}

for (let i = 0; i < 5; i++){
    addBowl()
}
canv.addEventListener("mousemove", (e)=>{
    mx=e.clientX
    my=e.clientY
})
function consumeBowl(bowln){
    // start a collect animation on the existing bowl (don't remove it yet)
    const b = bowls[bowln]
    if (!b) return
    // if this bowl is already being collected, ignore further requests
    if (b[3]) return
    const sz = b[2]
    const amount = Math.round(50*upgs.mult*sz*0.66)
    
    // attach animation meta to the bowl so run() can animate it in-place
    b[3] = {
        startScale: sz,
        amount: amount,
        startTime: performance.now(),
        duration: 250
    }
    // create a DOM popup that animates upward/fades (CSS handles removal timing)
    const popup = document.createElement('div')
    popup.className = 'collect-popup'
    popup.style.left = (b[0]) + 'px'
    popup.style.top = (b[1] - b[2]*12) + 'px'
    popup.innerText = '+' + amount
    document.body.appendChild(popup)
    // remove the popup after animation finishes
    setTimeout(()=>{ if (popup && popup.parentNode) popup.parentNode.removeChild(popup) }, 1000)
}
canv.addEventListener("click", (e)=>{
    if (cbowl !== undefined){
        consumeBowl(cbowl)
    }
})
document.getElementById("multiplier").addEventListener("click", ()=>{
    if (score >= costs.mult){
        upgs.mult *= 1.5
        score-=costs.mult
        costs.mult = Math.round(300*upgs.mult*1.1)
        document.getElementById("multiplier").innerText = "multiplier ("+costs.mult.toFixed(0)+" pts)"
        ctx.clearRect(0,0,canv.width,canv.height)
        bowls.forEach(b=>{
            drawBowl(b[0],b[1],b[2],b[2])
        })
        ctx.fillText("Score: "+score, 10, 50)
    }
})
document.getElementById("abowl").addEventListener("click", ()=>{
    if (score >= costs.bowls){
        score-=costs.bowls
        costs.bowls = Math.round(costs.bowls*1.1)
        const x = Math.random()*(sz.width-300)
        const y = Math.random()*sz.height
        const syz = Math.random()+1
        drawBowl(x,y,syz,syz)
        bowls.push([x,y,syz])
        ctx.clearRect(0,0,canv.width,canv.height)
        bowls.forEach(b=>{
            drawBowl(b[0],b[1],b[2],b[2])
        })
        ctx.fillText("Score: "+score, 10, 50)
        document.getElementById("abowl").innerText = "add bowl ("+costs.bowls.toFixed(0)+" pts)"
    }
})
document.getElementById("aapbowl").addEventListener("click", ()=>{
    while (score >= costs.bowls){
        score-=costs.bowls
        costs.bowls = Math.round(costs.bowls*1.1)
        const x = Math.random()*(sz.width-300)
        const y = Math.random()*sz.height
        const syz = Math.random()+1
        drawBowl(x,y,syz,syz)
        bowls.push([x,y,syz])
    }
    // simple redraw handled by main loop; update button text
    document.getElementById("abowl").innerText = "add bowl ("+costs.bowls.toFixed(0)+" pts)"
})
function outputD(t){
    outdiv.innerText+=t+"\n"
    const count = (outdiv.innerText.match(/\n/g) || []).length;
    const has12 = count === 12;
    if(has12){
        outdiv.innerText=""
    }
}
document.getElementById("autoclicker").addEventListener("click", ()=>{
    if (score >= 200 && !upgs.autoclicker){
        upgs.autoclicker = true
        score-=200
        setInterval(()=>{
            if (cbowl !== undefined){
                consumeBowl(cbowl)
            }
        },20)
    }
})

let lastGrainConsumptionTime = performance.now()
let grainAccumulator = 0
document.getElementById("buy1").addEventListener("click", ()=>{
    if (score >= 500){
        score-=500
        people.push({
            speed: 50,
            upg: 0,
            cost: 200,
            reward: 0.1,
            rupg: 0,
            rcost: 200
        })
    }
})
document.getElementById("buy2").addEventListener("click", ()=>{
    if (score >= 1500){
        score-=1500
        people.push({
            speed: 100,
            upg: 0,
            cost: 200,
            reward: 0.2,
            rupg: 0,
            rcost: 200
        })
    }
})
document.getElementById("buy3").addEventListener("click", ()=>{
    if (score >= 2500){
        score-=2500
        people.push({
            speed: 200,
            upg: 0,
            cost: 200,
            reward: 0.5,
            rupg: 0,
            rcost: 200
        })
    }
})
document.getElementById("buy4").addEventListener("click", ()=>{
    if (score >= 5000){
        score-=5000
        people.push({
            speed: 500,
            upg: 0,
            cost: 200,
            reward: 1,
            rupg: 0,
            rcost: 200
        })
    }
})
document.getElementById("buy5").addEventListener("click", ()=>{
    if (score >= 100000){
        score-=100000
        people.push({
            speed: 10000,
            upg: 0,
            cost: 200,
            reward: 10,
            rupg: 0,
            rcost: 200
        })
    }
})
document.getElementById("buy6").addEventListener("click", ()=>{
    if (score >= 1000000){
        score-=1000000
        people.push({
            speed: 100000,
            upg: 0,
            cost: 200,
            reward: 100,
            rupg: 0,
            rcost: 200
        })
    }
})
document.getElementById("buy7").addEventListener("click", ()=>{
    if (score >= 100000000){
        score-=100000000
        people.push({
            speed: 1000000,
            upg: 0,
            cost: 200,
            reward: 1000,
            rupg: 0,
            rcost: 200
        })
    }
})
document.getElementById("buy8").addEventListener("click", ()=>{
    if (score >= 10000000000){
        score-=10000000000
        people.push({
            speed: 10000000,
            upg: 0,
            cost: 200,
            reward: 10000,
            rupg: 0,
            rcost: 200
        })
    }
})
document.getElementById("sell").addEventListener("click", ()=>{
    people.shift()
    score+=500
     let list = document.querySelectorAll("#buy1 ~ li")
     if (list.length > 0){
        list[0].remove()
     }    
})
function run(){
    ctx.clearRect(0,0,canv.width,canv.height)
    // draw bowls; if a bowl has an attached animation meta, animate it in-place
    for (let i = 0; i < bowls.length; i++){
        const b = bowls[i]
        if (b[3]){
            const a = b[3]
            const nowAnim = performance.now()
            const t = (nowAnim - a.startTime) / a.duration
            const progress = Math.min(Math.max(t, 0), 1)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const finalScaleFactor = 0.05 // shrink nearly fully
            const scale = a.startScale * (1 - (1 - finalScaleFactor) * easeOut)
            drawBowl(b[0], b[1], scale, scale)
            if (progress >= 1){
                // finalize: credit grains and replace this bowl with a new random one
                grains += a.amount
                lastGrainConsumptionTime = nowAnim
                grainAccumulator = 0
                // replace bowl at this index with a new random bowl
                const x = Math.random()*(sz.width-300)
                const y = Math.random()*sz.height
                const syz = Math.random()+1
                bowls[i] = [x,y,syz]
            }
        } else {
            drawBowl(b[0],b[1],b[2],b[2])
        }
    }
    ctx.strokeStyle="black"
    ctx.fillStyle="black"
    ctx.fillText("Score: "+score, 10, 50)
    
    // Consume grains based on elapsed time from all people
    if (grains > 0) {
        const now = performance.now()
        const elapsedMs = now - lastGrainConsumptionTime
        // Sum up speeds from all people (consumption rate)
        const totalSpeed = people.reduce((sum, p) => sum + p.speed, 0)
        const grainConsumptionRate = totalSpeed / 1000 // grains per ms
        grainAccumulator += elapsedMs * grainConsumptionRate
        
        if (grainAccumulator >= 1) {
            const grainsConsumed = Math.min(Math.floor(grainAccumulator), grains)
            grains -= grainsConsumed
            grainAccumulator -= grainsConsumed
            score += people[0].reward * grainsConsumed
            score = Math.round(score*100)/100
            lastGrainConsumptionTime = now
        }
    }
    const totalSpeed = people.reduce((sum, p) => sum + p.speed, 0)
    const grainsPerSec = totalSpeed
    ctx.fillText("Grains/sec (max): " + grainsPerSec.toFixed(1), 10, 100)
    document.getElementById("total").innerText = grains
    
    let bowl
    bowls.forEach((b,i)=>{
        //outputD(i)
        if (mx > b[0]-b[2]*50 && my > b[1]-b[2]*20 && mx < b[0]+b[2]*50 && my < b[1]+b[2]*20){
            bowl = i
    }
})
    if (bowl !== undefined){
        canv.style.cursor = "pointer"
        cbowl = bowl+0
    } else {
        canv.style.cursor = "default"
        cbowl=undefined
    }
    if (upgs.vaccum){
        bowls.forEach((b,i)=>{
            if(Math.sqrt((mx-b[0])**2+(my-b[1])**2) < 200){
                consumeBowl(i)
            }
        })
    }
    requestAnimationFrame(run)
}
run()