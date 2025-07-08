// CORE STUFF TO DRAW GRAPH //

//node ids are in order in which nodes come in existence
var nodes = [
  { id: 0, label: "1", colorIndex: null, manual_override: null },
  { id: 1, label: "2", colorIndex: null, manual_override: null },
  { id: 2, label: "3", colorIndex: null, manual_override: null },
];

var colors = d3.schemeCategory10.slice(1, 6);  // Get the first 5 colors from schemeCategory10

var links = [
  { source: 0, target: 2, edgeColorIndex: 0, probability: 0.9 },
  { source: 0, target: 1, edgeColorIndex: 0, probability: 0.9 },
  { source: 1, target: 2, edgeColorIndex: 0, probability: 0.9 },
];

var lastNodeId = nodes.length
var viewWid = document.documentElement.clientWidth;
var w = viewWid > 1200 ? 900 : 700;
var h = w == 900 ? 600 : 500;
var rad = 10;

document.getElementById("container").style.width = "" + w + "px";

var svg = d3.select("#svg-wrap")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

// Add these variables near the top of the file with other state variables
var isDraggingProb = false;
var dragStartY;
var dragStartProb;

// Add this color scale near the top with other variables
var probColorScale = d3.scaleLinear()
  .domain([0, 0.5, 1])
  .range(["red", "orange", "green"]);

function print_stringified_links() {

  var stringified_links = links.map(function (link) {
    return {
      source: link.source.id,
      target: link.target.id
    }
  })
  // stringify the links

  var stringified_links = JSON.stringify(stringified_links)
  // print the links
  console.log(stringified_links)
}

function print_stringified_nodes() {
  // retain only the id label and colorindex
  var stringified_nodes = nodes.map(function (node) {
    return {
      id: node.id,
      label: node.label,
      colorIndex: node.colorIndex
    }
  })
  // stringify the nodes
  var stringified_nodes = JSON.stringify(stringified_nodes)
  // print the nodes
  console.log(stringified_nodes)

}
//the animation line when adding edge b/w two vertices
var dragLine = svg.append("path")
  .attr("class", "dragLine hidden")
  .attr("d", "M0,0L0,0");

var edges = svg.append("g")
  .selectAll(".edge");

var vertices = svg.append("g")
  .selectAll(".vertex");

var simulation = d3.forceSimulation()
  .force("charge", d3.forceManyBody().strength(-300).distanceMax(w / 2))
  .force("link", d3.forceLink().distance(60))
  .force("x", d3.forceX(w / 2))
  .force("y", d3.forceY(h / 2))
  .on("tick", tick);

