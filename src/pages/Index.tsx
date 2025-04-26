import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Edge, 
  Node, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  MarkerType,
  ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NodePalette from '@/components/sidebar/NodePalette';
import VersionHistoryItem from '@/components/sidebar/VersionHistoryItem';
import TechStackFlow from '@/components/TechStackFlow';
import ChatPanel from '@/components/ChatPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import TechNode from '@/components/nodes/TechNode';

const LOCAL_STORAGE_KEY = 'techStackGraphHistory';

// Type for version history items
interface VersionHistoryEntry {
  id: string;
  timestamp: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

// Define node types used in the flow
const nodeTypes = {
  techNode: TechNode,
};

const Index = () => {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Load initial state from localStorage or set default
  const loadInitialHistory = (): VersionHistoryEntry[] => {
    if (typeof window !== 'undefined') { // Ensure localStorage is available
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          // Basic validation to ensure it's an array
          if (Array.isArray(parsedHistory)) {
            return parsedHistory;
          }
        } catch (e) {
          console.error("Failed to parse version history from localStorage", e);
        }
      }
    }
    // Default initial version if nothing in localStorage or parsing failed
    return [
      {
        id: 'initial',
        timestamp: new Date().toLocaleString(),
        description: 'Initial Version',
        nodes: [],
        edges: [],
      }
    ];
  };

  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>(loadInitialHistory);
  const [activeVersionId, setActiveVersionId] = useState<string>(() => versionHistory[versionHistory.length - 1]?.id || 'initial');

  // Initialize nodes/edges state based on the active version
  const initialActiveVersion = versionHistory.find(v => v.id === activeVersionId) || versionHistory[0];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialActiveVersion.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialActiveVersion.edges);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportJson, setExportJson] = useState('');

  // Effect to mark initial load as complete after first render
  useEffect(() => {
    setInitialLoadComplete(true);
  }, []);

  // Save history to localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (initialLoadComplete && typeof window !== 'undefined') {
      // Find the currently active version in history and update its nodes/edges
      // This is needed because nodes/edges state updates separately now
      const updatedHistory = versionHistory.map(version => {
        if (version.id === activeVersionId) {
          return { ...version, nodes: nodes, edges: edges };
        }
        return version;
      });
      // Only save if the history actually changed to avoid infinite loops
      if (JSON.stringify(updatedHistory) !== JSON.stringify(versionHistory)) {
         setVersionHistory(updatedHistory); // Update the history state itself
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
      } else if (JSON.stringify(versionHistory) !== localStorage.getItem(LOCAL_STORAGE_KEY)) {
        // Or save if history state is different from localStorage (e.g., on initial load correction)
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(versionHistory));
      }
    }
  }, [nodes, edges, activeVersionId, versionHistory, initialLoadComplete]);

  // Get current active version data
  const getCurrentVersionData = (): VersionHistoryEntry => {
    return versionHistory.find(v => v.id === activeVersionId) || versionHistory[0];
  };

  // Handle node drag from palette
  const onDragStart = (event: React.DragEvent, nodeType: {type: string, label: string}) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType.type);
    event.dataTransfer.setData('application/reactflow/label', nodeType.label);
    event.dataTransfer.effectAllowed = 'move';
  };

  // React Flow Handlers
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'default', // Or your preferred edge type
        animated: false,
        style: { stroke: '#333' },
        markerEnd: { type: MarkerType.Arrow },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
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

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = { // Ensure newNode conforms to Node type
        id: `node_${Date.now()}`,
        type: 'techNode',
        position,
        data: {
          label: label || type,
          type: type, // Pass type for styling/logic in TechNode
          details: '', // Add details field
          // Pass handlers directly
          onLabelChange: handleNodeLabelChange,
          onDelete: handleNodeDelete,
          onDetailsChange: handleNodeDetailsChange,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes] // Removed dependency on node change handlers
  );

  // Node Data Change Handlers
  const handleNodeLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleNodeDetailsChange = useCallback((nodeId: string, details: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, details } };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Versioning Handlers
  const handleSave = () => { // No longer needs nodes/edges passed in
    const newVersion: VersionHistoryEntry = {
      id: `version_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      description: `Version ${versionHistory.length + 1}`, // Use current length before adding
      // Clone current nodes/edges from state
      nodes: nodes.map(n => ({ ...n, data: { ...n.data } })), // Deep copy nodes/data
      edges: edges.map(e => ({ ...e })), // Shallow copy edges (usually fine)
    };

    const updatedHistory = [...versionHistory, newVersion];
    setVersionHistory(updatedHistory);
    setActiveVersionId(newVersion.id); // Activate the new version
    // No need to setCurrentNodes/Edges here, state already reflects current graph
    toast({ title: "Graph Saved", description: `Version ${updatedHistory.length} saved.` });
  };

  const handleRestoreVersion = (versionId: string) => {
    const version = versionHistory.find(v => v.id === versionId);
    if (version) {
      setActiveVersionId(versionId);
      // Set nodes/edges state directly using setters from hooks
      setNodes([...version.nodes]); // Use spread for new array reference
      setEdges([...version.edges]); // Use spread for new array reference
      toast({ title: "Version Restored", description: `Restored: ${version.description}` });
    } else {
       toast({ title: "Error", description: "Version not found.", variant: "destructive"});
    }
  };

  // Handle exporting the graph
  const handleExportGraph = () => {
    const formattedNodes = nodes.map(node => ({ // Use nodes state
      id: node.id,
      name: node.data.label,
      details: node.data.details || '',
      x_pos: node.position.x,
      y_pos: node.position.y,
    }));

    const formattedEdges = edges.map(edge => ({ // Use edges state
      source_ID: edge.source,
      target_ID: edge.target,
    }));

    const graphData = {
      nodes: formattedNodes,
      edges: formattedEdges,
      metadata: {
        name: `Tech Stack Graph - ${new Date().toISOString()}`,
        created: new Date().toISOString(),
        version: activeVersionId // Use activeVersionId state
      }
    };

    setExportJson(JSON.stringify(graphData, null, 2));
    setExportDialogOpen(true);
  };

  // Handle AI graph generation
  const handleGenerateGraph = (prompt: string) => {
    // Placeholder for AI generation logic
    const aiNodes: Node[] = [ // Explicitly type as Node[]
        { id: 'ai_node_1', type: 'techNode', position: { x: 100, y: 100 }, data: { label: 'React', type: 'frontend', onLabelChange: handleNodeLabelChange, onDelete: handleNodeDelete, onDetailsChange: handleNodeDetailsChange } },
        { id: 'ai_node_2', type: 'techNode', position: { x: 100, y: 200 }, data: { label: 'Node.js', type: 'backend', onLabelChange: handleNodeLabelChange, onDelete: handleNodeDelete, onDetailsChange: handleNodeDetailsChange } },
        { id: 'ai_node_3', type: 'techNode', position: { x: 100, y: 300 }, data: { label: 'MongoDB', type: 'database', onLabelChange: handleNodeLabelChange, onDelete: handleNodeDelete, onDetailsChange: handleNodeDetailsChange } }
    ];
    const aiEdges: Edge[] = [ // Explicitly type as Edge[]
      { id: 'ai_edge_1-2', source: 'ai_node_1', target: 'ai_node_2', type: 'default', markerEnd: { type: MarkerType.Arrow } },
      { id: 'ai_edge_2-3', source: 'ai_node_2', target: 'ai_node_3', type: 'default', markerEnd: { type: MarkerType.Arrow } }
    ];

    const newVersion: VersionHistoryEntry = {
      id: `ai_version_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      description: `AI Generated: ${prompt.substring(0, 20)}...`,
      nodes: aiNodes,
      edges: aiEdges
    };

    const updatedHistory = [...versionHistory, newVersion];

    // Update state
    setVersionHistory(updatedHistory);
    setActiveVersionId(newVersion.id);
    setNodes(aiNodes); // Set the nodes/edges state directly
    setEdges(aiEdges);
    toast({ title: "AI Graph Generated", description: `Created new version: ${newVersion.description}` });
  };

  const handleCreateRepository = async () => {
    try {
      const response = await fetch('/api/github/create-repository', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: exportJson,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Repository created successfully!",
        });
        setExportDialogOpen(false);
      } else {
        throw new Error('Failed to create repository');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create repository. Please try again.",
        variant: "destructive",
      });
    }
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
                  isActive={version.id === activeVersionId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-grow" ref={reactFlowWrapper}>
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
          <TechStackFlow 
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance: ReactFlowInstance) => setReactFlowInstance(instance)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            onSave={handleSave}
            onExport={handleExportGraph}
          />
        </div>
        
        {/* Chat Panel */}
        <ChatPanel onGenerateGraph={handleGenerateGraph} />
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-lg w-[70vw] h-[60vh] flex flex-col p-4">
          <DialogHeader className="mb-2">
            <DialogTitle>Export to GitHub</DialogTitle>
            <DialogDescription>
              Review your tech stack graph data before creating a GitHub repository.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <Textarea 
              className="flex-1 font-mono text-xs resize-none mb-4 border border-input rounded-md p-2"
              value={exportJson}
              readOnly
            />
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setExportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateRepository}>Create Repository</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;