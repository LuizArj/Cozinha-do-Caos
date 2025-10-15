extends Area2D

@export var item_name := "Ingrediente"
var held_by: Node = null

func _ready():
	monitorable = true
	monitoring = true
	add_to_group("ingredient")

func pick(holder: Node):
	if held_by: return false
	held_by = holder
	reparent(holder)
	position = Vector2(0, -18)
	return true

func drop(world: Node2D, at: Vector2):
	if not held_by: return false
	reparent(world)
	global_position = at
	held_by = null
	return true
