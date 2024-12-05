import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'stats.js';

// Constants
const aspect = window.innerWidth / window.innerHeight;

// Variables
let isDragging = false; // Tracks if the user is currently dragging
let previousPosition = { x: 0, y: 0 }; // Stores the previous position of the mouse or touch
let houseModel = null; // Reference to the loaded 3D model
const minZoom = 5; // Minimum camera zoom distance
const maxZoom = 45; // Maximum camera zoom distance

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080);

// Camera Setup
const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000); // Field of view, aspect ratio, near, far
camera.position.set(10, 20, 15); // Initial camera position
camera.lookAt(0, 0, 0); // Camera looks at the center of the scene

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.setPixelRatio(window.devicePixelRatio); // Fix for high-DPI screens
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
document.body.appendChild(renderer.domElement);

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Soft ambient light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.001;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Stats.js Setup
const stats = new Stats();
stats.showPanel(0); // FPS panel
document.body.appendChild(stats.dom);

// Models Loading
const loader = new GLTFLoader();
loader.load(
    '3d_assets/house_mvp.glb', // Path to your GLB file
    (gltf) => {
        const object = gltf.scene; // Extract the scene from the loaded GLTF file

        object.traverse((child) => {
            if (child.isMesh) {
                // Enable shadows
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        houseModel = object; // Store reference to the model
        scene.add(object); // Add model to the scene
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded'); // Log progress
    },
    (error) => {
        console.error('Error loading model:', error); // Log errors
    }
);


// Interaction Functions

/**
 * Handles the start of a drag interaction.
 * Only activates if one finger is touching.
 * @param {MouseEvent | TouchEvent} event - The drag start event.
 */
function startDrag(event) {
    if (event.touches && event.touches.length > 1) return; // Ignore multi-touch gestures

    isDragging = true;
    previousPosition = getEventPosition(event);
}

/**
 * Handles the drag interaction, enabling rotation and zooming.
 * Only performs actions if one finger is touching.
 * @param {MouseEvent | TouchEvent} event - The drag event.
 */
function drag(event) {
    if (!isDragging || !houseModel || (event.touches && event.touches.length > 1)) return;

    const currentPosition = getEventPosition(event);
    const deltaMove = {
        x: currentPosition.x - previousPosition.x,
        y: currentPosition.y - previousPosition.y,
    };

    // Determine action based on movement direction
    if (Math.abs(deltaMove.y) > Math.abs(deltaMove.x)) {
        adjustZoom(deltaMove.y * 0.1); // Zoom with vertical drag
    } else {
        houseModel.rotation.y += deltaMove.x * 0.005; // Rotate with horizontal drag
    }

    previousPosition = currentPosition;
}

/**
 * Ends the drag interaction.
 * @param {TouchEvent | MouseEvent} event - The drag end event.
 */
function endDrag() {
    isDragging = false;
}

/**
 * Gets the position of the current input event.
 * @param {MouseEvent | TouchEvent} event - The input event.
 * @returns {Object} The x and y coordinates of the event.
 */
function getEventPosition(event) {
    if (event.touches && event.touches.length > 0) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    } else {
        return { x: event.clientX, y: event.clientY };
    }
}

/**
 * Adjusts the zoom by moving the camera along its forward direction.
 * Constrained to the minZoom and maxZoom limits.
 * @param {number} delta - The amount to zoom in or out.
 */
function adjustZoom(delta) {
    const zoomSpeed = 0.5;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const newPosition = camera.position.clone().addScaledVector(direction, delta * zoomSpeed);
    const distance = newPosition.length(); // Distance from origin

    // Constrain zoom distance
    if (distance >= minZoom && distance <= maxZoom) {
        camera.position.copy(newPosition);
    }
}

// Resize Event Listener
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Input Event Listeners
window.addEventListener('mousedown', startDrag, false);
window.addEventListener('mousemove', drag, false);
window.addEventListener('mouseup', endDrag, false);
window.addEventListener('touchstart', startDrag, false);
window.addEventListener('touchmove', drag, false);
window.addEventListener('touchend', endDrag, false);

/**
 * Browser Setup.
 */

// Disable default browser gestures
const canvas = renderer.domElement;

// Prevent pinch-to-zoom and other multi-touch gestures
canvas.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
        event.preventDefault(); // Prevent pinch-to-zoom
    }
}, { passive: false });

canvas.addEventListener('touchmove', (event) => {
    if (event.touches.length > 1) {
        event.preventDefault(); // Prevent pinch-to-zoom
    }
}, { passive: false });

canvas.addEventListener('wheel', (event) => {
    event.preventDefault(); // Prevent mouse wheel zoom
}, { passive: false });

// Handle window resizing
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Ensure high-DPI adjustment on resize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

 // Main game loop
function animate() {
    stats.begin(); // Start measuring FPS
    renderer.render(scene, camera);
    stats.end(); // Stop measuring FPS
    requestAnimationFrame(animate);
}

// Start Game Loop
animate();


