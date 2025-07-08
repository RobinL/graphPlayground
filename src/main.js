import { COLORS, W, H, RAD, PROB_COLOR_SCALE, FORCES } from './constants.js';
import * as model from './model.js';
import * as renderer from './renderer.js';
import * as simulation from './simulation.js';
import * as interactions from './interactions.js';
import * as ui from './ui.js';
import * as importExport from './importExport.js';

// Global D3 object (loaded from CDN in index.html)




//update positions of edges and vertices with each internal timer's tick
function tick() {
  renderer.updatePositions();
}



//updates the graph by updating links, nodes and binding them with DOM
//interface is defined through several events
function restart() {
  // Update the simulation with the new data
  simulation.update(model.nodes, model.links);

  // (We'll move this later, but for now it stays)
  model.generateAutomaticEdges();

  // Tell the renderer to redraw everything
  renderer.update(model.nodes, model.links);
  ui.updateTextarea(); // Call ui.updateTextarea here
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
  onNodeMouseUp: interactions.endDragLine,
  onEdgeMouseDown: (d) => {
    interactions.beginProbabilityDrag(d, d3.event);
  }
};

// Initialize the renderer
const { svg, dragLine } = renderer.init("#svg-wrap", eventCallbacks);

// Initialize interactions
interactions.init(d3, svg, dragLine, model, restart, simulation);

// Initialize the simulation
simulation.init(d3, tick);

// Initialize UI
ui.init(d3, model, restart);

// Initial call to restart
restart();
ui.updateTextarea(model);