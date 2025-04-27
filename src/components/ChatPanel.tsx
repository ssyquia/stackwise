import React, { useState, useRef, MutableRefObject, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Send, User, Bot, Terminal, Loader, PanelRightClose, FileText, FileTerminal, Copy, Download, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from "@/components/ui/sonner";
import { Node, Edge } from '@xyflow/react';

const apiUrl = import.meta.env.VITE_API_URL;


interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai' | 'system';
  content: string | object; 
  timestamp: string;
  type?: 'builder-prompt' | 'repo-script';
  fullContent?: string;
}

interface ChatPanelProps {
  onGenerateGraph: (prompt: string) => void;
  isGenerating: boolean;
  messages: ChatMessage[];
  chatContainerRef: MutableRefObject<HTMLDivElement | null>;
  onCollapse: () => void;
  nodes: Node[];
  edges: Edge[];
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}

type CommandMode = 'prompt' | 'repo' | null;

const availableCommands = [
  { id: 'prompt', name: 'Prompt Generation', icon: FileText, description: 'Generate a .txt file' },
  { id: 'repo', name: 'Repository Generation', icon: FileTerminal, description: 'Generate a .sh script' },
];

// Utility to trigger file download
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Helper function to get display name for command mode
const getCommandModeDisplayName = (mode: CommandMode) => {
  if (mode === 'prompt') return 'Prompt Gen';
  if (mode === 'repo') return 'Repo Gen';
  return null;
};

