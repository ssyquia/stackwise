
import React, { useState } from 'react';
import { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NodePalette from '@/components/sidebar/NodePalette';
import VersionHistoryItem from '@/components/sidebar/VersionHistoryItem';
import TechStackFlow from '@/components/TechStackFlow';
import ChatPanel from '@/components/ChatPanel';

// Type for version history items
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

  // Get current active version data
  const getCurrentVersionData = (): VersionHistoryEntry => {
    return versionHistory.find(v => v.id === activeVersion) || versionHistory[0];
  };

  // Handle node drag from palette
  const onDragStart = (event: React.DragEvent, nodeType: {type: string, label: string}) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType.type);
    event.dataTransfer.setData('application/reactflow/label', nodeType.label);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Save current graph state
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

  // Restore a specific version
  const handleRestoreVersion = (versionId: string) => {
    const version = versionHistory.find(v => v.id === versionId);
    if (version) {
      setActiveVersion(versionId);
      setCurrentNodes(version.nodes);
      setCurrentEdges(version.edges);
    }
  };

  // Handle AI graph generation (placeholder)
  const handleGenerateGraph = (prompt: string) => {
    // This would call the Gemini API in a real implementation
    // For now, just add a placeholder version
    const newVersion: VersionHistoryEntry = {
      id: `ai_version_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      description: `AI Generated: ${prompt.substring(0, 20)}...`,
      nodes: [
        // Add some placeholder nodes based on the prompt
        {
          id: 'ai_node_1',
          type: 'techNode',
          position: { x: 100, y: 100 },
          data: { label: 'React', type: 'frontend' }
        },
        {
          id: 'ai_node_2',
          type: 'techNode',
          position: { x: 100, y: 200 },
          data: { label: 'Node.js', type: 'backend' }
        },
        {
          id: 'ai_node_3',
          type: 'techNode',
          position: { x: 100, y: 300 },
          data: { label: 'MongoDB', type: 'database' }
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

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className={`bg-card border-r transition-all ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">Tech Stack Builder</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ←
            </button>
          </div>
          
          {/* Node Palette */}
          <div className="border-b">
            <NodePalette onDragStart={onDragStart} />
          </div>
          
          {/* Version History */}
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
      
      {/* Main Content */}
      <div className="flex flex-col flex-grow">
        {/* Toggle Sidebar Button (when closed) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 bg-card p-2 rounded-md shadow-md"
          >
            →
          </button>
        )}
        
        {/* Flow Editor */}
        <div className="flex-grow">
          <TechStackFlow onSave={handleSave} />
        </div>
        
        {/* Chat Panel */}
        <ChatPanel onGenerateGraph={handleGenerateGraph} />
      </div>
    </div>
  );
};

export default Index;
