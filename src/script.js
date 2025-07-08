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
  onNodeMouseUp: interactions.endDragLine,
  onEdgeMouseDown: (d) => {
    isDraggingProb = true;
    dragStartY = d3.event.y;
    dragStartProb = d.probability;
    d3.select(d3.event.currentTarget).classed("active", true);
    d3.event.stopPropagation();
  }
};

// Initialize the renderer
const svg = renderer.init("#svg-wrap", eventCallbacks);

// Initialize the simulation
simulation.init(d3, tick);

// Initial call to restart
restart();

// FUNCTIONS TO MANIPULATE GRAPH //

//interface for manipulation
svg.on("mousedown", () => {
  if (d3.event.button === 0) {
    model.addNode(d3.mouse(svg.node()));
    restart();
  }
})
  .on("mousemove", updateDragLine)
  .on("mouseup", hideDragLine)
  .on("contextmenu", function () { d3.event.preventDefault(); })
  .on("mouseleave", hideDragLine)
  .on("mousemove.prob", function () {
    if (isDraggingProb) {
      let dy = d3.event.y - dragStartY;
      // Increase sensitivity and precision
      let probChange = -dy * 0.001;  // Reduced from 0.005 to 0.001 for finer control

      // We need to get the current edges selection from the renderer
      // For now, we'll assume edges is still globally accessible or re-select it
      // This will be properly handled when interactions are moved.
      d3.selectAll(".edge-group line.active").each(function (d) {
        // Update probability, keeping it between 0 and 1
        d.probability = Math.min(1, Math.max(0, Math.round((dragStartProb + probChange) * 100) / 100));
        // Update the text and color
        let parentGroup = d3.select(this.parentNode);
        parentGroup.select("text")
          .text(d.probability.toFixed(2));
        // Update colors
        d3.select(this).style("stroke", PROB_COLOR_SCALE(d.probability));
        parentGroup.select("text").style("fill", PROB_COLOR_SCALE(d.probability));
      });
    }
  })
  .on("mouseup.prob", function () {
    isDraggingProb = false;
    d3.selectAll(".edge-group line").classed("active", false);
  })
  .on("mouseleave.prob", function () {
    if (isDraggingProb) {
      isDraggingProb = false;
      d3.selectAll(".edge-group line").classed("active", false);
    }
  });

// Keep just the clear button handler
d3.select("#clear")
  .on('click', function () {
    model.clearGraph();
    restart();
  });

// Functions to enable draging of nodes when ctrl is held
var lastKeyDown = -1;

d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);

