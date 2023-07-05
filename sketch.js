// global variables
let carX, carZ;
let car;
let moveSpeed;
let world;

// truck, overhead fuelbar and the number of coins
let truck, fuelbox, cointext;

// trees and bricks arrays
let trees = [];
let boxes = [];

// variables to create entities
let cx, cy, cz, total;

// bowling pins array
let pins = [];

// road block
let rblock;

// streetlights
let lights = [];

// bowling
let bowling;

// rain and coins array
let particles = [];
let coins = [];

// number of coins collected
let collections = 0;

// user position & velocity
const accel = 0.01;
let position, velocity;

// friction
const frictionMag = 0.005;
let friction;

// game over text
let overtext;

// sound
let carDrive, honk, click, bricks, collision, fence, coinCol, rain;

// load sounds
function preload() {
	rain = loadSound("sounds/rain.mp3");
	carDrive = loadSound("sounds/car.mp3");
	honk = loadSound("sounds/honk.mp3");
	coinCol = loadSound("sounds/collection.wav")
	click = loadSound("sounds/clicked.wav");
}


function setup() {
	// no canvas needed
	noCanvas();
	rain.setVolume(0.2)
	carDrive.setVolume(0.07)
	// construct the A-Frame world
	// this function requires a reference to the ID of the 'a-scene' tag in our HTML document
	world = new World('VRScene');

	// set a background color for the world using RGB values
	world.setBackground(192, 133, 201);
	// put the user up above the world
	world.setUserPosition(0,7,8);
	//
	// turn off WASD
	world.camera.cameraEl.removeAttribute('wasd-controls')

	// turn off the user's ability to freely rotate the camera
	// world.camera.cameraEl.removeAttribute('look-controls')

	// rotate the camera down at an angle
	world.camera.holder.object3D.rotation.set(radians(-15), 0, 0);

	// add sky
	sky = new Sky({
		asset: 'sky'
	});
	world.add(sky);
	// bgSound.setVolume(0.3);

	// add trees
	for (let i = 0; i < 40; i++) {
		trees.push(new Tree(random(10, 50), random(-40, 50), random(2.5, 3.3)));
		trees.push(new Tree(random(-50, -10), random(-40, 50), random(2.5, 3.3)));
	}

	// call entity placement functions
	placebowling();
	placefuel();
	placebrick();
	placelamps();
	placecar();
	placeRoadBlocks();
	playground();
	placeroad();
	placefence();

  // set up vectors to hold the user's position & accelration
  position = createVector(0, -5);
  velocity = createVector(0, 0);

}

function draw() {
	sounds();

	world.camera.holder.object3D.rotation.set(radians(-25), 0, 0);

	// always create a new rain particle
	var temp = new Particle(random(-20, 20), 15, random(-80,10));

	particles.push( temp );

	// draw all rain and delete if reaches the ground
	for (var i = 0; i < particles.length; i++) {
		var result = particles[i].move();
		if (result == "gone") {
			particles.splice(i, 1);
			i-=1;
		}
	}

	// decrement fuel after some time
	if (frameCount % 20 == 0 && fuelbox.getWidth() >= 0.09){
		fuelbox.setWidth(fuelbox.getWidth()-0.09);
	}

	// only move car if there is fuel
	if (fuelbox.getWidth() > 0.01) {
		carMovement();
	}
	else {
		console.log("over")
		overtext.setPosition(truck.getX(), 4, truck.getZ());
		overtext.toggleVisibility();
	}

	// add coins
	if (frameCount % 300 == 0){
		coins.push(new Coin())
	}
	// remove coins
	for (var i = 0; i < coins.length; i++) {
		var result = coins[i].destroy();
		if (result == "gone") {
			coins.splice(i, 1);
			i-=1;
		}
	}
	// update number of coins on the car
	cointext.setText(collections)

}

