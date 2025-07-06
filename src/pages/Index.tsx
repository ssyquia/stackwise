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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/sonner"
import TechNode from '@/components/nodes/TechNode';
import ResetGraphButton from '@/components/ResetGraphButton';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelGroupHandle,
} from "react-resizable-panels";
import { MessageCircle, PanelLeftClose, PanelRightClose, X, LogIn, LogOut } from 'lucide-react';
import { calculateLayout } from '@/lib/graphLayout'; // Import the layout function
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { graphStorage, VersionHistoryEntry } from '@/lib/graphStorage';

const apiUrl = import.meta.env.VITE_API_URL;

// Define node types used in the flow
const nodeTypes = {
  techNode: TechNode,
};

// Define message structure
interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai' | 'system';
  content: string | object; // Main display content
  timestamp: string;
  type?: 'builder-prompt'; // Optional type for special messages
  fullContent?: string; // Optional field to store full prompt content
}

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [initialLayoutApplied, setInitialLayoutApplied] = useState(false); // Track initial layout
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);

  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>('initial');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize nodes/edges state based on the active version
  const initialActiveVersion = versionHistory.find(v => v.id === activeVersionId) || versionHistory[0];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialActiveVersion?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialActiveVersion?.edges || []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isChatPanelCollapsed, setIsChatPanelCollapsed] = useState(false);

  // Load graphs on mount and when user changes
  useEffect(() => {
    (async () => {
      setIsLoading(true); // Set loading to true before starting
      const history = await graphStorage.loadGraphs();
      console.log('Loaded graph history:', history);
      setVersionHistory(history);
      setActiveVersionId(history[history.length - 1]?.id || 'initial');
      setIsLoading(false); // Set loading to false after completion
      setInitialLoadComplete(true); // Indicate initial load is complete
    })();
  }, [user]);

  // Update nodes/edges when active version changes
  useEffect(() => {
    const activeVersion = versionHistory.find(v => v.id === activeVersionId);
    if (activeVersion) {
      setNodes(activeVersion.nodes);
      setEdges(activeVersion.edges);
    }
  }, [activeVersionId, versionHistory, setNodes, setEdges]);

  // Function to apply automatic layout
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return; // Don't layout if no nodes
    const layoutedNodes = calculateLayout(nodes, edges);
    setNodes(layoutedNodes);
    // Fit view after layout (optional, requires reactFlowInstance)
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2 });
    }, 0); 
  }, [nodes, edges, setNodes, reactFlowInstance]);

  // Apply initial layout once nodes/edges/instance are ready and layout hasn't been applied yet
  useEffect(() => {
    if (initialLoadComplete && reactFlowInstance && nodes.length > 0 && !initialLayoutApplied) {
      handleAutoLayout();
      setInitialLayoutApplied(true); // Mark layout as applied
    }
    // Reset flag if nodes/edges change significantly (e.g., after AI generation or version restore)
    // This will trigger re-layout on next render
    if (nodes.length === 0) {
      setInitialLayoutApplied(false);
    }
  }, [nodes, edges, reactFlowInstance, initialLoadComplete, initialLayoutApplied, handleAutoLayout]);

  // Save current version when it changes
  useEffect(() => {
    if (initialLoadComplete && activeVersionId !== 'initial') {
      const saveCurrentVersion = async () => {
        try {
          await graphStorage.updateGraph(activeVersionId, { nodes, edges });
        } catch (error) {
          console.error('Failed to save current version:', error);
        }
      };
      saveCurrentVersion();
    }
  }, [nodes, edges, activeVersionId, initialLoadComplete]);

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
        style: { stroke: '#000000', strokeWidth: 1.5 },
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
  const handleSave = async () => {
    await graphStorage.saveGraph({ nodes, edges }, `Version ${versionHistory.length + 1}`);
    const history = await graphStorage.loadGraphs();
    setVersionHistory(history);
    setActiveVersionId(history[history.length - 1]?.id || 'initial');
    toast.success('Graph saved!');
  };

  const handleRestoreVersion = (versionId: string) => {
    const version = versionHistory.find(v => v.id === versionId);
    if (version) {
      setActiveVersionId(versionId);
      setNodes([...version.nodes]); // Use spread for new array reference
      setEdges([...version.edges]); // Use spread for new array reference
      setInitialLayoutApplied(false); // Allow layout to re-run for the restored version
      toast.info("Version Restored", { description: `Restored: ${version.description}`, duration: 3000 });
    } else {
       toast.error("Error", { description: "Version not found.", duration: 3000 });
    }
  };

  // Effect to scroll chat down on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle AI graph generation
  const handleGenerateGraph = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      toast.error("Input Error", { description: "Please enter a description.", duration: 3000 }); 
      return;
    }
    console.log(`Generating/Modifying graph for prompt: \"${prompt}\"`);
    const userMessage: ChatMessage = { sender: 'user', content: prompt, timestamp: new Date().toISOString() };
    const thinkingMessageId = `thinking-${Date.now()}`;
    const thinkingMessage: ChatMessage = { id: thinkingMessageId, sender: 'ai', content: 'Thinking...', timestamp: new Date().toISOString() };
    setChatMessages(prev => [...prev, userMessage, thinkingMessage]);
    setIsGenerating(true); 
    const graphLoadingToastId = toast.loading(
        "Generating/Modifying Graph...", // Updated toast title
        { description: "Asking AI to create or update your tech stack..." } // Updated description
    );
    
    let generatedData: any = null; 
    let graphError: Error | null = null;

    // --- Determine payload based on existing graph --- 
    let requestBody: any = { prompt };
    if (nodes.length > 0) {
       requestBody.existingGraph = { nodes, edges }; // Add existing graph if nodes exist
       console.log("Sending existing graph for modification...");
    } else {
       console.log("No existing graph, generating from scratch...");
    }

    try {
      // --- Call Generate/Modify Graph API --- 
      // TEMP: Force an error for testing - REVERTED
      const response = await fetch(`${apiUrl}/api/generate-graph`, { // Reverted back to original endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody), // Send the determined payload
      });

      if (!response.ok) {
         let errorMsg = `HTTP error! status: ${response.status}`;
         try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; }
         catch (jsonError) { errorMsg = response.statusText || errorMsg; }
         throw new Error(errorMsg);
      }
      generatedData = await response.json();
      if (!generatedData || !Array.isArray(generatedData.nodes) || !Array.isArray(generatedData.edges)) {
        throw new Error("Invalid data structure received from AI backend.");
      }
      // --- Update Graph and Version History --- 
      const graphAction = nodes.length > 0 ? "Modified" : "Generated";
      const newNodes = Array.isArray(generatedData.nodes) ? [...generatedData.nodes] : [];
      const newEdges = Array.isArray(generatedData.edges) ? [...generatedData.edges] : [];
      
      // Save the AI-generated graph
      const graphId = await graphStorage.saveGraph(
        { nodes: newNodes, edges: newEdges },
        `AI ${graphAction}: ${prompt.substring(0, 30)}...`
      );
      
      // Reload graphs to get the updated list
      const updatedHistory = await graphStorage.loadGraphs();
      setVersionHistory(updatedHistory);
      setActiveVersionId(graphId);
      setNodes(newNodes);
      setEdges(newEdges);
      setInitialLayoutApplied(false); // Reset layout flag to trigger auto-layout
      toast.success(`AI Graph ${graphAction}`, { 
        description: `New graph loaded and saved to ${user ? 'cloud' : 'local storage'}.`, 
        duration: 3000 
      });

    } catch (error) {
      console.error("Error generating graph via backend:", error);
      graphError = error; 
      toast.error("Graph Generation Failed", { 
        description: "Please try modifying your prompt or rerunning the request.", 
        duration: 5000, // Increased duration slightly
      });
      setChatMessages(prev => prev.filter(m => m.id !== thinkingMessageId));
      setChatMessages(prev => [...prev, { sender: 'system', content: `Graph generation/modification failed: ${error.message}`, timestamp: new Date().toISOString() }]);
      generatedData = null; 
    } finally {
       // ... (finally block as before) ...
       toast.dismiss(graphLoadingToastId); 
       if (graphError) { setIsGenerating(false); }
    }
    
    // --- Step 2: Call Explain Graph API (using the result and the triggering prompt) --- 
    if (generatedData && !graphError) {
      const explanationLoadingToastId = toast.loading("Generating Explanation...", { description: "Asking AI to explain the stack..." });
      let explanationError: Error | null = null;
      try {
          const explainResponse = await fetch(`${apiUrl}/api/explain-graph`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                graphData: generatedData, // Send the final graph (new or modified)
                originalPrompt: prompt // Send the prompt that generated/modified this version
              })
          });
          if (!explainResponse.ok) {
              let errorMsg = `Explanation error: ${explainResponse.status}`;
              try { const errorData = await explainResponse.json(); errorMsg = errorData.error || errorMsg; }
              catch (e) { errorMsg = explainResponse.statusText || errorMsg; }
              throw new Error(errorMsg);
          }
          const explanationData = await explainResponse.json();
          const explanationText = explanationData.explanation;
          if (explanationText) {
              setChatMessages(prev => prev.filter(m => m.id !== thinkingMessageId));
              setChatMessages(prev => [...prev, { sender: 'ai', content: explanationText, timestamp: new Date().toISOString() }]);
          } else {
              throw new Error("Empty explanation received from backend.");
          }
      } catch (explainError) {
          explanationError = explainError; 
          toast.error("Explanation Error", { description: explainError.message || "Failed to get explanation.", duration: 3000 });
          setChatMessages(prev => prev.filter(m => m.id !== thinkingMessageId));
          setChatMessages(prev => [...prev, { sender: 'system', content: `Failed to get explanation: ${explainError.message}`, timestamp: new Date().toISOString() }]);
      } finally {
          toast.dismiss(explanationLoadingToastId);
          setIsGenerating(false); 
      }
    }

  }, [nodes, edges, versionHistory, setNodes, setEdges, setActiveVersionId, setVersionHistory]); // Ensure all dependencies are correct

  // --- Add handler to imperatively expand chat --- 
  const handleExpandChatPanel = () => {
    setIsChatPanelCollapsed(false);
    // Set layout: Flow panel takes remaining space, Chat panel takes 25%
    panelGroupRef.current?.setLayout([75, 25]); 
  };
  // ---------------------------------------------

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
        {/* Sidebar (Fixed Width) - Reverted from Panel */}
      <div className={`bg-card border-r transition-all flex-shrink-0 ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-none'}`}>
        {/* Conditionally render sidebar content only if not collapsed */} 
        {isSidebarOpen && (
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground"
                title="Close Sidebar"
                style={{ marginTop: '2px', marginBottom: '2px'}}
            >
                <PanelLeftClose size={16} /> {/* Use appropriate icon */} 
            </button>
          </div>
          {/* Node Palette */}
            <div className="border-b flex-shrink-0 overflow-y-auto max-h-[50%]">
            <NodePalette onDragStart={onDragStart} />
          </div>
          {/* Version History */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-3 flex-shrink-0">Version History</h3>
               <div className="space-y-1 flex-grow overflow-y-auto">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-4">
                  Loading graphs...
                </div>
              ) : (
                versionHistory.map((version) => (
                  <VersionHistoryItem
                    key={version.id}
                    version={version}
                    onRestore={handleRestoreVersion}
                    isActive={version.id === activeVersionId}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        )}
      </div>
      
      {/* Resizable Area (Main Content + Chat) */}
      <PanelGroup 
        direction="horizontal" 
        className="flex-grow" 
        ref={panelGroupRef} 
      > 
        {/* Main Content Panel (Flow Editor) */}
        <Panel defaultSize={75} minSize={40} className="flex-grow relative"> {/* Occupies flexible space */} 
          <div className="flex flex-col h-full" ref={reactFlowWrapper}> 
            {/* Flow Editor takes full space */}
            <div className="flex-grow h-full">
               {(() => { 
                 // ... prep nodesWithHandlers ...
                 const nodesWithHandlers = nodes.map((node) => ({
                  ...node,
                  data: {
                    ...node.data,
                    onLabelChange: handleNodeLabelChange,
                    onDelete: handleNodeDelete,
                    onDetailsChange: handleNodeDetailsChange,
                  },
                 }));
                 return (
          <TechStackFlow 
                     nodes={nodesWithHandlers} 
                     edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
                     onConnect={onConnect}
                     onInit={(instance: ReactFlowInstance) => setReactFlowInstance(instance)}
                     onDrop={onDrop}
                     onDragOver={onDragOver}
                     nodeTypes={nodeTypes}
            onSave={handleSave} 
                     onReset={async () => {
                       setNodes([]);
                       setEdges([]);
                       setActiveVersionId('initial');
                       setInitialLayoutApplied(false); // Reset layout flag on manual reset
                       
                       // Save the reset state
                       try {
                         await graphStorage.saveGraph({ nodes: [], edges: [] }, 'Reset Graph');
                         const updatedHistory = await graphStorage.loadGraphs();
                         setVersionHistory(updatedHistory);
                       } catch (error) {
                         console.error('Failed to save reset state:', error);
                       }
                       
                       toast.info("Graph Reset", { description: "Canvas cleared.", duration: 3000 });
                     }}
                     onAutoLayout={handleAutoLayout} // Pass the handler
                     isSidebarCollapsed={!isSidebarOpen}
                     user={user}
                     onLogin={() => navigate('/login')}
                     onLogout={signOut}
                   />
                 );
               })()}
            </div>
        </div>
        </Panel>
        {/* --- Expand Sidebar Button (Bottom Left) --- */}
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="absolute bottom-4 left-4 z-10 bg-background/80 hover:bg-background border shadow-md h-8 w-8"
            title="Open Sidebar"
          >
            <PanelRightClose size={16} />
          </Button>
        )}
        {/* --- End Expand Sidebar Button --- */}
        <PanelResizeHandle className="w-1 bg-border/50 hover:bg-border transition-colors" />

        {/* Chat Panel (Right, Resizable & Collapsible) */}
        <Panel 
          id="chat-panel"
          defaultSize={25} 
          minSize={10} 
          maxSize={50}
          collapsible={true} 
          collapsedSize={0} 
          onCollapse={() => setIsChatPanelCollapsed(true)}
          onExpand={() => setIsChatPanelCollapsed(false)}
          className={`flex-shrink-0 bg-card flex flex-col border-l ${isChatPanelCollapsed ? '!min-w-0 !max-w-0 !w-0 border-none overflow-hidden' : ''}`}
        >
           {!isChatPanelCollapsed && (
             <ChatPanel 
               messages={chatMessages} 
               chatContainerRef={chatContainerRef}
               onGenerateGraph={handleGenerateGraph} 
               isGenerating={isGenerating} 
               onCollapse={() => setIsChatPanelCollapsed(true)} 
               nodes={nodes}
               edges={edges}
               setChatMessages={setChatMessages}
             />
           )}
        </Panel>
      </PanelGroup>

      {/* Floating Expand Chat Button */}
      {isChatPanelCollapsed && (
        <button
          onClick={handleExpandChatPanel}
          className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all"
          title="Open Chat"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
};

export default Index;