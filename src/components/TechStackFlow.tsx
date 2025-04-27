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
import { Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  onReset: () => void;
  onAutoLayout: () => void;
  isSidebarCollapsed: boolean;
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
  onReset,
  onAutoLayout,
  isSidebarCollapsed
}) => {
  const handleSave = () => {
    onSave();
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-center p-2 bg-background border-b">
        <h2 className="px-2 text-lg font-medium flex items-center">
          <img 
            src="/stackwiseLogo.png"
            alt="Stackwise logo" 
            className="h-5 w-5 mr-2"
          /> 
          <span>stackwise</span>
        </h2>
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
            onClick={onAutoLayout}
            variant="outline"
            size="sm"
            title="Auto Layout"
          >
            <Layout className="h-4 w-4 mr-1" />
            Layout
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
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'default',
            animated: false,
            style: { stroke: '#000000', strokeWidth: 1.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: '#000000',
            },
          }}
        >
          <Controls className={cn(isSidebarCollapsed && "mb-16")} />
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
