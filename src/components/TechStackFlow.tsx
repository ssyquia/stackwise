import React, { ReactNode } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnInit,
  NodeTypes,
  ReactFlowInstance,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import ResetGraphButton from './ResetGraphButton';

interface TechStackFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onInit: OnInit<any>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  nodeTypes: NodeTypes;
  onSave: () => void;
  onExport: () => void;
  onReset: () => void;
}

const TechStackFlow: React.FC<TechStackFlowProps> = ({ 
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  onDrop,
  onDragOver,
  nodeTypes,
  onSave, 
  onExport,
  onReset
}) => {
  const handleSave = () => {
    onSave();
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
          <ResetGraphButton onReset={onReset} size="sm" />
          <Button
            onClick={onExport}
            size="sm"
          >
            Export to GitHub
          </Button>
        </div>
      </div>
      <div className="flex-grow">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
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
          <MiniMap position="top-right" />
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
