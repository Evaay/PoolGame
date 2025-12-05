import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Ammo from "ammojs-typed";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as TWEEN from "@tweenjs/tween.js";
import GUI from "lil-gui";

let camera, controls, scene, renderer;
let textureLoader;
const clock = new THREE.Clock();
let holes;

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });

// Mundo físico con Ammo
let physicsWorld;
const gravityConstant = 9.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
const margin = 0.05; //margen colisiones

// Objetos rígidos
const rigidBodies = [];

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
//Variables temporales para actualizar transformación en el bucle
let transformAux1;
let tempBtVec3_1;

//texturas
const blanca = new THREE.TextureLoader().load("src/textures/blanca.png");
const bola1 = new THREE.TextureLoader().load("src/textures/bola1lisa.png");
const bola2 = new THREE.TextureLoader().load("src/textures/bola2lisa.png");
const bola3 = new THREE.TextureLoader().load("src/textures/bola3lisa.png");
const bola4 = new THREE.TextureLoader().load("src/textures/bola4lisa.png");
const bola5 = new THREE.TextureLoader().load("src/textures/bola5lisa.png");
const bola6 = new THREE.TextureLoader().load("src/textures/bola6lisa.png");
const bola7 = new THREE.TextureLoader().load("src/textures/bola7lisa.png");
const negra = new THREE.TextureLoader().load("src/textures/bolanegra.png");
const bola9 = new THREE.TextureLoader().load("src/textures/bola9raya.png");
const bola10 = new THREE.TextureLoader().load("src/textures/bola10raya.png");
const bola11 = new THREE.TextureLoader().load("src/textures/bola11raya.png");
const bola12 = new THREE.TextureLoader().load("src/textures/bola12raya.png");
const bola13 = new THREE.TextureLoader().load("src/textures/bola13raya.png");
const bola14 = new THREE.TextureLoader().load("src/textures/bola14raya.png");
const bola15 = new THREE.TextureLoader().load("src/textures/bola15raya.png");

//bola blanca
let whiteBallStartPos = new THREE.Vector3(-5, 0.5, 0);
const bola = { force : 3 }

//palo
let stick;
let stickDistance = 6;
let stickAngle = 0;
let whiteBall;
const stickLength = 10;

//gui
let throwBall = false;
const gui = new GUI();
let pushStick = {
  pushStick: pushStick
}

//bolas desaparecidas
let scoreBoard;

let sound;
let audioloaded = false;

//Inicialización ammo
Ammo(Ammo).then(start);

function start() {
  //Elementos gráficos
  initGraphics();
  //Elementos del mundo físico
  initPhysics();
  //Objetos
  createObjects();
  //Eventos
  initInput();

  animationLoop();
}

function initGraphics() {
  //Cámara, escena, renderer y control de cámara
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.2,
    2000
  );
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);
  camera.position.set(-15, 5, 0);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  //Audio
  const listener = new THREE.AudioListener();
  camera.add(listener);
  sound = new THREE.Audio(listener);
  // Carga de sonido
  const audioLoader = new THREE.AudioLoader();
  //Fuente audio https://pixabay.com/users/freesound_community-46691455/
  audioLoader.load("src/sticksound.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.5);
    audioloaded = true;
    console.log("Sonido cargado");
  });

  scoreBoard = document.createElement("div");
  scoreBoard.style.position = "absolute";
  scoreBoard.style.top = "10px";
  scoreBoard.style.left = "10px";
  scoreBoard.style.display = "flex";
  scoreBoard.style.flexDirection = "column";
  scoreBoard.style.gap = "6px";
  document.body.appendChild(scoreBoard);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.update();

  controls.maxDistance = 30;

  textureLoader = new THREE.TextureLoader();

  //Luces
  const ambientLight = new THREE.AmbientLight(0x707070);
  scene.add(ambientLight);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(-10, 18, 5);
  light.castShadow = true;
  const d = 14;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;

  light.shadow.camera.near = 2;
  light.shadow.camera.far = 50;

  light.shadow.mapSize.x = 1024;
  light.shadow.mapSize.y = 1024;

  scene.add(light);
  //Redimensión de la ventana
  window.addEventListener("resize", onWindowResize);

  gui.add(pushStick, 'pushStick').name('Ver desde arriba');
  gui.add(bola, "force", 0, 10, 0.5).name("Fuerza de tiro");

}