// place the fences around the playground
function placefence (){
	// gate Model
	let gate = new GLTF({
		asset: 'gate',
		x: -5,y: 0,z:-55,
		scaleX:2,scaleY:2,scaleZ:2,
		rotationY:90
	});
	// gate.tag.setAttribute('dynamic-Body', "linearDamping: 0.5; mass: 10");
	world.add(gate);

	// fence Model
	let cx = -25.6;
	let bx = 17;
	let fence;
	// add fences on the right and left of teh gate
	for (let i = 0; i < 4; i++){
		fence = new GLTF({
			asset: 'fence',
			x: cx,y: 0,z:-55,
			scaleX:2,scaleY:2,scaleZ:2,
			rotationY:68
		});
    	fence.spinY(-5);
		fence.tag.setAttribute('dynamic-Body', "shape: box; halfExtents: 0.05 0.05 0.02; mass: 0.5");
		world.add(fence);
		cx -= 8.3;
		fence = new GLTF({
			asset: 'fence',
			x: bx,y: 0,z:-55,
			scaleX:2,scaleY:2,scaleZ:2,
			rotationY:68
		});
		fence.tag.setAttribute('dynamic-Body', "linearDamping: 0.5; mass: 10");
		world.add(fence);
		bx += 8.3;
	}
	// add fences on the left and right of the playground
	cz = - 95
	for (let i = 0; i < 5; i++){
		fence = new GLTF({
			asset: 'fence',
			x:-50 ,y: 0,z:cz,
			scaleX:2,scaleY:2,scaleZ:2,
			rotationY:-23
		});
		fence.tag.setAttribute('dynamic-Body', "linearDamping: 0.5; mass: 10");
		world.add(fence);
		fence = new GLTF({
			asset: 'fence',
			x:50 ,y: 0,z:cz,
			scaleX:2,scaleY:2,scaleZ:2,
			rotationY:-23
		});
		fence.tag.setAttribute('dynamic-Body', "linearDamping: 0.5; mass: 10");
		world.add(fence);
		cz += 8.3;
	}

	// add fences behind the playground
	cx = -50;
	for (let i = 0; i < 12; i++){
		fence = new GLTF({
			asset: 'fence',
			x: cx,y: 0,z:-95,
			scaleX:2,scaleY:2,scaleZ:2,
			rotationY:68
		});
		fence.tag.setAttribute('dynamic-Body', "mass: 80");
		world.add(fence);
		cx += 8.5;
	}
}

// create the playground
function playground() {
	// create a plane to serve as our "ground"
	let g = new Plane({
		x:0, y:0.2, z:-75,
		width:100, height:40,
		red:64, green:128, blue:0,
		rotationX:-90});

	// add the plane to our world
	world.add(g);
}

// place the roads
function placeroad (){
	// connect two roads infront of each other
	// Road Model
	let road1 = new GLTF({
		asset: 'road',
		x: 0,
		y: 0,
		z:10,
		scaleX:0.015,
		scaleY:0.015,
		scaleZ:0.015
		// rotationX:radians(80)
	});
	// Road Model
	let road2 = new GLTF({
		asset: 'road',
		x: 0,
		y: 0,
		z:-35,
		scaleX:0.015,
		scaleY:0.015,
		scaleZ:0.015
		// rotationX:radians(80)
	});

	world.add(road1);
	world.add(road2);
}

// place the roadblock as well as playing instructions behind the car
function placeRoadBlocks(){
	// load new roadblock
	rblock = new GLTF({
		asset: 'rblock',
		x: 0,y: 0, z:-15,
		scaleX:0.03, scaleY:0.03,scaleZ:0.03,
		rotationY: -5
	});
	rblock.tag.setAttribute('dynamic-Body', "linearDamping: 0.5; mass: 10");
	world.add(rblock)

	// WASD instructions text
	let movetext = new Text({
		text: 'WASD to move',
		red: 51, green: 51, blue: 204,
		side: 'double',
		x: 0, y: 0.5, z: 3,
		scaleX: 22, scaleY: 22, scaleZ: 22,
		rotationX: -90
	});

	world.add(movetext);

	// honk text
	let honktext = new Text({
		text: 'H to honk',
		red: 51, green: 51, blue: 204,
		side: 'double',
		x: 0, y: 0.5, z: 4.5,
		scaleX: 18, scaleY: 18, scaleZ: 18,
		rotationX: -90
	});

	world.add(honktext);
}

