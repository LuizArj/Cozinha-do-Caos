// Cozinha do Caos - Rede Host e Controle Local HD
import { Chef } from './Chef.js';

export class NetworkHost {
  constructor(game) {
    this.game = game;
    this.ws = null;
    this.roomCode = 'CAOS';
    this.serverInfo = { localIP: 'localhost', port: 3000, qrCode: '' };

    this.chefs = new Map();
    this.localKeyboardChef = null;
    this.keysPressed = {};

    this.initKeyboardListener();
  }

  async fetchServerInfo() {
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        this.serverInfo = await res.json();
      }
    } catch (e) {
      console.warn('Não foi possível obter IP via API:', e);
    }
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[HOST WS] Conectado ao servidor!');
        this.ws.send(JSON.stringify({
          type: 'register_host',
          room: this.roomCode
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('Erro ao processar mensagem WS:', e);
        }
      };

      this.ws.onclose = () => {
        console.warn('[HOST WS] Reconectando em 2s...');
        setTimeout(() => this.connect(), 2000);
      };
    } catch (e) {
      console.error('Falha ao conectar WS:', e);
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'host_registered':
        if (data.players) {
          data.players.forEach(p => this.addPlayer(p));
        }
        break;

      case 'player_joined':
        this.addPlayer(data.player);
        break;

      case 'player_left':
        this.removePlayer(data.playerId);
        break;

      case 'player_input':
        this.updatePlayerInput(data.playerId, data.input);
        break;
    }
  }

  addPlayer(playerInfo) {
    if (this.chefs.has(playerInfo.id)) return;

    // Spawns desobstruídos e com muito espaço
    const spawns = [
      { x: 380, y: 170 },
      { x: 720, y: 170 },
      { x: 380, y: 490 },
      { x: 720, y: 490 }
    ];
    const spawnIndex = this.chefs.size;
    const spawn = spawns[spawnIndex % spawns.length];

    const newChef = new Chef(playerInfo.id, playerInfo.name, playerInfo.color, spawn.x, spawn.y);
    this.chefs.set(playerInfo.id, newChef);
  }

  removePlayer(playerId) {
    if (this.chefs.has(playerId)) {
      this.chefs.delete(playerId);
    }
  }

  updatePlayerInput(playerId, input) {
    const chef = this.chefs.get(playerId);
    if (chef && input) {
      chef.input.dx = input.dx || 0;
      chef.input.dy = input.dy || 0;
      chef.input.actionA = !!input.actionA;
      chef.input.actionB = !!input.actionB;
      chef.input.dash = !!input.dash;
    }
  }

  sendPlayerFeedback(playerId, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'host_feedback',
        room: this.roomCode,
        targetPlayerId: playerId,
        payload: payload
      }));
    }
  }

  // ==================== TECLADO LOCAL ====================
  initKeyboardListener() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;
      this.ensureLocalChef();
      this.updateLocalKeyboardInputs();
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
      this.updateLocalKeyboardInputs();
    });
  }

  ensureLocalChef() {
    if (!this.localKeyboardChef) {
      const localId = 'local_pc_player';
      // Nasce no corredor central espaçoso
      this.localKeyboardChef = new Chef(localId, 'Chef PC (Você)', '#3B82F6', 580, 330);
      this.chefs.set(localId, this.localKeyboardChef);
    }
  }

  update(dt) {
    this.updateLocalKeyboardInputs();
  }

  updateLocalKeyboardInputs() {
    if (!this.localKeyboardChef) return;

    let dx = 0;
    let dy = 0;

    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) dy -= 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) dy += 1;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) dx -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) dx += 1;

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }

    const actionA = !!(this.keysPressed['Space'] || this.keysPressed['KeyJ'] || this.keysPressed['Numpad0']);
    const actionB = !!(this.keysPressed['KeyE'] || this.keysPressed['KeyK'] || this.keysPressed['Enter']);
    const dash = !!(this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight'] || this.keysPressed['KeyL']);

    this.localKeyboardChef.input.dx = dx;
    this.localKeyboardChef.input.dy = dy;
    this.localKeyboardChef.input.actionA = actionA;
    this.localKeyboardChef.input.actionB = actionB;
    this.localKeyboardChef.input.dash = dash;
  }
}
