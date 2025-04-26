import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Edge, 
  Node, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  MarkerType,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NodePalette from '@/components/sidebar/NodePalette';
import VersionHistoryItem from '@/components/sidebar/VersionHistoryItem';
import TechStackFlow from '@/components/TechStackFlow';
import ChatPanel from '@/components/ChatPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/sonner"
import TechNode from '@/components/nodes/TechNode';
import ResetGraphButton from '@/components/ResetGraphButton';

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
  const [isGenerating, setIsGenerating] = useState(false);

  // Effect to mark initial load as complete after first render
  useEffect(() => {
    setInitialLoadComplete(true);
  }, []);

  // Save history to localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (initialLoadComplete && typeof window !== 'undefined') {
      // Find the currently active version in history and update its nodes/edges
      const updatedHistory = versionHistory.map(version => {
        if (version.id === activeVersionId) {
          // Ensure we're creating new objects/arrays to avoid mutation issues
          return { ...version, nodes: [...nodes], edges: [...edges] }; 
        }
        return version;
      });

      // Prepare the stringified history once
      const historyJson = JSON.stringify(updatedHistory);
      const currentStorageJson = localStorage.getItem(LOCAL_STORAGE_KEY);

      // Check if the state representation differs from the stored one
      if (historyJson !== currentStorageJson) {
         try {
             localStorage.setItem(LOCAL_STORAGE_KEY, historyJson);
             // If the state *itself* needed updating (rare case, defensive)
             if(JSON.stringify(updatedHistory) !== JSON.stringify(versionHistory)) {
                 setVersionHistory(updatedHistory); 
             }
         } catch (storageError) {
             console.warn("LocalStorage Warning (History Sync Effect): Failed to save graph history. Data might be lost on refresh.", storageError);
             // Optionally show a less intrusive warning, or none at all
             // toast({ title: "Storage Warning", description: "Could not sync history to storage.", variant: "outline", duration: 3000 });
             // Importantly, DO NOT THROW - allow UI updates to proceed
             
             // Still update the state if it changed, even if storage failed
             if(JSON.stringify(updatedHistory) !== JSON.stringify(versionHistory)) {
                 setVersionHistory(updatedHistory); 
             }
         }
      }
    }
  // NOTE: Reduced dependencies to avoid potentially excessive writes.
  // Re-evaluate if active version state *must* be saved on every node/edge change.
  // For now, focus on saving when the version *itself* changes or history is explicitly added.
  // }, [nodes, edges, activeVersionId, versionHistory, initialLoadComplete]); 
  }, [activeVersionId, versionHistory, initialLoadComplete]); // Try saving primarily when active version changes or history array changes

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
      // --- Prevent Self-Edges --- 
      if (params.source === params.target) {
        console.warn("Attempted to create self-edge, disallowed.");
        toast.warning("Cannot connect a node to itself.", { duration: 3000 });
        return; // Do not add the edge
      }
      // --- End Prevent Self-Edges ---
      
      const newEdge = {
        ...params,
        type: 'default', 
        animated: false,
        style: { stroke: '#333' },
        markerEnd: { type: MarkerType.Arrow },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, toast] // Added toast to dependency array
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

      // 1. Calculate correct screen position relative to the flow container
      const screenPosition = {
        x: event.clientX,
        y: event.clientY,
      };
      
      // 2. Convert screen position to flow coordinates
      const position = reactFlowInstance.screenToFlowPosition(screenPosition);

      // 3. Create the new node using the correctly calculated position
      const newNode: Node = { 
        id: `node_${Date.now()}`,
        type: 'techNode', // Use the correct node type
        position: position, // Assign the calculated position object correctly
        data: {
          label: label || type,
          type: type, 
          details: '', 
          // Pass handlers directly (ensure these exist)
          onLabelChange: handleNodeLabelChange,
          onDelete: handleNodeDelete,
          onDetailsChange: handleNodeDetailsChange,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    // Ensure all dependencies for handlers are included if necessary
    [reactFlowInstance, setNodes]
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
    toast.success("Graph Saved", { description: `Version ${updatedHistory.length} saved.`, duration: 3000 });
  };

  const handleRestoreVersion = (versionId: string) => {
    const version = versionHistory.find(v => v.id === versionId);
    if (version) {
      setActiveVersionId(versionId);
      // Set nodes/edges state directly using setters from hooks
      setNodes([...version.nodes]); // Use spread for new array reference
      setEdges([...version.edges]); // Use spread for new array reference
      toast.info("Version Restored", { description: `Restored: ${version.description}`, duration: 3000 });
    } else {
       toast.error("Error", { description: "Version not found.", duration: 3000 });
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
  const handleGenerateGraph = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      toast.error("Input Error", { description: "Please enter a description.", duration: 3000 });
      return;
    }
    console.log(`Generating graph for prompt: \"${prompt}\"`);
    setIsGenerating(true); // Show loading state
    
    const loadingToastId = toast.loading(
        "Generating Graph...", 
        { description: "Asking AI to create your tech stack..." }
    );

    try {
      // Call the Flask backend endpoint
      const response = await fetch('http://localhost:5001/api/generate-graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: prompt }),
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (jsonError) {
            // If response is not JSON, use the status text
            errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const generatedData = await response.json();

      // Validate response structure (basic)
      if (!generatedData || !Array.isArray(generatedData.nodes) || !Array.isArray(generatedData.edges)) {
        throw new Error("Invalid data structure received from AI backend.");
      }

      console.log("Received graph data from backend:", generatedData);

      // --- Create and Save New Version --- 
      const newVersionId = `ai_version_${Date.now()}`;
      // Ensure nodes/edges are copied correctly and have basic validation
      const newNodes = Array.isArray(generatedData.nodes) ? [...generatedData.nodes] : [];
      const newEdges = Array.isArray(generatedData.edges) ? [...generatedData.edges] : [];

      const newVersion: VersionHistoryEntry = {
        id: newVersionId,
        timestamp: new Date().toISOString(),
        description: `AI: ${prompt.substring(0, 30)}...`,
        nodes: newNodes, 
        edges: newEdges, 
      };

      // 1. Save the new version data to localStorage (with error handling)
      try {
          localStorage.setItem(
            `graphVersion_${newVersionId}`,
            JSON.stringify(newVersion)
          );
      } catch (storageError) {
          console.error("LocalStorage Error (Version Data):", storageError);
          // Optionally inform the user, but don't necessarily block the state update
          toast.error("Storage Warning", {
            description: "Failed to save the new version to browser storage. The current session is updated, but this version might be lost on refresh.",
            duration: 7000,
          });
          // We might still proceed to update the state even if storage fails
          // throw new Error("Failed to save new version data to storage."); // Remove original error throw
      }

      // 2. Update the index in localStorage (with error handling)
      const indexJson = localStorage.getItem('graphVersionIndex') || "[]";
      let currentIds: string[] = [];
      try {
          const parsedIds = JSON.parse(indexJson);
          if(Array.isArray(parsedIds)) currentIds = parsedIds;
      } catch(e){ console.warn("Index parse error on AI save"); }
      currentIds.push(newVersionId);

      try {
          localStorage.setItem('graphVersionIndex', JSON.stringify(currentIds));
      } catch (storageError) {
          console.error("LocalStorage Error (Index Data):", storageError);
          // Optionally inform the user
          toast.error("Storage Warning", {
            description: "Failed to update version index in browser storage. History might be inconsistent on refresh.",
            duration: 7000,
          });
          // throw new Error("Failed to update version index in storage."); // Remove original error throw
      }

      // 3. Update React State (this should happen even if localStorage fails)
      setVersionHistory((prevHistory) => [...prevHistory, newVersion]);
      setActiveVersionId(newVersionId);
      setNodes(newNodes); // Update the displayed graph
      setEdges(newEdges); // Update the displayed graph

      toast.success("AI Graph Generated", { description: "New graph loaded and saved.", duration: 3000 });

    } catch (error) {
      console.error("Error generating graph via backend:", error);
      // --- Error --- 
      toast.error("AI Generation Error", {
        description: error.message || "An unknown error occurred.",
        duration: 3000, 
      });
    } finally {
       setIsGenerating(false); // Hide loading state
       toast.dismiss(loadingToastId);
    }
  }, [versionHistory, setNodes, setEdges, setActiveVersionId, setVersionHistory]);

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
        toast.success("Success", {
          description: "Repository created successfully!",
          duration: 3000,
        });
        setExportDialogOpen(false);
      } else {
        throw new Error('Failed to create repository');
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to create repository. Please try again.",
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className={`bg-card border-r transition-all ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
            <h2 className="font-medium">Tech Stack Builder</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ←
            </button>
          </div>
          
          {/* Node Palette - Limit height, allow Version History to grow */}
          <div className="border-b flex-shrink-0 overflow-y-auto max-h-[50%]">
            <NodePalette onDragStart={onDragStart} />
          </div>
          
          {/* Version History - Takes remaining space */}
          <div className="flex-grow overflow-y-auto p-4 flex flex-col min-h-0">
            <h3 className="text-sm font-medium mb-3 flex-shrink-0">Version History</h3>
            <div className="space-y-1 flex-grow overflow-y-auto">
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
        
        {/* Flow Editor - Prepare nodes with handlers before passing down */}
        <div className="flex-grow">
          {(() => { // IIFE to prepare nodesWithHandlers
            const nodesWithHandlers = nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                // Ensure handlers are always attached
                onLabelChange: handleNodeLabelChange,
                onDelete: handleNodeDelete,
                onDetailsChange: handleNodeDetailsChange,
              },
            }));

            return (
          <TechStackFlow 
                nodes={nodesWithHandlers} // Pass nodes with handlers
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={(instance: ReactFlowInstance) => setReactFlowInstance(instance)}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes} // Pass nodeTypes
                onSave={handleSave} // Pass the updated save handler
            onExport={handleExportGraph}
                onReset={() => {
                  setNodes([]);
                  setEdges([]);
                  setActiveVersionId('initial'); // Assuming 'initial' is a valid default ID
                  toast.info("Graph Reset", { description: "Canvas cleared.", duration: 3000 });
                }}
              />
            );
          })()}
        </div>
        
        {/* Chat Panel */}
        <ChatPanel onGenerateGraph={handleGenerateGraph} isGenerating={isGenerating} />
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