// controls how the car moves, its acceleration and camera movemnet alonsgide it
function carMovement () {
	// if  S is pressed, play engine sound and set velocity
	if (keyIsDown(65)) {
		if(!carDrive.isPlaying()){
			carDrive.play()
		}
		//world.camera.nudgePosition(-moveSpeed, 0, 0);
		// The element of 'velocity' of the car is increaded by the accelration (in the opposite (left) direction).
		velocity.add(-accel, 0);
	}
	// if W is pressed
	if (keyIsDown(68)) {
		if(!carDrive.isPlaying()){
			carDrive.play()
		}
		//world.camera.nudgePosition(moveSpeed, 0, 0);
		// The element of 'velocity' of the car is increaded by the accelration.
		velocity.add(accel, 0);
	}
	// if D is pressed
	if (keyIsDown(87)) {
		if(!carDrive.isPlaying()){
			carDrive.play()
		}
		//world.camera.nudgePosition(0, 0, -moveSpeed);
		// The car is accelerated in the forward direction by increasing the velocity.
		velocity.add(0, -accel);
	}
	// if A is pressed
	if (keyIsDown(83)) {
		if(!carDrive.isPlaying()){
			carDrive.play()
		}
		//world.camera.nudgePosition(0, 0, moveSpeed);
		// The is decelerated backwards by decreasing the velocity.
		velocity.add(0, accel);
	}

	// apply friction
	// Making a copy of velocity, friction, in order to add it in the opposite direction of velocity
	friction = velocity.copy();
	friction.mult(-1);
	friction.normalize();
	friction.mult(frictionMag);
	velocity.add(friction);

	// add velocity to avatar
	position.add(velocity);

	// speed limits
	if (velocity.mag() > 1) {
	velocity.setMag(1);
	}
	if (velocity.mag() < 0.005) {
	velocity.setMag(0);
	}
	moveSpeed = map(velocity.y,-1,1,0.6,-0.6)

	// car movement
	// Ensuring the rotation of the car is perceived as the correct value
	if(truck.rotationY<0){
		rotationY = truck.rotationY%360 + 360;
	}
	else{
		rotationY = truck.rotationY%360;
	}
	// If the car is in the first quadrant, we increase the speed in such a manner
	if(rotationY<=90 && rotationY>=0){
		// We map the vector in the 'right' direction with the angle of rotation.
		moveX = map(rotationY, 0, 90, moveSpeed, 0)
		// We move the truck in the forward direction with the vector resulting from the subtraction of the totalspeed of the car, with the 'right' vector
		truck.nudge(0,0,moveX-moveSpeed);
		// Ensuring the fuelbox and the coins follow the car.
		fuelbox.nudge(0,0,moveX-moveSpeed)
		cointext.nudge(0,0,moveX-moveSpeed)
		// Then we move the car in the 'right' direction with the remaining amount.
		truck.nudge(moveX,0,0);
		// Ensuring the fuelbox and the coins follow the car.
		fuelbox.nudge(moveX,0,0);
		cointext.nudge(moveX,0,0);
		// world.camera.nudgePosition((moveX*2), 0, (moveX-moveSpeed)*2);
    	world.setUserPosition(truck.x, 7, truck.z+10);
	}
	else if((rotationY<=180 && rotationY>90)){
		moveX = map(rotationY, 90, 180, 0, moveSpeed)
		truck.nudge(0,0,moveX-moveSpeed);
		fuelbox.nudge(0,0,moveX-moveSpeed);
		cointext.nudge(0,0,moveX-moveSpeed);
		truck.nudge(-moveX,0,0);
		fuelbox.nudge(-moveX,0,0);
		cointext.nudge(-moveX,0,0);
		// world.camera.nudgePosition((-moveX*2), 0, (moveX-moveSpeed)*2);
    	world.setUserPosition(truck.x, 7, truck.z+10);
	}
	else if((rotationY<=270 && rotationY>180)){
		moveX = map(rotationY, 270, 180, 0, moveSpeed)
		truck.nudge(0,0,-(moveX-moveSpeed));
		fuelbox.nudge(0,0,-(moveX-moveSpeed));
		cointext.nudge(0,0,-(moveX-moveSpeed));
		truck.nudge(-moveX,0,0);
		fuelbox.nudge(-moveX,0,0);
		cointext.nudge(-moveX,0,0);
		// world.camera.nudgePosition((-moveX*2), 0, -(moveX-moveSpeed)*2);
    	world.setUserPosition(truck.x, 7, truck.z+10);
	}
	else if((rotationY<=360 && rotationY>270)){
		moveX = map(rotationY, 270, 360, 0, moveSpeed)
		truck.nudge(0,0,-(moveX-moveSpeed));
		fuelbox.nudge(0,0,-(moveX-moveSpeed));
		cointext.nudge(0,0,-(moveX-moveSpeed));
		truck.nudge(moveX,0,0);
		fuelbox.nudge(moveX,0,0);
		cointext.nudge(moveX,0,0);
		// world.camera.nudgePosition((moveX*2), 0, -(moveX-moveSpeed)*2);
    	world.setUserPosition(truck.x, 7, truck.z+10);
	}
	// Rotating the car on the A and S keys.
	if (keyIsDown(68)){
		truck.spinY(-2);
		fuelbox.spinY(-2);
		cointext.spinY(-2);
	}
	if (keyIsDown(65)){
		truck.spinY(2);
		fuelbox.spinY(2);
		cointext.spinY(2);
	}
}

