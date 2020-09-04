import { PlaneGeometry, Mesh, WebGLRenderer, PerspectiveCamera, Scene, } from 'three';
import { OrbitControls } from './three/examples/OrbitControls';
import { Portal } from './three/Portal';

// scene size
const WIDTH = 1024;
const HEIGHT = 512;

// camera
const VIEW_ANGLE = 45;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 1;
const FAR = 500;

const camera = new PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
const scene = new Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const cameraControls = new OrbitControls(camera, renderer.domElement);
cameraControls.target.set(0, 40, 0);
cameraControls.maxDistance = 400;
cameraControls.minDistance = 10;
cameraControls.update();

var sphereGroup, smallSphere;

init();
animate();

function init() {

  var container = document.getElementById('container');

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(WIDTH, HEIGHT);
  container.appendChild(renderer.domElement);

  // scene
  scene = new THREE.Scene();

  // camera
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  camera.position.set(0, 75, 160);

  cameraControls = new OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0, 40, 0);
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 10;
  cameraControls.update();

  //

  var planeGeo = new THREE.PlaneBufferGeometry(100.1, 100.1);

  // reflectors/mirrors

  var geometry = new THREE.CircleBufferGeometry(40, 64);
  var groundMirror = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: WIDTH * window.devicePixelRatio,
    textureHeight: HEIGHT * window.devicePixelRatio,
    color: 0x777777
  });
  groundMirror.position.y = 0.5;
  groundMirror.rotateX(- Math.PI / 2);
  scene.add(groundMirror);

  var geometry = new THREE.PlaneBufferGeometry(100, 100);
  var verticalMirror = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: WIDTH * window.devicePixelRatio,
    textureHeight: HEIGHT * window.devicePixelRatio,
    color: 0x889999
  });
  verticalMirror.position.y = 50;
  verticalMirror.position.z = - 50;
  scene.add(verticalMirror);


  sphereGroup = new THREE.Object3D();
  scene.add(sphereGroup);

  var geometry = new THREE.CylinderBufferGeometry(0.1, 15 * Math.cos(Math.PI / 180 * 30), 0.1, 24, 1);
  var material = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x444444 });
  var sphereCap = new THREE.Mesh(geometry, material);
  sphereCap.position.y = - 15 * Math.sin(Math.PI / 180 * 30) - 0.05;
  sphereCap.rotateX(- Math.PI);

  var geometry = new THREE.SphereBufferGeometry(15, 24, 24, Math.PI / 2, Math.PI * 2, 0, Math.PI / 180 * 120);
  var halfSphere = new THREE.Mesh(geometry, material);
  halfSphere.add(sphereCap);
  halfSphere.rotateX(- Math.PI / 180 * 135);
  halfSphere.rotateZ(- Math.PI / 180 * 20);
  halfSphere.position.y = 7.5 + 15 * Math.sin(Math.PI / 180 * 30);

  sphereGroup.add(halfSphere);

  var geometry = new THREE.IcosahedronBufferGeometry(5, 0);
  var material = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x333333, flatShading: true });
  smallSphere = new THREE.Mesh(geometry, material);
  scene.add(smallSphere);

  // walls
  var planeTop = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
  planeTop.position.y = 100;
  planeTop.rotateX(Math.PI / 2);
  scene.add(planeTop);

  var planeBottom = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
  planeBottom.rotateX(- Math.PI / 2);
  scene.add(planeBottom);

  var planeFront = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0x7f7fff }));
  planeFront.position.z = 50;
  planeFront.position.y = 50;
  planeFront.rotateY(Math.PI);
  scene.add(planeFront);

  var planeRight = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
  planeRight.position.x = 50;
  planeRight.position.y = 50;
  planeRight.rotateY(- Math.PI / 2);
  scene.add(planeRight);

  var planeLeft = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xff0000 }));
  planeLeft.position.x = - 50;
  planeLeft.position.y = 50;
  planeLeft.rotateY(Math.PI / 2);
  scene.add(planeLeft);

  // lights
  var mainLight = new THREE.PointLight(0xcccccc, 1.5, 250);
  mainLight.position.y = 60;
  scene.add(mainLight);

  var greenLight = new THREE.PointLight(0x00ff00, 0.25, 1000);
  greenLight.position.set(550, 50, 0);
  scene.add(greenLight);

  var redLight = new THREE.PointLight(0xff0000, 0.25, 1000);
  redLight.position.set(- 550, 50, 0);
  scene.add(redLight);

  var blueLight = new THREE.PointLight(0x7f7fff, 0.25, 1000);
  blueLight.position.set(0, 50, 550);
  scene.add(blueLight);

}

function animate() {

  requestAnimationFrame(animate);

  var timer = Date.now() * 0.01;

  sphereGroup.rotation.y -= 0.002;

  smallSphere.position.set(
    Math.cos(timer * 0.1) * 30,
    Math.abs(Math.cos(timer * 0.2)) * 20 + 5,
    Math.sin(timer * 0.1) * 30
  );
  smallSphere.rotation.y = (Math.PI / 2) - timer * 0.1;
  smallSphere.rotation.z = timer * 0.8;

  renderer.render(scene, camera);

}