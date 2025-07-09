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
    links.length = 0;
    links.push(...linksToKeep); // Add the filtered links back
  }
}

export function generateAutomaticEdges() {
  // Filter out previous automatic links. Manual links remain.
  let currentLinks = links.filter(link => !link.automatic);

  // Iterate over all pairs of nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i];
      const node2 = nodes[j];

      const override1 = node1.manual_override;
      const override2 = node2.manual_override;

      // Only consider pairs where both have non-null manual_override values
      if (override1 !== null && override2 !== null) {
        let probability;
        if (override1 === override2) {
          probability = 1.0;
        } else {
          probability = 0.0;
        }

        // Find if a link (manual or automatic) already exists between these two nodes in the current set
        let existingLink = currentLinks.find(link =>
          (link.source === node1 && link.target === node2) ||
          (link.source === node2 && link.target === node1)
        );

        if (existingLink) {
          // If a link exists, update its probability and mark it as automatic
          existingLink.probability = probability;
          existingLink.automatic = true; // Mark it as automatic so it gets filtered next time
        } else {
          // If no link exists, create a new automatic one
          currentLinks.push({
            source: node1,
            target: node2,
            probability: probability,
            automatic: true // Mark as an automatic edge
          });
        }
      }
    }
  }
  // Update the global links array with the new set of links
  links.length = 0;
  links.push(...currentLinks);
}

export function addLink(sourceNode, targetNode) {
  // Return if link already exists
  for (let i = 0; i < links.length; i++) {
    const l = links[i];
    if ((l.source === sourceNode && l.target === targetNode) || (l.source === targetNode && l.target === sourceNode)) {
      return;
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

// Normalize initial links to ensure they reference node objects, not just IDs
(function normaliseInitialLinks() {
  links.forEach(l => {
    if (typeof l.source === 'number') l.source = nodes[l.source];
    if (typeof l.target === 'number') l.target = nodes[l.target];
  });
})();