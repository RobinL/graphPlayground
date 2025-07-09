import * as model from './model.js';

export function getGraphData(model_obj) {
  const formattedNodes = model_obj.nodes.map(node => ({
    unique_id: node.label,
    manual_override: node.manual_override
  }));

  // Filter for non-automatic links and save BOTH the baseline and effective probabilities.
  const formattedLinks = model_obj.links
    .filter(link => !link.automatic)
    .map(link => ({
      unique_id_l: link.source.label,
      manual_override_l: link.source.manual_override,
      unique_id_r: link.target.label,
      manual_override_r: link.target.manual_override,
      match_probability: link.probability,
      match_probability_inc_overrides: link.probability_inc_overrides
    }));

  return {
    nodes: formattedNodes,
    links: formattedLinks
  };
}

export function generatePythonCode(model_obj) {
  const graphData = getGraphData(model_obj);

  // Output as pure JSON that can be loaded with json.loads
  return JSON.stringify(graphData, null, 2)

}