// In‑memory graph data + pure helpers

// The core data
export let nodes = [
  { id: 0, label: "1", colorIndex: null, manual_override: null },
  { id: 1, label: "2", colorIndex: null, manual_override: null },
  { id: 2, label: "3", colorIndex: null, manual_override: null },
];
export let links = [
  { source: 0, target: 2, probability: 0.9, probability_inc_overrides: 0.9, automatic: false },
  { source: 0, target: 1, probability: 0.9, probability_inc_overrides: 0.9, automatic: false },
  { source: 1, target: 2, probability: 0.9, probability_inc_overrides: 0.9, automatic: false },
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
  // 0.  Build a Map keyed by "id1-id2" (id order sorted) for O(1) look-ups
  const id = (a, b) => a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
  const linkMap = new Map(links.map(l => [id(l.source, l.target), l]));

  // 1.  For every *pair* of nodes decide what their override would be
  const toAdd = [];       // brand-new automatic links
  const toDelete = [];    // automatic links whose override vanished
  nodes.forEach((n1, i) => {
    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      const key = id(n1, n2);
      const link = linkMap.get(key);
      const bothHaveMO = n1.manual_override !== null && n2.manual_override !== null;

      // Desired value given current overrides
      let overrideProb = null;            // "null" means "no override in force"
      if (bothHaveMO) overrideProb = (n1.manual_override === n2.manual_override ? 1 : 0);

      if (link) {
        // -- (a) there *is* an existing link (manual or automatic)
        if (overrideProb === null) {
          // override vanished ➜ revert
          if (link.automatic && link.probability === null) {
            // It was a pure-override edge ➜ kill it
            toDelete.push(link);
          } else {
            // Restore baseline
            link.probability_inc_overrides = link.probability;
            link.automatic = false;    // keep, but it's no longer auto
          }
        } else {
          // override still in force ➜ just layer it
          link.probability_inc_overrides = overrideProb;
          link.automatic = true;
        }
      } else if (overrideProb !== null && overrideProb > 0) { // Only add links for prob > 0
        // -- (b) no link yet but override demands one
        toAdd.push({
          source: n1,
          target: n2,
          probability: null,
          probability_inc_overrides: overrideProb,
          automatic: true
        });
      }
    }
  });

  // 2. Commit mutations
  //    (mutating 'links' in-place keeps refs that the rest of the app holds)
  toDelete.forEach(l => links.splice(links.indexOf(l), 1));
  links.push(...toAdd);
}

export function addLink(sourceNode, targetNode) {
  // Return if link already exists
  for (let i = 0; i < links.length; i++) {
    const l = links[i];
    if ((l.source === sourceNode && l.target === targetNode) || (l.source === targetNode && l.target === sourceNode)) {
      return;
    }
  }
  links.push({
    source: sourceNode,
    target: targetNode,
    probability: 0.5,
    probability_inc_overrides: 0.5,
    automatic: false
  });
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

// Normalize initial links to ensure they reference node objects and have the correct fields
(function normaliseInitialLinks() {
  links.forEach(l => {
    if (typeof l.source === 'number') l.source = nodes.find(n => n.id === l.source);
    if (typeof l.target === 'number') l.target = nodes.find(n => n.id === l.target);
    if (l.probability_inc_overrides === undefined) {
      l.probability_inc_overrides = l.probability;
    }
    if (l.automatic === undefined) {
      l.automatic = false;
    }
  });
})();