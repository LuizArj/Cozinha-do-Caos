extends CharacterBody2D

@export var speed := 220.0
@export var player_id := 1
var held: Node = null
var action_pressed := false

func _draw():
	draw_circle(Vector2.ZERO, 12.0, Color(0.2, 0.7, 1.0))

func _ready():
	update()
	# Add small interact area
	var area := Area2D.new()
	area.name = "Interact"
	var cs := CollisionShape2D.new()
	cs.shape = CircleShape2D.new()
	cs.shape.radius = 16.0
	area.add_child(cs)
	add_child(area)

func _physics_process(delta: float) -> void:
	var input_vec := Vector2.ZERO
	# Gamepad/keyboard
	input_vec.x = Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left")
	input_vec.y = Input.get_action_strength("ui_down") - Input.get_action_strength("ui_up")
	# Network overlay
	var ni = get_node_or_null("/root/NetInput")
	if ni:
		var net_axis: Vector2 = ni.get_axis(player_id)
		if net_axis.length() > 0.05:
			input_vec = net_axis
		var net_action := ni.get_action(player_id)
		if net_action and not action_pressed:
			_do_action()
		action_pressed = net_action

	velocity = input_vec.normalized() * speed
	move_and_slide()

func _do_action():
	if held:
		# Drop to world slightly in front
		var world := get_tree().current_scene
		var drop_pos := global_position + Vector2(0, 20)
		if held.has_method("drop"):
			held.drop(world, drop_pos)
		held = null
		return
	# Try pick closest Ingredient in interact area
	# Find nearest ingredient in range
	var nearest: Node = null
	var best_d := 99999.0
	for n in get_tree().get_nodes_in_group("ingredient"):
		if n.get_parent() == get_tree().current_scene and n.has_method("pick"):
			var d := n.global_position.distance_to(global_position)
			if d < 24.0 and d < best_d:
				best_d = d
				nearest = n
	if nearest and nearest.pick(self):
		held = nearest
		return
