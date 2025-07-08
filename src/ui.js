import * as importExport from './importExport.js';

let restartCallback;
let d3_global;
let textarea;
let _model; // Declare module-level variable

export function init(d3_obj, model_obj, restartFn) {
  d3_global = d3_obj;
  _model = model_obj; // Assign model_obj to _model
  restartCallback = restartFn;

  // Remove the old button and add textarea + copy button
  d3_global.select("#dump-data").remove();

  const controlsDiv = d3_global.select("#container")
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
        _model.nodes.splice(0);
        _model.links.splice(0);

        // Add new nodes
        graphData.nodes.forEach((node, index) => {
          const colorIndex = node.manual_override ? node.manual_override.charCodeAt(0) - 97 : null; // Convert 'a' to 0, 'b' to 1, etc.
          _model.nodes.push({
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
          const sourceNode = _model.nodes.find(n => n.label === link.unique_id_l);
          const targetNode = _model.nodes.find(n => n.label === link.unique_id_r);
          if (sourceNode && targetNode) {
            _model.links.push({
              source: sourceNode,
              target: targetNode,
              probability: link.match_probability
            });
          }
        });

        _model.lastNodeId = _model.nodes.length;
        restartCallback();

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

  textarea = outputDiv.append("textarea")
    .attr("id", "graph-data")
    .attr("rows", "30")
    .attr("cols", "80")
    .style("font-family", "monospace")
    .style("width", "100%")
    .style("margin-top", "30px");

  // Initial update
  updateTextarea();
}

export function updateTextarea() {
  textarea.text(importExport.generatePythonCode(_model));
}