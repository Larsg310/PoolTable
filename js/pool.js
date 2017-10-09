BallType = {
    WHITE: {name: "White"},
    BLACK: {name: "Black"},
    SOLID: {name: "Solids"},
    STRIPE: {name: "Stripes"}
};

class Player
{
    constructor(name, turn)
    {
        this.name = name;
        this.ballType = null;
        this.ballsInThePocket = [];
        this.turn = turn;
    }

    updateTurn()
    {
        this.turn = !this.turn;
    }

    pocketBall(ball, otherPlayer)
    {
        this.ballsInThePocket.push(ball);
        if (this.ballType === null)
        {
            this.ballType = ball.type;
            otherPlayer.ballType = ball.type === BallType.STRIPE ? BallType.SOLID : BallType.STRIPE;
        }
    }
}

class Game
{
    constructor(player1, player2)
    {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.up.set(0, 0, 1);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x151515, 1);
        this.renderer.shadowMap.enabled = false;
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);

        this.table = new Table();
        this.scene.add(this.table);
        this.table.position.set(0, 0, -1);

        this.balls = [
            new Ball(0, {x: 0, y: -16}, BallType.WHITE, this),

            new Ball(1, {x: -1.01, y: 15}, BallType.SOLID, this),
            new Ball(2, {x: 1.01, y: 17}, BallType.SOLID, this),
            new Ball(3, {x: -0.51, y: 16}, BallType.SOLID, this),
            new Ball(4, {x: -1.01, y: 17}, BallType.SOLID, this),
            new Ball(5, {x: -2.02, y: 17}, BallType.SOLID, this),
            new Ball(6, {x: 1.53, y: 16}, BallType.SOLID, this),
            new Ball(7, {x: 0.51, y: 14}, BallType.SOLID, this),

            new Ball(8, {x: 0, y: 15}, BallType.BLACK, this),

            new Ball(9, {x: 0, y: 13}, BallType.STRIPE, this),
            new Ball(10, {x: 0.51, y: 16}, BallType.STRIPE, this),
            new Ball(11, {x: 2.02, y: 17}, BallType.STRIPE, this),
            new Ball(12, {x: -0.51, y: 14}, BallType.STRIPE, this),
            new Ball(13, {x: 0, y: 17}, BallType.STRIPE, this),
            new Ball(14, {x: -1.53, y: 16}, BallType.STRIPE, this),
            new Ball(15, {x: 1.01, y: 15}, BallType.STRIPE, this)
        ];

        this.cue = new Cue(this.balls[0], this);

        this.camera.lookAt(this.balls[0].position);
        this.camera.position.set(this.cue.selectedBall.position.x, this.cue.selectedBall.position.y, 45);

        this.players = [
            player1,
            player2
        ];

        this.balls.forEach(b => this.scene.add(b));

        this.scene.add(this.cue);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.maxDistance = 100;
        this.controls.minDistance = 5;
        this.controls.enablePan = false;
        this.controls.enableRotate = true;
        this.controls.minPolarAngle = Math.PI / 6;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target = this.balls[0].position;
        this.controls.update();

        let ambient = new THREE.AmbientLight(0xFFFFFF, 0.2);

        let pointLight1 = new THREE.PointLight(0xFFFFFF, 0.4, 100);
        pointLight1.position.set(-5, -12, 20);
        pointLight1.castShadow = true;

        let pointLight2 = new THREE.PointLight(0xFFFFFF, 0.4, 100);
        pointLight2.position.set(5, -12, 20);
        pointLight2.castShadow = true;

        let pointLight3 = new THREE.PointLight(0xFFFFFF, 0.4, 100);
        pointLight3.position.set(-5, 12, 20);
        pointLight3.castShadow = true;

        let pointLight4 = new THREE.PointLight(0xFFFFFF, 0.4, 100);
        pointLight4.position.set(5, 12, 20);
        pointLight4.castShadow = true;

        this.scene.add(pointLight1);
        this.scene.add(pointLight2);
        this.scene.add(pointLight3);
        this.scene.add(pointLight4);
        this.scene.add(ambient);

        // Add Clock
        this.clock = new THREE.Clock();

    }

    updateGame()
    {
        let deltaTime = 60 * this.clock.getDelta();

        for (let i = 0; i < this.balls.length; i++)
        {
            for (let ii = 0; ii < this.balls.length; ii++)
            {
                if (this.balls[i] !== this.balls[ii])
                {
                    this.balls[i].checkCollisionBall(this.balls[ii]);
                }
            }
            this.balls[i].checkCollisionTable(this.table);
            this.balls[i].move(deltaTime);
        }

        this.controls.target = this.cue.selectedBall.position;
        this.controls.update();

        this.cue.update(this.controls);

        // Update camera
        this.renderer.render(this.scene, this.camera);
    };

    switchTurn()
    {
        this.players.forEach(p => p.updateTurn());
    }
}

