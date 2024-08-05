/**
 * Defines the viewer of a given DPP database.
 */

import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Tween, Easing, Group} from '@tweenjs/tween.js';

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

/**
 * Creates the object table.
 *
 * @param {DataBase} database
 */
function createTable(database) {
    document.body.insertAdjacentHTML('afterbegin', `
        <div id="dpp-ctx">
            <div class="container"></div>
            <div class="author">Author: 
                <a href="https://ppizarror.com">Pablo Pizarro R.</a>
                <a href="https://github.com/ppizarror/simple-dpp-viewer"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
            </div>
        </div>
        <div id="dpp-title">${database.model_name}</div>
    `);

    // For each object, add to the container
    const make_property = (property_label, property_value) => `
        <div class="property">
            <div class="label">${property_label}</div>
            <div class="value">${property_value}</div>
        </div>
    `;
    const make_property_range = (property_label, property_percentage) => {
        const range_red = Math.round(255 * (100 - property_percentage) / 100);
        const range_green = Math.round(255 * property_percentage / 100);
        return make_property(
            property_label,
            `
                <div class="range-container">
                    <div class="marker" style="
                        border-color: rgb(${range_red}, ${range_green}, 0);
                        left: calc(${property_percentage}% - 1px);
                    "></div>
                </div>
                `
        );
    };
    database.objects.forEach((obj) => {
        // noinspection HtmlUnknownAttribute
        document.querySelector('#dpp-ctx div.container').insertAdjacentHTML('beforeend', `
            <div class="dpp" dpp-id="${obj.id}">
                <div class="title">${obj.material}</div>
                <div class="material">${obj.label}</div>
                ${make_property_range('Condition', obj.condition)}
                ${make_property_range('Reusability', obj.reusability)}
                ${make_property('Dimensions (m)', obj.dimensions)}
            </div>
        `);
    });

    // Create hover property for dpp
    /** @type {THREE.MeshStandardMaterial} */ let current_hovered = null;
    document.querySelectorAll('#dpp-ctx div.container div.dpp').forEach((dpp) => {
        dpp.addEventListener('mouseenter', () => {
            const dppId = dpp.getAttribute('dpp-id');
            const dppMaterial = database.getObject(dppId).viewerMaterial;
            if (dppMaterial === current_hovered) return;
            if (current_hovered) current_hovered.emissiveIntensity = 0;
            current_hovered = dppMaterial;
            current_hovered.emissiveIntensity = 0.5;
        });
        dpp.addEventListener('mouseleave', () => {
            if (!current_hovered) return; // Reinitialize material
            current_hovered.emissiveIntensity = 0;
            current_hovered = null;
        });
    });
}

/**
 * Initializes the viewer.
 *
 * @param {DataBase} database - Model database
 */
function initViewer(database) {
    // Init
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    const scene = new THREE.Scene();

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 10); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 100, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create camera
    const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 100);
    camera.position.x = -1;
    camera.position.y = -2;
    camera.position.z = 0.5;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Tween groups
    const tween_group = new Group();

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
        database.model_path,
        function (gltf) {
            model_scale(gltf.scene);
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    const material = child.material;
                    if (material && material.map) {
                        database.bindMaterial(material);
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

            cameraZ *= 2; // Zoom out a little so that the model is fully visible
            camera.lookAt(center);

            controls.target = center;
            controls.target.x -= 0.5 * cameraZ;
            controls.update();
            scene.add(gltf.scene);

            // Animate camera
            setTimeout(() => {
                let from_position = camera.position.clone();
                let to_position = new THREE.Vector3();
                to_position.z = center.z + 1.25 * cameraZ;
                to_position.y = center.y + 0.5 * cameraZ;
                to_position.x = center.x + -cameraZ;
                const tween = new Tween(from_position)
                    .to(to_position, 1250)
                    .easing(Easing.Quadratic.InOut)
                    .onUpdate(() => {
                        camera.position.set(from_position.x, from_position.y, from_position.z);
                    })
                    .start();
                tween_group.add(tween);
            }, 250);
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

    function animate(time) {
        controls.update();
        renderer.render(scene, camera);
        tween_group.update(time);
    }

    // Creates the table
    createTable(database);
}

export {initViewer}