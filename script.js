const canvas = document.querySelector('.webgl');
canvas.width = innerWidth;
canvas.height = innerHeight;
const scoreEl = document.querySelector('.score');

const c = canvas.getContext('2d');

const pelletEat = new Audio('./sound/eating.mp3');
const powerEat = new Audio('./sound/eating-fruit.mp3');
const killGhost = new Audio('./sound/eating-ghost.mp3');
const playerKill = new Audio('./sound/miss.mp3');
// const ghostMove = new Audio('./sound/ghost-move.mp3');
const ghostBlue = new Audio('./sound/ghost-blue.mp3');



class Boundary {
    static width = 40;
    static height = 40;
    constructor({ position, image }) {
        this.position = position;
        this.width = 40;
        this.height = 40;
        this.image = image
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y);
    }
}

class Player {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 15;
        this.radians = 0.75;
        this.openRate = 0.12;
        this.rotation = 0;
    }

    draw() {
        c.save();
        c.translate(this.position.x, this.position.y);
        c.rotate(this.rotation);
        c.translate(-this.position.x, -this.position.y)
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, this.radians, Math.PI * 2 - this.radians);
        c.lineTo(this.position.x, this.position.y)
        c.fillStyle = 'yellow';
        c.fill();
        c.closePath();
        c.restore();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.radians < 0 || this.radians > 0.75)
            this.openRate = -this.openRate;

        this.radians += this.openRate
    }
}

class Ghost {
    static speed = 2;
    constructor({ position, velocity, color = 'red' }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 15;
        this.color = color;
        this.prevCollison = [];
        this.speed = 2;
        this.scared = false;
        this.timeOutId
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.scared ? 'blue' : this.color;
        c.fill();
        c.closePath();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Pellet {
    constructor({ position }) {
        this.position = position;
        this.radius = 3;
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = 'white';
        c.fill();
        c.closePath();
    }
}

class powerUp {
    constructor({ position }) {
        this.position = position;
        this.radius = 6;
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = 'white';
        c.fill();
        c.closePath();
    }
}

function circleCollideWithRectangle({ circle, rectangle }) {
    const padding = Boundary.width / 2 - circle.radius - 1;
    return (circle.position.y - circle.radius + circle.velocity.y <= rectangle.position.y + rectangle.height + padding &&
        circle.position.x + circle.radius + circle.velocity.x >= rectangle.position.x - padding &&
        circle.position.y + circle.radius + circle.velocity.y >= rectangle.position.y - padding &&
        circle.position.x - circle.radius + circle.velocity.x <= rectangle.position.x + rectangle.width + padding)
}

const pellets = [];
const power = []
const boundaries = [];
const ghosts = [
    new Ghost({
        position: {
            x: Boundary.width * 5 + Boundary.width / 2,
            y: Boundary.height * 5 + Boundary.height / 2
        },
        velocity: {
            x: 0,
            y: -Ghost.speed
        }
    }),
    new Ghost({
        position: {
            x: Boundary.width * 5 + Boundary.width / 2,
            y: Boundary.height * 6 + Boundary.height / 2
        },
        velocity: {
            x: 0,
            y: Ghost.speed
        },
        color: 'pink'
    })
]
const map = [
    ['1', '-', '-', '-', '-', '-', '-', '-', '-', '-', '2'],
    ['|', '.', '.', '.', '.', '*', '.', '.', '.', '.', '|'],
    ['|', '.', '1', '-', 'cr', '.', 'cl', '-', '2', '.', '|'],
    ['|', '.', 'cb', '.', '.', '.', '.', '.', 'cb', '.', '|'],
    ['|', '.', '.', '.', 'ct', '.', 'ct', '.', '.', '*', '|'],
    ['pr', '-', 'cr', '.', '|', '*', '|', '.', 'cl', '-', 'pl'],
    ['|', '*', '.', '.', 'cb', '.', 'cb', '.', '.', '.', '|'],
    ['|', '.', 'ct', '.', '.', '.', '.', '.', 'ct', '.', '|'],
    ['|', '.', '4', '-', 'cr', '.', 'cl', '-', '3', '.', '|'],
    ['|', '.', '.', '.', '.', '*', '.', '.', '.', '.', '|'],
    ['4', '-', '-', '-', '-', '-', '-', '-', '-', '-', '3']
]

let lastKey;
let score = 0

const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    },
}
function createImage(src) {
    const image = new Image();
    image.src = src;
    return image
}