class Table extends THREE.Object3D
{
    constructor()
    {
        super();
        this.dimensions = {
            topLeft: {x: -12, y: 24},
            topRight: {x: 12, y: 24},
            bottomLeft: {x: -12, y: -24},
            bottomRight: {x: 12, y: -24}
        };

        this.collidableMeshList = [];

        // Field textures
        let fieldGeometry = new THREE.BoxGeometry(24, 48, 1);
        let fieldTexture = new THREE.TextureLoader().load("./textures/table/cloth.jpg", function (texture)
        {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.offset.set(0, 0);
            texture.repeat.set(3, 6);
        });

        let fieldMaterial = new THREE.MeshStandardMaterial(
            {
                color: 0x42a8ff,
                map: fieldTexture,
                roughness: 0.4,
                metalness: 0,
                bumpScale: 1
            });

        let field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.receiveShadow = true;

        let shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(0, 22);
        shape.lineTo(0.5, 21.2);
        shape.lineTo(0.5, 0.8);
        shape.lineTo(0, 0);

        let extrudeSettings = {steps: 1, amount: 1, bevelEnabled: false};

        let clothSideGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        let clothSideLeftTop = new THREE.Mesh(clothSideGeometry, fieldMaterial);
        let clothSideRightTop = new THREE.Mesh(clothSideGeometry, fieldMaterial);
        let clothSideLeftBottom = new THREE.Mesh(clothSideGeometry, fieldMaterial);
        let clothSideRightBottom = new THREE.Mesh(clothSideGeometry, fieldMaterial);
        let clothTop = new THREE.Mesh(clothSideGeometry, fieldMaterial);
        let clothBottom = new THREE.Mesh(clothSideGeometry, fieldMaterial);

        clothSideLeftTop.position.set(-12, 1, 0.2);
        clothSideRightTop.position.set(12, 1, 1.2);
        clothSideLeftBottom.position.set(-12, -23, 0.2);
        clothSideRightBottom.position.set(12, -23, 1.2);

        clothTop.position.set(-11, 24, 0.2);
        clothBottom.position.set(11, -24, 0.2);

        clothTop.rotation.set(0, 0, -90 * Math.PI / 180, 0);
        clothBottom.rotation.set(0, 0, 90 * Math.PI / 180, 0);

        clothSideRightTop.rotation.set(0, 180 * Math.PI / 180, 0);
        clothSideRightBottom.rotation.set(0, 180 * Math.PI / 180, 0);

        // Wood sides
        let woodTexture = new THREE.TextureLoader().load("./textures/table/wood.jpg");
        let woodMaterial = new THREE.MeshStandardMaterial({map: woodTexture});

        let woodSideGeometry = new THREE.BoxGeometry(1, 22, 1);
        let woodTopGeometry = new THREE.BoxGeometry(22, 1, 1);

        let woodSideLeftTop = new THREE.Mesh(woodSideGeometry, woodMaterial);
        let woodSideRightTop = new THREE.Mesh(woodSideGeometry, woodMaterial);
        let woodSideLeftBottom = new THREE.Mesh(woodSideGeometry, woodMaterial);
        let woodSideRightBottom = new THREE.Mesh(woodSideGeometry, woodMaterial);
        let woodTop = new THREE.Mesh(woodTopGeometry, woodMaterial);
        let woodBottom = new THREE.Mesh(woodTopGeometry, woodMaterial);

        woodSideLeftTop.position.set(-12.5, 12, 0.7);
        woodSideRightTop.position.set(12.5, 12, 0.7);
        woodSideLeftBottom.position.set(-12.5, -12, 0.7);
        woodSideRightBottom.position.set(12.5, -12, 0.7);
        woodTop.position.set(0, 24.5, 0.7);
        woodBottom.position.set(0, -24.5, 0.7);

        // Holes
        let cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1.4, 20);
        let cylinderMaterial = new THREE.MeshBasicMaterial({color: 0x000000});

        let topLeftCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        let topRightCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        let middleLeftCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        let middleRightCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        let bottomLeftCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        let bottomRightCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

