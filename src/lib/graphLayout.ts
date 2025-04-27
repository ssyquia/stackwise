import { Node, Edge, Position } from '@xyflow/react';

interface NodeWithPosition extends Node {
  position: { x: number; y: number };
}

interface EdgeWithNodes extends Edge {
  sourceNode: NodeWithPosition;
  targetNode: NodeWithPosition;
}

/**
 * Performs a topological sort on the nodes using Kahn's algorithm.
 * Returns an array of node IDs in topological order, or null if a cycle is detected.
 */
export const topologicalSort = (nodes: Node[], edges: Edge[]): string[] | null => {
  const inDegree: { [key: string]: number } = {};
  const adj: { [key: string]: string[] } = {};
  const nodeMap: { [key: string]: Node } = {};

  nodes.forEach(node => {
    inDegree[node.id] = 0;
    adj[node.id] = [];
    nodeMap[node.id] = node;
  });

  edges.forEach(edge => {
    if (adj[edge.source]) {
      adj[edge.source].push(edge.target);
    } else {
      // Handle case where an edge references a non-existent source node
      console.warn(`Edge source node ${edge.source} not found.`);
    }
    if (inDegree[edge.target] !== undefined) {
      inDegree[edge.target]++;
    } else {
      // Handle case where an edge references a non-existent target node
      console.warn(`Edge target node ${edge.target} not found.`);
    }
  });

  const queue = nodes.filter(node => inDegree[node.id] === 0).map(node => node.id);
  const result: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    result.push(u);

    if (adj[u]) {
      adj[u].forEach(v => {
        if (inDegree[v] !== undefined) {
          inDegree[v]--;
          if (inDegree[v] === 0) {
            queue.push(v);
          }
        }
      });
    }
  }

  if (result.length !== nodes.length) {
    console.error("Cycle detected in the graph. Topological sort failed.");
    return null; // Cycle detected
  }

  return result;
};

/**
 * Calculates node positions based on topological sort for a top-down layout.
 */
export const calculateLayout = (
  nodes: Node[],
  edges: Edge[],
  options: { nodeWidth?: number; nodeHeight?: number; horizontalSpacing?: number; verticalSpacing?: number } = {}
): NodeWithPosition[] => {
  const {
    nodeWidth = 150, // Default width (matches TechNode style)
    nodeHeight = 80,  // Approximate height of TechNode
    horizontalSpacing = 100,
    verticalSpacing = 100,
  } = options;

  const sortedNodeIds = topologicalSort(nodes, edges);

  if (!sortedNodeIds) {
    console.warn("Could not perform topological sort (likely due to cycle or invalid edges). Returning original node positions.");
    // Fallback: Return original nodes if sort fails
    return nodes.map(n => ({ ...n, position: n.position || { x: 0, y: 0 } })) as NodeWithPosition[];
  }

  const nodeMap = new Map(nodes.map(node => [node.id, { ...node }]));
  const levels: Map<string, number> = new Map();

  // Calculate level for each node (longest path from a source)
  sortedNodeIds.forEach(nodeId => {
    let maxLevel = 0;
    edges.forEach(edge => {
      if (edge.target === nodeId) {
        const sourceLevel = levels.get(edge.source) ?? 0;
        maxLevel = Math.max(maxLevel, sourceLevel + 1);
      }
    });
    levels.set(nodeId, maxLevel);
  });

  const nodesByLevel: Map<number, string[]> = new Map();
  levels.forEach((level, nodeId) => {
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(nodeId);
  });

  const layoutNodes: NodeWithPosition[] = [];

  // Calculate positions
  nodesByLevel.forEach((levelNodes, level) => {
    const levelWidth = levelNodes.length * (nodeWidth + horizontalSpacing) - horizontalSpacing;
    const startX = -levelWidth / 2; // Center the level horizontally

    levelNodes.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        const x = startX + index * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
        const y = level * (nodeHeight + verticalSpacing);
        layoutNodes.push({
          ...node,
          position: { x, y },
        } as NodeWithPosition); // Assert type as we are setting position
      }
    });
  });

  // Ensure all original nodes are included even if they were disconnected
  nodes.forEach(originalNode => {
    if (!layoutNodes.some(ln => ln.id === originalNode.id)) {
        // Add disconnected nodes at level 0, spaced out
        const levelZeroNodes = layoutNodes.filter(ln => levels.get(ln.id) === 0);
        const lastLevelZeroX = levelZeroNodes.length > 0 ? levelZeroNodes[levelZeroNodes.length - 1].position.x : - (nodeWidth + horizontalSpacing);
        layoutNodes.push({
            ...originalNode,
            position: { x: lastLevelZeroX + nodeWidth + horizontalSpacing, y: 0 }
        } as NodeWithPosition);
        levels.set(originalNode.id, 0); // Assign level for consistency
    }
  });


  return layoutNodes;
}; 