// add sounds
function sounds(){
	if (dist(truck.x, truck.z, rblock.x, rblock.z) <= 3){
		console.log("touchhh")
	}
}

// place the truck
function placecar() {
	carX = 0;
	carZ = 0;
	moveSpeed = 0.3;

	// Truck Model
	truck = new GLTF({
		asset: 'truck',
		x: carX,
		y: 0.5,
		z:carZ,
		scaleX:0.005,
		scaleY:0.005,
		scaleZ:0.005,
		rotationY:90
	});
	// Fuel bar
	fuelbox = new Box({
		x:carX, y:2.6, z:carZ,
		width:0.9, height: 0.1, depth: 0.05,
		red:255, green:0, blue:0,
	});

	// coin text
	cointext = new Text({
		text: collections,
		red: 255, green: 255, blue:102,
		side: 'double',
		x: carX, y: 2.9, z: carZ,
		scaleX: 8, scaleY: 8, scaleZ: 8
	});

	world.add(cointext);

	world.add(fuelbox);
	// Making the truck collidable with other objects
	truck.tag.setAttribute('static-Body', "shape: box; mass: 100");
  	truck.tag.setAttribute('kinematic-Body', true);

	world.add(truck);
}

//  place street lights
function placelamps() {
	// Street Light Model
	cz = 20
	let light;
	// place street lights on the left and the right
	for (let i = 0; i < 8; i++){
		light = new GLTF({
			asset: 'light',
			x: 6,
			y: -0.4,
			z: cz,
			scaleX:0.003,
			scaleY:0.003,
			scaleZ:0.003
		})
		world.add(light)
		lights.push(light)
		light = new GLTF({
			asset: 'light',
			x: -6,
			y: -0.4,
			z: cz,
			scaleX:0.003,
			scaleY:0.003,
			scaleZ:0.003,
			rotationY:-180
		})
		world.add(light)
		lights.push(light)
		cz -= 10
	}
}

// place bricks in the playground
function placebrick () {
	// add bricks that are of two layers
	for (let j = 0; j < 10; j++ ){
		total = random(1, 7)
		cx = random(-30, 30);
		cy = 0;
		cz = random(-50, -85);
		for (let i = 0; i < total; i++) {
			// first layer of boxes
			boxes.push(new Cube(cx, cy, cz));
			// second layer
			if (total >= 2 && i < total-1){
				boxes.push(new Cube(cx+0.5, cy+0.5, cz))
			}
			cx += 1;
		}
	}

	cy = 0.25;
	cz = -80;
	// add the taller brick towers
	for (let i = 0; i < 7; i++) {
		cx = 15;
		for (let i = 0; i < 5; i++) {
			// first layer of boxes
			boxes.push(new Cube(cx, cy, cz));
			cx+=1
		}
		cy += 1
	}

	cy = 0.25;
	cx = -15;
	// add the second taller brick tower in different direction
	for (let i = 0; i < 6; i++) {
		cz = -70;
		for (let i = 0; i < 6; i++) {
			// first layer of boxes
			boxes.push(new Cube(cx, cy, cz));
			cz+=1.3
		}
		cy += 1 + 0.0001*i
	}
}