        topLeftCylinder.position.set(this.dimensions.topLeft.x, this.dimensions.topLeft.y, 0);
        topRightCylinder.position.set(this.dimensions.topRight.x, this.dimensions.topRight.y, 0);
        middleLeftCylinder.position.set(this.dimensions.topLeft.x - 0.5, (this.dimensions.topLeft.y + this.dimensions.bottomLeft.y) / 2, 0);
        middleRightCylinder.position.set(this.dimensions.topRight.x + 0.5, (this.dimensions.topRight.y + this.dimensions.bottomRight.y) / 2, 0);
        bottomLeftCylinder.position.set(this.dimensions.bottomLeft.x, this.dimensions.bottomLeft.y, 0);
        bottomRightCylinder.position.set(this.dimensions.bottomRight.x, this.dimensions.bottomRight.y, 0);

        topLeftCylinder.rotation.set(1.5708, 0, 0);
        topRightCylinder.rotation.set(1.5708, 0, 0);
        middleLeftCylinder.rotation.set(1.5708, 0, 0);
        middleRightCylinder.rotation.set(1.5708, 0, 0);
        bottomLeftCylinder.rotation.set(1.5708, 0, 0);
        bottomRightCylinder.rotation.set(1.5708, 0, 0);

        // Platinum sides
        let sideShape = new THREE.Shape();
        sideShape.moveTo(0, 0);
        sideShape.lineTo(1, 0);
        sideShape.lineTo(0.75, -0.75);
        sideShape.lineTo(0, -1);
        sideShape.lineTo(0, 0);

        let sideExtrudeSettings = {steps: 50, amount: 50, bevelEnabled: false};

        let sideMaterial = new THREE.MeshStandardMaterial({
            color: 0xE5E4E2,
            side: THREE.DoubleSide,
            specular: 0xFFFFFF,
            metalness: 0
        });

        let sideGeometry = new THREE.ExtrudeGeometry(sideShape, sideExtrudeSettings);
        sideExtrudeSettings.steps = 26;
        sideExtrudeSettings.amount = 26;
        let topGeometry = new THREE.ExtrudeGeometry(sideShape, sideExtrudeSettings);

        let leftSidePlane = new THREE.Mesh(sideGeometry, sideMaterial);
        let rightSidePlane = new THREE.Mesh(sideGeometry, sideMaterial);
        let topPlane = new THREE.Mesh(topGeometry, sideMaterial);
        let bottomPlane = new THREE.Mesh(topGeometry, sideMaterial);

        var pi180 = Math.PI / 180;

        leftSidePlane.rotation.set(90 * pi180, 0, 180 * pi180);
        rightSidePlane.rotation.set(90 * pi180, 0, 90 * pi180);
        topPlane.rotation.set(90 * pi180, -90 * pi180, 180 * pi180);
        bottomPlane.rotation.set(90 * pi180, -90 * pi180, 90 * pi180);

        leftSidePlane.position.set(-13, 25, 0.2);
        rightSidePlane.position.set(13, 25, 0.2);
        topPlane.position.set(13, 25, 0.2);
        bottomPlane.position.set(13, -25, 0.2);

        let bottomGeometry = new THREE.CubeGeometry(28, 52, 4);
        let bottom = new THREE.Mesh(bottomGeometry, sideMaterial);

        bottom.position.set(0, 0, -1.8);

        // Shadows
        field.receiveShadow = true;

        this.add(field);
        this.add(woodSideLeftTop);
        this.add(woodSideRightTop);
        this.add(woodSideLeftBottom);
        this.add(woodSideRightBottom);
        this.add(woodTop);
        this.add(woodBottom);

        this.add(clothSideLeftTop);
        this.add(clothSideRightTop);
        this.add(clothSideLeftBottom);
        this.add(clothSideRightBottom);
        this.add(clothTop);
        this.add(clothBottom);

        this.add(topLeftCylinder);
        this.add(topRightCylinder);
        this.add(middleLeftCylinder);
        this.add(middleRightCylinder);
        this.add(bottomLeftCylinder);
        this.add(bottomRightCylinder);

        this.collidableMeshList.push(clothBottom);
    }
}

