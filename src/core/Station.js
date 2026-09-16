// Cozinha do Caos - Estações de Trabalho em Alta Fidelidade (Tile 64px)
import { Item, ItemType, ItemState } from './Item.js';

export const StationType = {
  COUNTER: 'COUNTER',
  SPAWNER: 'SPAWNER',
  CUTTING_BOARD: 'CUTTING_BOARD',
  STOVE: 'STOVE',
  SINK: 'SINK',
  TRASH: 'TRASH',
  DELIVERY: 'DELIVERY',
  EXTINGUISHER_RACK: 'EXTINGUISHER_RACK'
};

export class Station {
  constructor(x, y, type, spawnItemType = null, tileSize = 64) {
    this.x = x; // Grid col (0..19)
    this.y = y; // Grid row (0..10)
    this.type = type;
    this.spawnItemType = spawnItemType;
    this.tileSize = tileSize;

    this.item = null;
    this.isHighlighted = false;

    this.processProgress = 0;
    this.isOnFire = false;
    this.fireTimer = 0;
    this.animTimer = Math.random() * 10;
  }

  get pixelX() {
    return this.x * this.tileSize;
  }

  get pixelY() {
    return this.y * this.tileSize;
  }

  update(dt, soundManager, particles) {
    this.animTimer += dt;

    if (this.type === StationType.STOVE) {
      if (this.item && this.item.type === ItemType.MEAT) {
        if (this.item.state === ItemState.CHOPPED) {
          this.item.cookProgress += dt * 20; // 5s
          if (Math.random() < 0.4) {
            particles.spawnSmoke(this.pixelX + this.tileSize / 2, this.pixelY + 24);
          }

          if (this.item.cookProgress >= 100) {
            this.item.state = ItemState.COOKED;
            this.item.cookProgress = 100;
          }
        } else if (this.item.state === ItemState.COOKED) {
          this.item.cookProgress += dt * 16.6; // 6s extras

          if (this.item.cookProgress >= 150 && !this.isOnFire) {
            if (Math.random() < 0.2) {
              soundManager.playAlarm();
            }
            particles.spawnSmoke(this.pixelX + this.tileSize / 2, this.pixelY + 24, true);
          }

          if (this.item.cookProgress >= 200) {
            this.item.state = ItemState.BURNT;
            this.isOnFire = true;
            soundManager.playError();
          }
        }
      }

      if (this.isOnFire) {
        particles.spawnFire(this.pixelX + this.tileSize / 2, this.pixelY + 28);
        if (Math.random() < 0.12) {
          soundManager.playAlarm();
        }
      }
    }
  }

  performAction(dt, chef, soundManager, particles) {
    if (this.isOnFire && chef.holdingItem && chef.holdingItem.type === ItemType.EXTINGUISHER) {
      this.fireTimer += dt;
      particles.spawnExtinguisherFoam(this.pixelX + this.tileSize / 2, this.pixelY + this.tileSize / 2);
      if (this.fireTimer >= 1.2) {
        this.isOnFire = false;
        this.fireTimer = 0;
        soundManager.playWash();
      }
      return true;
    }

    if (this.type === StationType.CUTTING_BOARD && this.item && this.item.canBeChopped()) {
      this.item.chopProgress += dt * 50;
      soundManager.playChop();
      particles.spawnChopSparks(this.pixelX + this.tileSize / 2, this.pixelY + this.tileSize / 2, this.item.type);

      if (this.item.chopProgress >= 100) {
        this.item.state = ItemState.CHOPPED;
        this.item.chopProgress = 100;
        soundManager.playPickup();
      }
      return true;
    }

    if (this.type === StationType.SINK && this.item && this.item.type === ItemType.DIRTY_PLATE) {
      this.processProgress += dt * 45;
      soundManager.playWash();
      particles.spawnWaterSplash(this.pixelX + this.tileSize / 2, this.pixelY + this.tileSize / 2);

      if (this.processProgress >= 100) {
        this.item = new Item(ItemType.PLATE);
        this.processProgress = 0;
        soundManager.playDing();
      }
      return true;
    }

    return false;
  }

  render(ctx) {
    const size = this.tileSize;
    const px = this.pixelX;
    const py = this.pixelY;

    ctx.save();
    ctx.translate(px, py);

    // 1. Sombra da bancada no chão
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, size - 4, size, 8);

