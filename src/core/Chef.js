// Cozinha do Caos - Entidade Chef (Chibi HD + Física Fluida de Colisão)
import { Item, ItemType } from './Item.js';

export class Chef {
  constructor(id, name, color, x = 320, y = 300) {
    this.id = id;
    this.name = name;
    this.color = color || '#EF4444';
    
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 240; // Pixels por segundo (escala 64px)
    this.feetRadius = 14; // Colisão nos pés

    this.facing = { x: 0, y: 1 };
    this.walkCycle = 0;
    this.isMoving = false;
    this.isDashing = false;
    this.dashCooldown = 0;
    this.hatTilt = 0;

    this.holdingItem = null;
    this.targetStation = null;

    this.input = {
      dx: 0,
      dy: 0,
      actionA: false,
      actionB: false,
      dash: false
    };

    this.lastActionA = false;
    this.lastActionB = false;
  }

  update(dt, kitchenMap, soundManager, particles) {
    // Dash / Arrancada
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
    }

    let moveSpeed = this.speed;
    if (this.input.dash && this.dashCooldown <= 0 && (this.input.dx !== 0 || this.input.dy !== 0)) {
      moveSpeed *= 1.8;
      this.dashCooldown = 0.7;
      soundManager.playDash();
      particles.spawnDashDust(this.x, this.y + 16);
    }

    // Vetor de movimento
    const inputLen = Math.hypot(this.input.dx, this.input.dy);
    if (inputLen > 0.05) {
      this.vx = (this.input.dx / inputLen) * moveSpeed;
      this.vy = (this.input.dy / inputLen) * moveSpeed;
      this.facing = { x: this.input.dx / inputLen, y: this.input.dy / inputLen };
      this.isMoving = true;
      this.walkCycle += dt * 14;
      this.hatTilt = Math.sin(this.walkCycle) * 0.12;
    } else {
      this.vx = 0;
      this.vy = 0;
      this.isMoving = false;
      this.hatTilt *= 0.8;
    }

    // Movimentação eixo a eixo com colisão nos pés (feetY = y + 14)
    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;

    const feetOffsetY = 14;

    // Testar movimento em X
    if (!kitchenMap.checkCollision(nextX, this.y + feetOffsetY, this.feetRadius)) {
      this.x = nextX;
    }
    // Testar movimento em Y
    if (!kitchenMap.checkCollision(this.x, nextY + feetOffsetY, this.feetRadius)) {
      this.y = nextY;
    }

    // Auto-descolagem caso o chef fique sobreposto em alguma quina
    kitchenMap.resolveOverlap(this, feetOffsetY, this.feetRadius);

    // Identificar a bancada na mira à frente
    this.targetStation = kitchenMap.getStationInFront(this.x, this.y + feetOffsetY, this.facing);

    // Tratar Ação A (Pegar / Largar / Montar)
    if (this.input.actionA && !this.lastActionA) {
      this.handleActionA(kitchenMap, soundManager, particles);
    }

    // Tratar Ação B (Ação contínua de Cortar / Lavar / Extintor)
    if (this.input.actionB && this.targetStation) {
      this.targetStation.performAction(dt, this, soundManager, particles);
    }

