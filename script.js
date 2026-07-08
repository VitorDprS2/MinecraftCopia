const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.FogExp2(0x87CEEB, 0.03);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const lightAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(lightAmbiente);

const lightSol = new THREE.DirectionalLight(0xffffff, 0.5);
lightSol.position.set(10, 20, 10);
scene.add(lightSol);

const materialGrama = new THREE.MeshLambertMaterial({ color: 0x557a2b });
const geoBloco = new THREE.BoxGeometry(1, 1, 1);
const blocos = [];

const tamanhoMundo = 20;
for (let x = -tamanhoMundo; x < tamanhoMundo; x++) {
    for (let z = -tamanhoMundo; z < tamanhoMundo; z++) {
        let y = Math.floor(Math.sin(x * 0.2) * 1.5 + Math.cos(z * 0.2) * 1.5);
        for (let h = y - 2; h <= y; h++) {
            const bloco = new THREE.Mesh(geoBloco, materialGrama);
            bloco.position.set(x, h, z);
            scene.add(bloco);
            blocos.push(bloco);
        }
    }
}

camera.position.set(0, 5, 0);
camera.rotation.order = "YXZ";

let mexeFrente = false, mexeTras = false, mexeEsquerda = false, mexeDireita = false;
let velocidade = new THREE.Vector3();
let direcao = new THREE.Vector3();
let podePular = false;
let relogio = new THREE.Clock();

document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.0025;
        camera.rotation.x -= e.movementY * 0.0025;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
});

document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': mexeFrente = true; break;
        case 'KeyS': mexeTras = true; break;
        case 'KeyA': mexeEsquerda = true; break;
        case 'KeyD': mexeDireita = true; break;
        case 'Space': if (podePular) velocidade.y += 7.5; podePular = false; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': mexeFrente = false; break;
        case 'KeyS': mexeTras = false; break;
        case 'KeyA': mexeEsquerda = false; break;
        case 'KeyD': mexeDireita = false; break;
    }
});

const raycaster = new THREE.Raycaster();
const centroTela = new THREE.Vector2(0, 0);

document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body) return;

    raycaster.setFromCamera(centroTela, camera);
    const interseccoes = raycaster.intersectObjects(blocos);

    if (interseccoes.length > 0 && interseccoes[0].distance < 5) {
        const intersect = interseccoes[0];

        if (e.button === 0) { 
            scene.remove(intersect.object);
            const index = blocos.indexOf(intersect.object);
            if (index > -1) blocos.splice(index, 1);
        } 
        else if (e.button === 2) { 
            const novoBloco = new THREE.Mesh(geoBloco, materialGrama);
            novoBloco.position.copy(intersect.object.position).add(intersect.face.normal);
            scene.add(novoBloco);
            blocos.push(novoBloco);
        }
    }
});

document.addEventListener('contextmenu', e => e.preventDefault());

function loop() {
    requestAnimationFrame(loop);

    if (document.pointerLockElement === document.body) {
        const delta = relogio.getDelta();

        velocidade.x -= velocidade.x * 10.0 * delta;
        velocidade.z -= velocidade.z * 10.0 * delta;
        velocidade.y -= 9.8 * 2.2 * delta;

        direcao.z = Number(mexeFrente) - Number(mexeTras);
        direcao.x = Number(mexeDireita) - Number(mexeEsquerda);
        direcao.normalize();

        const direcaoFrente = new THREE.Vector3();
        camera.getWorldDirection(direcaoFrente);
        direcaoFrente.y = 0;
        direcaoFrente.normalize();

        const direcaoLado = new THREE.Vector3(-direcaoFrente.z, 0, direcaoFrente.x);

        if (mexeFrente || mexeTras) velocidade.addScaledVector(direcaoFrente, 40.0 * delta);
        if (mexeEsquerda || mexeDireita) velocidade.addScaledVector(direcaoLado, -40.0 * delta);

        camera.translateX(velocidade.x * delta);
        camera.translateY(velocidade.y * delta);
        camera.translateZ(-velocidade.z * delta);

        if (camera.position.y < 3.5) {
            velocidade.y = 0;
            camera.position.y = 3.5;
            podePular = true;
        }
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

loop();