class Ball extends THREE.Mesh
{
    constructor(ballNumber, position, type, game)
    {
        const sphereGeometry = new THREE.SphereGeometry(0.5, 128, 128);
        const texture = new THREE.TextureLoader().load("./textures/ball/" + ballNumber + ".png");
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.25,
            metalness: 0,
            map: texture
        });
        super(sphereGeometry, material);
        this.ballNumber = ballNumber;
        this.type = type;
        this.game = game;

        this.castShadow = true;
        this.speed = new THREE.Vector2();
        this.position.set(position.x, position.y, 0);
        this.pocketed = false;
    };

    setSpeed(speed) { this.speed = speed; };

    setPosition(position) { this.position = position; };

    checkCollisionBall(ball)
    {
        // Calculating distance between Balls.
        let dx = ball.position.x - this.position.x;
        let dy = ball.position.y - this.position.y;

        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1)
        { // Collision!
            // Play sound
            //sound.play();
            let angle1 = Math.atan2(this.speed.y, this.speed.x);
            let angle2 = Math.atan2(ball.speed.y, ball.speed.x);

            let vel1 = Math.sqrt(this.speed.x * this.speed.x + this.speed.y * this.speed.y);
            let vel2 = Math.sqrt(ball.speed.x * ball.speed.x + ball.speed.y * ball.speed.y);

            let collisionAngle = Math.atan2(dy, dx);

            let aSpeedX = (2 * vel2 * Math.cos(angle2 - collisionAngle) / 2) * Math.cos(collisionAngle) + vel1 * Math.sin(angle1 - collisionAngle) * Math.cos(collisionAngle + Math.PI / 2);
            let aSpeedY = (2 * vel2 * Math.cos(angle2 - collisionAngle) / 2) * Math.sin(collisionAngle) + vel1 * Math.sin(angle1 - collisionAngle) * Math.sin(collisionAngle + Math.PI / 2);

            let bSpeedX = (2 * vel1 * Math.cos(angle1 - collisionAngle) / 2) * Math.cos(collisionAngle) + vel2 * Math.sin(angle2 - collisionAngle) * Math.cos(collisionAngle + Math.PI / 2);
            let bSpeedY = (2 * vel1 * Math.cos(angle1 - collisionAngle) / 2) * Math.sin(collisionAngle) + vel2 * Math.sin(angle2 - collisionAngle) * Math.sin(collisionAngle + Math.PI / 2);

            // Reset position outside of collision bounds.
            this.position.x = ball.position.x - (Math.round(Math.cos(collisionAngle) * 1000) / 1000);
            this.position.y = ball.position.y - (Math.round(Math.sin(collisionAngle) * 1000) / 1000);

            this.setSpeed({x: aSpeedX, y: aSpeedY});
            ball.setSpeed({x: bSpeedX, y: bSpeedY});
        }
    };

    checkCollisionTable(table)
    {
        if (!this.pocketed)
        {
            // Reverse speed when boundary off the table have been reached.
            if (this.position.x + 1 > table.dimensions.topRight.x || this.position.x - 1 < table.dimensions.topLeft.x)
            {
                this.speed.x *= -1;
            }
            if (this.position.y + 1 > table.dimensions.topRight.y || this.position.y - 1 < table.dimensions.bottomRight.y)
            {
                this.speed.y *= -1;
            }

            if (this.position.x - 1.3 < table.dimensions.topLeft.x && this.position.y + 1.3 > table.dimensions.topLeft.y)
            {
                this.pocket();
            }

            if (this.position.x + 1.3 > table.dimensions.topRight.x && this.position.y + 1.3 > table.dimensions.topRight.y)
            {
                this.pocket();
            }

            if (this.position.x - 1.3 < table.dimensions.bottomLeft.x && this.position.y - 1.3 < table.dimensions.bottomLeft.y)
            {
                this.pocket();
            }

            if (this.position.x + 1.3 > table.dimensions.bottomRight.x && this.position.y - 1.3 < table.dimensions.bottomRight.y)
            {
                this.pocket();
            }

            if (this.position.x - 0.5 < table.dimensions.topLeft.x && (this.position.y < 1.2 && this.position.y > -1.2))
            {
                this.pocket();
            }

            if (this.position.x + 0.5 > table.dimensions.topRight.x && (this.position.y < 1.2 && this.position.y > -1.2))
            {
                this.pocket();
            }
        }

    }

    move(deltaTime)
    {
        // Setting rolling resistance.
        this.speed.x = this.speed.x * (1 - 0.01 * deltaTime);
        this.speed.y = this.speed.y * (1 - 0.01 * deltaTime);

        // Set new position according to x/y speed.
        let stepX = this.speed.x * deltaTime;
        let stepY = this.speed.y * deltaTime;
        this.position.set(this.position.x + stepX, this.position.y + stepY, 0);

        // Update ball rotation
        let tempMat = new THREE.Matrix4();
        tempMat.makeRotationAxis(new THREE.Vector3(0, 1, 0), stepX / 0.5);
        tempMat.multiply(this.matrix);
        this.matrix = tempMat;
        tempMat = new THREE.Matrix4();
        tempMat.makeRotationAxis(new THREE.Vector3(1, 0, 0), -stepY / 0.5);
        tempMat.multiply(this.matrix);
        this.matrix = tempMat;
        this.rotation.setFromRotationMatrix(this.matrix);
    }

    pocket()
    {
        if (this.ballNumber !== 0 && this.visible)
        {
            console.log("Ball pocketed: " + this.ballNumber + "(" + this.type.name + ")");
            this.visible = false;
            this.setSpeed({x: 0, y: 0});
            this.position.set(50, 50, 0);
            this.pocketed = true;
            if (this.game.players[0].turn) this.game.players[0].pocketBall(this, this.game.players[1]);
            if (this.game.players[1].turn) this.game.players[1].pocketBall(this, this.game.players[0]);
        }
    }
}

