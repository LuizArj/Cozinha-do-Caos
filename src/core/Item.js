// Cozinha do Caos - Entidade de Itens e Gráficos Vetoriais de Alta Resolução

export const ItemType = {
  BUN: 'BUN',                 // Pão artesanal de hambúrguer
  MEAT: 'MEAT',               // Carne / Hambúrguer
  TOMATO: 'TOMATO',           // Tomate
  LETTUCE: 'LETTUCE',         // Alface crocante
  CHEESE: 'CHEESE',           // Queijo cheddar
  PLATE: 'PLATE',             // Prato de porcelana
  DIRTY_PLATE: 'DIRTY_PLATE', // Prato sujo
  EXTINGUISHER: 'EXTINGUISHER'// Extintor de incêndio
};

export const ItemState = {
  RAW: 'RAW',
  CHOPPED: 'CHOPPED',
  COOKED: 'COOKED',
  BURNT: 'BURNT'
};

export class Item {
  constructor(type, state = ItemState.RAW) {
    this.type = type;
    this.state = state;
    this.contents = [];
    this.cookProgress = 0;
    this.chopProgress = 0;
  }

  clone() {
    const it = new Item(this.type, this.state);
    it.cookProgress = this.cookProgress;
    it.chopProgress = this.chopProgress;
    it.contents = this.contents.map(c => c.clone());
    return it;
  }

  get name() {
    switch (this.type) {
      case ItemType.BUN: return 'Pão';
      case ItemType.MEAT:
        if (this.state === ItemState.BURNT) return 'Carne Queimada';
        if (this.state === ItemState.COOKED) return 'Hambúrguer Grelhado';
        if (this.state === ItemState.CHOPPED) return 'Hambúrguer Cru';
        return 'Carne';
      case ItemType.TOMATO:
        return this.state === ItemState.CHOPPED ? 'Tomate Fatiado' : 'Tomate';
      case ItemType.LETTUCE:
        return this.state === ItemState.CHOPPED ? 'Alface Picada' : 'Alface';
      case ItemType.CHEESE:
        return this.state === ItemState.CHOPPED ? 'Queijo Fatiado' : 'Queijo';
      case ItemType.PLATE:
        if (this.contents.length === 0) return 'Prato Limpo';
        return 'Prato Montado';
      case ItemType.DIRTY_PLATE: return 'Prato Sujo';
      case ItemType.EXTINGUISHER: return 'Extintor';
      default: return 'Item';
    }
  }

  get icon() {
    switch (this.type) {
      case ItemType.BUN: return '🍞';
      case ItemType.MEAT:
        if (this.state === ItemState.BURNT) return '🔥';
        if (this.state === ItemState.COOKED) return '🥩';
        if (this.state === ItemState.CHOPPED) return '🍖';
        return '🥩';
      case ItemType.TOMATO: return '🍅';
      case ItemType.LETTUCE: return '🥬';
      case ItemType.CHEESE: return '🧀';
      case ItemType.PLATE: return this.contents.length === 0 ? '🍽️' : '🍔';
      case ItemType.DIRTY_PLATE: return '🧼';
      case ItemType.EXTINGUISHER: return '🧯';
      default: return '📦';
    }
  }

  canBeChopped() {
    if (this.state !== ItemState.RAW) return false;
    return [ItemType.MEAT, ItemType.TOMATO, ItemType.LETTUCE, ItemType.CHEESE].includes(this.type);
  }

  canBeCooked() {
    return this.type === ItemType.MEAT && this.state === ItemState.CHOPPED;
  }

  addIngredientToPlate(ingredient) {
    if (this.type !== ItemType.PLATE) return false;
    if ([ItemType.PLATE, ItemType.DIRTY_PLATE, ItemType.EXTINGUISHER].includes(ingredient.type)) return false;
    if (ingredient.type === ItemType.MEAT && ingredient.state !== ItemState.COOKED) return false;
    if ([ItemType.TOMATO, ItemType.LETTUCE, ItemType.CHEESE].includes(ingredient.type) && ingredient.state !== ItemState.CHOPPED) return false;
    if (this.contents.some(c => c.type === ingredient.type)) return false;

    this.contents.push(ingredient.clone());
    return true;
  }

