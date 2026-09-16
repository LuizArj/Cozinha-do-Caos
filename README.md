# 🍳 Cozinha do Caos (Chaos Kitchen 2.0)

Jogo cooperativo dinâmico de cozinha estilo **Overcooked / 2D RPG**, onde a tela principal (Host/TV/PC) exibe o restaurante e até 4 jogadores entram usando seus **próprios celulares como controle via QR Code** (sem instalar aplicativo nenhum!), ou jogando direto no **teclado do PC**.

---

## 🚀 Como Executar

### 1. Iniciar o Servidor
Certifique-se de ter o [Node.js](https://nodejs.org) instalado e execute no terminal:

```bash
npm install
npm start
```

### 2. Abrir o Jogo
- **Na TV / Monitor Principal (Host):**
  Acesse no navegador: `http://localhost:3000`
- **Nos Celulares dos Jogadores:**
  Basta apontar a câmera do celular para o **QR Code** na tela do jogo ou acessar a URL mostrada (ex: `http://192.168.x.x:3000/controller`).

---

## 🎮 Controles

### 📱 No Celular (Mobile Controller):
- **Joystick Virtual (Esquerda):** Mover o Chef livremente em 360°.
- **Botão Verde (✋ PEGAR / SOLTAR):** Pega ingredientes, apoia itens nas bancadas e monta receitas no prato.
- **Botão Vermelho (🔪 AÇÃO / CORTAR):** Pica ingredientes na tábua, apaga fogo com extintor e lava louça na pia.
- **Botão Amarelo (⚡ CORRER):** Dá um Dash rápido para atravessar a cozinha com agilidade.

### 💻 No Teclado do PC (Local Host):
- **Movimentação:** `W, A, S, D` ou `Setas`
- **Pegar / Soltar:** `ESPAÇO` ou `J`
- **Ação / Cortar / Lavar:** `E` ou `K`
- **Correr (Dash):** `SHIFT`
- **Iniciar / Reiniciar Partida:** `ENTER`

---

## 🍔 Receitas e Mecânicas

| Receita | Ingredientes Necessários | Pontos Base |
|---|---|---|
| **Hambúrguer Simples** | Pão + Hambúrguer Grelhado | 100 pts |
| **Cheeseburger** | Pão + Hambúrguer Grelhado + Queijo Fatiado | 150 pts |
| **Hambúrguer Salada** | Pão + Hambúrguer Grelhado + Alface Picada + Tomate Picado | 180 pts |
| **X-Tudo do Caos** | Pão + Hambúrguer Grelhado + Queijo + Alface + Tomate | 240 pts |
| **Salada Fresca** | Alface Picada + Tomate Picado no Prato | 130 pts |

### ⚠️ Elementos do Caos:
- **Tábua de Corte:** Ingredientes crus (carne, tomate, alface, queijo) precisam ser cortados antes do uso.
- **Fogão & Fritura:** O hambúrguer grelha no fogão. Se deixado por muito tempo além do ponto, **queima e pega fogo**!
- **Extintor de Incêndio:** Se o fogão pegar fogo, pegue o extintor e segure a Ação para salvar o restaurante.
- **Pia de Louça:** Lave pratos sujos para poder montar novos pedidos.
- **Gorjetas por Rapidez:** Entregar pedidos rapidamente concede bônus de gorjeta de até +50 pts!

---

## 🛠️ Tecnologias Utilizadas
- **Backend:** Node.js, Express, WebSockets (`ws`), `qrcode`
- **Frontend Host:** HTML5 Canvas 2D, Web Audio API procedural, JavaScript Modular
- **Mobile Controller:** Touch Events com prevenção de pull-to-refresh e feedback háptico (`navigator.vibrate`)
