// Cozinha do Caos - Main Host HD
import { Game, GameState } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new Game(canvas);

  // Click no canvas para os botões do Lobby e Game Over
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (game.state === GameState.LOBBY) {
      // Botão "COMEÇAR A JOGAR"
      const cardH = 540;
      const cardY = (canvas.height - cardH) / 2;
      const btnW = 300;
      const btnH = 54;
      const btnX = (canvas.width - btnW) / 2;
      const btnY = cardY + cardH - 74;

      if (clickX >= btnX && clickX <= btnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
        game.startGame();
      }
    } else if (game.state === GameState.GAMEOVER) {
      // Botão "JOGAR NOVAMENTE"
      const btnW = 260;
      const btnH = 50;
      const btnX = (canvas.width - btnW) / 2;
      const btnY = 420;

      if (clickX >= btnX && clickX <= btnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
        game.startGame();
      }
    }
  });

  // Atalho de teclado: ENTER inicia ou reinicia a partida
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      if (game.state === GameState.LOBBY || game.state === GameState.GAMEOVER) {
        game.startGame();
      }
    }
  });

  // Som Ativo / Mudo
  const btnAudio = document.getElementById('btn-sound-toggle');
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      game.sound.init();
      const isMuted = game.sound.toggleMute();
      btnAudio.textContent = isMuted ? '🔇 Mudo' : '🔊 Som Ativo';
    });
  }

  // Tela Cheia
  const btnFullscreen = document.getElementById('btn-fullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {});
      } else {
        document.exitFullscreen().catch(err => {});
      }
    });
  }
});
