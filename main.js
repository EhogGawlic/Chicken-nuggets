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
ctx.fillText("<--Rice bowl", 220, 120, 500)
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
for (let i = 0; i < 20; i++){
    const x = Math.random()*sz.width
    const y = Math.random()*sz.height
    const syz = Math.random()+1
    drawBowl(x,y,syz,syz)
    bowls.push([x,y,syz])
}
canv.addEventListener("mousemove", (e)=>{
    mx=e.clientX
    my=e.clientY
})
canv.addEventListener("click", (e)=>{
    if (cbowl !== undefined){
        bowls.splice(cbowl,1)
        const x = Math.random()*sz.width
    const y = Math.random()*sz.height
    const syz = Math.random()+1
    drawBowl(x,y,syz,syz)
    bowls.push([x,y,syz])
        ctx.clearRect(0,0,canv.width,canv.height)
        bowls.forEach(b=>{
            drawBowl(b[0],b[1],b[2],b[2])
        })
        
        score+=5
        ctx.fillText("Score: "+score, 10, 50)
    }
})
function outputD(t){
    outdiv.innerText+=t+"\n"
    const count = (outdiv.innerText.match(/\n/g) || []).length;
    const has12 = count === 12;
    if(has12){
        outdiv.innerText=""
    }
}
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