function pushStick() {
  camera.position.set(-1,30,0);
  camera.lookAt(0,0,0);
  controls.target.set(0,0,0);
  controls.update();
}


function initPhysics() {
  // Configuración Ammo
  // Colisiones
  collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  // Gestor de colisiones convexas y cóncavas
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  // Colisión fase amplia
  broadphase = new Ammo.btDbvtBroadphase();
  // Resuelve resricciones de reglas físicas como fuerzas, gravedad, etc.
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  // Crea en mundo físico
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );
  // Establece gravedad
  physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));

  transformAux1 = new Ammo.btTransform();
  tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
}

//Objeto con posición y orientación especificada con cuaternión
function createObject(mass, halfExtents, pos, quat, material) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(
      halfExtents.x * 2,
      halfExtents.y * 2,
      halfExtents.z * 2
    ),
    material
  );
  object.position.copy(pos);
  object.quaternion.copy(quat);
}

function createObjects() {
  // Suelo
  pos.set(0, -0.5, 0);
  quat.set(0, 0, 0, 1);
  const suelo = createBoxWithPhysics(
    40,
    1,
    40,
    0,
    pos,
    quat,
    new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 })
  );
  //suelo.receiveShadow = true;
  /*textureLoader.load(
    "https://cdn.glitch.global/8b114fdc-500a-4e05-b3c5-a4afa5246b07/grid.png?v=1669716810074",
    function (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(40, 40);
      suelo.material.map = texture;
      suelo.material.needsUpdate = true;
    }
  );*/

  // Muro
  //createWall();
  createTable();
  loadTable();
  createBalls();
  createStick();
  const backgroundTexture = new THREE.TextureLoader().load(
    "https://cdn.polyhaven.com/asset_img/primary/venice_sunset.png?height=760&quality=95"
  );
  background(backgroundTexture);
}

function background(texture = undefined) {
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
  //Textura
  if (texture != undefined) {
    material.map = texture;
   }
  const backgroundImage = new THREE.Mesh(
    new THREE.SphereGeometry(200, 20, 20),
    material
  );
  scene.add(backgroundImage);

  const loader = new GLTFLoader();
  loader.load(
    "https://raw.githubusercontent.com/Evaay/models3d/main/kleeblatt_quest_home_environment.glb",
    (gltf) => {
      const model = gltf.scene;
      //model.scale.set(0.2, 0.3, 0.2);
      model.scale.set(12,12,12);
      //model.position.set(0, -8, 0);
      model.position.set(0, -8.2, 0);
      scene.add(model);
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );
}

let initDistance = 6;
let returnDistance = 8;
let crashDistance = 5;

function tweens() {
  const tween3 = new TWEEN.Tween({ d: crashDistance })
  .to({d: initDistance}, 500)
  .easing(TWEEN.Easing.Exponential.Out)
  .onUpdate((coords) => {
    stickDistance = coords.d;
    positionStick();
  });

  const tween2 = new TWEEN.Tween({ d: returnDistance })
  .to({d: crashDistance }, 500)
  .easing(TWEEN.Easing.Exponential.Out)
  .start()
  .onUpdate((coords) => {
    stickDistance = coords.d;
    positionStick();
  })
  .delay(100)
  .onComplete(() => {
    hitWhiteBall();
    if (audioloaded) {
      sound.play();
    }
  })
  .chain(tween3);
}

function hitWhiteBall() {
  const body = whiteBall.userData.physicsBody;

  const x = -Math.cos(stickAngle) * bola.force;
  const z = -Math.sin(stickAngle) * bola.force;

  body.activate(true);
  body.setLinearVelocity(new Ammo.btVector3(x, 0, z));
}

function createMaterial(color, texture = undefined) {
  color = color || createRandomColor();
  let material = new THREE.MeshPhongMaterial({ color: color });
  //Textura
  if (texture != undefined) {
    texture.center = new THREE.Vector2(0.5, 0.5);
    material.map = texture;
  }
  return material;
}

function createStick() {
  const radius = 0.1;
  const height = 10;
  stick = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.5, radius, height, 16),
    createMaterial(0x654321)
  );
  stick.castShadow = true;
  stick.receiveShadow = true;

  const initialPos = new THREE.Vector3(-13, radius + 0.5, 0);
  const stickShape = new Ammo.btCylinderShape(new Ammo.btVector3(radius, height * 0.5, radius));
  stickShape.setMargin(margin);
  pos.copy(stick.quaternion);
  quat.copy(stick.quaternion);

  const stickBody = createRigidBody(stick, stickShape, 0, initialPos, quat);
  stickBody.setRestitution(0.95); 
  stickBody.setFriction(0.05);
  stickBody.setCollisionFlags(0);
}

