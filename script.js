// URL estável e padrão do Eaglercraft 1.8.8
const EAGLERCRAFT_URL = "https://eaglercraft.ru";

// Seleção de elementos do DOM
const btnPlay = document.getElementById('btnPlay');
const btnFullscreen = document.getElementById('btnFullscreen');
const btnClose = document.getElementById('btnClose');
const launcherScreen = document.getElementById('launcherScreen');
const gameScreen = document.getElementById('gameScreen');
const gameContainer = document.getElementById('gameContainer');
const bgAnimation = document.getElementById('bgAnimation');

// 1. Geração de cubos flutuantes decorativos no fundo do Launcher
function createAmbientBackground() {
    const cubeCount = 15;
    for (let i = 0; i < cubeCount; i++) {
        const cube = document.createElement('div');
        cube.classList.add('ambient-cube');
        
        // Tamanhos e posições aleatórias para profundidade
        const size = Math.random() * 40 + 10;
        cube.style.width = `${size}px`;
        cube.style.height = `${size}px`;
        cube.style.left = `${Math.random() * 100}vw`;
        
        // Tempos de animação variados
        cube.style.animationDuration = `${Math.random() * 12 + 8}s`;
        cube.style.animationDelay = `${Math.random() * 5}s`;
        
        bgAnimation.appendChild(cube);
    }
}

// 2. Ação de Iniciar o Jogo (Injeta o iframe apenas sob demanda)
btnPlay.addEventListener('click', () => {
    // Exibe a tela do jogo e oculta o painel principal
    launcherScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // Injeta de forma limpa o iframe do jogo para evitar lentidão prévia
    gameContainer.innerHTML = `
        <iframe 
            src="${EAGLERCRAFT_URL}" 
            allow="autoplay; fullscreen; pointer-lock" 
            id="gameFrame">
        </iframe>
    `;
});

// 3. Sistema Dinâmico de Tela Cheia nativo do Navegador
btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        gameScreen.requestFullscreen().catch(err => {
            console.error(`Erro ao tentar ativar tela cheia: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// 4. Fechar o Jogo e retornar com segurança ao Menu
btnClose.addEventListener('click', () => {
    // Sai da tela cheia caso esteja ativa
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }

    // Oculta a tela do jogo e remove o iframe para limpar a memória do navegador
    gameScreen.classList.add('hidden');
    gameContainer.innerHTML = ''; 
    launcherScreen.classList.remove('hidden');
});

// Inicializa os efeitos visuais de fundo ao carregar o script
createAmbientBackground();