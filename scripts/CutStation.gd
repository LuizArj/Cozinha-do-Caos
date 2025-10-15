extends Area2D

# Drop an ingredient onto this station and press action to process it

func process_item(item: Node) -> void:
	# placeholder: tint item to indicate processed
	if item and item.has_node("Sprite2D"):
		item.get_node("Sprite2D").self_modulate = Color(0.5, 1.0, 0.5)
