
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

const nodeTypes = {
  techNode: TechNode,
};

const TechStackFlow = ({ onSave }: { onSave: (nodes: Node[], edges: Edge[]) => void }) => {
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

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');

      // Check if the dropped element is valid
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
        data: { label: label || type, type },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

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
        <button
          onClick={handleSave}
          className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm"
        >
          Save Graph
        </button>
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
