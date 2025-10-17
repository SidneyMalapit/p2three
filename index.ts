import * as Three from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import Perlin from './perlin.js';
import Microphone from './Microphone.js';

const scene = new Three.Scene;
const camera = new Three.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const loader = new GLTFLoader;

const renderer = new Three.WebGLRenderer;
renderer.setSize(innerWidth, innerHeight);
document.body.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const gltfLoader = new GLTFLoader;
const glb = await gltfLoader.loadAsync('SidneyMalapit.glb');

const hemiLight = new Three.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(hemiLight);

camera.position.z = 3;

renderer.setAnimationLoop(animate);

let originalVertices: Three.Vector3[] = [];
let scale = 3;
glb.scene.scale.set(scale, scale, scale);
glb.scene.rotation.x = Math.PI / 2;
glb.scene.rotation.y = 0.86 * Math.PI / 4;
glb.scene.traverse(child => {
  if (!(child instanceof Three.Mesh) || !child.isMesh) { return; }
  const geometry = child.geometry as Three.BufferGeometry;
  const points = geometry.getAttribute('position');
  for (let i = 0; i < points.count; i++) {
    originalVertices.push(new Three.Vector3(points.getX(i), points.getY(i), points.getZ(i)));
  }
});

const perlin = new Perlin;
let hasUserInteracted = false;

await new Promise<void>((resolve) => {
  document.getElementById('entry')!.addEventListener('click', () => resolve(), { once: true });
});

Microphone.init();
hasUserInteracted = true;

// addEventListener('mousemove', () => {
//   console.log(Microphone.volume);
// });

const maxIntensity = 50;
let intensity = 1;

function animate() {
  if (!hasUserInteracted) { return; }

  const { volume } = Microphone;
  const speakPrompt = document.getElementById('speak-prompt');
  if (volume < 0.01 && speakPrompt) {
    speakPrompt.classList.add('visible');
  } else if (speakPrompt) {
    speakPrompt.classList.remove('visible');
  }

  controls.update();
  renderer.render(scene, camera);

  glb.scene.traverse(child => {
    if (!(child instanceof Three.Mesh) || !child.isMesh) { return; }
    const geometry = child.geometry as Three.BufferGeometry;
    const points = geometry.getAttribute('position');
    
    for (let i = 0; i < points.count; i++) {
      let originalIntensity = intensity;

      if (originalVertices[i] == undefined) { continue; }

      const noise = perlin.getValue((i) / 1e6 + renderer.info.render.frame / 10); 
      //intensity = (noise + 1) / 2 * maxIntensity + 1;
      intensity = volume * noise * maxIntensity / controls.object.position.distanceTo(new Three.Vector3(0, 0, 0)) * 30;

      points.setXYZ(
        i,
        originalVertices[i]!.x + Math.random() * intensity - intensity / 2,
        originalVertices[i]!.y + Math.random() * intensity - intensity / 2,
        originalVertices[i]!.z + Math.random() * intensity - intensity / 2
      );
      intensity = originalIntensity;
    }

    points.needsUpdate = true;
  });
  
  scene.add(glb.scene);
}
