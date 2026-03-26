import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type XYPosition,
} from "reactflow";
import { create } from "zustand";
import { paletteByType, type PaletteItem } from "../blocks/palette";
import type { EffectNodeData } from "../components/EffectNode";

type GraphNode = Node<EffectNodeData>;
type NodeParameters = Record<string, number>;

interface GraphState {
  nodes: GraphNode[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNodeFromPalette: (type: string, position: XYPosition) => void;
  updateNodeParameter: (nodeId: string, parameterId: string, value: number) => void;
}

const initialNodes: GraphNode[] = [
  createNode(paletteByType["source.image"], { x: 120, y: 160 }, "node-1"),
  createNode(paletteByType["fx.brightness"], { x: 420, y: 150 }, "node-2"),
];

const initialEdges: Edge[] = [
  {
    id: "edge-node-1-node-2",
    source: "node-1",
    target: "node-2",
    sourceHandle: "image",
    targetHandle: "image",
    animated: true,
    style: { strokeWidth: 2 },
  },
];

function createNode(
  definition: PaletteItem,
  position: XYPosition,
  id: string = crypto.randomUUID(),
): GraphNode {
  const parameters: NodeParameters = Object.fromEntries(
    definition.parameters.map((parameter) => [parameter.id, parameter.defaultValue]),
  );

  return {
    id,
    type: "effect",
    position,
    data: {
      definition,
      parameters,
    },
  };
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),
  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),
  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: `edge-${connection.source}-${connection.target}-${crypto.randomUUID()}`,
          animated: true,
          style: { strokeWidth: 2 },
        },
        state.edges,
      ),
    })),
  addNodeFromPalette: (type, position) => {
    const definition = paletteByType[type];

    if (!definition) {
      return;
    }

    set((state) => ({
      nodes: [...state.nodes, createNode(definition, position)],
    }));
  },
  updateNodeParameter: (nodeId, parameterId, value) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                parameters: {
                  ...node.data.parameters,
                  [parameterId]: value,
                },
              },
            }
          : node,
      ),
    })),
}));
