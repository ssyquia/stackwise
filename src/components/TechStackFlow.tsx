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
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow/type');
    const label = event.dataTransfer.getData('application/reactflow/label');

    if (typeof type === 'undefined' || !type) {
      return;
    }

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const newNode = {
      id: `node_${Date.now()}`,
      type: 'techNode',
      position,
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
    onSave(nodes, edges);
    toast({
      title: "Graph saved",
      description: "Your tech stack graph has been saved successfully",
    });
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-center p-2 bg-background border-b">
        <h2 className="text-lg font-medium">Tech Stack Editor</h2>
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
        >
          <Controls />
          <MiniMap />
          <Background 
            variant={BackgroundVariant.Dots}  // Updated to use BackgroundVariant enum
            gap={12} 
            size={1} 
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default TechStackFlow;