function positionStick() {
  const whiteBallPos = whiteBall.position;

  const x = whiteBallPos.x + stickDistance * Math.cos(stickAngle);
  const z = whiteBallPos.z + stickDistance * Math.sin(stickAngle);
  const y = whiteBallPos.y;

  stick.position.set(x, y, z);
  stick.lookAt(whiteBallPos);
  stick.rotateX(Math.PI / 2);
  stick.rotateY(Math.PI / 5);
}

function createBalls() {
  let ballMass = 0.175;
  const ballRadius = 0.285;
  const ylevelball = -1;
  const ballPositions = [
    [-5, -0.5, 0, 0xffffff, blanca],
    [4, ylevelball, 0, 0xff0000, bola1],

    [4.52, ylevelball, 0.28, 0xff0000, bola2],
    [4.52, ylevelball, -0.28, 0xffff00, bola9],

    [5.05, ylevelball, 0, 0x0000ff, negra],
    [5.05, ylevelball, -0.57, 0xff0000, bola3],
    [5.05, ylevelball, 0.57, 0xffff00, bola10],

    [5.65, ylevelball, -0.28, 0xff0000, bola4],
    [5.65, ylevelball, 0.28, 0xffff00, bola11],
    [5.65, ylevelball, 0.85, 0xff0000, bola5],
    [5.65, ylevelball, -0.85, 0xffff00, bola12],

    [6.2, ylevelball, 0, 0xff0000, bola7],
    [6.2, ylevelball, 0.57, 0xffff00, bola13],
    [6.2, ylevelball, -0.57, 0xffff00, bola14],
    [6.2, ylevelball, -1.15, 0xff0000, bola6],
    [6.2, ylevelball, 1.15, 0xffff00, bola15],
  ];
  ballPositions.forEach((p) => {
    const [x, y, z, color, texture] = p;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballRadius, 14, 10),
      createMaterial(0xffffff, texture)
    );
    if (texture === blanca) {
      //ballMass =0.165;
      whiteBall = ball;
    }
    //pos.set(x, y + ballRadius + 1 / 2, z);
    ball.castShadow = true;
    ball.receiveShadow = true;
    ball.rotation.y = Math.PI / 2;

    const ballShape = new Ammo.btSphereShape(ballRadius);
    ballShape.setMargin(margin);
    pos.set(x, y + ballRadius + 1 / 2, z);
    quat.copy(ball.quaternion);
    const ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);
    ballBody.setRestitution(0.5);
    ballBody.setFriction(0.3);
    ballBody.setRollingFriction(0.05);
    ballBody.setDamping(0.05, 0.05);
    ballBody.setCollisionFlags(0);
  });
}

function loadTable() {
  const loader = new GLTFLoader();
  loader.load(
    "https://raw.githubusercontent.com/Evaay/models3d/main/pool_table_002.glb",
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.1, 0.1, 0.1);
      model.position.set(0, -4.05, 0);
      scene.add(model);
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );
}

