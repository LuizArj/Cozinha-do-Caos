// Cozinha do Caos - Mapa HD da Cozinha (1280x704, Tile 64px)
import { Station, StationType } from './Station.js';
import { ItemType, Item } from './Item.js';

export class KitchenMap {
  constructor(ordersManager) {
    this.ordersManager = ordersManager;
    this.cols = 20;
    this.rows = 11;
    this.tileSize = 64;
    this.stations = [];
    this.setupKitchen();
  }

  setupKitchen() {
    this.stations = [];
    const ts = this.tileSize;

    // ==================== BALCÕES DO TOPO (Row 1) ====================
    // Spawners de Ingredientes e Tábuas
    this.addStation(2, 1, StationType.SPAWNER, ItemType.BUN);         // Pão
    this.addStation(3, 1, StationType.SPAWNER, ItemType.MEAT);        // Carne
    this.addStation(4, 1, StationType.CUTTING_BOARD);                 // Tábua de Corte 1
    this.addStation(5, 1, StationType.CUTTING_BOARD);                 // Tábua de Corte 2
    this.addStation(6, 1, StationType.SPAWNER, ItemType.TOMATO);      // Tomate
    this.addStation(7, 1, StationType.SPAWNER, ItemType.LETTUCE);     // Alface
    this.addStation(8, 1, StationType.SPAWNER, ItemType.CHEESE);      // Queijo
    this.addStation(9, 1, StationType.COUNTER);                       // Balcão Livre Topo
    this.addStation(10, 1, StationType.COUNTER);                      // Balcão Livre Topo
    this.addStation(11, 1, StationType.SPAWNER, ItemType.PLATE);      // Pilha de Pratos
    this.addStation(12, 1, StationType.COUNTER);                      // Balcão Livre
    this.addStation(13, 1, StationType.CUTTING_BOARD);                // Tábua 3
    this.addStation(14, 1, StationType.SPAWNER, ItemType.TOMATO);     // Tomate Extra
    this.addStation(15, 1, StationType.EXTINGUISHER_RACK);            // Extintor Topo
    this.addStation(16, 1, StationType.TRASH);                        // Lixeira Topo
    this.addStation(17, 1, StationType.COUNTER);                      // Balcão Livre

    // ==================== ILHA CENTRAL SUPERIOR (Row 4) ====================
    this.addStation(4, 4, StationType.STOVE);                         // Fogão 1
    this.addStation(5, 4, StationType.STOVE);                         // Fogão 2
    this.addStation(6, 4, StationType.STOVE);                         // Fogão 3
    this.addStation(7, 4, StationType.COUNTER);                       // Balcão Ilha 1
    this.addStation(8, 4, StationType.COUNTER);                       // Balcão Ilha 2
    this.addStation(9, 4, StationType.CUTTING_BOARD);                 // Tábua Ilha
    this.addStation(10, 4, StationType.CUTTING_BOARD);                // Tábua Ilha
    this.addStation(11, 4, StationType.COUNTER);                      // Balcão Ilha 3
    this.addStation(12, 4, StationType.COUNTER);                      // Balcão Ilha 4
    this.addStation(13, 4, StationType.COUNTER);                      // Balcão Ilha 5
    this.addStation(14, 4, StationType.COUNTER);                      // Balcão Ilha 6
    this.addStation(15, 4, StationType.EXTINGUISHER_RACK);            // Extintor Ilha

    // ==================== ILHA CENTRAL INFERIOR (Row 6) ====================
    this.addStation(4, 6, StationType.COUNTER);                       // Balcão Ilha 7
    this.addStation(5, 6, StationType.COUNTER);                       // Balcão Ilha 8
    this.addStation(6, 6, StationType.COUNTER);                       // Balcão Ilha 9
    this.addStation(7, 6, StationType.COUNTER);                       // Balcão Ilha 10
    this.addStation(8, 6, StationType.COUNTER);                       // Balcão Ilha 11
    this.addStation(9, 6, StationType.COUNTER);                       // Balcão Ilha 12
    this.addStation(10, 6, StationType.COUNTER);                      // Balcão Ilha 13
    this.addStation(11, 6, StationType.COUNTER);                      // Balcão Ilha 14
    this.addStation(12, 6, StationType.COUNTER);                      // Balcão Ilha 15
    this.addStation(13, 6, StationType.COUNTER);                      // Balcão Ilha 16
    this.addStation(14, 6, StationType.COUNTER);                      // Balcão Ilha 17
    this.addStation(15, 6, StationType.COUNTER);                      // Balcão Ilha 18

    // ==================== BALCÕES DA BASE (Row 9) ====================
    this.addStation(2, 9, StationType.DELIVERY);                      // Entrega 1
    this.addStation(3, 9, StationType.DELIVERY);                      // Entrega 2
    this.addStation(4, 9, StationType.DELIVERY);                      // Entrega 3
    this.addStation(5, 9, StationType.COUNTER);                       // Balcão Base
    this.addStation(6, 9, StationType.COUNTER);                       // Balcão Base
    this.addStation(7, 9, StationType.COUNTER);                       // Balcão Base
    this.addStation(10, 9, StationType.SINK);                         // Pia de Lavar Louça 1
    this.addStation(11, 9, StationType.SINK);                         // Pia de Lavar Louça 2
    this.addStation(12, 9, StationType.COUNTER);                      // Balcão Base
    this.addStation(13, 9, StationType.COUNTER);                      // Balcão Base
    this.addStation(16, 9, StationType.TRASH);                        // Lixeira Base
    this.addStation(17, 9, StationType.COUNTER);                      // Balcão Base
  }

