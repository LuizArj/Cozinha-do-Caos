// Cozinha do Caos - Engine Principal HD (1280x704 @ 60FPS)
import { SoundManager } from '../audio/SoundManager.js';
import { OrdersManager } from './OrdersManager.js';
import { KitchenMap } from './KitchenMap.js';
import { ParticleSystem } from './Particles.js';
import { NetworkHost } from './NetworkHost.js';

export const GameState = {
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER'
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.sound = new SoundManager();
    this.particles = new ParticleSystem();
    this.orders = new OrdersManager();
    this.map = new KitchenMap(this.orders);
    this.network = new NetworkHost(this);

    this.state = GameState.LOBBY;
    this.gameTime = 210; // 3 min e 30 seg
    this.totalGameTime = 210;

    this.lastTime = 0;
    this.screenShake = 0;
    this.floatingTexts = []; // { text, x, y, color, life, maxLife }

    this.setupResize();
    this.init();
  }

  setupResize() {
    this.canvas.width = 1280;
    this.canvas.height = 704;
  }

  async init() {
    await this.network.fetchServerInfo();
    this.network.connect();
    this.startLoop();
  }

  startGame() {
    this.sound.init();
    this.sound.playDing();
    this.orders.reset();
    this.map.setupKitchen();
    this.gameTime = this.totalGameTime;
    this.state = GameState.PLAYING;
    this.spawnFloatingText('GO! COZINHEM!', 640, 300, '#fbbf24', 2.0);
  }

  returnToLobby() {
    this.state = GameState.LOBBY;
  }

  spawnFloatingText(text, x, y, color = '#fbbf24', duration = 1.5) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      life: duration,
      maxLife: duration
    });
  }

  startLoop() {
    const loop = (timestamp) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    this.particles.update(dt);
    this.network.update(dt);

    // Atualizar textos flutuantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= dt * 35;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }

    if (this.state === GameState.PLAYING) {
      this.gameTime -= dt;
      if (this.gameTime <= 0) {
        this.gameTime = 0;
        this.state = GameState.GAMEOVER;
        this.sound.playDing();
        this.particles.spawnConfetti(640, 350);
      }

      this.orders.update(dt, this.sound);
      this.map.update(dt, this.sound, this.particles);

      for (const [id, chef] of this.network.chefs) {
        const prevHolding = chef.holdingItem ? chef.holdingItem.name : null;
        chef.update(dt, this.map, this.sound, this.particles);
        const newHolding = chef.holdingItem ? chef.holdingItem.name : null;

        if (prevHolding !== newHolding) {
          this.network.sendPlayerFeedback(id, {
            holding: chef.holdingItem ? {
              name: chef.holdingItem.name,
              icon: chef.holdingItem.icon
            } : null,
            vibrate: 25
          });
        }
      }
    } else if (this.state === GameState.LOBBY) {
      for (const [id, chef] of this.network.chefs) {
        chef.update(dt, this.map, this.sound, this.particles);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    if (this.screenShake > 0) {
      const sx = (Math.random() * 2 - 1) * this.screenShake;
      const sy = (Math.random() * 2 - 1) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Mapa e Bancadas HD
    this.map.render(ctx);

    // 2. Chefs
    for (const chef of this.network.chefs.values()) {
      chef.render(ctx);
    }

    // 3. Partículas
    this.particles.render(ctx);

    // 4. Textos Flutuantes
    for (const ft of this.floatingTexts) {
      ctx.save();
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.font = '900 22px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();

    // 5. HUD e Telas
    if (this.state === GameState.PLAYING) {
      this.renderHUD(ctx);
    } else if (this.state === GameState.LOBBY) {
      this.renderLobby(ctx);
    } else if (this.state === GameState.GAMEOVER) {
      this.renderGameOver(ctx);
    }
  }

  // ==================== HUD DE RESTAURANTE HD ====================
  renderHUD(ctx) {
    const w = this.canvas.width;

    // Fita metálica de suporte de comandas
    const gradBar = ctx.createLinearGradient(0, 0, 0, 56);
    gradBar.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    gradBar.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
    ctx.fillStyle = gradBar;
    ctx.fillRect(0, 0, w, 58);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, w, 58);

    // Renderizar Comandas estilo Tickets de Restaurante
    let orderX = 16;
    this.orders.orders.forEach((order) => {
      this.renderOrderTicket(ctx, order, orderX, 6);
      orderX += 165;
    });

    // Placar e Timer no canto direito (Card elegante com blur)
    const scoreCardW = 200;
    const scoreCardX = w - scoreCardW - 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(scoreCardX, 6, scoreCardW, 46, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.stroke();

    // Pontuação
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 18px Outfit, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`⭐ ${this.orders.score} PTS`, scoreCardX + scoreCardW - 12, 26);

    // Relógio / Tempo Restante
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    const timeStr = `⏱️ ${mins}:${secs < 10 ? '0' : ''}${secs}`;
    ctx.fillStyle = this.gameTime < 30 ? '#ef4444' : '#f8fafc';
    ctx.font = '800 15px Outfit, sans-serif';
    ctx.fillText(timeStr, scoreCardX + scoreCardW - 12, 44);
  }

  renderOrderTicket(ctx, order, x, y) {
    const w = 155;
    const h = 46;
    const timeRatio = Math.max(0, order.timeLeft / order.totalTime);

    // Pregador de madeira no topo
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + w / 2 - 12, y - 2, 24, 6);

    // Cartão estilo papel kraft
    const gradPaper = ctx.createLinearGradient(x, y, x + w, y + h);
    gradPaper.addColorStop(0, '#fef3c7');
    gradPaper.addColorStop(1, '#fde68a');
    ctx.fillStyle = gradPaper;
    ctx.beginPath();
    ctx.roundRect(x, y + 2, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Nome e ícone da receita
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${order.recipe.icon} ${order.recipe.name}`, x + 8, y + 18);

    // Ingredientes necessários
    let ingX = x + 8;
    order.recipe.required.forEach(req => {
      let icon = '📦';
      if (req.type === 'BUN') icon = '🍞';
      else if (req.type === 'MEAT') icon = '🥩';
      else if (req.type === 'TOMATO') icon = '🍅';
      else if (req.type === 'LETTUCE') icon = '🥬';
      else if (req.type === 'CHEESE') icon = '🧀';

      ctx.font = '13px sans-serif';
      ctx.fillText(icon, ingX, y + 36);
      ingX += 20;
    });

    // Barra de tempo com degradê colorido
    let barColor = '#10b981';
    if (timeRatio < 0.3) barColor = '#ef4444';
    else if (timeRatio < 0.6) barColor = '#f59e0b';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x + 6, y + h - 5, w - 12, 4);

    ctx.fillStyle = barColor;
    ctx.fillRect(x + 6, y + h - 5, (w - 12) * timeRatio, 4);
  }

  // ==================== LOBBY MODERNO COM QR CODE ====================
  renderLobby(ctx) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
    ctx.fillRect(0, 0, w, h);

    const cardW = 900;
    const cardH = 540;
    const cardX = (w - cardW) / 2;
    const cardY = (h - cardH) / 2;

    // Card Principal
    const gradCard = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    gradCard.addColorStop(0, '#1e293b');
    gradCard.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradCard;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Título Principal
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 36px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍳 COZINHA DO CAOS 🔪', w / 2, cardY + 56);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px Outfit, sans-serif';
    ctx.fillText('Conecte seu celular pelo QR Code ou jogue direto no teclado do PC!', w / 2, cardY + 84);

    // QR Code no lado esquerdo
    const qrX = cardX + 60;
    const qrY = cardY + 120;
    const qrSize = 220;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 14);
    ctx.fill();

    if (this.network.serverInfo.qrCode) {
      if (!this.qrImg) {
        this.qrImg = new Image();
        this.qrImg.src = this.network.serverInfo.qrCode;
      }
      if (this.qrImg.complete) {
        ctx.drawImage(this.qrImg, qrX, qrY, qrSize, qrSize);
      }
    }

    // Informações de Conexão à Direita
    const infoX = qrX + qrSize + 50;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📱 No Celular acesse:', infoX, qrY + 25);

    const accessUrl = this.network.serverInfo.controllerUrl || `http://${this.network.serverInfo.localIP}:3000/controller`;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillText(accessUrl, infoX, qrY + 55);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 18px Outfit, sans-serif';
    ctx.fillText(`🔑 Sala: ${this.network.roomCode}`, infoX, qrY + 90);

    // Teclas do PC
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px Outfit, sans-serif';
    ctx.fillText('💻 Teclado PC:', infoX, qrY + 130);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Outfit, sans-serif';
    ctx.fillText('• WASD / Setas: Mover', infoX + 10, qrY + 152);
    ctx.fillText('• ESPAÇO: Pegar / Largar / Montar', infoX + 10, qrY + 172);
    ctx.fillText('• E: Cortar na tábua / Lavar pia / Extintor', infoX + 10, qrY + 192);
    ctx.fillText('• SHIFT: Correr (Dash)', infoX + 10, qrY + 212);

    // Lista de Chefs Conectados
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.fillText(`Chefs Conectados (${this.network.chefs.size}):`, qrX, cardY + 390);

    let chefX = qrX;
    if (this.network.chefs.size === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 14px Outfit, sans-serif';
      ctx.fillText('Aguardando chefs entrarem...', chefX, cardY + 420);
    } else {
      for (const chef of this.network.chefs.values()) {
        ctx.fillStyle = chef.color;
        ctx.beginPath();
        ctx.arc(chefX + 12, cardY + 418, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.fillText(chef.name, chefX + 30, cardY + 423);
        chefX += 160;
      }
    }

    // Botão "COMEÇAR A JOGAR"
    const btnW = 300;
    const btnH = 54;
    const btnX = (w - btnW) / 2;
    const btnY = cardY + cardH - 74;

    const gradBtn = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    gradBtn.addColorStop(0, '#10b981');
    gradBtn.addColorStop(1, '#059669');
    ctx.fillStyle = gradBtn;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 14);
    ctx.fill();
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COMEÇAR A JOGAR! 🚀', w / 2, btnY + 34);
  }

  // ==================== TELA DE GAMEOVER ====================
  renderGameOver(ctx) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(11, 15, 25, 0.94)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 48px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FIM DE TURNO! ⏰', w / 2, 180);

    let stars = '⭐';
    if (this.orders.score >= 500) stars = '⭐⭐';
    if (this.orders.score >= 1000) stars = '⭐⭐⭐';
    ctx.font = '54px sans-serif';
    ctx.fillText(stars, w / 2, 260);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Outfit, sans-serif';
    ctx.fillText(`Pontuação Final: ${this.orders.score} pts`, w / 2, 320);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px Outfit, sans-serif';
    ctx.fillText(`✅ Pedidos Entregues: ${this.orders.deliveredCount}   |   ❌ Pedidos Perdidos: ${this.orders.failedCount}`, w / 2, 365);

    // Botão Jogar Novamente
    const btnW = 260;
    const btnH = 50;
    const btnX = (w - btnW) / 2;
    const btnY = 420;

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 14);
    ctx.fill();

    ctx.fillStyle = '#1e1b4b';
    ctx.font = '900 18px Outfit, sans-serif';
    ctx.fillText('JOGAR NOVAMENTE 🔄', w / 2, btnY + 32);
  }
}
