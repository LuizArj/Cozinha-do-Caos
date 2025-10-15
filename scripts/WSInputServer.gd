extends Node

# Minimal WebSocket server using TCPServer + WebSocketPeer (Godot 4)
# Listens on 0.0.0.0:9080 and stores latest inputs into NetInput singleton (to be added)

const PORT := 9080
var _tcp := TCPServer.new()
var _peers: Dictionary[int, WebSocketPeer] = {}
var _last_id := 0

func _ready():
	var err := _tcp.listen(PORT)
	if err != OK:
		push_error("WS server failed to listen on %d" % PORT)
		set_process(false)
		return
	print("WS server listening on port %d" % PORT)
	set_process(true)

func _process(_delta):
	# Accept new connections
	while _tcp.is_connection_available():
		_last_id += 1
		var ws := WebSocketPeer.new()
		ws.accept_stream(_tcp.take_connection())
		_peers[_last_id] = ws
		print("+ Peer %d connected" % _last_id)

	# Poll existing peers
	for id in _peers.keys():
		var peer: WebSocketPeer = _peers[id]
		peer.poll()
		match peer.get_ready_state():
			WebSocketPeer.STATE_OPEN:
				while peer.get_available_packet_count() > 0:
					var pkt := peer.get_packet()
					var text := pkt.get_string_from_utf8() if peer.was_string_packet() else ""
					if text != "":
						_handle_message(id, text)
			WebSocketPeer.STATE_CLOSED:
				var code := peer.get_close_code()
				_peers.erase(id)
				print("- Peer %d closed (%d)" % [id, code])

func _handle_message(peer_id: int, text: String) -> void:
	# Expecting simple JSON like {"player_id":1, "lx":0.1, "ly":-0.8, "action": true}
	var data := {}
	if text.begins_with("{"):
		data = JSON.parse_string(text) or {}
	if typeof(data) == TYPE_DICTIONARY:
		var player_id := int(data.get("player_id", peer_id))
		var lx := float(data.get("lx", 0.0))
		var ly := float(data.get("ly", 0.0))
		var action := bool(data.get("action", false))
		var ni = get_node_or_null("/root/NetInput")
		if ni:
			ni.set_player_input(player_id, Vector2(lx, ly), action)
		# Always print minimal debug
		print("peer %d -> id=%d lx=%.2f ly=%.2f a=%s" % [peer_id, player_id, lx, ly, str(action)])
	else:
		print("peer %d sent non-JSON: %s" % [peer_id, text])
