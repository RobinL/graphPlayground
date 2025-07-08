import { W, H, RAD, COLORS, PROB_COLOR_SCALE } from './constants.js';

let svg, edges, vertices, dragLine;

// Callback functions to be set by other modules
let onNodeClick = () => {};
let onNodeContextMenu = () => {};
let onNodeMouseDown = () => {};
let onNodeMouseUp = () => {};
let onEdgeContextMenu = () => {};
let onEdgeMouseDown = () => {};

export function init(selector, eventCallbacks) {
  // Set up the main SVG
  svg = d3.select(selector)
    .append("svg")
    .attr("width", W)
    .attr("height", H);

  document.getElementById("container").style.width = "" + W + "px";

  // Define groups for edges and vertices
  edges = svg.append("g").selectAll(".edge");
  vertices = svg.append("g").selectAll(".vertex");

  // ADD THIS
  dragLine = svg.append("path")
    .attr("class", "dragLine hidden")
    .attr("d", "M0,0L0,0");

  // Assign callbacks
  onNodeClick = eventCallbacks.onNodeClick;
  onNodeContextMenu = eventCallbacks.onNodeContextMenu;
  onNodeMouseDown = eventCallbacks.onNodeMouseDown;
  onNodeMouseUp = eventCallbacks.onNodeMouseUp;
  onEdgeContextMenu = eventCallbacks.onEdgeContextMenu;
  onEdgeMouseDown = eventCallbacks.onEdgeMouseDown;

  // CHANGE THE RETURN VALUE
  return { svg, dragLine };
}

export function update(nodes, links) {
  // === EDGES ===
  edges = edges.data(links, d => `v${d.source.id}-v${d.target.id}`);
  edges.exit().remove();

  var edgeGroups = edges.enter()
    .append("g")
    .attr("class", "edge-group");

  edgeGroups.append("line")
    .attr("class", "edge")
    .on("mousedown", () => d3.event.stopPropagation())
    .on("contextmenu", onEdgeContextMenu)
    .on("mousedown.prob", onEdgeMouseDown);

  edgeGroups.append("text")
    .attr("class", "edge-text")
    .attr("text-anchor", "middle")
    .style("pointer-events", "none")
    .style("user-select", "none");

  edges = edgeGroups.merge(edges);

  edges.select("line")
    .style("stroke", d => PROB_COLOR_SCALE(d.probability));

  edges.select("text")
    .text(d => d.probability.toFixed(2))
    .style("fill", d => PROB_COLOR_SCALE(d.probability));

  // === VERTICES ===
  vertices = vertices.data(nodes, d => d.id);
  vertices.exit().remove();

  var enterVertices = vertices.enter()
    .append("g")
    .attr("class", "vertex-group");

  enterVertices.append("circle")
    .attr("r", RAD)
    .on("mousedown", onNodeMouseDown)
    .on("mouseup", onNodeMouseUp)
    .on("contextmenu", onNodeContextMenu)
    .on("click", onNodeClick);

  // Add text layers for outline effect
  enterVertices.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .style("pointer-events", "none")
    .style("stroke", "white")
    .style("stroke-width", "2px");

  enterVertices.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .style("pointer-events", "none")
    .style("fill", "black");

  vertices = enterVertices.merge(vertices);

  vertices.select("circle")
    .style("fill", d => d.colorIndex === null ? 'grey' : COLORS[d.colorIndex % 5]);

  vertices.selectAll("text")
    .text(d => d.label);
}

// Function to update element positions during simulation ticks
export function updatePositions() {
  edges.select("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  edges.select("text")
    .attr("x", d => (d.source.x + d.target.x) / 2)
    .attr("y", d => (d.source.y + d.target.y) / 2 - 5);

  vertices.attr("transform", d => `translate(${d.x},${d.y})`);
}