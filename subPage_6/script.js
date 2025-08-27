import * as THREE from 'three';

// --- Helper function to create a circular texture ---
function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.arc(16, 16, 15, 0, 2 * Math.PI);
    context.fillStyle = '#ffffff';
    context.fill();
    return new THREE.CanvasTexture(canvas);
}
const circleTexture = createCircleTexture();

// --- DOM Elements ---
const info = document.getElementById('info');
const message = document.getElementById('message');
const canvas = document.getElementById('bg');

// --- Main function to run after loading config ---
function main(config) {
    // Set UI text from config
    info.querySelector('h1').textContent = config.mainTitle;
    info.querySelector('p').textContent = config.subTitle;
    message.querySelector('h2').textContent = config.finalTitle;
    message.querySelector('h3').textContent = config.finalSubtitle;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);

    // --- Object Groups ---
    const rotatingGroup = new THREE.Group(); // Group for objects that will rotate
    scene.add(rotatingGroup);

    // --- Particle Systems ---

    // 1. Background Stars (add to rotating group)
    const starVertices = [], starColors = [];
    const starColorPalette = [new THREE.Color(0xffa5b5), new THREE.Color(0x8ecae6), new THREE.Color(0xbcf0da)];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000, y = (Math.random() - 0.5) * 2000, z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
        const color = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
        starColors.push(color.r, color.g, color.b);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const starMaterial = new THREE.PointsMaterial({ map: circleTexture, size: 0.7, transparent: true, opacity: 0.8, vertexColors: true, alphaTest: 0.5 });
    const backgroundStars = new THREE.Points(starGeometry, starMaterial);
    rotatingGroup.add(backgroundStars);

    // 2. Ground Particles (add to rotating group)
    const groundVertices = [], groundColors = [];
    const groundColorPalette = [new THREE.Color(0xcccccc), new THREE.Color(0xbbd0ff), new THREE.Color(0xffffff)];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 400, z = (Math.random() - 0.5) * 400, y = -15 + (Math.random() - 0.5) * 5;
        groundVertices.push(x, y, z);
        const color = groundColorPalette[Math.floor(Math.random() * groundColorPalette.length)];
        groundColors.push(color.r, color.g, color.b);
    }
    const groundGeometry = new THREE.BufferGeometry();
    groundGeometry.setAttribute('position', new THREE.Float32BufferAttribute(groundVertices, 3));
    groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(groundColors, 3));
    const groundMaterial = new THREE.PointsMaterial({ map: circleTexture, size: 0.3, transparent: true, opacity: 0.7, vertexColors: true, alphaTest: 0.5 });
    const groundParticles = new THREE.Points(groundGeometry, groundMaterial);
    rotatingGroup.add(groundParticles);

    // 3. Heart Particles (add directly to scene, so it won't rotate)
    const heartGeometry = new THREE.BufferGeometry();
    const targetPositions = new Float32Array(1000 * 3), initialPositions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
        const t = Math.random() * Math.PI * 2, scale = 1.5;
        const x = 16 * Math.pow(Math.sin(t), 3) * scale, y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale, z = (Math.random() - 0.5) * 5;
        targetPositions[i * 3] = x; targetPositions[i * 3 + 1] = y; targetPositions[i * 3 + 2] = z;
        const spherical = new THREE.Spherical(Math.random() * 20 + 10, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        const vec = new THREE.Vector3().setFromSpherical(spherical);
        initialPositions[i * 3] = vec.x; initialPositions[i * 3 + 1] = vec.y; initialPositions[i * 3 + 2] = vec.z;
    }
    heartGeometry.setAttribute('position', new THREE.Float32BufferAttribute(initialPositions, 3));
    const heartMaterial = new THREE.PointsMaterial({ map: circleTexture, color: 0xff3388, size: 0.8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, alphaTest: 0.5 });
    const heartParticles = new THREE.Points(heartGeometry, heartMaterial);
    scene.add(heartParticles); // Add to scene, not rotatingGroup

    // --- Animation Logic ---
    let formAnimationProgress = 0, formAnimationStarted = false;
    let textAnimationProgress = 0, textAnimationStarted = false;
    const clock = new THREE.Clock();

    function animate() {
        const elapsedTime = clock.getElapsedTime();
        requestAnimationFrame(animate);
        rotatingGroup.rotation.y = elapsedTime * 0.05; // Only rotate the group

        if (formAnimationStarted && formAnimationProgress < 1) {
            formAnimationProgress += 0.005;
            const currentPos = heartGeometry.attributes.position;
            for (let i = 0; i < currentPos.count; i++) {
                const ix = initialPositions[i * 3], iy = initialPositions[i * 3 + 1], iz = initialPositions[i * 3 + 2];
                const tx = targetPositions[i * 3], ty = targetPositions[i * 3 + 1], tz = targetPositions[i * 3 + 2];
                currentPos.setXYZ(i, THREE.MathUtils.lerp(ix, tx, formAnimationProgress), THREE.MathUtils.lerp(iy, ty, formAnimationProgress), THREE.MathUtils.lerp(iz, tz, formAnimationProgress));
            }
            currentPos.needsUpdate = true;
            heartMaterial.opacity = formAnimationProgress;
        }

        if (formAnimationProgress >= 1 && !textAnimationStarted) {
            const pulse = 1 + 0.1 * Math.sin(elapsedTime * 5);
            heartParticles.scale.set(pulse, pulse, pulse);
        }

        if (textAnimationStarted && textAnimationProgress < 1) {
            textAnimationProgress += 0.01;
            heartParticles.position.x = THREE.MathUtils.lerp(0, -25, textAnimationProgress);
            const scale = THREE.MathUtils.lerp(1, 0.4, textAnimationProgress);
            heartParticles.scale.set(scale, scale, scale);
            
            if (message.style.visibility !== 'visible') {
                message.style.visibility = 'visible';
                message.style.opacity = '1';
            }
        }

        renderer.render(scene, camera);
    }

    // --- Event Listeners ---
    info.addEventListener('click', () => {
        if (formAnimationStarted) return;
        formAnimationStarted = true;
        info.classList.add('fade-out');
        setTimeout(() => { info.classList.add('hidden'); }, 1500);
        setTimeout(() => { textAnimationStarted = true; }, 5000);
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

// --- Load configuration and run main function ---
fetch('config.json')
    .then(response => response.json())
    .then(config => main(config))
    .catch(error => {
        console.error('Error loading config.json:', error);
        // Fallback config if file fails to load
        const fallbackConfig = {
            "mainTitle": "點擊奔赴七夕浪漫",
            "subTitle": "輕觸屏幕開始查看",
            "finalTitle": "七夕快樂！",
            "finalSubtitle": "我愛你❤"
        };
        main(fallbackConfig);
    });
