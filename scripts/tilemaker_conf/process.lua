function node_function(node, result)
  if node.tags and node.tags.place then
    result:add_node("place")
  end
end

function way_function(way, result)
  -- no-op for ways in this minimal config
end

function relation_function(relation, result)
  -- no-op for relations in this minimal config
end
