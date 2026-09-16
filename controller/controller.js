// Cozinha do Caos - Controller Client
(function () {
  'use strict';

  // Elementos do DOM
  const setupScreen = document.getElementById('setup-screen');
  const gamepadScreen = document.getElementById('gamepad-screen');
  const playerNameInput = document.getElementById('player-name');
  const roomCodeInput = document.getElementById('room-code');
  const colorPicker = document.getElementById('color-picker');
  const btnJoin = document.getElementById('btn-join');
  const connStatus = document.getElementById('conn-status');

  const badgeAvatar = document.getElementById('badge-avatar');
  const badgeName = document.getElementById('badge-name');
  const badgeStatus = document.getElementById('badge-status');
  const holdingIcon = document.getElementById('holding-icon');
  const holdingText = document.getElementById('holding-text');
  const btnReconnect = document.getElementById('btn-reconnect');

  const joystickZone = document.getElementById('joystick-zone');
  const joystickBase = document.getElementById('joystick-base');
  const joystickStick = document.getElementById('joystick-stick');

  const btnActionA = document.getElementById('btn-action-a');
  const btnActionB = document.getElementById('btn-action-b');
  const btnDash = document.getElementById('btn-dash');

  // Estado do Jogador
  let selectedColor = '#EF4444';
  let playerId = localStorage.getItem('cozinha_player_id') || `chef_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  localStorage.setItem('cozinha_player_id', playerId);

  let currentRoom = 'CAOS';
  let ws = null;
  let isConnected = false;

  // Estado dos Inputs
  const inputState = {
    dx: 0,
    dy: 0,
    actionA: false,
    actionB: false,
    dash: false
  };

  let lastSentState = JSON.stringify(inputState);
  let inputSendInterval = null;

  // Seleção de Cor
  colorPicker.addEventListener('click', (e) => {
    const opt = e.target.closest('.color-opt');
    if (!opt) return;
    document.querySelectorAll('.color-opt').forEach(el => el.classList.remove('selected'));
    opt.classList.add('selected');
    selectedColor = opt.dataset.color;
    document.documentElement.style.setProperty('--theme-color', selectedColor);
    vibrate(15);
  });

  // Entrar na Sala
  btnJoin.addEventListener('click', () => {
    const name = playerNameInput.value.trim() || 'Chef ' + Math.floor(Math.random() * 100);
    currentRoom = (roomCodeInput.value.trim() || 'CAOS').toUpperCase();
    connectWebSocket(name, selectedColor, currentRoom);
  });

  btnReconnect.addEventListener('click', () => {
    vibrate(20);
    if (ws) ws.close();
    const name = playerNameInput.value.trim() || 'Chef';
    connectWebSocket(name, selectedColor, currentRoom);
  });

  function vibrate(ms) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  // ==================== CONEXÃO WEBSOCKET ====================
  function connectWebSocket(name, color, room) {
    connStatus.textContent = 'Conectando ao jogo...';
    connStatus.style.color = '#fbbf24';

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WS] Conectado!');
        ws.send(JSON.stringify({
          type: 'join_controller',
          room: room,
          playerId: playerId,
          name: name,
          color: color
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (e) {
          console.error('Erro ao ler msg WS:', e);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Desconectado');
        isConnected = false;
        badgeStatus.textContent = 'Desconectado';
        badgeStatus.style.color = '#f87171';
        clearInterval(inputSendInterval);
      };

      ws.onerror = (err) => {
        console.error('[WS Error]', err);
        connStatus.textContent = 'Erro ao conectar. Verifique se o Host está ativo.';
        connStatus.style.color = '#f87171';
      };
    } catch (e) {
      connStatus.textContent = 'Falha ao iniciar WebSocket.';
    }
  }

  function handleServerMessage(data) {
    switch (data.type) {
      case 'controller_joined':
        isConnected = true;
        setupScreen.classList.remove('active');
        gamepadScreen.classList.add('active');

        badgeName.textContent = data.player.name;
        badgeAvatar.style.backgroundColor = data.player.color;
        badgeStatus.textContent = `Sala: ${data.room} (Online)`;
        badgeStatus.style.color = '#34d399';
        document.documentElement.style.setProperty('--theme-color', data.player.color);

        vibrate([50, 50, 100]);
        startInputLoop();
        break;

      case 'feedback':
        if (data.payload) {
          // Feedback de vibração
          if (data.payload.vibrate) {
            vibrate(data.payload.vibrate);
          }
          // Feedback de item segurado
          if (data.payload.holding !== undefined) {
            updateHoldingItem(data.payload.holding);
          }
        }
        break;
    }
  }

  function updateHoldingItem(item) {
    if (!item) {
      holdingIcon.textContent = '👋';
      holdingText.textContent = 'Vazias';
    } else {
      holdingIcon.textContent = item.icon || '📦';
      holdingText.textContent = item.name || 'Item';
    }
  }

  // ==================== LOOP DE ENVIO DE INPUTS ====================
  function startInputLoop() {
    clearInterval(inputSendInterval);
    // Envia inputs a cada 25ms (~40Hz) ou imediatamente em mudanças de botão
    inputSendInterval = setInterval(() => {
      sendInputsIfChanged();
    }, 25);
  }

  function sendInputs(force = false) {
    if (!ws || ws.readyState !== WebSocket.OPEN || !isConnected) return;
    const currentStr = JSON.stringify(inputState);
    if (force || currentStr !== lastSentState) {
      ws.send(JSON.stringify({
        type: 'controller_input',
        room: currentRoom,
        input: { ...inputState }
      }));
      lastSentState = currentStr;
    }
  }

  function sendInputsIfChanged() {
    sendInputs(false);
  }

  // ==================== JOYSTICK VIRTUAL TÁTIL ====================
  let joystickTouchId = null;
  const MAX_RADIUS = 48; // Raio máximo de movimento do stick em pixels

  function handleJoystickStart(clientX, clientY, touchId = null) {
    joystickTouchId = touchId;
    updateJoystickPos(clientX, clientY);
  }

  function handleJoystickMove(clientX, clientY) {
    updateJoystickPos(clientX, clientY);
  }

  function handleJoystickEnd() {
    joystickTouchId = null;
    inputState.dx = 0;
    inputState.dy = 0;
    joystickStick.style.transform = `translate(0px, 0px)`;
    sendInputs(true);
  }

  function updateJoystickPos(clientX, clientY) {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > MAX_RADIUS) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * MAX_RADIUS;
      deltaY = Math.sin(angle) * MAX_RADIUS;
    }

    // Normalização (-1.0 a 1.0)
    let normX = deltaX / MAX_RADIUS;
    let normY = deltaY / MAX_RADIUS;

    // Deadzone suave
    const DEADZONE = 0.12;
    if (Math.hypot(normX, normY) < DEADZONE) {
      normX = 0;
      normY = 0;
    }

    inputState.dx = Number(normX.toFixed(3));
    inputState.dy = Number(normY.toFixed(3));

    joystickStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    sendInputs(false);
  }

  // Touch Events no Joystick
  joystickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (joystickTouchId !== null) return;
    const touch = e.changedTouches[0];
    handleJoystickStart(touch.clientX, touch.clientY, touch.identifier);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (joystickTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId) {
        handleJoystickMove(touch.clientX, touch.clientY);
        break;
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (joystickTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId) {
        handleJoystickEnd();
        break;
      }
    }
  });

  window.addEventListener('touchcancel', (e) => {
    if (joystickTouchId !== null) {
      handleJoystickEnd();
    }
  });

  // Mouse fallback para testes no navegador desktop
  let isMouseDownJoystick = false;
  joystickZone.addEventListener('mousedown', (e) => {
    isMouseDownJoystick = true;
    handleJoystickStart(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => {
    if (isMouseDownJoystick) handleJoystickMove(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', () => {
    if (isMouseDownJoystick) {
      isMouseDownJoystick = false;
      handleJoystickEnd();
    }
  });

  // ==================== BOTÕES DE AÇÃO ====================
  function bindGameButton(element, actionKey, vibrateMs = 30) {
    const activate = (e) => {
      e.preventDefault();
      element.classList.add('pressed');
      inputState[actionKey] = true;
      vibrate(vibrateMs);
      sendInputs(true);
    };

    const deactivate = (e) => {
      e.preventDefault();
      element.classList.remove('pressed');
      inputState[actionKey] = false;
      sendInputs(true);
    };

    element.addEventListener('touchstart', activate, { passive: false });
    element.addEventListener('touchend', deactivate, { passive: false });
    element.addEventListener('touchcancel', deactivate, { passive: false });

    element.addEventListener('mousedown', activate);
    element.addEventListener('mouseup', deactivate);
    element.addEventListener('mouseleave', deactivate);
  }

  bindGameButton(btnActionA, 'actionA', 25);
  bindGameButton(btnActionB, 'actionB', 35);
  bindGameButton(btnDash, 'dash', 20);

  // Prevenir zoom de pinça e duplo clique indesejado no mobile
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());

})();