class Cue extends THREE.Mesh
{
    constructor(ball, game)
    {
        // let woodTexture = new THREE.TextureLoader().load("./3D/texture/cuewood.jpg");
        let geometry = new THREE.CylinderGeometry(0.1, 0.15, 12, 32, 32);
        let material = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF
        });
        super(geometry, material);
        this.geometry.translate(0, -7, 0);
        this.castShadow = true;
        this.position.set(ball.position.x, ball.position.y, 0);
        this.speed = 0.6;
        this.selectedBall = ball;
        this.game = game;
    };

    setBall(ball)
    {
        this.selectedBall = ball;
        this.position.set(ball.position.x, ball.position.y, ball.position.z);
    };

    shoot(force)
    {
        // can't shoot while cue is invisible
        if (this.visible)
        {
            let angle = this.rotation.z - (-90 * Math.PI / 180);
            let speedX = Math.cos(angle) * force;
            let speedY = Math.sin(angle) * force;
            this.selectedBall.setSpeed({
                x: speedX,
                y: speedY
            });
        }

        this.game.switchTurn();
        // temp hide cue
        this.visible = false;
    };

    update(control)
    {
        let dx = this.selectedBall.position.x - control.object.position.x;
        let dy = this.selectedBall.position.y - control.object.position.y;

        let cameraAngle = Math.atan2(dy, dx);
        this.rotation.z = cameraAngle + (-90 * Math.PI / 180);

        // Set camera to rotate and look at selected ball
        this.position.set(this.selectedBall.position.x, this.selectedBall.position.y, this.selectedBall.position.z);

        // show cue again when speed of ball is < ...
        if (Math.abs(this.selectedBall.speed.y) <= 0.002 && Math.abs(this.selectedBall.speed.x) <= 0.002)
        {
            if (!this.visible)
            {
                //control.target = this.selectedBall.position;
                //control.update();
            }
            this.visible = true;
        }
    };
}

init();
animate();

var game;
var player1;
var player2;

let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

function init()
{
    player1 = new Player("Player 1", true);
    player2 = new Player("Player 2", false);

    game = new Game(player1, player2);
    window.addEventListener("resize", onResize, false);
    document.addEventListener('keydown', onDocumentKeyDown, false);
    document.addEventListener('click', onDocumentMouseClick, false);
}

function animate()
{
    requestAnimationFrame(animate);

    game.updateGame();
    updateOverlay();
}

function updateOverlay()
{
    document.getElementById("turn").innerText = game.players[0].turn ? "Turn: Player 1" : "Turn: Player 2";

    if (player1.ballsInThePocket.length > 0)
    {
        document.getElementById("player1type").innerText = "Player 1: " + player1.ballType.name;
        document.getElementById("player1count").innerText = "Amount: " + player1.ballsInThePocket.length;
    }
    if (player2.ballsInThePocket.length > 0)
    {
        document.getElementById("player2type").innerText = "Player 1: " + player2.ballType.name;
        document.getElementById("player2count").innerText = "Amount: " + player2.ballsInThePocket.length;
    }
}

function onResize()
{
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentKeyDown(event)
{
    let keyCode = event.which;
    if (keyCode === 32)
    {
        game.cue.shoot(1); // Space
    }
}

function onDocumentMouseClick(event)
{
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse.clone(), game.camera);

    let intersect = raycaster.intersectObjects(game.balls);

    for (let i = 0; i < intersect.length; i++)
    {
        game.cue.setBall(intersect[i].object);
    }
}