function createTable() {
  const tableMass = 0;
  const tableHeight = 1;
  const ylevel = -0.05;
  const boxes = [
    // [depth, height, length, x, y, z]
    [0.5, tableHeight, 12, 10.5, ylevel, 0, 0x5a3728],
    [0.5, tableHeight, 12, -10.5, ylevel, 0, 0x5a3728],
    [20, tableHeight, 0.5, 0, ylevel, 6, 0x5a3728],
    [20, tableHeight, 0.5, 0, ylevel, -6, 0x5a3728],
    //inner
    [8.4, tableHeight, 0.9, -4.9, ylevel, 5.5, 0x33c143],
    [8.4, tableHeight, 0.9, 4.9, ylevel, 5.5, 0x33c143],
    [8.4, tableHeight, 0.9, -4.9, ylevel, -5.5, 0x33c143],
    [8.4, tableHeight, 0.9, 4.9, ylevel, -5.5, 0x33c143],
    [0.9, tableHeight, 9.4, 10.2, ylevel, 0, 0x33c143],
    [0.9, tableHeight, 9.4, -10.1, ylevel, 0, 0x33c143],
    //base
    [21, 0.05, 12, 0, 0, 0, 0x33c143],
  ];

  boxes.forEach((params) => {
    const [sx, sy, sz, x, y, z, color] = params;
    pos.set(x, y, z);
    quat.set(0, 0, 0, 1);
    const box = createBoxWithPhysics(
      sx,
      sy,
      sz,
      tableMass,
      pos,
      quat,
      createMaterial(color)
    );
    box.castShadow = true;
    box.receiveShadow = true;
  });

  holes = [
    [0, 0, 5.7],
    [0, 0, -5.7],
    [10, 0, 5.5],
    [-10, 0, 5.5],
    [10, 0, -5.5],
    [-10, 0, -5.5],
  ];
  holes.forEach((params) => {
    const [x, y, z] = params;
    pos.set(x, y, z);
    createHoleWithPhysics(0.6, pos, quat);
  });
}

function createHoleWithPhysics(radius, pos, quat) {
  const object2 = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.051, 16),
    new THREE.MeshPhongMaterial({ color: 0x000000 })
  );
  object2.userData.isHole = true;
  //Estructura geométrica de colisión
  //Crea caja orientada en el espacio, especificando dimensiones
  const shape2 = new Ammo.btCylinderShapeZ(
    new Ammo.btVector3(radius, 0.05, radius)
  );

  //Margen para colisione
  shape2.setMargin(margin);

  const body = createRigidBody(object2, shape2, 1, pos, quat);
  body.setCollisionFlags(2);
  object2.userData.physicsBody = body;
  object2.userData.collided = false;

  scene.add(object2);
}

function addPocketedBall(ballMesh) {
  const imgSrc = ballMesh.material.map.image.currentSrc;

  const ballDiv = document.createElement("div");
  ballDiv.style.width = "32px";
  ballDiv.style.height = "32px";
  ballDiv.style.borderRadius = "50%";
  ballDiv.style.border = "2px solid white";
  ballDiv.style.backgroundImage = `url(${imgSrc})`;
  ballDiv.style.backgroundSize = "cover";
  ballDiv.style.backgroundPosition = "-25px";

  scoreBoard.appendChild(ballDiv);
}

function removeRigidBody(object) {
  const body = object.userData.physicsBody;
  scene.remove(object);
  physicsWorld.removeRigidBody(body);
  const index = rigidBodies.indexOf(object);
  if (index !== -1) {
    rigidBodies.splice(index, 1);
  }
  Ammo.destroy(body.getMotionState());
  Ammo.destroy(body);
}

function createBoxWithPhysics(sx, sy, sz, mass, pos, quat, material) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1),
    material
  );
  //Estructura geométrica de colisión
  //Crea caja orientada en el espacio, especificando dimensiones
  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  //Margen para colisione
  shape.setMargin(margin);

  const body = createRigidBody(object, shape, mass, pos, quat);
  body.setRestitution(0.98);
  body.setFriction(0.2);

  return object;
}

//Creación de cuerpo rígido, con masa, sujeto a fuerzas, colisiones...
function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
  //Posición
  if (pos) {
    object.position.copy(pos);
  } else {
    pos = object.position;
  }
  //Cuaternión, es decir orientación
  if (quat) {
    object.quaternion.copy(quat);
  } else {
    quat = object.quaternion;
  }
  //Matriz de transformación
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);
  //Inercia inicial y parámetros de rozamiento, velocidad
  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);
  //Crea el cuerpo
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    physicsShape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);

  body.setFriction(0.5);

  if (vel) {
    body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
  }

  if (angVel) {
    body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
  }

  //Enlaza primitiva gráfica con física
  object.userData.physicsBody = body;
  object.userData.collided = false;

  scene.add(object);
  //Si tiene masa
  if (mass > 0) {
    rigidBodies.push(object);
    // Disable deactivation
    //body.setActivationState(4);
  }
  //Añadido al universo físico
  physicsWorld.addRigidBody(body);

  return body;
}

