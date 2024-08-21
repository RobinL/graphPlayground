// CORE STUFF TO DRAW GRAPH //

//node ids are in order in which nodes come in existence
var nodes = [
  { id: 0, label: "A", colorIndex: 0 },
  { id: 1, label: "B", colorIndex: 0 },
  { id: 2, label: "C", colorIndex: 0 },


];

var colors = d3.schemeCategory10.slice(1, 6);  // Get the first 5 colors from schemeCategory10

var links = [
  { source: 0, target: 2, edgeColorIndex: 0 },
  { source: 0, target: 1, edgeColorIndex: 0 },
  { source: 1, target: 2, edgeColorIndex: 0 },
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
  edges.attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; });

  // Update the position of the group
  vertices.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}


//updates the graph by updating links, nodes and binding them with DOM
//interface is defined through several events
function restart() {
  edges = edges.data(links, d => `v${d.source.id}-v${d.target.id}`);
  edges.exit().remove();
  edges = edges.enter()
    .append("line")
    .attr("class", "edge")
    .on("mousedown", () => d3.event.stopPropagation())
    .on("contextmenu", removeEdge)
    .on("click", function (d) {
      var colors = ["green", "grey", "orange", "red",];
      d.edgeColorIndex = (d.edgeColorIndex + 1) % colors.length;
      d3.select(this)
        .style("stroke", colors[d.edgeColorIndex])
        .style("stroke-dasharray", colors[d.edgeColorIndex] === "grey" ? "5,5" : "");  // Apply dotted line if grey
    })
    .merge(edges)
    .style("stroke", d => ["green", "grey", "orange", "red",][d.edgeColorIndex])
    .style("stroke-dasharray", d => d.edgeColorIndex === 1 ? "5,5" : "");  // Apply dotted line if grey

  vertices = vertices.data(nodes, d => d.id);
  vertices.exit().remove();

  var enterVertices = vertices.enter()
    .append("g")
    .attr("class", "vertex-group");

  enterVertices.append("circle")
    .attr("r", rad)
    .style("fill", d => colors[d.colorIndex % 5])
    .on("mousedown", beginDragLine)
    .on("mouseup", endDragLine)
    .on("contextmenu", removeNode)
    .on("click", function (d) {
      d.colorIndex = (d.colorIndex + 1) % 5;
      d3.select(this).style("fill", colors[d.colorIndex]);
      d3.event.stopPropagation();
    });

  enterVertices.append("text")
    .text(d => d.label)
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .style("pointer-events", "none")
    .style("user-select", "none")
    .style("stroke", "white")
    .style("stroke-width", "2px");

  enterVertices.append("text")
    .text(d => d.label)
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .style("pointer-events", "none")
    .style("user-select", "none")
    .style("fill", "black");

  vertices = enterVertices.merge(vertices);

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
  .on("mouseleave", hideDragLine);

function addNode() {
  if (d3.event.button == 0) {
    var coords = d3.mouse(this);

    // Calculate the alphabetic label based on lastNodeId
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var label = alphabet[lastNodeId % 26];  // Cycles through A-Z

    var newNode = {
      id: ++lastNodeId,
      label: label,  // Assign the alphabetic label to the new node
      colorIndex: 0,
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

  // Create new link with edgeColorIndex
  var newLink = {
    source: mousedownNode,
    target: d,
    edgeColorIndex: 0 // Initialize edgeColorIndex to 0 (which corresponds to "grey")
  };

  links.push(newLink);
  restart();
}


//clearAll button
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
  // Only prevent the default action if the key is "Control"
  if (d3.event.key === "Control") {
    d3.event.preventDefault();
    if (lastKeyDown !== -1) return;
    lastKeyDown = d3.event.key;

    vertices.call(d3.drag()
      .on("start", function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(1).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function (d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      })
      .on("end", function (d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }));
  }
}


function keyup() {
  // Reset lastKeyDown only if "Control" was released
  if (d3.event.key === "Control") {
    lastKeyDown = -1;
    vertices.on("mousedown.drag", null);
  }
}

