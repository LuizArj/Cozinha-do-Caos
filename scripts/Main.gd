extends Node2D

@onready var ws_server: Node = $WSInputServer
@onready var ip_label: Label = $IPLabel

func _ready():
	var ip := _get_local_ip()
	ip_label.text = "Conecte-se: ws://%s:9080\n(abra o cliente web no celular)" % ip
	print("Main ready. WS server at ws://%s:9080" % ip)
	# Center player if present
	var player := get_node_or_null("/root/Main/Player")
	if player and get_viewport():
		player.position = get_viewport().get_visible_rect().size / 2.0

func _get_local_ip() -> String:
	var ips := IP.get_local_addresses()
	for a in ips:
		if a.contains('.') and not a.begins_with('127.'):
			return a
	return "127.0.0.1"
