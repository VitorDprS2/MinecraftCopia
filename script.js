const games = [
  {
    title: "Jogo da Velha",
    desc: "Desafie a IA ou jogue com um amigo localmente.",
    url: "https://playtictactoe.org/"
  },
  {
    title: "2048",
    desc: "Combine blocos numéricos iguais até chegar em 2048.",
    url: "https://play2048.co/"
  },
  {
    title: "Pac-Man",
    desc: "Jogue o clássico arcade diretamente no navegador.",
    url: "https://pacman.place/"
  }
];

const grid = document.getElementById('game-grid');
const modal = document.getElementById('game-modal');
const iframe = document.getElementById('game-iframe');

function renderGames() {
  grid.innerHTML = games.map(game => `
    <div class="card">
      <div>
        <h2>${game.title}</h2>
        <p>${game.desc}</p>
      </div>
      <button class="btn" onclick="openGame('${game.url}')">Jogar Agora</button>
    </div>
  `).join('');
}

function openGame(url) {
  iframe.src = url;
  modal.style.display = 'flex';
}

function closeGame() {
  modal.style.display = 'none';
  iframe.src = '';
}

renderGames();