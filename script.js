// --- 1. CONFIGURAÇÃO DO CENÁRIO 3D ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Cor do céu azul
scene.fog = new THREE.FogExp2(0x87CEEB, 0.03); // Efeito de neblina ao fundo

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 2. ILUMINAÇÃO ---
const lightAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(lightAmbiente);

const lightSol = new THREE.DirectionalLight(0xffffff, 0.5);
lightSol.position.set(10, 20, 10);
scene.add(lightSol);

// --- 3. MATERIAIS E BLOCOS ---
const materialGrama = new THREE.MeshLambertMaterial({ color: 0x557a2b });
const geoBloco = new THREE.BoxGeometry(1, 1, 1);
const blocos = []; // Array que guarda todos os blocos do mapa

// Geração de um terreno simples (20x20 blocos) com pequenas ondulações
const tamanhoMundo = 20;
for (let x = -tamanhoMundo; x < tamanhoMundo; x++) {
    for (let z = -tamanhoMundo; z < tamanhoMundo; z++) {
        // Altura baseada em fórmulas matemáticas para criar relevo
        let y = Math.floor(Math.sin(x * 0.2) * 1.5 + Math.cos(z * 0.2) * 1.5);
        
        // Camadas de terra/grama debaixo do bloco do topo
        for (let h = y - 2; h <= y; h++) {
            const bloco = new THREE.Mesh(geoBloco, materialGrama);
            bloco.position.set(x, h, z);
            scene.add(bloco);
            blocos.push(bloco); // Guarda na lista de colisões/interações
        }
    }
}

// Posição inicial do jogador (X=0, Y=5, Z=0)
camera.position.set(0, 5, 0);
camera.rotation.order = "YXZ"; // Trava a ordem dos eixos para jogabilidade FPS

// --- 4. CONTROLES DE MOVIMENTAÇÃO ---
let mexeFrente = false, mexeTras = false, mexeEsquerda = false, mexeDireita = false;
let velocidade = new THREE.Vector3();
let direcao = new THREE.Vector3();
let podePular = false;
let relogio = new THREE.Clock();

// Bloqueia o mouse na tela ao clicar nela
document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
});

// Movimenta a câmera olhando para os lados
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.0025;
        camera.rotation.x -= e.movementY * 0.0025;
        // Limita o olhar para cima e para baixo (não deixa virar cambalhota)
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
});

// Captura teclas pressionadas
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': mexeFrente = true; break;
        case 'KeyS': mexeTras = true; break;
        case 'KeyA': mexeEsquerda = true; break;
        case 'KeyD': mexeDireita = true; break;
        case 'Space': if (podePular) velocidade.y += 7.5; podePular = false; break;
    }
});

// Captura teclas soltas
document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': mexeFrente = false; break;
        case 'KeyS': mexeTras = false; break;
        case 'KeyA': mexeEsquerda = false; break;
        case 'KeyD': mexeDireita = false; break;
    }
});

// --- 5. INTERAÇÃO COM OS BLOCOS (QUEBRAR E COLOCAR) ---
const raycaster = new THREE.Raycaster();
const centroTela = new THREE.Vector2(0, 0);

document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body) return;

    // Dispara um raio invisível bem do meio da tela
    raycaster.setFromCamera(centroTela, camera);
    const interseccoes = raycaster.intersectObjects(blocos);

    // Se o raio atingir um bloco a menos de 5 metros de distância
    if (interseccoes.length > 0 && interseccoes[0].distance < 5) {
        const intersect = interseccoes[0];

        if (e.button === 0) { 
            // Clique Esquerdo: Destrói o bloco
            scene.remove(intersect.object);
            const index = blocos.indexOf(intersect.object);
            if (index > -1) blocos.splice(index, 1);
        } 
        else if (e.button === 2) { 
            // Clique Direito: Cria um bloco adjacente à face clicada
            const novoBloco = new THREE.Mesh(geoBloco, materialGrama);
            novoBloco.position.copy(intersect.object.position).add(intersect.face.normal);
            scene.add(novoBloco);
            blocos.push(novoBloco);
        }
    }
});

