import type { Connection, EdgeChange, NodeChange, XYPosition } from "reactflow";
import { create } from "zustand";
import {
  applyEdgeChanges as applyDagEdgeChanges,
  applyNodeChanges as applyDagNodeChanges,
  connectNodes,
  createGraph,
  createGraphSnapshot,
  createNodeRecord,
  createViewModel,
  updateNodeProperty,
  type DagGraph,
} from "../model/dag";
import { templateByType } from "../template/registry";

interface GraphState {
  graph: DagGraph;
  nodes: ReturnType<typeof createViewModel>["nodes"];
  edges: ReturnType<typeof createViewModel>["edges"];
  graphJson: string;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNodeFromPalette: (type: string, position: XYPosition) => void;
  updateNodeParameter: (nodeId: string, parameterId: string, value: number) => void;
}

const initialGraph = createGraph();

function syncGraph(graph: DagGraph, graphJson: string) {
  const viewModel = createViewModel(graph);

  return {
    graph,
    nodes: viewModel.nodes,
    edges: viewModel.edges,
    graphJson,
  };
}

function syncGraphIfChanged(currentGraph: DagGraph, nextGraph: DagGraph, shouldExportJson: boolean) {
  if (nextGraph === currentGraph) {
    return undefined;
  }

  const nextGraphJson = shouldExportJson ? createGraphSnapshot(nextGraph) : createGraphSnapshot(currentGraph);

  return syncGraph(nextGraph, nextGraphJson);
}

export const useGraphStore = create<GraphState>((set) => ({
  ...syncGraph(initialGraph, createGraphSnapshot(initialGraph)),
  onNodesChange: (changes) =>
    set((state) => {
      const shouldExportJson = changes.some((change) => change.type === "remove");
      const nextState = syncGraphIfChanged(
        state.graph,
        applyDagNodeChanges(state.graph, changes),
        shouldExportJson,
      );
      return nextState ?? state;
    }),
  onEdgesChange: (changes) =>
    set((state) => {
      const nextState = syncGraphIfChanged(state.graph, applyDagEdgeChanges(state.graph, changes), false);
      return nextState ?? state;
    }),
  onConnect: (connection) =>
    set((state) => {
      const nextState = syncGraphIfChanged(state.graph, connectNodes(state.graph, connection), true);
      return nextState ?? state;
    }),
  addNodeFromPalette: (type, position) => {
    const definition = templateByType[type];

    if (!definition) {
      return;
    }

    set((state) => {
      const node = createNodeRecord(definition, position);

      const nextGraph = {
        ...state.graph,
        nodeOrder: [...state.graph.nodeOrder, node.id],
        nodes: {
          ...state.graph.nodes,
          [node.id]: node,
        },
      };

      return syncGraph(nextGraph, createGraphSnapshot(nextGraph));
    });
  },
  updateNodeParameter: (nodeId, parameterId, value) =>
    set((state) => {
      const nextState = syncGraphIfChanged(
        state.graph,
        updateNodeProperty(state.graph, nodeId, parameterId, value),
        false,
      );
      return nextState ?? state;
    }),
}));
