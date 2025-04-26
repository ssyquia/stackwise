import React, { useState } from 'react';
import { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NodePalette from '@/components/sidebar/NodePalette';
import VersionHistoryItem from '@/components/sidebar/VersionHistoryItem';
import TechStackFlow from '@/components/TechStackFlow';
import ChatPanel from '@/components/ChatPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface VersionHistoryEntry {
  id: string;
  timestamp: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

const Index = () => {
  const [activeVersion, setActiveVersion] = useState<string>('initial');
  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>([
    {
      id: 'initial',
      timestamp: new Date().toLocaleString(),
      description: 'Initial Version',
      nodes: [],
      edges: [],
    }
  ]);
  const [currentNodes, setCurrentNodes] = useState<Node[]>([]);
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportJson, setExportJson] = useState('');

  const getCurrentVersionData = (): VersionHistoryEntry => {
    return versionHistory.find(v => v.id === activeVersion) || versionHistory[0];
  };

  const onDragStart = (event: React.DragEvent, nodeType: {type: string, label: string}) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType.type);
    event.dataTransfer.setData('application/reactflow/label', nodeType.label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSave = (nodes: Node[], edges: Edge[]) => {
    const newVersion: VersionHistoryEntry = {
      id: `version_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      description: `Version ${versionHistory.length + 1}`,
      nodes: nodes,
      edges: edges,
    };

    setVersionHistory([...versionHistory, newVersion]);
    setActiveVersion(newVersion.id);
    setCurrentNodes(nodes);
    setCurrentEdges(edges);
  };

  const handleRestoreVersion = (versionId: string) => {
    const version = versionHistory.find(v => v.id === versionId);
    if (version) {
      setActiveVersion(versionId);
      setCurrentNodes([...version.nodes]);
      setCurrentEdges([...version.edges]);
    }
  };

  const handleExportGraph = () => {
    const graphData = {
      nodes: currentNodes,
      connections: currentEdges.map(edge => ({
        nodes: [edge.source, edge.target]
      })),
      metadata: {
        name: `Tech Stack Graph - ${new Date().toISOString()}`,
        created: new Date().toISOString(),
        version: activeVersion
      }
    };

    setExportJson(JSON.stringify(graphData, null, 2));
    setExportDialogOpen(true);
  };

  const handleGenerateGraph = (prompt: string) => {
    const newVersion: VersionHistoryEntry = {
      id: `ai_version_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      description: `AI Generated: ${prompt.substring(0, 20)}...`,
      nodes: [
        {
          id: 'ai_node_1',
          type: 'techNode',
          position: { x: 100, y: 100 },
          data: { 
            label: 'React', 
            type: 'frontend',
            onLabelChange: handleNodeLabelChange,
            onDelete: handleNodeDelete,
          }
        },
        {
          id: 'ai_node_2',
          type: 'techNode',
          position: { x: 100, y: 200 },
          data: { 
            label: 'Node.js', 
            type: 'backend',
            onLabelChange: handleNodeLabelChange,
            onDelete: handleNodeDelete,
          }
        },
        {
          id: 'ai_node_3',
          type: 'techNode',
          position: { x: 100, y: 300 },
          data: { 
            label: 'MongoDB', 
            type: 'database',
            onLabelChange: handleNodeLabelChange,
            onDelete: handleNodeDelete,
          }
        }
      ],
      edges: [
        {
          id: 'ai_edge_1-2',
          source: 'ai_node_1',
          target: 'ai_node_2'
        },
        {
          id: 'ai_edge_2-3',
          source: 'ai_node_2',
          target: 'ai_node_3'
        }
      ]
    };

    setVersionHistory([...versionHistory, newVersion]);
    setActiveVersion(newVersion.id);
    setCurrentNodes(newVersion.nodes);
    setCurrentEdges(newVersion.edges);
  };

  const handleNodeLabelChange = (nodeId: string, newLabel: string) => {
    setCurrentNodes((nds) => 
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
    setCurrentNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setCurrentEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  return (
    <div className="flex h-screen w-full">
      <div className={`bg-card border-r transition-all ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">Tech Stack Builder</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ←
            </button>
          </div>
          
          <div className="border-b">
            <NodePalette onDragStart={onDragStart} />
          </div>
          
          <div className="flex-grow overflow-y-auto p-4">
            <h3 className="text-sm font-medium mb-3">Version History</h3>
            <div className="space-y-1">
              {versionHistory.map((version) => (
                <VersionHistoryItem
                  key={version.id}
                  version={version}
                  onRestore={handleRestoreVersion}
                  isActive={version.id === activeVersion}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-grow">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 bg-card p-2 rounded-md shadow-md"
          >
            →
          </button>
        )}
        
        <div className="bg-background p-2 flex justify-end border-b">
          <Button onClick={handleExportGraph} variant="outline" size="sm">
            Export to GitHub
          </Button>
        </div>
        
        <div className="flex-grow">
          <TechStackFlow onSave={handleSave} />
        </div>
        
        <ChatPanel onGenerateGraph={handleGenerateGraph} />
      </div>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export to GitHub</DialogTitle>
            <DialogDescription>
              This JSON representation of your graph can be used to generate a GitHub repository.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea 
              className="h-60 font-mono text-xs"
              value={exportJson}
              readOnly
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setExportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button>Create Repository</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