    // 2. Base de Madeira nobre (Carvalho escuro com veios)
    const gradBase = ctx.createLinearGradient(0, 0, 0, size);
    gradBase.addColorStop(0, '#5c2c16');
    gradBase.addColorStop(1, '#3b1708');
    ctx.fillStyle = gradBase;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 6);
    ctx.fill();

    // 3. Tampo Superior (Inox Escovado com Reflexo de Luz)
    const gradInox = ctx.createLinearGradient(0, 2, size, size - 12);
    gradInox.addColorStop(0, '#e2e8f0');
    gradInox.addColorStop(0.4, '#cbd5e1');
    gradInox.addColorStop(0.6, '#94a3b8');
    gradInox.addColorStop(1, '#64748b');
    ctx.fillStyle = gradInox;
    ctx.beginPath();
    ctx.roundRect(3, 3, size - 6, size - 14, 4);
    ctx.fill();

    // Brilho especular no topo do inox
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(5, 5, size - 10, 3);

    // 4. Detalhes específicos de cada estação
    switch (this.type) {
      case StationType.SPAWNER:
        this.renderSpawner(ctx, size);
        break;
      case StationType.CUTTING_BOARD:
        this.renderCuttingBoard(ctx, size);
        break;
      case StationType.STOVE:
        this.renderStove(ctx, size);
        break;
      case StationType.SINK:
        this.renderSink(ctx, size);
        break;
      case StationType.TRASH:
        this.renderTrash(ctx, size);
        break;
      case StationType.DELIVERY:
        this.renderDelivery(ctx, size);
        break;
      case StationType.EXTINGUISHER_RACK:
        this.renderExtinguisherRack(ctx, size);
        break;
    }

    // 5. Renderizar Item em cima da bancada
    if (this.item) {
      this.item.render(ctx, size / 2, size / 2 - 4, 44);

      if (this.type === StationType.CUTTING_BOARD && this.item.canBeChopped() && this.item.chopProgress > 0 && this.item.chopProgress < 100) {
        this.renderProgressBar(ctx, this.item.chopProgress / 100, '#38bdf8', size);
      }

      if (this.type === StationType.STOVE && this.item.type === ItemType.MEAT) {
        if (this.item.state === ItemState.CHOPPED) {
          this.renderProgressBar(ctx, this.item.cookProgress / 100, '#22c55e', size);
        } else if (this.item.state === ItemState.COOKED) {
          const dangerPct = Math.min(1, (this.item.cookProgress - 100) / 100);
          this.renderProgressBar(ctx, dangerPct, '#ef4444', size, true);
        }
      }
    }

    if (this.type === StationType.SINK && this.processProgress > 0) {
      this.renderProgressBar(ctx, this.processProgress / 100, '#60a5fa', size);
    }

    // 6. Contorno brilhante de foco quando o Chef mira nesta bancada
    if (this.isHighlighted) {
      const pulse = 0.6 + Math.sin(Date.now() / 150) * 0.4;
      ctx.strokeStyle = `rgba(250, 204, 21, ${pulse})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(1, 1, size - 2, size - 2, 6);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderSpawner(ctx, size) {
    // Caixa de madeira de feira rústica com ripas
    const bx = 8;
    const by = 8;
    const bw = size - 16;
    const bh = size - 24;

    ctx.fillStyle = '#92400e';
    ctx.fillRect(bx, by, bw, bh);

    // Ripas de madeira
    ctx.fillStyle = '#b45309';
    ctx.fillRect(bx + 2, by + 2, bw - 4, 8);
    ctx.fillRect(bx + 2, by + 12, bw - 4, bh - 14);

    // Palha no fundo
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(bx + 4, by + 4, bw - 8, 4);

    // Mock do item gerado
    const tempItem = new Item(this.spawnItemType);
    tempItem.render(ctx, size / 2, size / 2 - 4, 34);
  }

  renderCuttingBoard(ctx, size) {
    // Tábua de corte de faia nobre
    const bx = 10;
    const by = 8;
    const bw = size - 20;
    const bh = size - 24;

    const gradWood = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    gradWood.addColorStop(0, '#fed7aa');
    gradWood.addColorStop(1, '#fba749');
    ctx.fillStyle = gradWood;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 5);
    ctx.fill();
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Faca de Chef Japonesa elegante
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(bx + bw - 4, by + 4);
    ctx.lineTo(bx + bw - 8, by + 4);
    ctx.lineTo(bx + bw - 8, by + bh - 8);
    ctx.lineTo(bx + bw - 4, by + bh - 12);
    ctx.closePath();
    ctx.fill();

    // Cabo da faca
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx + bw - 7, by + bh - 8, 5, 8);
  }

  renderStove(ctx, size) {
    const cx = size / 2;
    const cy = size / 2 - 4;

    // Placa de indução preta
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(8, 6, size - 16, size - 20, 6);
    ctx.fill();

    // Queimador com chama viva
    const flameRadius = 18;
    ctx.fillStyle = this.isOnFire ? '#dc2626' : 'rgba(30, 41, 59, 0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, flameRadius, 0, Math.PI * 2);
    ctx.fill();

    // Chamas azuis/laranjas animadas
    if (!this.isOnFire) {
      const flicker = Math.sin(this.animTimer * 12) * 1.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, flameRadius - 4 + flicker, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Frigideira de ferro fundido com cabo
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Cabo da frigideira
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 2, cy + 13, 4, 10);
  }

  renderSink(ctx, size) {
    const bx = 8;
    const by = 6;
    const bw = size - 16;
    const bh = size - 20;

    // Cuba profunda em aço inox escovado
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 5);
    ctx.fill();

    // Água cristalina animada
    const gradWater = ctx.createLinearGradient(bx, by, bx, by + bh);
    gradWater.addColorStop(0, '#60a5fa');
    gradWater.addColorStop(1, '#2563eb');
    ctx.fillStyle = gradWater;
    ctx.beginPath();
    ctx.roundRect(bx + 3, by + 3, bw - 6, bh - 6, 4);
    ctx.fill();

    // Ondinhas na água
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const wave = Math.sin(this.animTimer * 4) * 2;
    ctx.fillRect(bx + 6, by + 8 + wave, bw - 12, 2);

    // Torneira cromada em arco
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(size / 2 - 3, 2, 6, 9);
    ctx.beginPath();
    ctx.arc(size / 2, 10, 5, 0, Math.PI);
    ctx.fill();
  }

  renderTrash(ctx, size) {
    const cx = size / 2;
    const cy = size / 2 - 4;

    // Lixeira de inox cilíndrica com pedal
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(cx - 16, cy - 14, 32, 28, 6);
    ctx.fill();

    // Tampa
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(cx - 18, cy - 18, 36, 8, 4);
    ctx.fill();

    // Ícone 🗑️
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🗑️', cx, cy + 2);
  }

  renderDelivery(ctx, size) {
    // Esteira de metal com acabamento dourado e sino de serviço
    const gradBelt = ctx.createLinearGradient(0, 0, size, 0);
    gradBelt.addColorStop(0, '#059669');
    gradBelt.addColorStop(0.5, '#10b981');
    gradBelt.addColorStop(1, '#059669');
    ctx.fillStyle = gradBelt;
    ctx.beginPath();
    ctx.roundRect(4, 4, size - 8, size - 14, 6);
    ctx.fill();

    // Sino de serviço dourado clássico (🛎️)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 - 6, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(size / 2 - 12, size / 2 - 6, 24, 3);
    ctx.fillRect(size / 2 - 2, size / 2 - 19, 4, 4);

    // Texto de entrega
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ENTREGA ⬇️', size / 2, size - 16);
  }

  renderExtinguisherRack(ctx, size) {
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.roundRect(8, 6, size - 16, size - 20, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧯', size / 2, size / 2 - 4);
  }

  renderProgressBar(ctx, pct, color, size, isPulsing = false) {
    const w = size - 16;
    const h = 7;
    const x = 8;
    const y = size - 13;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x - 1, y - 1, w + 2, h + 2, 4);
    ctx.fill();

    ctx.fillStyle = color;
    if (isPulsing && Math.floor(Date.now() / 120) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w * Math.max(0, Math.min(1, pct)), h, 3);
    ctx.fill();
  }
}
