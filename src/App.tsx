import { useCallback, useRef, type DragEvent } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import EffectNode from "./components/EffectNode";
import { useGraphStore } from "./store/useGraphStore";
import { templateItems } from "./template/registry";

const nodeTypes = {
  effect: EffectNode,
};

const dragMimeType = "application/aurora-graph-node";

function App() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNodeFromPalette, graphJson } =
    useGraphStore();

  const onDragStart = useCallback((event: DragEvent<HTMLButtonElement>, type: string) => {
    event.dataTransfer.setData(dragMimeType, type);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(dragMimeType);

      if (!type || !wrapperRef.current) {
        return;
      }

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addNodeFromPalette(type, position);
    },
    [addNodeFromPalette, screenToFlowPosition],
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-copy">
          <h1>Aurora Graph</h1>
          <p>
            Drag blocks onto the canvas to start shaping the effect graph UI. The execution engine
            comes later.
          </p>
        </div>

        <div className="palette-list">
          {templateItems.map((item) => (
            <button
              key={item.type}
              className="palette-card"
              draggable
              onDragStart={(event) => onDragStart(event, item.type)}
              style={{ ["--card-accent" as string]: item.accent }}
              type="button"
            >
              <span className="palette-category">{item.category}</span>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>

        <section className="graph-export">
          <div className="graph-export-header">
            <span className="eyebrow">Live JSON</span>
            <p>Canonical DAG snapshot exported straight from the model layer.</p>
          </div>
          <pre className="graph-export-code">{graphJson}</pre>
        </section>
      </aside>

      <section className="canvas-shell">
        <div className="canvas-frame" onDragOver={onDragOver} onDrop={onDrop} ref={wrapperRef}>
          <ReactFlow
            defaultEdgeOptions={{ type: "smoothstep" }}
            edges={edges}
            fitView
            nodeTypes={nodeTypes}
            nodes={nodes}
            onConnect={onConnect}
            onEdgesChange={onEdgesChange}
            onNodesChange={onNodesChange}
          >
            <Panel className="canvas-panel" position="top-left">
              Drop to create nodes, then drag them around and connect matching ports.
            </Panel>
            <MiniMap
              className="minimap"
              maskColor="rgba(8, 15, 28, 0.75)"
              nodeBorderRadius={16}
              nodeColor="#7dd3fc"
              pannable
              zoomable
            />
            <Controls position="bottom-left" />
            <Background color="rgba(125, 211, 252, 0.18)" gap={24} variant={BackgroundVariant.Cross} />
          </ReactFlow>
        </div>
      </section>
    </main>
  );
}

export default App;
