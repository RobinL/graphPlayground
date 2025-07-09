import { COLORS, W, H, RAD, PROB_COLOR_SCALE, FORCES } from './constants.js';
import * as model from './model.js';
import * as renderer from './renderer.js';
import * as simulation from './simulation.js';
import * as interactions from './interactions.js';
import * as ui from './ui.js';
import * as importExport from './importExport.js';

// Global D3 object (loaded from CDN in index.html)




function tick() {
  renderer.updatePositions();
}



function restart() {
  // 1 First, apply overrides and generate/remove automatic edges.
  model.generateAutomaticEdges();              // <- must run FIRST

  // 2 Now every link has a final `probability_inc_overrides`, hand it to the force engine
  simulation.update(model.nodes, model.links); // <- then run the sim

  // Tell the renderer to redraw everything
  renderer.update(model.nodes, model.links);
  ui.updateTextarea();
}

// Event callbacks for the renderer
const eventCallbacks = {
  onNodeClick: (d) => {
    d3.event.stopPropagation();
    if (d.colorIndex === null) {
      d.colorIndex = 0;
    } else {
      d.colorIndex = (d.colorIndex + 1);
    }

    if (d.colorIndex >= COLORS.length) {
      d.colorIndex = null;
      d.manual_override = null;
    } else {
      d.manual_override = String.fromCharCode(97 + d.colorIndex);
    }

    // Using a timeout defers the restart, letting the event bubble up cleanly.
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

// Initialize the simulation and hold on to the instance
const forceSim = simulation.init(d3, tick);

// Initialize interactions
interactions.init(d3, svg, dragLine, model, restart, forceSim);

// Initialize UI
ui.init(d3, model, restart);

// Initial call to restart
restart();
ui.updateTextarea(model);