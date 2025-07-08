// CORE STUFF TO DRAW GRAPH //

import { COLORS, W, H, RAD, PROB_COLOR_SCALE, FORCES } from './constants.js';
import * as model from './model.js';
import * as renderer from './renderer.js';
import * as simulation from './simulation.js';
import * as interactions from './interactions.js';





//update positions of edges and vertices with each internal timer's tick
function tick() {
  renderer.updatePositions();
}

function generateAutomaticEdges() {
  // Filter out previous automatic links. Manual links remain.
  let currentLinks = model.links.filter(link => !link.automatic);

  // Iterate over all pairs of nodes
  for (let i = 0; i < model.nodes.length; i++) {
    for (let j = i + 1; j < model.nodes.length; j++) {
      const node1 = model.nodes[i];
      const node2 = model.nodes[j];

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
  model.links.length = 0; // Clear the existing array
  model.links.push(...currentLinks); // Add all elements from currentLinks
}

//updates the graph by updating links, nodes and binding them with DOM
//interface is defined through several events
function restart() {
  // Update the simulation with the new data
  simulation.update(model.nodes, model.links);

  // (We'll move this later, but for now it stays)
  generateAutomaticEdges();

  // Tell the renderer to redraw everything
  renderer.update(model.nodes, model.links);
}



// Event callbacks for the renderer
const eventCallbacks = {
  onNodeClick: (d) => {
    d3.event.stopPropagation();
    if (d.colorIndex === null) {
      d.colorIndex = 0;
    } else {
      d.colorIndex = (d.colorIndex + 1) % 5;
    }
    d.manual_override = String.fromCharCode(97 + d.colorIndex);
    setTimeout(() => {
      restart();
    }, 0);
  },
  onNodeContextMenu: (d) => {
    if (d3.event.ctrlKey) return;
    d3.event.preventDefault();
    model.removeNode(d);
    restart();
  },
  onEdgeContextMenu: (d) => {
    d3.event.preventDefault();
    model.removeLink(d);
    restart();
  },
  onNodeMouseDown: interactions.beginDragLine,
  onNodeMouseUp: interactions.endDragLine
};

// Initialize the renderer
const svg = renderer.init("#svg-wrap", eventCallbacks);

// Initialize interactions
interactions.init(d3, svg, model, restart, simulation);

// Initialize the simulation
simulation.init(d3, tick);

// Initial call to restart
restart();

// FUNCTIONS TO MANIPULATE GRAPH //

// Keep just the clear button handler
d3.select("#clear")
  .on('click', function () {
    model.clearGraph();
    restart();
  });



