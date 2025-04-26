import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';  // Updated import path
import { useToast } from '@/hooks/use-toast';
import TechNode from './nodes/TechNode';
import { Button } from '@/components/ui/button';

const nodeTypes = {
  techNode: TechNode,
};

const TechStackFlow = ({ onSave, onExport }: { onSave: (nodes: Node[], edges: Edge[]) => void, onExport: () => void }) => {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'default',
        animated: false,
        style: { stroke: '#333' },
        markerEnd: {
          type: MarkerType.Arrow,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeLabelChange = (nodeId: string, newLabel: string) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const handleNodeDetailsChange = (nodeId: string, details: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              details
            },
          };
        }
        return node;
      })
    );
  };

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!reactFlowWrapper.current || !reactFlowInstance) return;

    const type = event.dataTransfer.getData('application/reactflow/type');
    const label = event.dataTransfer.getData('application/reactflow/label');

    if (typeof type === 'undefined' || !type) {
      return;
    }

    // Calculate position: Top-left corner at cursor's flow coordinates
    // screenToFlowPosition correctly handles zoom and pan
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Create the new node with the calculated position (no offset)
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'techNode',
      position, // Use the position directly from screenToFlowPosition
      data: { 
        label: label || type, 
        type,
        details: '',
        onLabelChange: handleNodeLabelChange,
        onDelete: handleNodeDelete,
        onDetailsChange: handleNodeDetailsChange,
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  const handleSave = () => {
    const formattedNodes = nodes.map(node => ({
      id: node.id,
      name: node.data.label,
      details: node.data.details || '',
      x_pos: node.position.x,
      y_pos: node.position.y,
    }));

    const formattedEdges = edges.map(edge => ({
      source_ID: edge.source,
      target_ID: edge.target,
    }));

    const graphData = {
      nodes: formattedNodes,
      edges: formattedEdges,
      metadata: {
        created: new Date().toISOString(),
      }
    };

    onSave(nodes, edges);
    toast({
      title: "Graph saved",
      description: "Your tech stack graph has been saved successfully",
    });
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-end items-center p-2 bg-background border-b">
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            variant="outline"
            size="sm"
          >
            Save Graph
          </Button>
          <Button
            onClick={onExport}
            size="sm"
          >
            Export to GitHub
          </Button>
        </div>
      </div>
      <div className="flex-grow" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            type: 'default',
            animated: false,
            style: { stroke: '#333' },
            markerEnd: {
              type: MarkerType.Arrow,
            },
          }}
        >
          <Controls />
          <MiniMap />
          <Background 
            variant={BackgroundVariant.Dots}
            gap={12} 
            size={1} 
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default TechStackFlow;
