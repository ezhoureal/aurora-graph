import type { Connection, Edge, EdgeChange, Node, NodeChange, XYPosition } from "reactflow";
import { templateByType, type TemplateDefinition, type PortKind } from "../template/registry";

export interface DagNodeProperties {
  [propertyId: string]: number;
}

export interface DagConnectionRef {
  edgeId: string;
  nodeId: string;
  portId: string;
  portKind: PortKind;
}

export interface DagNodeRecord {
  id: string;
  type: string;
  label: string;
  category: string;
  description: string;
  accent: string;
  inputs: TemplateDefinition["inputs"];
  outputs: TemplateDefinition["outputs"];
  parameters: TemplateDefinition["parameters"];
  position: XYPosition;
  properties: DagNodeProperties;
  parents: DagConnectionRef[];
  children: DagConnectionRef[];
}

export interface DagEdgeRecord {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  sourcePortKind: PortKind;
  targetNodeId: string;
  targetPortId: string;
  targetPortKind: PortKind;
}

export interface DagGraph {
  nodeOrder: string[];
  edgeOrder: string[];
  nodes: Record<string, DagNodeRecord>;
  edges: Record<string, DagEdgeRecord>;
}

export interface DagViewNodeData {
  definition: TemplateDefinition;
  properties: DagNodeProperties;
}

export type DagViewNode = Node<DagViewNodeData>;

const nodeStyle = { borderWidth: 2 };
const edgeStyle = { strokeWidth: 2 };

export function createNodeRecord(
  definition: TemplateDefinition,
  position: XYPosition,
  id: string = crypto.randomUUID(),
): DagNodeRecord {
  return {
    id,
    type: definition.type,
    label: definition.label,
    category: definition.category,
    description: definition.description,
    accent: definition.accent,
    inputs: definition.inputs,
    outputs: definition.outputs,
    parameters: definition.parameters,
    position,
    properties: Object.fromEntries(
      definition.parameters.map((parameter) => [parameter.id, parameter.defaultValue]),
    ),
    parents: [],
    children: [],
  };
}

export function createGraph(): DagGraph {
  const sourceDefinition = templateByType["source.image"];
  const brightnessDefinition = templateByType["fx.brightness"];

  if (!sourceDefinition || !brightnessDefinition) {
    return {
      nodeOrder: [],
      edgeOrder: [],
      nodes: {},
      edges: {},
    };
  }

  const source = createNodeRecord(sourceDefinition, { x: 120, y: 160 }, "node-1");
  const brightness = createNodeRecord(brightnessDefinition, { x: 420, y: 150 }, "node-2");

  const graph: DagGraph = {
    nodeOrder: [source.id, brightness.id],
    edgeOrder: [],
    nodes: {
      [source.id]: source,
      [brightness.id]: brightness,
    },
    edges: {},
  };

  return connectNodes(graph, {
    source: source.id,
    sourceHandle: "image",
    target: brightness.id,
    targetHandle: "image",
  });
}

export function createGraphSnapshot(graph: DagGraph): string {
  return JSON.stringify(graph, null, 2);
}

export function createViewModel(graph: DagGraph): {
  nodes: DagViewNode[];
  edges: Edge[];
} {
  return {
    nodes: graph.nodeOrder
      .map((nodeId) => graph.nodes[nodeId])
      .filter((node): node is DagNodeRecord => Boolean(node))
      .map((node) => {
        return {
          id: node.id,
          type: "effect",
          position: node.position,
          style: { ...nodeStyle, borderColor: node.accent },
          data: {
            definition: {
              type: node.type,
              label: node.label,
              category: node.category,
              description: node.description,
              accent: node.accent,
              inputs: node.inputs,
              outputs: node.outputs,
              parameters: node.parameters,
            },
            properties: node.properties,
          },
        };
      }),
    edges: graph.edgeOrder
      .map((edgeId) => graph.edges[edgeId])
      .filter((edge): edge is DagEdgeRecord => Boolean(edge))
      .map((edge) => ({
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        sourceHandle: edge.sourcePortId,
        targetHandle: edge.targetPortId,
        animated: true,
        style: edgeStyle,
      })),
  };
}

export function updateNodePosition(graph: DagGraph, nodeId: string, position: XYPosition): DagGraph {
  const node = graph.nodes[nodeId];

  if (!node) {
    return graph;
  }

  return {
    ...graph,
    nodes: {
      ...graph.nodes,
      [nodeId]: {
        ...node,
        position,
      },
    },
  };
}

export function updateNodeProperty(
  graph: DagGraph,
  nodeId: string,
  propertyId: string,
  value: number,
): DagGraph {
  const node = graph.nodes[nodeId];

  if (!node) {
    return graph;
  }

  return {
    ...graph,
    nodes: {
      ...graph.nodes,
      [nodeId]: {
        ...node,
        properties: {
          ...node.properties,
          [propertyId]: value,
        },
      },
    },
  };
}

