import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';


//texturas
const bola1 = new THREE.TextureLoader().load("src/textures/bola1lisa.png");


// Crear escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const axesHelper = new THREE.AxesHelper(50); 
scene.add(axesHelper);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
)
camera.position.set(0,3,0)
camera.lookAt(0,0,0)


const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
});
// Luz ambiental
const ambient_light = new THREE.AmbientLight('#FFF', 0.5)
scene.add(ambient_light)
// Punto de luz
const light = new THREE.PointLight('#FFF', 1, 100)
light.position.set(15, 15, 15)
scene.add(light)
// Permite mover la camara al rededor de un objeto
const controls = new OrbitControls(camera, renderer.domElement);

const loader = new GLTFLoader()
loader.load('https://raw.githubusercontent.com/Evaay/models3d/main/pool_table_002.glb', (gltf) => {
  const model = gltf.scene
  model.scale.set(0.1, 0.01, 0.01)
  model.position.set(0, -0.5, 0)
  model.rotation.y = Math.PI / 2;
  scene.add(model)

  // Obtener clips de animacion
  const mixer = new THREE.AnimationMixer(model);
  const clips = gltf.animations;
  clips.forEach((clip) => {
    mixer.clipAction(clip).play();
  });
  const directionVector = new THREE.Vector3();
  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
if (mixer) {
      mixer.update(clock.getDelta());
    }
  }
  /*
  const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
    // Rotar modelo
    //model.rotation.y += 0.01
  }*/
  animate();
}, undefined, (error) => {
  console.error(error)
})