  // Renderização 2D de alta fidelidade
  render(ctx, x, y, size = 44) {
    ctx.save();
    ctx.translate(x, y);

    switch (this.type) {
      case ItemType.BUN:
        this.renderBun(ctx, size);
        break;
      case ItemType.MEAT:
        this.renderMeat(ctx, size);
        break;
      case ItemType.TOMATO:
        this.renderTomato(ctx, size);
        break;
      case ItemType.LETTUCE:
        this.renderLettuce(ctx, size);
        break;
      case ItemType.CHEESE:
        this.renderCheese(ctx, size);
        break;
      case ItemType.PLATE:
        this.renderPlate(ctx, size);
        break;
      case ItemType.DIRTY_PLATE:
        this.renderDirtyPlate(ctx, size);
        break;
      case ItemType.EXTINGUISHER:
        this.renderExtinguisher(ctx, size);
        break;
      default:
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-size/2, -size/2, size, size);
    }

    ctx.restore();
  }

  renderBun(ctx, size) {
    const r = size * 0.45;
    // Sombra do pão
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.35, r, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pão Base
    const gradBase = ctx.createLinearGradient(0, 0, 0, r * 0.4);
    gradBase.addColorStop(0, '#f59e0b');
    gradBase.addColorStop(1, '#b45309');
    ctx.fillStyle = gradBase;
    ctx.beginPath();
    ctx.ellipse(0, 4, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pão Topo (Cúpula volumosa)
    const gradTop = ctx.createRadialGradient(0, -6, 2, 0, -6, r * 0.9);
    gradTop.addColorStop(0, '#fbbf24');
    gradTop.addColorStop(0.7, '#d97706');
    gradTop.addColorStop(1, '#92400e');
    ctx.fillStyle = gradTop;
    ctx.beginPath();
    ctx.ellipse(0, -3, r * 0.95, r * 0.6, 0, Math.PI, 0);
    ctx.fill();

    // Sementes de gergelim douradas
    ctx.fillStyle = '#fef3c7';
    [[-8, -8], [-2, -10], [5, -9], [-5, -4], [4, -5], [9, -4]].forEach(([gx, gy]) => {
      ctx.beginPath();
      ctx.ellipse(gx, gy, 1.8, 1.2, 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderMeat(ctx, size) {
    const r = size * 0.42;

    if (this.state === ItemState.BURNT) {
      // Hambúrguer carbonizado com cinzas
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (this.state === ItemState.COOKED) {
      // Hambúrguer grelhado suculento
      const grad = ctx.createLinearGradient(0, -r*0.5, 0, r*0.5);
      grad.addColorStop(0, '#78350f');
      grad.addColorStop(0.5, '#451a03');
      grad.addColorStop(1, '#290e02');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();

      // Marcas douradas de grelha
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 2.5;
      [-7, 0, 7].forEach(gx => {
        ctx.beginPath();
        ctx.moveTo(gx - 6, -5);
        ctx.lineTo(gx + 6, 5);
        ctx.stroke();
      });
    } else if (this.state === ItemState.CHOPPED) {
      // Disco de hambúrguer cru
      const grad = ctx.createLinearGradient(0, -r*0.5, 0, r*0.5);
      grad.addColorStop(0, '#ef4444');
      grad.addColorStop(1, '#b91c1c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Peça de carne rústica inteira com osso
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.roundRect(-r*0.9, -r*0.5, r*1.8, r, 6);
      ctx.fill();

      // Marmoreio / gordura
      ctx.fillStyle = '#fecaca';
      ctx.beginPath();
      ctx.ellipse(-r*0.2, -r*0.1, 4, 2, 0.3, 0, Math.PI * 2);
      ctx.ellipse(r*0.3, 0, 5, 2, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderTomato(ctx, size) {
    const r = size * 0.38;
    if (this.state === ItemState.CHOPPED) {
      // 2 fatias de tomate vívidas
      [-7, 7].forEach(tx => {
        const grad = ctx.createRadialGradient(tx, 0, 2, tx, 0, r * 0.75);
        grad.addColorStop(0, '#f87171');
        grad.addColorStop(0.7, '#dc2626');
        grad.addColorStop(1, '#991b1b');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tx, 0, r * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Sementes amarelas
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(tx - 3, -1, 1.5, 0, Math.PI * 2);
        ctx.arc(tx + 3, 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Tomate inteiro brilhante
      const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, r);
      grad.addColorStop(0, '#f87171');
      grad.addColorStop(0.5, '#ef4444');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 2, r, 0, Math.PI * 2);
      ctx.fill();

      // Folhinhas verdes no topo
      ctx.fillStyle = '#15803d';
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * 5, -r + 2 + Math.sin(ang) * 3, 4, 2, ang, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderLettuce(ctx, size) {
    const r = size * 0.42;
    if (this.state === ItemState.CHOPPED) {
      // Folhas soltas crocantes
      ctx.fillStyle = '#22c55e';
      [-8, -1, 7].forEach((lx, i) => {
        ctx.beginPath();
        ctx.ellipse(lx, (i % 2 === 0 ? -2 : 3), 7, 4.5, 0.4 * i, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    } else {
      // Cabeça de alface crespa
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
      grad.addColorStop(0, '#86efac');
      grad.addColorStop(0.6, '#22c55e');
      grad.addColorStop(1, '#15803d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(-5, 0, r * 0.7, 0, Math.PI * 2);
      ctx.arc(5, 0, r * 0.7, 0, Math.PI * 2);
      ctx.arc(0, -4, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderCheese(ctx, size) {
    const r = size * 0.4;
    if (this.state === ItemState.CHOPPED) {
      // Fatia de queijo cheddar quadrado derretendo suavemente
      const grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, '#fde047');
      grad.addColorStop(1, '#eab308');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.4);
      ctx.lineTo(r * 0.8, -r * 0.4);
      ctx.lineTo(r * 0.6, r * 0.4);
      ctx.lineTo(-r * 0.6, r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // Bloco triangular de queijo suíço
      const grad = ctx.createLinearGradient(0, -r, 0, r);
      grad.addColorStop(0, '#fde047');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.5);
      ctx.lineTo(r, r * 0.5);
      ctx.lineTo(0, -r * 0.8);
      ctx.closePath();
      ctx.fill();

      // Furinhos característicos
      ctx.fillStyle = '#a16207';
      [[-4, 0, 2.5], [3, 4, 2], [1, -5, 1.8]].forEach(([hx, hy, hr]) => {
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  renderPlate(ctx, size) {
    const r = size * 0.5;

    // Sombra do prato
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 4, r, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Borda de porcelana branca
    const gradBorda = ctx.createLinearGradient(0, -r, 0, r);
    gradBorda.addColorStop(0, '#ffffff');
    gradBorda.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = gradBorda;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Friso azul clássico de prato de restaurante
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Centro do prato
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Renderizar ingredientes empilhados
    if (this.contents.length > 0) {
      this.contents.forEach((ing, index) => {
        const offset = -4 + index * 3;
        ing.render(ctx, 0, offset, size * 0.75);
      });
    }
  }

  renderDirtyPlate(ctx, size) {
    const r = size * 0.48;
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Gordura e manchas
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-4, -2, 5, 0, Math.PI * 2);
    ctx.arc(5, 3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Espuma de sabão
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(2, -4, 4, 0, Math.PI * 2);
    ctx.arc(-2, 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  renderExtinguisher(ctx, size) {
    const w = size * 0.4;
    const h = size * 0.8;
    // Cilindro vermelho metálico
    const grad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.5, '#dc2626');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2 + 6, w, h - 6, 5);
    ctx.fill();

    // Manômetro e gatilho
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-w * 0.3, -h/2, w * 0.6, 8);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -h/2 + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