export function removeNode(graph: DagGraph, nodeId: string): DagGraph {
  if (!graph.nodes[nodeId]) {
    return graph;
  }

  const edgeIdsToRemove = new Set<string>();

  for (const edgeId of graph.edgeOrder) {
    const edge = graph.edges[edgeId];

    if (edge && (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId)) {
      edgeIdsToRemove.add(edgeId);
    }
  }

  let nextGraph = graph;
  for (const edgeId of edgeIdsToRemove) {
    nextGraph = removeEdge(nextGraph, edgeId);
  }

  const { [nodeId]: removedNode, ...remainingNodes } = nextGraph.nodes;

  return {
    ...nextGraph,
    nodeOrder: nextGraph.nodeOrder.filter((id) => id !== nodeId),
    nodes: remainingNodes,
  };
}

export function removeEdge(graph: DagGraph, edgeId: string): DagGraph {
  const edge = graph.edges[edgeId];

  if (!edge) {
    return graph;
  }

  const sourceNode = graph.nodes[edge.sourceNodeId];
  const targetNode = graph.nodes[edge.targetNodeId];

  return {
    ...graph,
    edgeOrder: graph.edgeOrder.filter((id) => id !== edgeId),
    edges: omitRecord(graph.edges, edgeId),
    nodes: {
      ...graph.nodes,
      [edge.sourceNodeId]: sourceNode
        ? {
            ...sourceNode,
            children: sourceNode.children.filter((connection) => connection.edgeId !== edgeId),
          }
        : sourceNode,
      [edge.targetNodeId]: targetNode
        ? {
            ...targetNode,
            parents: targetNode.parents.filter((connection) => connection.edgeId !== edgeId),
          }
        : targetNode,
    },
  };
}

export function connectNodes(graph: DagGraph, connection: Connection): DagGraph {
  if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
    return graph;
  }

  const sourceNode = graph.nodes[connection.source];
  const targetNode = graph.nodes[connection.target];

  if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) {
    return graph;
  }

  const sourcePort = sourceNode.outputs.find((port) => port.id === connection.sourceHandle);
  const targetPort = targetNode.inputs.find((port) => port.id === connection.targetHandle);

  if (!sourcePort || !targetPort || sourcePort.kind !== targetPort.kind) {
    return graph;
  }

  if (isDuplicateTargetHandle(graph, targetNode.id, targetPort.id)) {
    return graph;
  }

  if (hasPath(graph, targetNode.id, sourceNode.id)) {
    return graph;
  }

  const edgeId = `edge-${sourceNode.id}-${connection.sourceHandle}-${targetNode.id}-${connection.targetHandle}-${crypto.randomUUID()}`;
  const edge: DagEdgeRecord = {
    id: edgeId,
    sourceNodeId: sourceNode.id,
    sourcePortId: sourcePort.id,
    sourcePortKind: sourcePort.kind,
    targetNodeId: targetNode.id,
    targetPortId: targetPort.id,
    targetPortKind: targetPort.kind,
  };

  return {
    ...graph,
    edgeOrder: [...graph.edgeOrder, edgeId],
    edges: {
      ...graph.edges,
      [edgeId]: edge,
    },
    nodes: {
      ...graph.nodes,
      [sourceNode.id]: {
        ...sourceNode,
        children: [
          ...sourceNode.children,
          {
            edgeId,
            nodeId: targetNode.id,
            portId: targetPort.id,
            portKind: targetPort.kind,
          },
        ],
      },
      [targetNode.id]: {
        ...targetNode,
        parents: [
          ...targetNode.parents,
          {
            edgeId,
            nodeId: sourceNode.id,
            portId: sourcePort.id,
            portKind: sourcePort.kind,
          },
        ],
      },
    },
  };
}

export function applyNodeChanges(graph: DagGraph, changes: NodeChange[]): DagGraph {
  let nextGraph = graph;

  for (const change of changes) {
    switch (change.type) {
      case "position":
        if (change.position) {
          nextGraph = updateNodePosition(nextGraph, change.id, change.position);
        }
        break;
      case "remove":
        nextGraph = removeNode(nextGraph, change.id);
        break;
      default:
        break;
    }
  }

  return nextGraph;
}

export function applyEdgeChanges(graph: DagGraph, changes: EdgeChange[]): DagGraph {
  let nextGraph = graph;

  for (const change of changes) {
    if (change.type === "remove" && "id" in change) {
      nextGraph = removeEdge(nextGraph, change.id);
    }
  }

  return nextGraph;
}

function hasPath(graph: DagGraph, startNodeId: string, targetNodeId: string): boolean {
  if (startNodeId === targetNodeId) {
    return true;
  }

  const visited = new Set<string>();
  const stack = [startNodeId];

  while (stack.length > 0) {
    const currentNodeId = stack.pop();

    if (!currentNodeId || visited.has(currentNodeId)) {
      continue;
    }

    visited.add(currentNodeId);

    const currentNode = graph.nodes[currentNodeId];

    if (!currentNode) {
      continue;
    }

    for (const child of currentNode.children) {
      if (child.nodeId === targetNodeId) {
        return true;
      }

      if (!visited.has(child.nodeId)) {
        stack.push(child.nodeId);
      }
    }
  }

  return false;
}

function isDuplicateTargetHandle(graph: DagGraph, nodeId: string, portId: string): boolean {
  return Object.values(graph.edges).some(
    (edge) => edge.targetNodeId === nodeId && edge.targetPortId === portId,
  );
}

function omitRecord<T extends Record<string, unknown>, K extends keyof T>(record: T, key: K): Omit<T, K> {
  const { [key]: _removed, ...remaining } = record;
  return remaining;
}
