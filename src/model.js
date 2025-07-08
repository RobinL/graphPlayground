// In‑memory graph data + pure helpers

// The core data
export let nodes = [
  { id: 0, label: "1", colorIndex: null, manual_override: null },
  { id: 1, label: "2", colorIndex: null, manual_override: null },
  { id: 2, label: "3", colorIndex: null, manual_override: null },
];
export let links = [
  { source: 0, target: 2, edgeColorIndex: 0, probability: 0.9 },
  { source: 0, target: 1, edgeColorIndex: 0, probability: 0.9 },
  { source: 1, target: 2, edgeColorIndex: 0, probability: 0.9 },
];

let lastNodeId = nodes.length;

// Functions to manipulate the model
export function addNode(coords) {
  const label = (lastNodeId + 1).toString();
  const newNode = {
    id: ++lastNodeId,
    label: label,
    colorIndex: null,
    manual_override: null,
    x: coords[0],
    y: coords[1]
  };
  nodes.push(newNode);
}

export function removeNode(nodeToRemove) {
  const index = nodes.indexOf(nodeToRemove);
  if (index > -1) {
    nodes.splice(index, 1);
    // Filter out links connected to the removed node
    const linksToKeep = links.filter(l => l.source !== nodeToRemove && l.target !== nodeToRemove);
    links.length = 0; // Clear the original array
    links.push(...linksToKeep); // Add the filtered links back
  }
}

export function addLink(sourceNode, targetNode) {
  // Return if link already exists
  for (let i = 0; i < links.length; i++) {
    const l = links[i];
    if ((l.source === sourceNode && l.target === targetNode) || (l.source === targetNode && l.target === sourceNode)) {
      return; // Do nothing if link exists
    }
  }
  links.push({ source: sourceNode, target: targetNode, probability: 0.5 });
}

export function removeLink(linkToRemove) {
  const index = links.indexOf(linkToRemove);
  if (index > -1) {
    links.splice(index, 1);
  }
}

export function clearGraph() {
  nodes.length = 0;
  links.length = 0;
  lastNodeId = 0;
}