function keydown() {
  // Use Meta key (Command key on Mac)
  if (d3.event.key === "Meta") {

    console.log("keydown")

    lastKeyDown = d3.event.key;

    // This will be moved to interactions.js
    d3.selectAll(".vertex-group").call(d3.drag()
      .on("start", function dragstarted(d) {
        console.log("drag start");
        if (!d3.event.active) simulation.alphaTarget(1).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function (d) {
        console.log("dragging");
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      })
      .on("end", function (d) {
        console.log("drag end");
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }));
  }
}

function keyup() {
  // Reset lastKeyDown only if "Meta" (Command) was released
  if (d3.event.key === "Meta") {
    lastKeyDown = -1;
    // This will be moved to interactions.js
    d3.selectAll(".vertex-group circle").on("mousedown.drag", null);
  }
}

function getGraphData() {
  // Format nodes
  const formattedNodes = model.nodes.map(node => ({
    unique_id: node.label,
    manual_override: node.manual_override
  }));

  // Format links
  const formattedLinks = model.links.map(link => ({
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

// Add this function after the other print functions
function dumpGraphData() {
  console.log(JSON.stringify(getGraphData(), null, 2));
}

// Add button handler after other button handlers
d3.select("#container")
  .append("button")
  .attr("id", "dump-data")
  .text("Dump Graph Data")
  .on("click", dumpGraphData);

function generatePythonCode() {

  const graphData = getGraphData();

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

// Remove the old button and add textarea + copy button
d3.select("#dump-data").remove();

const controlsDiv = d3.select("#container")
  .append("div")
  .style("margin-top", "20px")
  .style("position", "relative");  // Add relative positioning

// Create details/summary for input
const details = controlsDiv.append("details")
  .style("margin-bottom", "20px");

details.append("summary")
  .text("Import Graph Data")
  .style("cursor", "pointer")
  .style("padding", "10px")
  .style("background-color", "#f5f5f5")
  .style("border", "1px solid #ddd")
  .style("border-radius", "4px");

const inputDiv = details.append("div")
  .style("margin", "10px 0")
  .style("padding", "10px")
  .style("border", "1px solid #ddd")
  .style("border-radius", "4px");

// Add input textarea
const inputTextarea = inputDiv.append("textarea")
  .attr("id", "graph-data-input")
  .attr("rows", "15")
  .attr("cols", "80")
  .attr("placeholder", "Paste your graph_data here in same json format as the output below...")
  .style("font-family", "monospace")
  .style("width", "100%")
  .style("margin-bottom", "10px");

// Add load button below textarea
inputDiv.append("button")
  .text("Load Graph")
  .style("display", "block")
  .style("margin", "10px 0")
  .on("click", function () {
    try {
      const inputText = inputTextarea.node().value;
      let graphData;

      try {
        // First try parsing as pure JSON
        graphData = JSON.parse(inputText);
      } catch (e) {
        // If that fails, try extracting JSON from Python code
        const match = inputText.match(/json\.loads\(\s*'''([\s\S]*?)'''\s*\)/);
        if (!match) {
          throw new Error("Could not find valid JSON or Python json.loads format in input");
        }
        graphData = JSON.parse(match[1]);
      }

      // Validate the structure
      if (!graphData.nodes || !graphData.links ||
        !Array.isArray(graphData.nodes) || !Array.isArray(graphData.links)) {
        throw new Error("Input must contain 'nodes' and 'links' arrays");
      }

      // Clear existing graph
      model.nodes.splice(0);
      model.links.splice(0);

      // Add new nodes
      graphData.nodes.forEach((node, index) => {
        const colorIndex = node.manual_override ? node.manual_override.charCodeAt(0) - 97 : null; // Convert 'a' to 0, 'b' to 1, etc.
        model.nodes.push({
          id: index,
          label: node.unique_id,
          colorIndex: colorIndex,
          manual_override: node.manual_override,
          x: W / 2 + (Math.random() - 0.5) * 100,  // Random position near center
          y: H / 2 + (Math.random() - 0.5) * 100
        });
      });

      // Add new links
      graphData.links.forEach(link => {
        const sourceNode = model.nodes.find(n => n.label === link.unique_id_l);
        const targetNode = model.nodes.find(n => n.label === link.unique_id_r);
        if (sourceNode && targetNode) {
          model.links.push({
            source: sourceNode,
            target: targetNode,
            probability: link.match_probability
          });
        }
      });

      model.lastNodeId = model.nodes.length;
      restart();

      // Close the details panel after successful load
      details.node().open = false;
    } catch (e) {
      console.error("Error importing graph:", e);
      alert("Error importing graph: " + e.message);
    }
  });

// Output textarea section
const outputDiv = controlsDiv.append("div")
  .style("position", "relative")
  .style("margin-top", "20px");

outputDiv.append("button")
  .text("Copy to Clipboard")
  .style("position", "absolute")
  .style("top", "0")
  .style("right", "0")
  .style("z-index", "1")
  .on("click", function () {
    textarea.node().select();
    document.execCommand('copy');
    const originalText = this.textContent;
    this.textContent = "Copied!";
    setTimeout(() => {
      this.textContent = originalText;
    }, 1500);
  });

const textarea = outputDiv.append("textarea")
  .attr("id", "graph-data")
  .attr("rows", "30")
  .attr("cols", "80")
  .style("font-family", "monospace")
  .style("width", "100%")
  .style("margin-top", "30px");

// Function to update textarea
function updateTextarea() {
  textarea.text(generatePythonCode());
}

// Update textarea whenever graph changes
// Add this to the restart() function
const originalRestart = restart;
restart = function () {
  originalRestart();
  updateTextarea();
};

// Initial update
updateTextarea();