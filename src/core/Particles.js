// Cozinha do Caos - Sistema de Partículas e Efeitos Visuais

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.scale = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.scale || 1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  spawnSmoke(x, y, isHeavy = false) {
    const count = isHeavy ? 3 : 1;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y: y,
        vx: (Math.random() * 20 - 10),
        vy: -(25 + Math.random() * 30),
        size: 5 + Math.random() * 6,
        color: isHeavy ? '#334155' : 'rgba(203, 213, 225, 0.7)',
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.0
      });
    }
  }

  spawnFire(x, y) {
    for (let i = 0; i < 4; i++) {
      const colors = ['#ef4444', '#f97316', '#facc15', '#ffffff'];
      this.particles.push({
        x: x + (Math.random() * 16 - 8),
        y: y + (Math.random() * 8 - 4),
        vx: (Math.random() * 30 - 15),
        vy: -(40 + Math.random() * 50),
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }
  }

  spawnChopSparks(x, y, itemType) {
    let color = '#ffffff';
    if (itemType === 'TOMATO') color = '#ef4444';
    else if (itemType === 'LETTUCE') color = '#22c55e';
    else if (itemType === 'CHEESE') color = '#eab308';
    else if (itemType === 'MEAT') color = '#dc2626';

    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: 2.5 + Math.random() * 2,
        color: color,
        life: 0.25,
        maxLife: 0.25
      });
    }
  }

  spawnWaterSplash(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y: y,
        vx: (Math.random() * 40 - 20),
        vy: -(30 + Math.random() * 30),
        size: 3,
        color: '#60a5fa',
        life: 0.3,
        maxLife: 0.3
      });
    }
  }

  spawnExtinguisherFoam(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: (Math.random() * 50 - 25),
        vy: (Math.random() * 50 - 25),
        size: 6 + Math.random() * 6,
        color: 'rgba(255, 255, 255, 0.9)',
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  spawnDashDust(x, y) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y: y + 10,
        vx: (Math.random() * 20 - 10),
        vy: (Math.random() * 10 - 5),
        size: 4 + Math.random() * 3,
        color: 'rgba(148, 163, 184, 0.6)',
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  spawnPickupPop(x, y) {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * 35,
        vy: Math.sin(angle) * 35,
        size: 3,
        color: '#facc15',
        life: 0.25,
        maxLife: 0.25
      });
    }
  }

  spawnTrashPoof(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() * 10 - 5),
        y: y,
        vx: (Math.random() * 30 - 15),
        vy: -(20 + Math.random() * 20),
        size: 4,
        color: '#64748b',
        life: 0.3,
        maxLife: 0.3
      });
    }
  }

  spawnConfetti(x, y) {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3
      });
    }
  }
}