// position bowling pins and bowling ball
function placebowling () {
	// add bowling pins
	let cx = -22
	let cz = -80
	pins.push(new BowlingPins(cx,cz));
	pins.push(new BowlingPins(cx-0.5,cz-0.5));
	pins.push(new BowlingPins(cx-0.5,cz+0.5));
	pins.push(new BowlingPins(cx-1.0,cz-1.0));
	pins.push(new BowlingPins(cx-1.0,cz+0.0));
	pins.push(new BowlingPins(cx-1.0,cz+1.0));
	pins.push(new BowlingPins(cx-1.5,cz-1.5));
	pins.push(new BowlingPins(cx-1.5,cz-0.5));
	pins.push(new BowlingPins(cx-1.5,cz+0.5));
	pins.push(new BowlingPins(cx-1.5,cz+1.5));

	// Bowling ball Model
	ball = new GLTF({
		asset: 'ball',
		x: cx+9,
		y: 1,
		z: cz,
		scaleX:0.8,
		scaleY:0.8,
		scaleZ:0.8
		// rotationY:30
	});

 	ball.tag.setAttribute('body', "type: dynamic; mass: 50; shape: none;");
  	ball.tag.setAttribute('shape__main', "shape: sphere; radius:1.4;");

	world.add(ball);
}

// place fuel pump and button on it
function placefuel () {
	// Pump Model
	let pump = new GLTF({
		asset: 'pump',
		x: 6,
		y: 0.5,
		z:-25,
		scaleX:0.04,
		scaleY:0.04,
		scaleZ:0.04,
		rotationY:-90
	});
  	pump.tag.setAttribute('static-Body',"shape: box; linearDamping:0.9; mass: 5000000");
	// fuel park boundaries
	let parking = new Plane ({
		x:3.7, y:0.3, z:-24.9,
		width:2.4, height:2.5,
		red:255, green:153, blue:153,
		rotationX:-90
	});
	// Fuel button
	let fuelbutton = new Cylinder ({
		x: 5.8, y:4, z:-24.2,
		height: 0.03,
		radius: 0.2,
		red: 0, green:255, blue:0,
		rotationX: 90,
		// hover on the button to change its color to indicate that it can be clicked
		enterFunction: function(theBox) {
			// make the button change color
			theBox.setColor(0, 153, 51);
		},
		leaveFunction: function(theBox) {
			// make the button original color
			theBox.setColor(0, 255, 0);
		},
		// click on button to fill fuel tank
		clickFunction:  function(entity) {
			console.log(truck.x, truck.z)
			if (truck.x >= 3 &&
				truck.x <= 4.8 &&
				truck.z <= -23 &&
				truck.z >= -25 &&
				collections >= 0) {
				fuelbox.setWidth(0.9);
				collections -=2;
				click.play()
			}

		}
	})

	// fuel text
	let fueltext = new Text({
		text: 'FILL',
		red: 0, green: 51, blue: 0,
		side: 'double',
		x: 5.8, y: 4, z: -24.16,
		scaleX: 4, scaleY: 4, scaleZ: 4
	});

	// fuel empty/ game over text
	overtext = new Text({
		text: 'OUT OF FUEL',
		red: 0, green: 0, blue: 0,
		side: 'double',
		x: 5.8, y: -10, z: -24.16,
		show: false,
		hide: true,
		scaleX: 26, scaleY: 26, scaleZ: 26
	});

	world.add(overtext)
	world.add(fueltext);
	world.add(fuelbutton);
	world.add(parking);
	world.add(pump);

}

// coin class
class Coin {
	// coin Model
	constructor(){
		this.coin = new GLTF({
			asset: 'coin',
			x: random(-30, 30),y: 1,z:random(-95, 0),
			scaleX:0.08,scaleY:0.08,scaleZ:0.08
		});
		// coins.push(this.coin)
		world.add(this.coin);
		this.time = 0;
	}
	// destroy coins after some time or when the user picks them up
	destroy(){
		this.time += 1
		// if they havent been picked up, remove after a certain time
		if (this.time == 700){
			world.remove(this.coin)
			return "gone"
		}
		// if they are picked up, remove, play music and increase coin count
		else if (dist(truck.x, truck.z, this.coin.x, this.coin.z) <= 2){
			collections += 1
			coinCol.play()
			world.remove(this.coin)
			return "gone"
		}
		else {
			return "ok"
		}
	}
}