// Desativa o menu chato do botão direito na tela do jogo
document.addEventListener('contextmenu', e => e.preventDefault());

// --- 6. LOOP DE FÍSICA E RENDERIZAÇÃO ---
function loop() {
    requestAnimationFrame(loop);

    if (document.pointerLockElement === document.body) {
        const delta = relogio.getDelta();

        // Atrito / Desaceleração
        velocidade.x -= velocidade.x * 10.0 * delta;
        velocidade.z -= velocidade.z * 10.0 * delta;
        velocidade.y -= 9.8 * 2.2 * delta; // Gravidade agindo

        direcao.z = Number(mexeFrente) - Number(mexeTras);
        direcao.x = Number(mexeDireita) - Number(mexeEsquerda);
        direcao.normalize();

        // Direção horizontal que a câmera aponta
        const direcaoFrente = new THREE.Vector3();
        camera.getWorldDirection(direcaoFrente);
        direcaoFrente.y = 0;
        direcaoFrente.normalize();

        const direcaoLado = new THREE.Vector3(-direcaoFrente.z, 0, direcaoFrente.x);

        // Aplica velocidade baseado na direção
        if (mexeFrente || mexeTras) velocidade.addScaledVector(direcaoFrente, 40.0 * delta);
        if (mexeEsquerda || mexeDireita) velocidade.addScaledVector(direcaoLado, -40.0 * delta);

        // Move a câmera no espaço
        camera.translateX(velocidade.x * delta);
        camera.translateY(velocidade.y * delta);
        camera.translateZ(-velocidade.z * delta);

        // Colisão simplificada com o chão (falso chão no Y=3.5)
        if (camera.position.y < 3.5) {
            velocidade.y = 0;
            camera.position.y = 3.5;
            podePular = true;
        }
    }

    renderer.render(scene, camera);
}

// Ajusta a tela dinamicamente se o usuário redimensionar o navegador
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Inicializa o jogo
loop();// --- 1. CONFIGURAÇÃO DO CENÁRIO 3D ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Cor do céu azul
scene.fog = new THREE.FogExp2(0x87CEEB, 0.03); // Efeito de neblina ao fundo

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 2. ILUMINAÇÃO ---
const lightAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(lightAmbiente);

const lightSol = new THREE.DirectionalLight(0xffffff, 0.5);
lightSol.position.set(10, 20, 10);
scene.add(lightSol);

// --- 3. MATERIAIS E BLOCOS ---
const materialGrama = new THREE.MeshLambertMaterial({ color: 0x557a2b });
const geoBloco = new THREE.BoxGeometry(1, 1, 1);
const blocos = []; // Array que guarda todos os blocos do mapa

// Geração de um terreno simples (20x20 blocos) com pequenas ondulações
const tamanhoMundo = 20;
for (let x = -tamanhoMundo; x < tamanhoMundo; x++) {
    for (let z = -tamanhoMundo; z < tamanhoMundo; z++) {
        // Altura baseada em fórmulas matemáticas para criar relevo
        let y = Math.floor(Math.sin(x * 0.2) * 1.5 + Math.cos(z * 0.2) * 1.5);
        
        // Camadas de terra/grama debaixo do bloco do topo
        for (let h = y - 2; h <= y; h++) {
            const bloco = new THREE.Mesh(geoBloco, materialGrama);
            bloco.position.set(x, h, z);
            scene.add(bloco);
            blocos.push(bloco); // Guarda na lista de colisões/interações
        }
    }
}

// Posição inicial do jogador (X=0, Y=5, Z=0)
camera.position.set(0, 5, 0);
camera.rotation.order = "YXZ"; // Trava a ordem dos eixos para jogabilidade FPS

// --- 4. CONTROLES DE MOVIMENTAÇÃO ---
let mexeFrente = false, mexeTras = false, mexeEsquerda = false, mexeDireita = false;
let velocidade = new THREE.Vector3();
let direcao = new THREE.Vector3();
let podePular = false;
let relogio = new THREE.Clock();

