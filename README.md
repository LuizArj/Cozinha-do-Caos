# A Orquestra do Caos na Cozinha (MVP Sprint 1)

Este repositório contém um projeto Godot 4 com:
- Cena principal com servidor WebSocket embutido (porta 9080)
- Cena de jogador 2D simples com movimento (teclado/gamepad ou celular via WebSocket)
- Cliente web móvel minimalista (joystick virtual + botão de ação)

## Requisitos
- Godot 4.3+ (GL Compatibility)
- PC Windows (funciona em máquinas fracas)

## Como rodar (Godot)
1. Abra o Godot e carregue a pasta do projeto.
2. Pressione Play para iniciar.
3. Na tela, no canto superior esquerdo, aparecerá algo como: `Conecte-se: ws://192.168.x.x:9080`.
	Na aba Output você verá o mesmo endereço.

## Como conectar pelo celular
1. Identifique o IP do seu PC na rede local (Ex: 192.168.1.10).
2. Sirva a pasta `webclient` via um servidor local simples e acesse do celular na mesma rede.

### Servir a pasta `webclient` no Windows (PowerShell)
Você pode usar Python (se instalado) ou Node.js (http-server). Escolha um:

- Python 3:
```
python -m http.server 8081 --directory "webclient"
```
Acesse no celular: `http://SEU_IP:8081/`

- Node.js (instale o pacote http-server globalmente uma vez):
```
npm install -g http-server
http-server webclient -p 8081 -c-1
```

3. Na página, digite o IP do PC e a porta 9080, clique Conectar.
4. Use o joystick virtual e o botão de ação. O player no Godot deve se mover.

## Notas
- O botão de ação já é enviado pelo cliente, mas ainda não faz nada no jogo. Vamos ligar à mecânica de pegar/soltar em sprints seguintes.
- O projeto usa um Autoload `NetInput` (ver `project.godot`).
- Para XInput, as ações `ui_*` já funcionam com gamepads. Ajuste mapeamentos conforme necessário em Project Settings > Input Map.

## Próximos passos sugeridos
- Adicionar lobby simples que mostre IP/QR para conexão.
- Implementar ação de pegar/soltar (interações com `Area2D`).
- Adicionar 2-3 ingredientes e estações de trabalho básicas.

Dica Windows: se o firewall perguntar, permita o Godot na rede privada para a porta 9080.