// Brick class
class Cube {
	constructor(x,y,z) {
		// new brick
		this.box = new Box({

			x:x, y:y, z:z,
			width:1, height: 1, depth: 1,
			// iron asset
			asset: 'iron',
			red:255, green:217, blue:179,
			// change color upon clicking and slide to brick
			clickFunction: function(theBox) {
				// console.log("TOUCHED bOX")
				theBox.setColor( random(255), random(255), random(255) );
				// world.slideToObject( theBox, 1000 );
				// click.play();
			}
		});
		this.px = x;
		this.py = y;
		this.pz = z;
		// make bricks dynamic
		this.box.tag.setAttribute('dynamic-Body', "linearDamping: 0.5; mass: 10");
		world.add(this.box);
	}

}

// Bowling Pins class
class BowlingPins {
	constructor(x,z) {
		// bowling pins Model
		bowling = new GLTF({
			asset: 'bowling',
			x: x,
			y: 1,
			z:z,
			scaleX:0.0015,
			scaleY:0.0015,
			scaleZ:0.0015
			// rotationY:30
		});
		// make bowling pins dynamic
   		bowling.tag.setAttribute('dynamic-Body', "shape: cylinder; radiusTop: 0.05; radiusBottom: 0.05; cylinderAxis: y; mass: 25");
		world.add(bowling);
	}
}

// tree class
class Tree {
	constructor(x, z, h) {

		// tree stem
		this.stem = new Cylinder({
			x: x, y:h/2, z:z,
			height: h,
			radius: 0.5,
			red: 150, green:98, blue:72
		});

		// tree leaves
		this.leaves = new Cone({
			x: x, y:h, z:z,
			height:random(2.3, 4),
			radiusBottom: 1.4, radiusTop: 0.01,
			red: random(20, 40), green:random(120, 140), blue:0
		});
    	this.stem.tag.object3D.userData.solid = true;

		// add stem and leaves to container
		this.stem.tag.setAttribute('static-Body', true);
		this.leaves.tag.setAttribute('static-Body', true);
		world.add(this.stem);
		world.add(this.leaves);
	}
}

// class to describe a rain particle's behavior
class Particle {

	constructor(x,y,z) {

		// construct a new Box that lives at this position
		this.myBox = new Cone({
			x:x, y:y, z:z,
			red: 179, green: 224, blue: 255,
			height: 0.3,
			radiusBottom: 0.03, radiusTop: 0.001
		});

		// add the box to the world
		world.add(this.myBox);

		// keep track of an offset in Perlin noise space
		this.xOffset = random(1000);
		this.zOffset = random(2000, 3000);
	}

	// function to move our box
	move() {
		// compute how the particle should move
		// the particle should always move up by a small amount
		var yMovement = -0.15;

		// the particle should randomly move in the x & z directions
		var xMovement = map( noise(this.xOffset), 0, 1, -0.01, 0.01);
		var zMovement = map( noise(this.zOffset), 0, 1, -0.01, 0.01);

		// update our poistions in perlin noise space
		this.xOffset += 0.01;
		this.yOffset += 0.01;

		// set the position of our box (using the 'nudge' method)
		this.myBox.nudge(xMovement, yMovement, zMovement);

		// make the boxes shrink a little bit
		var boxScale = this.myBox.getScale();
		this.myBox.setScale( boxScale.x, boxScale.y, boxScale.z);

		// if we get too small we need to indicate that this box is now no longer viable
		if (boxScale.x <= 0) {
			// remove the box from the world
			world.remove(this.myBox);

			return "gone";
		}
		else {
			return "ok";
		}
	}
}

// play sound
function keyPressed(){
	// play rain sound in background
	if(!rain.isPlaying()){
		rain.loop();
	}
	// play horn when H is pressed
	if (keyCode == 72){
		honk.play()
	}
}