// Bloqueia o mouse na tela ao clicar nela
document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
});

// Movimenta a câmera olhando para os lados
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.0025;
        camera.rotation.x -= e.movementY * 0.0025;
        // Limita o olhar para cima e para baixo (não deixa virar cambalhota)
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
});

// Captura teclas pressionadas
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': mexeFrente = true; break;
        case 'KeyS': mexeTras = true; break;
        case 'KeyA': mexeEsquerda = true; break;
        case 'KeyD': mexeDireita = true; break;
        case 'Space': if (podePular) velocidade.y += 7.5; podePular = false; break;
    }
});

// Captura teclas soltas
document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': mexeFrente = false; break;
        case 'KeyS': mexeTras = false; break;
        case 'KeyA': mexeEsquerda = false; break;
        case 'KeyD': mexeDireita = false; break;
    }
});

// --- 5. INTERAÇÃO COM OS BLOCOS (QUEBRAR E COLOCAR) ---
const raycaster = new THREE.Raycaster();
const centroTela = new THREE.Vector2(0, 0);

document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body) return;

    // Dispara um raio invisível bem do meio da tela
    raycaster.setFromCamera(centroTela, camera);
    const interseccoes = raycaster.intersectObjects(blocos);

    // Se o raio atingir um bloco a menos de 5 metros de distância
    if (interseccoes.length > 0 && interseccoes[0].distance < 5) {
        const intersect = interseccoes[0];

        if (e.button === 0) { 
            // Clique Esquerdo: Destrói o bloco
            scene.remove(intersect.object);
            const index = blocos.indexOf(intersect.object);
            if (index > -1) blocos.splice(index, 1);
        } 
        else if (e.button === 2) { 
            // Clique Direito: Cria um bloco adjacente à face clicada
            const novoBloco = new THREE.Mesh(geoBloco, materialGrama);
            novoBloco.position.copy(intersect.object.position).add(intersect.face.normal);
            scene.add(novoBloco);
            blocos.push(novoBloco);
        }
    }
});

// Desativa o menu chato do botão direito na tela do jogo
document.addEventListener('contextmenu', e => e.preventDefault());

// --- 6. LOOP DE FÍSICA E RENDERIZAÇÃO ---
function loop() {
    requestAnimationFrame(loop);

    if (document.pointerLockElement === document.body) {
        const delta = relogio.getDelta();

        // Atrito / Desaceleração
        velocidade.x -= velocidade.x * 10.0 * delta;
        velocidade.z -= velocidade.z * 10.0 * delta;
        velocidade.y -= 9.8 * 2.2 * delta; // Gravidade agindo

        direcao.z = Number(mexeFrente) - Number(mexeTras);
        direcao.x = Number(mexeDireita) - Number(mexeEsquerda);
        direcao.normalize();

        // Direção horizontal que a câmera aponta
        const direcaoFrente = new THREE.Vector3();
        camera.getWorldDirection(direcaoFrente);
        direcaoFrente.y = 0;
        direcaoFrente.normalize();

        const direcaoLado = new THREE.Vector3(-direcaoFrente.z, 0, direcaoFrente.x);

        // Aplica velocidade baseado na direção
        if (mexeFrente || mexeTras) velocidade.addScaledVector(direcaoFrente, 40.0 * delta);
        if (mexeEsquerda || mexeDireita) velocidade.addScaledVector(direcaoLado, -40.0 * delta);

        // Move a câmera no espaço
        camera.translateX(velocidade.x * delta);
        camera.translateY(velocidade.y * delta);
        camera.translateZ(-velocidade.z * delta);

        // Colisão simplificada com o chão (falso chão no Y=3.5)
        if (camera.position.y < 3.5) {
            velocidade.y = 0;
            camera.position.y = 3.5;
            podePular = true;
        }
    }

    renderer.render(scene, camera);
}

// Ajusta a tela dinamicamente se o usuário redimensionar o navegador
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Inicializa o jogo
loop();