const ChatPanel = ({ 
  onGenerateGraph, 
  isGenerating, 
  messages, 
  chatContainerRef,
  onCollapse,
  nodes,
  edges,
  setChatMessages
}: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showCommandPopup, setShowCommandPopup] = useState(false);
  const [commandMode, setCommandMode] = useState<CommandMode>(null);
  const [filteredCommands, setFilteredCommands] = useState(availableCommands);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [modalPromptContent, setModalPromptContent] = useState('');
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [modalRepoScriptContent, setModalRepoScriptContent] = useState('');

  // Update filtered commands based on input
  useEffect(() => {
    if (inputValue.startsWith('/') && commandMode === null) {
      const query = inputValue.substring(1).toLowerCase();
      setFilteredCommands(
        availableCommands.filter(cmd => 
          cmd.name.toLowerCase().includes(query) || 
          cmd.description.toLowerCase().includes(query)
        )
      );
      setShowCommandPopup(true);
    } else {
      setShowCommandPopup(false);
    }
  }, [inputValue, commandMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const selectCommand = (mode: CommandMode) => {
    setCommandMode(mode);
    setInputValue('');
    setShowCommandPopup(false);
    inputRef.current?.focus();
  };

  // Add function to cancel command mode
  const handleCancelCommandMode = () => {
    setCommandMode(null);
    setInputValue('');
    inputRef.current?.focus();
  };

  // Placeholder for actual API call
  const simulateFileGeneration = async (mode: 'prompt' | 'repo', userPrompt: string): Promise<string> => {
    console.log(`Simulating ${mode} generation for prompt:`, userPrompt);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    if (mode === 'prompt') {
      return `Generated TXT content based on: "${userPrompt}"`;
    } else {
      return `#!/bin/bash
# Generated Bash script based on: "${userPrompt}"
echo "Setting up repository..."
`;
    }
  };

  const handleGenerateFile = async (mode: 'prompt' | 'repo', userPrompt: string) => {
    const loadingToastId = toast.loading(`Generating ${mode === 'prompt' ? 'builder prompt' : 'repository script'}...`);

    try {
      let fileContent: string;

      if (mode === 'prompt') {
        // Call backend to generate the builder prompt
        const response = await fetch(`${apiUrl}/api/generate-builder-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            graphData: { nodes, edges }, // Send current graph state
            userContext: userPrompt 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        fileContent = result.markdownPrompt; // Get the markdown from backend
        
        // --- Add message to chat history --- 
        const newMessage: ChatMessage = {
          id: `prompt-msg-${Date.now()}`,
          sender: 'ai',
          content: `Generated Builder Prompt for: "${userPrompt.substring(0, 30)}...". Click to view/copy.`,
          timestamp: new Date().toISOString(),
          type: 'builder-prompt',
          fullContent: fileContent,
        };
        setChatMessages((prev) => [...prev, newMessage]);
        // --- End add message ---

        // --- Show modal immediately after generation ---
        setModalPromptContent(fileContent);
        setIsPromptModalOpen(true);
        toast.success('Builder Prompt Generated', { id: loadingToastId, description: `Prompt added to chat. Click to view.` });
        // --- End modal logic ---

      } else { // mode === 'repo'
        // --- Call backend to generate the repository script --- 
        const response = await fetch(`${apiUrl}/api/generate-repo-script`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            graphData: { nodes, edges }, // Send current graph state
            userContext: userPrompt 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        fileContent = result.bashScript; // Get the bash script from backend
        
        // --- Add message to chat history --- 
        const newMessage: ChatMessage = {
          id: `repo-script-msg-${Date.now()}`,
          sender: 'ai',
          content: `Generated Repository Script for: "${userPrompt.substring(0, 30)}...". Click to view/copy.`,
          timestamp: new Date().toISOString(),
          type: 'repo-script', // Set the type
          fullContent: fileContent, // Store the full script
        };
        setChatMessages((prev) => [...prev, newMessage]);
        // --- End add message ---

        // --- Show modal instead of direct download ---
        setModalRepoScriptContent(fileContent);
        setIsRepoModalOpen(true);
        toast.success('Repository Script Generated', { id: loadingToastId, description: `Script added to chat. Click to view.` });
        // --- End modal logic ---
      }

    } catch (error) {
      console.error(`Error generating ${mode} file:`, error);
      toast.error('Generation Failed', { id: loadingToastId, description: error.message || 'Could not generate file.' }); // Generic failure message
    } finally {
      setCommandMode(null);
      setInputValue('');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isGenerating) return;

    if (commandMode === 'prompt') {
      handleGenerateFile('prompt', trimmedInput);
    } else if (commandMode === 'repo') {
      handleGenerateFile('repo', trimmedInput);
    } else {
      onGenerateGraph(trimmedInput);
      setInputValue('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPopup && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab')) {
      e.preventDefault();
      if (e.key === 'Enter' && filteredCommands.length > 0) {
        selectCommand(filteredCommands[0].id as CommandMode);
      }
    } else if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
    e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowCommandPopup(false);
      if (commandMode) {
        handleCancelCommandMode();
      }
    }
  };

  const getPlaceholderText = () => {
    if (commandMode === 'prompt') return 'Enter prompt for .txt file generation...';
    if (commandMode === 'repo') return 'Enter prompt for .sh script generation...';
    return 'Describe your project or type / for commands...';
  };

  // Helper function for copying to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy text.');
    }
  };

  // Function to open the prompt modal from a chat message
  const openPromptModal = (promptContent: string | undefined) => {
    if (promptContent) {
      setModalPromptContent(promptContent);
      setIsPromptModalOpen(true);
    }
  };

  // Function to open the repo script modal from a chat message
  const openRepoModal = (scriptContent: string | undefined) => {
    if (scriptContent) {
      setModalRepoScriptContent(scriptContent);
      setIsRepoModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={onCollapse}
        className="absolute top-2 right-2 h-7 w-7 z-10 text-muted-foreground hover:text-foreground"
        title="Collapse Chat"
      >
        <PanelRightClose size={16} />
      </Button>

      <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4 pt-10">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-10">
            Ask the AI to generate a tech stack based on your project description.
          </div>
        )}
        {messages.map((msg, index) => {
          const isThinking = msg.sender === 'ai' && msg.content === 'Thinking...';
          const isBuilderPrompt = msg.type === 'builder-prompt';
          const isRepoScript = msg.type === 'repo-script';

          const handleClick = () => {
            if (isBuilderPrompt) openPromptModal(msg.fullContent);
            if (isRepoScript) openRepoModal(msg.fullContent);
          };

          return (
            <div 
              key={msg.id ?? `${msg.sender}-${index}-${msg.timestamp}`}
              className={cn(
                "flex", 
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div 
                onClick={isBuilderPrompt || isRepoScript ? handleClick : undefined}
                className={cn(
                  "p-3 rounded-lg max-w-[80%] flex items-start gap-2",
                  msg.sender === 'user' && 'bg-primary text-primary-foreground',
                  msg.sender === 'ai' && !isThinking && !isBuilderPrompt && !isRepoScript && 'bg-muted',
                  msg.sender === 'ai' && isThinking && 'bg-muted/50 text-muted-foreground italic',
                  msg.sender === 'system' && 'bg-secondary text-secondary-foreground text-xs italic w-full text-center',
                  isBuilderPrompt && 'bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer',
                  isRepoScript && 'bg-teal-500/10 hover:bg-teal-500/20 cursor-pointer'
                )}
              >
                {isBuilderPrompt && <FileText className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />}
                {isRepoScript && <FileTerminal className="h-4 w-4 mt-0.5 text-teal-400 flex-shrink-0" />}
                {isThinking && <Loader className="h-4 w-4 animate-spin flex-shrink-0" />}

                {typeof msg.content === 'string' ? (
                  (msg.sender === 'ai' && !isThinking && !isBuilderPrompt && !isRepoScript) ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown components={{ /* Customize rendering if needed */ }}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (msg.sender === 'ai' && (isBuilderPrompt || isRepoScript)) ? (
                    // --- Custom rendering for file gen cards ---
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-medium",
                        isBuilderPrompt && "text-blue-400",
                        isRepoScript && "text-teal-400"
                      )}>
                        {isBuilderPrompt ? "Prompt Gen" : "Repo Gen"}
                      </span>
                      <span className="text-xs text-muted-foreground/80 mt-0.5">
                        Click to view/copy.
                      </span>
                    </div>
                    // ----------------------------------------
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )
                ) : (
                  <pre className="text-xs overflow-x-auto"><code>{JSON.stringify(msg.content, null, 2)}</code></pre>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t p-4 flex-shrink-0 bg-background relative">
        {showCommandPopup && filteredCommands.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-1 bg-popover border border-border rounded-md shadow-lg p-2 z-20 max-h-48 overflow-y-auto">
            <p className="text-xs text-muted-foreground px-2 pb-1">Commands</p>
            <div className="flex flex-col gap-1">
              {filteredCommands.map((command) => (
                <Button
                  key={command.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-2 text-left flex items-center gap-2"
                  onClick={() => selectCommand(command.id as CommandMode)}
                >
                  <command.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{command.name}</span>
                    <span className="text-xs text-muted-foreground">{command.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {commandMode && (
          <div className="absolute bottom-full left-4 mb-1 flex items-center gap-2 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs z-10">
            <span>Mode: {getCommandModeDisplayName(commandMode)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCancelCommandMode}
              title="Cancel command mode"
            >
              <X size={14} />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end space-x-2"> 
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={getPlaceholderText()}
            className="flex-grow resize-none max-h-[150px] bg-background"
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isGenerating && commandMode === null}
            aria-label="Chat input"
          />
          <Button
            type="submit"
            disabled={isGenerating || !inputValue.trim()}
            className="h-9 w-9 p-0 flex-shrink-0"
            variant="ghost"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Dialog open={isPromptModalOpen} onOpenChange={setIsPromptModalOpen}>
        <DialogContent className="max-w-2xl w-[80vw] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generated Builder Prompt</DialogTitle>
            <DialogDescription>
              Review the generated prompt. You can copy it or download it as a file.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-hidden p-0 m-0">
            <Textarea 
              value={modalPromptContent}
              readOnly
              className="w-full h-full resize-none font-mono text-xs border rounded-md p-2"
              placeholder="Generated prompt content..."
            />
        </div>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button 
              variant="outline"
              onClick={() => copyToClipboard(modalPromptContent)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => downloadFile(modalPromptContent, 'builder_prompt.txt', 'text/plain')}
            >
               <Download className="h-4 w-4 mr-2" />
              Download .txt
            </Button>
             <DialogClose asChild>
                <Button variant="ghost">Close</Button>
             </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRepoModalOpen} onOpenChange={setIsRepoModalOpen}>
        <DialogContent className="max-w-2xl w-[80vw] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generated Repository Script</DialogTitle>
            <DialogDescription>
              Review the generated bash script. You can copy it or download it as a file.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-hidden p-0 m-0">
            <Textarea 
              value={modalRepoScriptContent}
              readOnly
              className="w-full h-full resize-none font-mono text-xs border rounded-md p-2 bg-muted"
              placeholder="Generated bash script content..."
            />
        </div>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button 
              variant="outline"
              onClick={() => copyToClipboard(modalRepoScriptContent)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => downloadFile(modalRepoScriptContent, 'generate_repo.sh', 'application/x-shellscript')}
            >
               <Download className="h-4 w-4 mr-2" />
              Download .sh
            </Button>
             <DialogClose asChild>
                <Button variant="ghost">Close</Button>
             </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ChatPanel;