    this.lastActionA = this.input.actionA;
    this.lastActionB = this.input.actionB;
  }

  handleActionA(kitchenMap, soundManager, particles) {
    if (!this.targetStation) return;
    const station = this.targetStation;

    // 1. Lixeira
    if (station.type === 'TRASH') {
      if (this.holdingItem) {
        this.holdingItem = null;
        soundManager.playTrash();
        particles.spawnTrashPoof(station.pixelX + station.tileSize/2, station.pixelY + station.tileSize/2);
      }
      return;
    }

    // 2. Balcão de Entrega
    if (station.type === 'DELIVERY') {
      if (this.holdingItem && (this.holdingItem.type === 'PLATE' || this.holdingItem.contents.length > 0)) {
        const delivered = kitchenMap.deliverPlate(this.holdingItem, soundManager, particles);
        if (delivered) {
          this.holdingItem = null;
        }
      }
      return;
    }

    // 3. Extintor
    if (station.type === 'EXTINGUISHER_RACK') {
      if (!this.holdingItem) {
        this.holdingItem = new Item(ItemType.EXTINGUISHER);
        soundManager.playPickup();
      } else if (this.holdingItem.type === ItemType.EXTINGUISHER) {
        this.holdingItem = null;
        soundManager.playDrop();
      }
      return;
    }

    // 4. Se o jogador estiver de mãos vazias
    if (!this.holdingItem) {
      if (station.item) {
        this.holdingItem = station.item;
        station.item = null;
        soundManager.playPickup();
      } else if (station.type === 'SPAWNER' && station.spawnItemType) {
        this.holdingItem = new Item(station.spawnItemType);
        soundManager.playPickup();
        particles.spawnPickupPop(station.pixelX + station.tileSize/2, station.pixelY + station.tileSize/2);
      }
      return;
    }

    // 5. Se o jogador estiver segurando um item
    if (this.holdingItem) {
      if (!station.item && station.type !== 'SPAWNER') {
        station.item = this.holdingItem;
        this.holdingItem = null;
        soundManager.playDrop();
        return;
      }

      // Montagem no prato
      if (station.item) {
        if (station.item.type === 'PLATE') {
          const added = station.item.addIngredientToPlate(this.holdingItem);
          if (added) {
            this.holdingItem = null;
            soundManager.playDrop();
            particles.spawnPickupPop(station.pixelX + station.tileSize/2, station.pixelY + station.tileSize/2);
            return;
          }
        }

        if (this.holdingItem.type === 'PLATE') {
          const added = this.holdingItem.addIngredientToPlate(station.item);
          if (added) {
            station.item = null;
            soundManager.playPickup();
            particles.spawnPickupPop(station.pixelX + station.tileSize/2, station.pixelY + station.tileSize/2);
            return;
          }
        }
      }
    }
  }

  // Renderização do Chef Chibi HD
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Aura / Glow nos pés na cor do jogador
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 16, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // 2. Sombra suave
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Sapatinhos e Pernas
    const legOffset = this.isMoving ? Math.sin(this.walkCycle) * 5 : 0;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-10, 12 + legOffset, 7, 9, 3);
    ctx.roundRect(3, 12 - legOffset, 7, 9, 3);
    ctx.fill();

    // 4. Corpo e Avental colorido com degradê
    const gradBody = ctx.createLinearGradient(0, -10, 0, 14);
    gradBody.addColorStop(0, this.color);
    gradBody.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradBody;
    ctx.beginPath();
    ctx.roundRect(-14, -8, 28, 22, 8);
    ctx.fill();

    // Peitilho branco do avental
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 16, 4);
    ctx.fill();

    // Bolsinho frontal
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-5, 2, 10, 8);

    // 5. Cabeça Chibi fofinha
    const headGrad = ctx.createRadialGradient(-3, -16, 2, 0, -15, 14);
    headGrad.addColorStop(0, '#ffedd5');
    headGrad.addColorStop(1, '#fed7aa');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, -14, 13, 0, Math.PI * 2);
    ctx.fill();

    // Bochechas rosadas (Blush fofo)
    ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
    ctx.beginPath();
    ctx.arc(-8, -12, 3, 0, Math.PI * 2);
    ctx.arc(8, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Olhos expressivos com reflexo brilhante
    const lookX = this.facing.x * 4;
    const lookY = this.facing.y * 2.5;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-4 + lookX, -15 + lookY, 2.8, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(4 + lookX, -15 + lookY, 2.8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brilho dos olhos (pupilas vivas)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5 + lookX, -16 + lookY, 1.2, 0, Math.PI * 2);
    ctx.arc(3 + lookX, -16 + lookY, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Chapéu de Chef Alto com física de balanço
    ctx.save();
    ctx.translate(0, -26);
    ctx.rotate(this.hatTilt);

    // Base do chapéu
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-10, 0, 20, 8);
    ctx.fillStyle = this.color;
    ctx.fillRect(-10, 5, 20, 3); // Faixa colorida do chapéu

    // Cúpula bufante do chapéu
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -6, 12, 0, Math.PI * 2);
    ctx.arc(-8, -4, 8, 0, Math.PI * 2);
    ctx.arc(8, -4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. Mãozinhas levantadas se estiver segurando item
    if (this.holdingItem) {
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(-14, -20, 4, 0, Math.PI * 2);
      ctx.arc(14, -20, 4, 0, Math.PI * 2);
      ctx.fill();

      // Flutuação do item acima da cabeça
      const bob = Math.sin(Date.now() / 140) * 3;
      this.holdingItem.render(ctx, 0, -56 + bob, 42);
    }

    // 8. Nome do Chef em badge elegante
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    const nameWidth = ctx.measureText(this.name).width || 40;
    ctx.roundRect(-nameWidth/2 - 6, -42, nameWidth + 12, 14, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.name, 0, -35);

    ctx.restore();
  }
}
