import { PROB_COLOR_SCALE } from './constants.js';

let mousedownNode = null;
let mouseupNode = null;
let dragLine;

let isDraggingProb = false;
let sim; // Reference to the force simulation
let dragStartY;
let dragStartProb;

let svg;
let model;
let restartCallback;
let d3_global;

let isMetaKeyDown = false;

export function init(d3_obj, svgElement, dragLineElement, dataModel, restartFn, simulation_obj) {
  d3_global = d3_obj;
  svg = svgElement;
  dragLine = dragLineElement;
  model = dataModel;
  restartCallback = restartFn;
  sim = simulation_obj; // Store for pausing/resuming

  svg.on("mousedown", () => {
    if (d3_global.event.button === 0) {
      model.addNode(d3_global.mouse(svg.node()));
      restartCallback();
    }
  })
    .on("mousemove", updateDragLine)
    .on("mouseup", hideDragLine)
    .on("contextmenu", function () { d3_global.event.preventDefault(); })
    .on("mouseleave", hideDragLine)
    .on("mousemove.prob", function () {
      if (isDraggingProb) {
        let dy = d3_global.event.y - dragStartY;
        let probChange = -dy * 0.001;

        d3_global.selectAll(".edge-group line.active").each(function (d) {
          const newProb = Math.min(1, Math.max(0, Math.round((dragStartProb + probChange) * 100) / 100));

          // Update baseline probability
          d.probability = newProb;
          // Keep effective probability in sync for live feedback
          d.probability_inc_overrides = newProb;

          let parentGroup = d3_global.select(this.parentNode);
          parentGroup.select("text")
            .text(d.probability_inc_overrides.toFixed(2));
          d3_global.select(this).style("stroke", PROB_COLOR_SCALE(d.probability_inc_overrides));
          parentGroup.select("text").style("fill", PROB_COLOR_SCALE(d.probability_inc_overrides));
        });
      }
    })
    .on("mouseup.prob", function () {
      if (isDraggingProb) {
        isDraggingProb = false;
        d3_global.selectAll(".edge-group line").classed("active", false);
        // Call restart to re-apply any active overrides that might have been temporarily ignored during the drag
        restartCallback();
      }
    })
    .on("mouseleave.prob", function () {
      if (isDraggingProb) {
        isDraggingProb = false;
        d3_global.selectAll(".edge-group line").classed("active", false);
        restartCallback();
      }
    });

  d3_global.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);

  d3_global.select("#clear")
    .on('click', function () {
      model.clearGraph();
      restartCallback();
    });
}

function resetMouseVar() {
  mousedownNode = null;
  mouseupNode = null;
}

function hideDragLine() {
  dragLine.classed("hidden", true);
  if (mousedownNode) {
    const [mx, my] = d3_global.mouse(svg.node());
    const hit = model.nodes.find(
      n => Math.hypot(n.x - mx, n.y - my) < 12);
    if (hit && hit !== mousedownNode) {
      model.addLink(mousedownNode, hit);
      restartCallback();
    }
    mousedownNode = null;
    resetMouseVar();
    resumeSimulation();
  }
}

export function beginDragLine(d) {
  console.log('beginDragLine called', {
    metaKey: d3_global.event.metaKey,
    button: d3_global.event.button,
    isMetaKeyDown: isMetaKeyDown
  });

  // If Meta key is held, this should be handled by the drag behavior instead
  if (isMetaKeyDown || d3_global.event.metaKey || d3_global.event.button !== 0) {
    console.log('beginDragLine: aborting due to metaKey or wrong button');
    return;
  }

  d3_global.event.stopPropagation();
  d3_global.event.preventDefault();
  sim.alphaTarget(0).stop();
  mousedownNode = d;
  dragLine.classed("hidden", false)
    .attr("d", `M${d.x},${d.y}L${d.x},${d.y}`);
}

function updateDragLine() {
  if (!mousedownNode) return;
  dragLine.attr("d", "M" + mousedownNode.x + "," + mousedownNode.y +
    "L" + d3_global.mouse(svg.node())[0] + "," + d3_global.mouse(svg.node())[1]);
}

export function endDragLine(targetNode) {
  if (!mousedownNode || mousedownNode === targetNode) {
    if (mousedownNode) {
      mousedownNode = null;
      resetMouseVar();
      resumeSimulation();
    }
    return;
  }
  model.addLink(mousedownNode, targetNode);
  mousedownNode = null;
  resetMouseVar();
  restartCallback();
  resumeSimulation();
}

function resumeSimulation() {
  sim.alpha(0.8).restart();
}

function keydown() {
  console.log('keydown event:', d3_global.event.key);
  if (d3_global.event.key === "Meta") {
    console.log('Meta key pressed - setting up drag behavior');
    isMetaKeyDown = true;

    // Apply drag behavior to the circles
    d3_global.selectAll(".vertex-group circle").call(d3_global.drag()
      .on("start", function dragstarted(d) {
        console.log('drag started for node:', d);
        if (!d3_global.event.active) sim.alphaTarget(1).restart();
        d.fx = d.x;
        d.fy = d.y;
        // Add dragging class for visual feedback
        d3_global.select(this.parentNode).classed("dragging", true);
      })
      .on("drag", function (d) {
        console.log('dragging node:', d, 'to:', d3_global.event.x, d3_global.event.y);
        d.fx = d3_global.event.x;
        d.fy = d3_global.event.y;
      })
      .on("end", function (d) {
        console.log('drag ended for node:', d);
        if (!d3_global.event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        // Remove dragging class
        d3_global.select(this.parentNode).classed("dragging", false);
      }));
  }
}

export function keyup() {
  console.log('keyup event:', d3_global.event.key);
  if (d3_global.event.key === "Meta") {
    console.log('Meta key released - removing drag behavior');
    isMetaKeyDown = false;

    // Remove drag handlers
    d3_global.selectAll(".vertex-group circle").on(".drag", null);

    // Remove any dragging classes
    d3_global.selectAll(".vertex-group").classed("dragging", false);

    // Resume normal force behaviour
    sim.alphaTarget(0);
  }
}

export function beginProbabilityDrag(d, event) {
  isDraggingProb = true;
  dragStartY = event.y;

  // If the link has no baseline prob, it was purely automatic. Give it one.
  if (d.probability === null) {
    d.probability = d.probability_inc_overrides;
  }
  dragStartProb = d.probability;
  d3_global.select(event.currentTarget).classed("active", true);
  event.stopPropagation();
}