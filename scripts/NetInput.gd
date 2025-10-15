extends Node

# Autoload singleton holding inputs coming from network controllers
# API:
#   set_player_input(id: int, axis: Vector2, action: bool)
#   get_axis(id: int) -> Vector2
#   get_action(id: int) -> bool

var _axis := {}
var _action := {}

func set_player_input(id: int, axis: Vector2, action: bool) -> void:
	_axis[id] = axis
	_action[id] = action

func get_axis(id: int) -> Vector2:
	return _axis.get(id, Vector2.ZERO)

func get_action(id: int) -> bool:
	return bool(_action.get(id, false))
