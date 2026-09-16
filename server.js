import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Obter IP da rede local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignora loopback e IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'src')));
app.use('/controller', express.static(path.join(__dirname, 'controller')));
app.use('/assets', express.static(path.join(__dirname, 'public')));

// Endpoint para informações de conexão e QR Code
app.get('/api/info', async (req, res) => {
  const hostUrl = `http://${localIP}:${PORT}`;
  const controllerUrl = `http://${localIP}:${PORT}/controller`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(controllerUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    });

    res.json({
      localIP,
      port: PORT,
      hostUrl,
      controllerUrl,
      qrCode: qrCodeDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

// Gerenciamento de Salas e Conexões
// rooms: { [roomCode]: { hostWs: WebSocket, players: Map<playerId, { ws: WebSocket, info: Object }> } }
const rooms = new Map();

function getOrCreateRoom(roomCode = 'CAOS') {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      hostWs: null,
      players: new Map()
    });
  }
  return rooms.get(roomCode);
}

wss.on('connection', (ws, req) => {
  let clientType = null; // 'host' ou 'controller'
  let clientRoom = 'CAOS';
  let playerId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const room = getOrCreateRoom(data.room || 'CAOS');
      clientRoom = data.room || 'CAOS';

      switch (data.type) {
        case 'register_host': {
          clientType = 'host';
          room.hostWs = ws;
          console.log(`[HOST] Jogo registrado na sala: ${clientRoom}`);
          
          ws.send(JSON.stringify({
            type: 'host_registered',
            room: clientRoom,
            players: Array.from(room.players.values()).map(p => p.info)
          }));
          break;
        }

        case 'join_controller': {
          clientType = 'controller';
          playerId = data.playerId || `chef_${Date.now()}_${Math.floor(Math.random()*1000)}`;
          const playerInfo = {
            id: playerId,
            name: data.name || `Chef ${room.players.size + 1}`,
            color: data.color || getRandomColor(room.players.size)
          };

          room.players.set(playerId, { ws, info: playerInfo });
          console.log(`[CONTROLLER] ${playerInfo.name} (${playerId}) entrou na sala ${clientRoom}`);

          // Confirma entrada para o celular
          ws.send(JSON.stringify({
            type: 'controller_joined',
            player: playerInfo,
            room: clientRoom
          }));

          // Notifica o Host do jogo
          if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
            room.hostWs.send(JSON.stringify({
              type: 'player_joined',
              player: playerInfo
            }));
          }
          break;
        }

        case 'controller_input': {
          // Repasse imediato de inputs ao Host
          if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
            room.hostWs.send(JSON.stringify({
              type: 'player_input',
              playerId: playerId,
              input: data.input // { dx, dy, actionA, actionB, dash }
            }));
          }
          break;
        }

        case 'host_feedback': {
          // Feedback do Host para o celular (ex: vibrar, item na mão)
          if (data.targetPlayerId && room.players.has(data.targetPlayerId)) {
            const p = room.players.get(data.targetPlayerId);
            if (p.ws && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({
                type: 'feedback',
                payload: data.payload
              }));
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error('Erro ao processar mensagem WS:', e);
    }
  });

  ws.on('close', () => {
    const room = rooms.get(clientRoom);
    if (!room) return;

    if (clientType === 'host') {
      console.log(`[HOST] Host desconectou da sala ${clientRoom}`);
      room.hostWs = null;
    } else if (clientType === 'controller' && playerId) {
      console.log(`[CONTROLLER] Jogador ${playerId} saiu da sala ${clientRoom}`);
      room.players.delete(playerId);
      if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
        room.hostWs.send(JSON.stringify({
          type: 'player_left',
          playerId: playerId
        }));
      }
    }
  });
});

function getRandomColor(index = 0) {
  const colors = [
    '#EF4444', // Vermelho
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#8B5CF6', // Roxo
    '#EC4899'  // Rosa
  ];
  return colors[index % colors.length];
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🍳 COZINHA DO CAOS — SERVIDOR RODANDO!`);
  console.log(`📺 TELA DO JOGO (Host):       http://localhost:${PORT}`);
  console.log(`📱 CONTROLE MOBILE:          http://${localIP}:${PORT}/controller`);
  console.log(`====================================================`);
});
