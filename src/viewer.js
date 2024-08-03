import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Init
const renderer = new THREE.WebGLRenderer({antialias: true});
const scene = new THREE.Scene();

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Create camera
const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 100);
camera.position.z = 1;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Utils: Scale the model to a factor of 1
function model_scale(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Calculate the scale factor to normalize size to 1
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 1 / maxDim;

    // Center the model and scale it
    model.position.sub(center);
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

// Load GLTF model
const loader = new GLTFLoader();
loader.load(
    'scene/home.glb',
    function (gltf) {
        model_scale(gltf.scene);
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                /** @type {THREE.MeshStandardMaterial} */ const material = child.material;
                if (material && material.map) {
                    if (material.name === 'snapshot01') material.opacity = 0;
                    console.warn(material);
                }
            }
        });
        // Adjust camera and controls to frame the loaded model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2));

        cameraZ *= 3; // Zoom out a little so that the model is fully visible

        camera.position.z = center.z + 1.25 * cameraZ;
        camera.position.y = center.y + 0.5 * cameraZ;
        camera.position.x = center.x + -cameraZ;
        camera.lookAt(center);

        controls.target = center;
        controls.update();
        scene.add(gltf.scene);
    },
    undefined,
    function (error) {
        console.error('Error loading GLTF model', error);
    }
);

// Resize handler
function resize_handler() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize_handler);
resize_handler();

// Animation loop
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

function animate() {
    controls.update();
    renderer.render(scene, camera);
}