//update positions of edges and vertices with each internal timer's tick
function tick() {
  edges.select("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  edges.select("text")
    .attr("x", d => (d.source.x + d.target.x) / 2)
    .attr("y", d => (d.source.y + d.target.y) / 2 - 5);

  vertices.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}


//updates the graph by updating links, nodes and binding them with DOM
//interface is defined through several events
function restart() {
  edges = edges.data(links, d => `v${d.source.id}-v${d.target.id}`);
  edges.exit().remove();

  // Create a group for each edge to hold both the line and the text
  var edgeGroups = edges.enter()
    .append("g")
    .attr("class", "edge-group");

  // Add the line to the edge group
  edgeGroups.append("line")
    .attr("class", "edge")
    .on("mousedown", () => d3.event.stopPropagation())
    .on("contextmenu", removeEdge)
    .on("mousedown.prob", function (d) {
      isDraggingProb = true;
      dragStartY = d3.event.y;
      dragStartProb = d.probability;
      d3.select(this).classed("active", true);
      d3.event.stopPropagation();
    });

  // Add the probability text to the edge group
  edgeGroups.append("text")
    .attr("class", "edge-text")
    .attr("text-anchor", "middle")
    .style("pointer-events", "none")
    .style("user-select", "none")
    .on("click", function (d) {
      // Prevent click from propagating to other elements
      d3.event.stopPropagation();
    });

  // Merge the groups
  edges = edgeGroups.merge(edges);

  // Update all lines
  edges.select("line")
    .style("stroke", d => probColorScale(d.probability))
    .style("stroke-dasharray", "none");

  // Update all probability texts
  edges.select("text")
    .text(d => d.probability.toFixed(2))  // Show 2 decimal places
    .style("fill", d => probColorScale(d.probability))
    .style("font-size", "10px");

  vertices = vertices.data(nodes, d => d.id);
  vertices.exit().remove();

  var enterVertices = vertices.enter()
    .append("g")
    .attr("class", "vertex-group");

  enterVertices.append("circle")
    .attr("r", rad)
    .style("fill", d => d.colorIndex === null ? 'grey' : colors[d.colorIndex % 5])
    .on("mousedown", beginDragLine)
    .on("mouseup", endDragLine)
    .on("contextmenu", removeNode)
    .on("click", function (d) {
      if (d.colorIndex === null) {
        d.colorIndex = 0;
      } else {
        d.colorIndex = (d.colorIndex + 1) % 5;
      }
      d.manual_override = String.fromCharCode(97 + d.colorIndex);
      d3.select(this).style("fill", colors[d.colorIndex]);
      // Update the labels immediately
      d3.select(this.parentNode).selectAll("text")
        .text(d.label);
      updateTextarea();
      d3.event.stopPropagation();
    });

  enterVertices.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .style("pointer-events", "none")
    .style("user-select", "none")
    .style("stroke", "white")
    .style("stroke-width", "2px");

  enterVertices.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .style("pointer-events", "none")
    .style("user-select", "none")
    .style("fill", "black");

  vertices = enterVertices.merge(vertices);

  // Update all vertex labels
  vertices.selectAll("text")
    .text(d => d.label);

  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(0.8).restart();
}


restart();

// CORE STUFF TO DRAW GRAPH ENDS //

// FUNCTIONS TO MANIPULATE GRAPH //

//interface for manipulation
svg.on("mousedown", addNode)
  .on("mousemove", updateDragLine)
  .on("mouseup", hideDragLine)
  .on("contextmenu", function () { d3.event.preventDefault(); })
  .on("mouseleave", hideDragLine)
  .on("mousemove.prob", function () {
    if (isDraggingProb) {
      let dy = d3.event.y - dragStartY;
      // Increase sensitivity and precision
      let probChange = -dy * 0.001;  // Reduced from 0.005 to 0.001 for finer control

      edges.selectAll("line.active").each(function (d) {
        // Update probability, keeping it between 0 and 1
        d.probability = Math.min(1, Math.max(0, Math.round((dragStartProb + probChange) * 100) / 100));
        // Update the text and color
        let parentGroup = d3.select(this.parentNode);
        parentGroup.select("text")
          .text(d.probability.toFixed(2));
        // Update colors
        d3.select(this).style("stroke", probColorScale(d.probability));
        parentGroup.select("text").style("fill", probColorScale(d.probability));
      });
    }
  })
  .on("mouseup.prob", function () {
    isDraggingProb = false;
    edges.selectAll("line").classed("active", false);
  })
  .on("mouseleave.prob", function () {
    if (isDraggingProb) {
      isDraggingProb = false;
      edges.selectAll("line").classed("active", false);
    }
  });

function addNode() {
  if (d3.event.button == 0) {
    var coords = d3.mouse(this);
    var label = (lastNodeId + 1).toString();

    var newNode = {
      id: ++lastNodeId,
      label: label,
      colorIndex: null,
      manual_override: null,
      x: coords[0],
      y: coords[1]
    };
    nodes.push(newNode);
    restart();
  }
}


//d is data, i is index according to selection
function removeNode(d, i) {
  //to make ctrl-drag works for mac/osx users
  if (d3.event.ctrlKey) return;
  nodes.splice(nodes.indexOf(d), 1);
  var linksToRemove = links.filter(function (l) {
    return l.source === d || l.target === d;
  });
  linksToRemove.map(function (l) {
    links.splice(links.indexOf(l), 1);
  });
  d3.event.preventDefault();
  restart();
}

function removeEdge(d, i) {
  links.splice(links.indexOf(d), 1);
  d3.event.preventDefault();
  restart();
}

//dragLine is used to add edge graphicaly b/w two nodes

//the two nodes of edges are mousedownNode and mouseupNode
var mousedownNode = null;
var mouseupNode = null;

function resetMouseVar() {
  mousedownNode = null;
  mouseupNode = null;
}

function hideDragLine() {
  dragLine.classed("hidden", true);
  resetMouseVar();
  restart();
}

function beginDragLine(d) {
  //to prevent call of addNode through svg
  d3.event.stopPropagation();
  //to prevent dragging of svg in firefox
  d3.event.preventDefault();
  if (d3.event.ctrlKey || d3.event.button != 0) return;
  mousedownNode = d;
  dragLine.classed("hidden", false)
    .attr("d", "M" + mousedownNode.x + "," + mousedownNode.y +
      "L" + mousedownNode.x + "," + mousedownNode.y);
}

function updateDragLine() {
  if (!mousedownNode) return;
  dragLine.attr("d", "M" + mousedownNode.x + "," + mousedownNode.y +
    "L" + d3.mouse(this)[0] + "," + d3.mouse(this)[1]);
}

//no need to call hideDragLine in endDragLine
//mouseup on vertices propagates to svg which calls hideDragLine
function endDragLine(d) {
  if (!mousedownNode || mousedownNode === d) return;

  // Return if link already exists
  for (var i = 0; i < links.length; i++) {
    var l = links[i];
    if ((l.source === mousedownNode && l.target === d) || (l.source === d && l.target === mousedownNode)) {
      return;
    }
  }

  // Create new link with probability
  var newLink = {
    source: mousedownNode,
    target: d,
    probability: 0.9  // Default probability
  };

  links.push(newLink);
  restart();
}


// Keep just the clear button handler
d3.select("#clear")
  .on('click', function () {
    nodes.splice(0);
    links.splice(0);
    lastNodeId = 0;
    restart();
  });

// FUNCTIONS TO MANIPULATE GRAPH ENDS //

// Functions to enable draging of nodes when ctrl is held

//one response per ctrl keydown
var lastKeyDown = -1;

d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);