map.forEach((row, i) => {
    row.forEach((symbol, j) => {
        switch (symbol) {
            case '-':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/pipeHorizontal.png')
                }))

                break;
            case '|':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/pipeVertical.png')
                }))

                break;
            case '1':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/pipeCorner1.png')
                }))

                break;
            case '2':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/pipeCorner2.png')
                }))

                break;
            case '3':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/pipeCorner3.png')
                }))

                break;
            case '4':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/pipeCorner4.png')
                }))

                break;
            case 'b':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/block.png')
                }))

                break;
            case 'cr':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/capRight.png')
                }))

                break;
            case 'cb':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/capBottom.png')
                }))

                break;
            case 'cl':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/capLeft.png')
                }))

                break;
            case 'ct':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/capTop.png')
                }))

                break;
            case 'pl':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/pipeConnectorLeft.png')
                }))

                break;
            case 'pr':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    },
                    image: createImage('./img/pipeConnectorRight.png')
                }))

                break;
            case '.':
                pellets.push(new Pellet({
                    position: {
                        x: Boundary.width * j + Boundary.width / 2,
                        y: Boundary.height * i + Boundary.height / 2
                    }
                }))

                break;
            case '*':
                power.push(new powerUp({
                    position: {
                        x: Boundary.width * j + Boundary.width / 2,
                        y: Boundary.height * i + Boundary.height / 2
                    }
                }))

                break;
        }
    })
})


const player = new Player({
    position: {
        x: Boundary.width + Boundary.width / 2,
        y: Boundary.height + Boundary.height / 2
    },
    velocity: {
        x: 0,
        y: 0
    }
});

window.addEventListener('keydown', ({ key }) => {
    switch (key) {
        case 'w':
            keys.w.pressed = true;
            lastKey = 'w';
            break;
        case 'a':
            keys.a.pressed = true;
            lastKey = 'a';
            break;
        case 's':
            keys.s.pressed = true;
            lastKey = 's';
            break;
        case 'd':
            keys.d.pressed = true;
            lastKey = 'd';
            break;
        case 'W':
            keys.w.pressed = true;
            lastKey = 'w';
            break;
        case 'A':
            keys.a.pressed = true;
            lastKey = 'a';
            break;
        case 'S':
            keys.s.pressed = true;
            lastKey = 's';
            break;
        case 'D':
            keys.d.pressed = true;
            lastKey = 'd';
            break;
        case 'ArrowUp':
            keys.w.pressed = true;
            lastKey = 'w';
            break;
        case 'ArrowLeft':
            keys.a.pressed = true;
            lastKey = 'a';
            break;
        case 'ArrowDown':
            keys.s.pressed = true;
            lastKey = 's';
            break;
        case 'ArrowRight':
            keys.d.pressed = true;
            lastKey = 'd';
            break;
        default:
            break;
    }
});

window.addEventListener('keyup', ({ key }) => {
    switch (key) {
        case 'w':
            keys.w.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
        case 's':
            keys.s.pressed = false;
            break;
        case 'd':
            keys.d.pressed = false;
            break;
        case 'W':
            keys.w.pressed = false;
            break;
        case 'A':
            keys.a.pressed = false;
            break;
        case 'S':
            keys.s.pressed = false;
            break;
        case 'D':
            keys.d.pressed = false;
            break;
        case 'ArrowUp':
            keys.w.pressed = false;
            break;
        case 'ArrowLeft':
            keys.a.pressed = false;
            break;
        case 'ArrowDown':
            keys.s.pressed = false;
            break;
        case 'ArrowRight':
            keys.d.pressed = false;
            break;
    }
});

let animationId;

