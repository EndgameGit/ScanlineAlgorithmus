
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const offset = canvas.getBoundingClientRect();
const penColor = document.getElementById("penColor");
const penWidth = document.getElementById("penWidth");

const calculateCanvasX = x => { return x - offset.x };
const calculateCanvasY = y => { return y - offset.y };
const resetCanvas = () => { ctx.clearRect(0, 0, canvas.width, canvas.height) }

let mousePressed = false;
let mouseOut = false;
penWidth.value = 1;

let vertices = [];
let horizontalEdges = [];
let edges = [];

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    resetCanvas();
    drawAll();
});

canvas.addEventListener('click', (e) => {
    const x = Math.round(calculateCanvasX(e.x));
    const y = Math.round(calculateCanvasY(e.y));

    vertices.push({
        x: x,
        y: y
    })
    resetCanvas();
    drawPoints();
});

function drawAll() {
    edges = [];
    for (let ifrom = 0; ifrom < vertices.length; ifrom++) {
        const from = vertices[ifrom];
        const to = (ifrom == vertices.length - 1 ? vertices[0] : vertices[ifrom + 1]);
        drawLine(from.x, from.y, to.x, to.y);
    }
}

function drawPoints() {
    vertices.forEach(vertex => {
        drawVertex(vertex.x, vertex.y);
    })
}

function fillAll() {
    createEdges();
    if (edges.length < 3) {
        return;
    }
    let imageData = new ImageData(canvas.width, canvas.height);
    horizontalEdges.forEach((edge) => {
        drawPixelLine(imageData, edge.sx, edge.ex, edge.y);
    })
    edges.sort((a, b) => { return b.ymax - a.ymax })
    for (let row = edges[0].ymax; ; --row) {
        let intersections = [];
        edges.forEach((edge) => {
            const intersection = calculateIntersection(row, edge);
            if (intersection != null) {
                intersections.push({
                    edge: edge,
                    x: intersection
                });
            }
        })
        if (intersections.length == 0) {
            break;
        }
        intersections.sort((a, b) => { return a.x - b.x });
        previousEndIntersection = null;
        for (let i = 0; i < (intersections.length - 1); i += 2) {
            const startIntersection = intersections[i];
            let endIntersection = intersections[i + 1];
            if (row == startIntersection.edge.ymax && row == endIntersection.edge.ymax ||
                row == startIntersection.edge.ymin && row == endIntersection.edge.ymin) {
                continue;
            }
            if (row == startIntersection.edge.ymax && row == endIntersection.edge.ymin ||
                row == startIntersection.edge.ymin && row == endIntersection.edge.ymax) {
                endIntersection = intersections[i + 2];
                ++i
            }
            drawPixelLine(imageData, startIntersection.x, endIntersection.x, row)
            previousEndIntersection = endIntersection;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function drawVertex(x, y) {
    ctx.save();
    ctx.fillStyle = penColor.value;
    ctx.beginPath()
    ctx.arc(x, y, penWidth.value, 0, (2 * Math.PI), false)
    ctx.fill()
    ctx.restore();
}

function drawLine(sx, sy, ex, ey) {
    ctx.save();
    ctx.strokeStyle = penColor.value;
    ctx.lineWidth = penWidth.value;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.restore();
}

function createEdges() {
    edges = [];
    for (let ifrom = 0; ifrom < vertices.length; ifrom++) {
        const from = vertices[ifrom];
        const to = (ifrom == vertices.length - 1 ? vertices[0] : vertices[ifrom + 1]);
        if (from.y == to.y) {
            horizontalEdges.push({
                sx: (from.x < to.x ? from.x : to.x),
                ex: (from.x < to.x ? to.x : from.x),
                y: from.y,
            })
        } else {
            edges.push({
                xb: (from.y < to.y ? to.x : from.x),
                ymin: (from.y > to.y ? to.y : from.y),
                ymax: (from.y > to.y ? from.y : to.y),
                m: (from.y - to.y) / (from.x - to.x)
            })
        }
    }
}

function drawPixelLine(imageData, sx, ex, y) {
    rgb = getColor(penColor.value)
    for (let column = sx; column <= ex; ++column) {
        imageData.data[y * imageData.width * 4 + (column * 4) + 0] = rgb.r;
        imageData.data[y * imageData.width * 4 + (column * 4) + 1] = rgb.g;
        imageData.data[y * imageData.width * 4 + (column * 4) + 2] = rgb.b;
        imageData.data[y * imageData.width * 4 + (column * 4) + 3] = 255;
    }
}

function getColor(color) {
    return {
        r: parseInt(color[1] + color[2], 16),
        g: parseInt(color[3] + color[4], 16),
        b: parseInt(color[5] + color[6], 16)
    }
}

function calculateIntersection(y, edge) {
    if (y <= edge.ymax && y >= edge.ymin) {
        return Math.round((y - (edge.ymax - edge.m * edge.xb)) / edge.m);
    }

    return null;

}

function reset() {
    vertices = [];
    edges = [];
    horizontalEdges = [];
    resetCanvas();
}