  addStation(x, y, type, spawnType = null) {
    const st = new Station(x, y, type, spawnType, this.tileSize);
    this.stations.push(st);
  }

  // Verifica colisão do círculo dos pés do Chef
  checkCollision(x, y, radius) {
    const minX = 64 + radius;
    const maxX = (this.cols - 1) * 64 - radius;
    const minY = 64 + radius;
    const maxY = (this.rows - 1) * 64 - radius;

    if (x < minX || x > maxX || y < minY || y > maxY) {
      return true;
    }

    for (const st of this.stations) {
      const rx = st.pixelX;
      const ry = st.pixelY;
      const rw = this.tileSize;
      const rh = this.tileSize;

      const closestX = Math.max(rx, Math.min(x, rx + rw));
      const closestY = Math.max(ry, Math.min(y, ry + rh));

      const dx = x - closestX;
      const dy = y - closestY;
      if (dx * dx + dy * dy < radius * radius) {
        return true;
      }
    }

    return false;
  }

  // Descola suavemente o Chef caso fique preso em quinas
  resolveOverlap(chef, feetOffsetY, radius) {
    const feetY = chef.y + feetOffsetY;

    for (const st of this.stations) {
      const rx = st.pixelX;
      const ry = st.pixelY;
      const rw = this.tileSize;
      const rh = this.tileSize;

      const closestX = Math.max(rx, Math.min(chef.x, rx + rw));
      const closestY = Math.max(ry, Math.min(feetY, ry + rh));

      const dx = chef.x - closestX;
      const dy = feetY - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < radius * radius && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const overlap = radius - dist;
        const pushX = (dx / dist) * overlap;
        const pushY = (dy / dist) * overlap;

        chef.x += pushX;
        chef.y += pushY;
      }
    }
  }

  // Identifica o balcão apontado pela direção do Chef
  getStationInFront(chefX, feetY, facing) {
    this.stations.forEach(s => s.isHighlighted = false);

    const checkDist = 52;
    const targetX = chefX + facing.x * checkDist;
    const targetY = feetY + facing.y * checkDist;

    let closestStation = null;
    let minDistance = 9999;

    for (const st of this.stations) {
      const centerX = st.pixelX + this.tileSize / 2;
      const centerY = st.pixelY + this.tileSize / 2;

      const dist = Math.hypot(targetX - centerX, targetY - centerY);
      if (dist < 46 && dist < minDistance) {
        minDistance = dist;
        closestStation = st;
      }
    }

    if (closestStation) {
      closestStation.isHighlighted = true;
    }

    return closestStation;
  }

  deliverPlate(plateItem, soundManager, particles) {
    const result = this.ordersManager.checkDelivery(plateItem);
    if (result && result.success) {
      soundManager.playDing();
      particles.spawnConfetti(3.5 * this.tileSize, 9 * this.tileSize);
      return true;
    } else {
      soundManager.playError();
      return false;
    }
  }

  update(dt, soundManager, particles) {
    for (const st of this.stations) {
      st.update(dt, soundManager, particles);
    }
  }

  // Renderização 2D do Piso de Madeira e Paredes de Tijolo
  render(ctx) {
    const totalW = this.cols * this.tileSize;
    const totalH = this.rows * this.tileSize;

    // 1. Piso da Cozinha (Mosaico de Azulejos Gourmet com chanfro)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const px = c * this.tileSize;
        const py = r * this.tileSize;

        if (r === 0) {
          // Parede de tijolos nobres no topo
          const brickGrad = ctx.createLinearGradient(0, py, 0, py + this.tileSize);
          brickGrad.addColorStop(0, '#334155');
          brickGrad.addColorStop(1, '#1e293b');
          ctx.fillStyle = brickGrad;
          ctx.fillRect(px, py, this.tileSize, this.tileSize);

          // Padrão de tijolos
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, this.tileSize, this.tileSize / 2);
          ctx.strokeRect(px + ((c % 2 === 0) ? 0 : this.tileSize/2), py + this.tileSize / 2, this.tileSize / 2, this.tileSize / 2);

          // Rodapé de carvalho nobre
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px, py + this.tileSize - 6, this.tileSize, 6);
        } else {
          // Azulejos do piso com degradê e chanfro
          const isAlt = (r + c) % 2 === 0;
          const tileGrad = ctx.createLinearGradient(px, py, px + this.tileSize, py + this.tileSize);
          if (isAlt) {
            tileGrad.addColorStop(0, '#f1f5f9');
            tileGrad.addColorStop(1, '#e2e8f0');
          } else {
            tileGrad.addColorStop(0, '#cbd5e1');
            tileGrad.addColorStop(1, '#94a3b8');
          }
          ctx.fillStyle = tileGrad;
          ctx.fillRect(px, py, this.tileSize, this.tileSize);

          // Rejunte suave
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px, py, this.tileSize, this.tileSize);
        }
      }
    }

    // 2. Renderizar todas as bancadas
    for (const st of this.stations) {
      st.render(ctx);
    }
  }
}