function animation() {
    animationId = requestAnimationFrame(animation);

    c.clearRect(0, 0, canvas.width, canvas.height)
    boundaries.forEach((boundary) => {
        boundary.draw();

        if (circleCollideWithRectangle({ circle: player, rectangle: boundary })) {
            pelletEat.pause();
            player.velocity.x = 0;
            player.velocity.y = 0;
        }
    });

    for (let i = pellets.length - 1; i > 0; i--) {
        const pellet = pellets[i];
        pellet.draw();

        if (Math.hypot(
            pellet.position.x - player.position.x, pellet.position.y - player.position.y
        ) < pellet.radius + player.radius - 10
        ) {
            pellets.splice(i, 1);
            score += 10;
            scoreEl.innerHTML = score;
            pelletEat.play();
        }
    }

    for (let i = power.length - 1; i >= 0; i--) {
        const pow = power[i];
        pow.draw();

        if (Math.hypot(
            pow.position.x - player.position.x, pow.position.y - player.position.y
        ) < pow.radius + player.radius
        ) {
            power.splice(i, 1);
            score += 50;
            scoreEl.innerHTML = score;
            powerEat.play();

            //ghost scared
            ghosts.forEach((ghost) => {
                if (ghost.scared) clearTimeout(ghost.timeOutId);
                ghost.scared = true;

                ghost.timeOutId = setTimeout(() => {
                    ghost.scared = false;
                }, 5000)
            })
        }
    }
    //detect collision b/w ghost and player
    for (let i = ghosts.length - 1; i >= 0; i--) {
        const ghost = ghosts[i];
        if (Math.hypot(
            ghost.position.x - player.position.x, ghost.position.y - player.position.y
        ) < ghost.radius + player.radius
        ) {
            if (ghost.scared) {
                ghosts.splice(i, 1);
                score += 100;
                scoreEl.innerHTML = score;
                killGhost.play();
            }
            else{
                pelletEat.pause();
                playerKill.play();
                cancelAnimationFrame(animationId);
            }
        }
    }

    if(ghosts.length && ghosts[0].scared){
        ghostBlue.play();
    } 
    else if(!ghosts.length){
        ghostBlue.pause();
    }

    //win condition
    if (pellets.length === 1){
        pelletEat.pause();
        cancelAnimationFrame(animationId);
    }

    player.update();

    ghosts.forEach(ghost => {
        ghost.update();

        const collisions = [];
        boundaries.forEach((boundary, i) => {
            if (!collisions.includes('right') &&
                circleCollideWithRectangle({
                    circle: {
                        ...ghost, velocity: {
                            x: ghost.speed,
                            y: 0
                        }
                    },
                    rectangle: boundaries[i]
                })) {
                collisions.push('right');
            }

            if (!collisions.includes('left') &&
                circleCollideWithRectangle({
                    circle: {
                        ...ghost, velocity: {
                            x: -ghost.speed,
                            y: 0
                        }
                    },
                    rectangle: boundaries[i]
                })) {
                collisions.push('left');
            }

            if (!collisions.includes('up') &&
                circleCollideWithRectangle({
                    circle: {
                        ...ghost, velocity: {
                            x: 0,
                            y: -ghost.speed
                        }
                    },
                    rectangle: boundaries[i]
                })) {
                collisions.push('up');
            }

            if (!collisions.includes('down') &&
                circleCollideWithRectangle({
                    circle: {
                        ...ghost, velocity: {
                            x: 0,
                            y: ghost.speed
                        }
                    },
                    rectangle: boundaries[i]
                })) {
                collisions.push('down');
            }
        })
        if (collisions.length > ghost.prevCollison)
            ghost.prevCollison = collisions;

        if (JSON.stringify(collisions) !== JSON.stringify(ghost.prevCollison)) {

            if (ghost.velocity.x > 0) ghost.prevCollison.push('right');
            else if (ghost.velocity.x < 0) ghost.prevCollison.push('left');
            else if (ghost.velocity.y > 0) ghost.prevCollison.push('up');
            else if (ghost.velocity.y < 0) ghost.prevCollison.push('down');

            const pathways = ghost.prevCollison.filter((collision) => {
                return !collisions.includes(collision);
            })

            const direction = pathways[Math.floor(Math.random() * pathways.length)];

            switch (direction) {
                case 'down':
                    ghost.velocity.y = ghost.speed;
                    ghost.velocity.x = 0;
                    break;

                case 'up':
                    ghost.velocity.y = -ghost.speed;
                    ghost.velocity.x = 0;
                    break;

                case 'right':
                    ghost.velocity.y = 0;
                    ghost.velocity.x = ghost.speed;
                    break;

                case 'left':
                    ghost.velocity.y = 0;
                    ghost.velocity.x = -ghost.speed;
                    break;

            }
            ghost.prevCollison = [];
        }
    })

    if (keys.w.pressed && lastKey === 'w') {
        for (let i = 0; i < boundaries.length; i++) {
            if (circleCollideWithRectangle({
                circle: {
                    ...player, velocity: {
                        x: 0,
                        y: -4
                    }
                },
                rectangle: boundaries[i]
            })) {
                player.velocity.y = 0;
                break;
            }
            else
                player.velocity.y = -4;
        }
    }
    else if (keys.a.pressed && lastKey === 'a') {
        for (let i = 0; i < boundaries.length; i++) {
            if (circleCollideWithRectangle({
                circle: {
                    ...player, velocity: {
                        x: -4,
                        y: 0
                    }
                },
                rectangle: boundaries[i]
            })) {
                player.velocity.x = 0;
                break;
            }
            else
                player.velocity.x = -4;
        }
    }
    else if (keys.s.pressed && lastKey === 's') {
        for (let i = 0; i < boundaries.length; i++) {
            if (circleCollideWithRectangle({
                circle: {
                    ...player, velocity: {
                        x: 0,
                        y: 4
                    }
                },
                rectangle: boundaries[i]
            })) {
                player.velocity.y = 0;
                break;
            }
            else
                player.velocity.y = 4;
        }
    }
    else if (keys.d.pressed && lastKey === 'd') {
        for (let i = 0; i < boundaries.length; i++) {
            if (circleCollideWithRectangle({
                circle: {
                    ...player, velocity: {
                        x: 4,
                        y: 0
                    }
                },
                rectangle: boundaries[i]
            })) {
                player.velocity.x = 0;
                break;
            }
            else
                player.velocity.x = 4;
        }
    }

    if (player.velocity.x > 0) player.rotation = 0;
    else if (player.velocity.x < 0) player.rotation = Math.PI;
    else if (player.velocity.y > 0) player.rotation = Math.PI / 2;
    else if (player.velocity.y < 0) player.rotation = Math.PI * 1.5;

}
animation();