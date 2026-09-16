// Cozinha do Caos - Sistema de Comandas e Pedidos
import { ItemType, ItemState } from './Item.js';

export const RECIPES = [
  {
    id: 'simple_burger',
    name: 'Hambúrguer Simples',
    icon: '🍔',
    basePoints: 100,
    timeLimit: 75,
    required: [
      { type: ItemType.BUN },
      { type: ItemType.MEAT, state: ItemState.COOKED }
    ]
  },
  {
    id: 'cheese_burger',
    name: 'Cheeseburger',
    icon: '🍔🧀',
    basePoints: 150,
    timeLimit: 85,
    required: [
      { type: ItemType.BUN },
      { type: ItemType.MEAT, state: ItemState.COOKED },
      { type: ItemType.CHEESE, state: ItemState.CHOPPED }
    ]
  },
  {
    id: 'salad_burger',
    name: 'Hambúrguer Salada',
    icon: '🍔🥗',
    basePoints: 180,
    timeLimit: 90,
    required: [
      { type: ItemType.BUN },
      { type: ItemType.MEAT, state: ItemState.COOKED },
      { type: ItemType.LETTUCE, state: ItemState.CHOPPED },
      { type: ItemType.TOMATO, state: ItemState.CHOPPED }
    ]
  },
  {
    id: 'chaos_burger',
    name: 'X-Tudo do Caos',
    icon: '🍔👑',
    basePoints: 240,
    timeLimit: 110,
    required: [
      { type: ItemType.BUN },
      { type: ItemType.MEAT, state: ItemState.COOKED },
      { type: ItemType.CHEESE, state: ItemState.CHOPPED },
      { type: ItemType.LETTUCE, state: ItemState.CHOPPED },
      { type: ItemType.TOMATO, state: ItemState.CHOPPED }
    ]
  },
  {
    id: 'fresh_salad',
    name: 'Salada Fresca',
    icon: '🥗🍅',
    basePoints: 130,
    timeLimit: 65,
    required: [
      { type: ItemType.LETTUCE, state: ItemState.CHOPPED },
      { type: ItemType.TOMATO, state: ItemState.CHOPPED }
    ]
  }
];

export class OrdersManager {
  constructor() {
    this.orders = [];
    this.score = 0;
    this.deliveredCount = 0;
    this.failedCount = 0;
    this.spawnTimer = 2; // Começa gerando pedido rápido
    this.maxOrders = 5;
    this.nextOrderId = 1;
  }

  reset() {
    this.orders = [];
    this.score = 0;
    this.deliveredCount = 0;
    this.failedCount = 0;
    this.spawnTimer = 1;
    this.nextOrderId = 1;
  }

  update(dt, soundManager) {
    // Atualiza tempo de cada comanda ativa
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const order = this.orders[i];
      order.timeLeft -= dt;

      // Pedido expirou!
      if (order.timeLeft <= 0) {
        this.orders.splice(i, 1);
        this.score = Math.max(0, this.score - 40);
        this.failedCount++;
        soundManager.playError();
      }
    }

    // Gerador de novos pedidos
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.orders.length < this.maxOrders) {
      this.addNewOrder();
      // Intervalo entre 14 e 22 segundos para o próximo pedido
      this.spawnTimer = 14 + Math.random() * 8;
    }
  }

  addNewOrder() {
    const recipeTemplate = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    const newOrder = {
      id: this.nextOrderId++,
      recipe: recipeTemplate,
      totalTime: recipeTemplate.timeLimit,
      timeLeft: recipeTemplate.timeLimit
    };
    this.orders.push(newOrder);
  }

  // Valida um prato entregue contra as comandas ativas
  checkDelivery(plateItem) {
    if (!plateItem || plateItem.type !== 'PLATE') return null;

    for (let i = 0; i < this.orders.length; i++) {
      const order = this.orders[i];
      if (this.matchesRecipe(plateItem, order.recipe)) {
        // Cálculo de pontuação com gorjeta por agilidade
        const timeRatio = order.timeLeft / order.totalTime;
        let tip = 0;
        if (timeRatio > 0.6) tip = 50; // Super rápido
        else if (timeRatio > 0.3) tip = 25;

        const pointsEarned = order.recipe.basePoints + tip;
        this.score += pointsEarned;
        this.deliveredCount++;

        // Remove a comanda atendida
        this.orders.splice(i, 1);

        return {
          success: true,
          recipeName: order.recipe.name,
          points: pointsEarned,
          tip: tip
        };
      }
    }

    return null;
  }

  matchesRecipe(plateItem, recipe) {
    const contents = plateItem.contents;
    if (contents.length !== recipe.required.length) {
      return false;
    }

    // Verifica se todos os itens exigidos estão presentes no prato
    for (const req of recipe.required) {
      const found = contents.some(c => {
        if (c.type !== req.type) return false;
        if (req.state && c.state !== req.state) return false;
        return true;
      });
      if (!found) return false;
    }

    return true;
  }
}
