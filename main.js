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
let score = 0
let upgs = {
    autoclicker: false,
    mult: 1
}
let costs = {
    autoclicker: 200,
    mult: 300,
    bowls:100
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

for (let i = 0; i < 20; i++){
    addBowl()
}
canv.addEventListener("mousemove", (e)=>{
    mx=e.clientX
    my=e.clientY
})
canv.addEventListener("click", (e)=>{
    if (cbowl !== undefined){
        bowls.splice(cbowl,1)
        addBowl()
        ctx.clearRect(0,0,canv.width,canv.height)
        bowls.forEach(b=>{
            drawBowl(b[0],b[1],b[2],b[2])
        })
        
        score+=5*upgs.mult
        ctx.fillText("Score: "+score, 10, 50)
    }
})
document.getElementById("multiplier").addEventListener("click", ()=>{
    if (score >= costs.mult){
        upgs.mult +=1
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
    ctx.clearRect(0,0,canv.width,canv.height)
    bowls.forEach(b=>{
        drawBowl(b[0],b[1],b[2],b[2])
    })
    ctx.fillText("Score: "+score, 10, 50)
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
        ctx.clearRect(0,0,canv.width,canv.height)
        bowls.forEach(b=>{
            drawBowl(b[0],b[1],b[2],b[2])
        })
        ctx.fillText("Score: "+score, 10, 50)
        setInterval(()=>{
            if (cbowl !== undefined){
                bowls.splice(cbowl,1)
                const x = Math.random()*(sz.width-300)
                const y = Math.random()*sz.height
                const syz = Math.random()+1
                drawBowl(x,y,syz,syz)
                bowls.push([x,y,syz])
                ctx.clearRect(0,0,canv.width,canv.height)
                bowls.forEach(b=>{
                    drawBowl(b[0],b[1],b[2],b[2])
                })
                
                score+=5*upgs.mult
                ctx.fillText("Score: "+score, 10, 50)
            }
        },20)
    }
})

function run(){
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
    requestAnimationFrame(run)
}
run()