function createRandomColor() {
  return Math.floor(Math.random() * (1 << 24));
}

//Evento de ratón
function initInput() {
  
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "e") {
      tweens();
    }
  });


  /*window.addEventListener("pointerdown", function (event) {
    //Coordenadas del puntero
    mouseCoords.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouseCoords, camera);

    // Crea bola como cuerpo rígido y la lanza según coordenadas de ratón
    const ballMass = 0.2;
    const ballRadius = 0.285;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballRadius, 14, 10),
      ballMaterial
    );
    ball.castShadow = true;
    ball.receiveShadow = true;
    //Ammo
    //Estructura geométrica de colisión esférica
    const ballShape = new Ammo.btSphereShape(ballRadius);
    ballShape.setMargin(margin);
    pos.copy(raycaster.ray.direction);
    pos.add(raycaster.ray.origin);
    quat.set(0, 0, 0, 1);
    const ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);
    ballBody.setRestitution(0.95);
    ballBody.setFriction(0.05);
    ballBody.setRollingFriction(0.02);
    ballBody.setDamping(0.01, 0.01);

    pos.copy(raycaster.ray.direction);
    pos.multiplyScalar(8);
    ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));
  });*/

  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r") {
      resetGame();
    }
  });

  window.addEventListener("pointermove", (event) => {
    mouseCoords.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouseCoords, camera);

    if (!whiteBall) return;

    const planeY = whiteBall.position.y;
    const origin = raycaster.ray.origin;
    const dir = raycaster.ray.direction;

    const t = (planeY - origin.y) / dir.y;
    if (t < 0) return;

    const intersect = new THREE.Vector3().copy(origin).add(dir.clone().multiplyScalar(t));

    const dx = intersect.x - whiteBall.position.x;
    const dz = intersect.z - whiteBall.position.z;
    stickAngle = Math.atan2(dz, dx);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animationLoop() {
  requestAnimationFrame(animationLoop);

  const deltaTime = clock.getDelta();
  updatePhysics(deltaTime);
  
  positionStick();
  TWEEN.update();

  renderer.render(scene, camera);
}

function updatePhysics(deltaTime) {
  // Avanza la simulación en función del tiempo
  physicsWorld.stepSimulation(deltaTime, 10);

  // Actualiza cuerpos rígidos
  for (let i = 0; i < rigidBodies.length; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    //Obtiene posición y rotación
    const ms = objPhys.getMotionState();
    //Actualiza la correspondiente primitiva gráfica asociada
    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

      objThree.userData.collided = false;
    }

    if (objThree.geometry.type === "SphereGeometry") {
      for (const h of holes) {
        const dx = objThree.position.x - h[0];
        const dz = objThree.position.z - h[2];
        const dy = objThree.position.y - 0;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const holeRadius = Math.abs(h[0]) > 8 || Math.abs(h[2]) > 5 ? 0.9 : 0;
        if (distance < holeRadius && dy < 1) {
          if (objThree === whiteBall) {
            const body = whiteBall.userData.physicsBody;

            body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
            body.setAngularFactor(new Ammo.btVector3(1, 1, 1));

            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(
              whiteBallStartPos.x,
              whiteBallStartPos.y,
              whiteBallStartPos.z
            ));
            transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
            body.setWorldTransform(transform);
            body.activate(true);

            whiteBall.position.copy(whiteBallStartPos);
            whiteBall.quaternion.set(0, 0, 0, 1);

            stickDistance = initDistance;
            positionStick();
          } else {
            removeRigidBody(objThree);
            addPocketedBall(objThree);
            i--;
            break;
          }
        }
      }
    }
  }
}

function resetGame() {
  rigidBodies.slice().forEach(obj => {
    if (!obj.userData.isHole) {
      removeRigidBody(obj);
    }
  });
  rigidBodies.length = 0;
  createBalls();
  positionStick();
  scoreBoard.innerHTML = "";
}