function keydown() {
  // Use Meta key (Command key on Mac)
  if (d3.event.key === "Meta") {

    console.log("keydown")

    lastKeyDown = d3.event.key;

    vertices_groups = d3.selectAll(".vertex-group");

    vertices_groups.call(d3.drag()
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
    vertices.on("mousedown.drag", null);
  }
}

function getGraphData() {
    // Format nodes
    const formattedNodes = nodes.map(node => ({
      unique_id: node.label,
      manual_override: node.manual_override
    }));
  
    // Format links
    const formattedLinks = links.map(link => ({
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
      nodes.splice(0);
      links.splice(0);

      // Add new nodes
      graphData.nodes.forEach((node, index) => {
        const colorIndex = node.manual_override ? node.manual_override.charCodeAt(0) - 97 : null; // Convert 'a' to 0, 'b' to 1, etc.
        nodes.push({
          id: index,
          label: node.unique_id,
          colorIndex: colorIndex,
          manual_override: node.manual_override,
          x: w / 2 + (Math.random() - 0.5) * 100,  // Random position near center
          y: h / 2 + (Math.random() - 0.5) * 100
        });
      });

      // Add new links
      graphData.links.forEach(link => {
        const sourceNode = nodes.find(n => n.label === link.unique_id_l);
        const targetNode = nodes.find(n => n.label === link.unique_id_r);
        if (sourceNode && targetNode) {
          links.push({
            source: sourceNode,
            target: targetNode,
            probability: link.match_probability
          });
        }
      });

      lastNodeId = nodes.length;
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