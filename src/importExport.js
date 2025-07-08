import * as model from './model.js';

export function getGraphData(model_obj) {
  // Format nodes
  const formattedNodes = model_obj.nodes.map(node => ({
    unique_id: node.label,
    manual_override: node.manual_override
  }));

  // Format links
  const formattedLinks = model_obj.links.map(link => ({
    unique_id_l: link.source.label,
    manual_override_l: link.source.manual_override,
    unique_id_r: link.target.label,
    manual_override_r: link.target.manual_override,
    match_probability: link.probability
  }));

  return {
    nodes: formattedNodes,
    links: formattedLinks
  };
}

export function generatePythonCode(model_obj) {
  const graphData = getGraphData(model_obj);

  // Output as pure JSON that can be loaded with json.loads
  return `import pandas as pd
import json

# Load the graph data
graph_data = json.loads('''
${JSON.stringify(graphData, null, 2)}
''')

nodes_df = pd.DataFrame(graph_data["nodes"])
links_df = pd.DataFrame(graph_data["links"])
`;
}