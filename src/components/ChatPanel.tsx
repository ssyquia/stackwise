import React, { useState, useRef, MutableRefObject, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Send, User, Bot, Terminal, Loader, PanelRightClose, FileText, FileTerminal, Copy, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from "@/components/ui/sonner";
import { Node, Edge } from '@xyflow/react';

interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai' | 'system';
  content: string | object; 
  timestamp: string;
  type?: 'builder-prompt';
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
    const loadingToastId = toast.loading(`Generating ${mode === 'prompt' ? 'builder prompt (.txt)' : '.sh script'}...`);

    try {
      let fileContent: string;
      let filename: string;
      let mimeType: string;

      if (mode === 'prompt') {
        // Call backend to generate the builder prompt
        const response = await fetch('http://localhost:5001/api/generate-builder-prompt', {
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
          content: `Generated Builder Prompt for: "${userPrompt.substring(0, 30)}...". Click to view/copy.`, // Short display content
          timestamp: new Date().toISOString(),
          type: 'builder-prompt', // Set the type
          fullContent: fileContent, // Store the full prompt
        };
        setChatMessages((prev) => [...prev, newMessage]);
        // --- End add message ---

        // --- Show modal immediately after generation ---
        setModalPromptContent(fileContent);
        setIsPromptModalOpen(true);
        toast.success('Builder Prompt Generated', { id: loadingToastId, description: `Prompt added to chat. Click to view.` });
        // --- End modal logic ---

      } else { // mode === 'repo'
        // Use the existing simulation for repo generation for now
        fileContent = await simulateFileGeneration(mode, userPrompt);
        filename = 'generate_repo.sh';
        mimeType = 'application/x-shellscript';
        downloadFile(fileContent, filename, mimeType);
        toast.success('File Generated', { id: loadingToastId, description: `${filename} download started.` });
      }

    } catch (error) {
      console.error(`Error generating ${mode} file:`, error);
      toast.error('File Generation Failed', { id: loadingToastId, description: error.message || 'Could not generate file.' });
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
        setCommandMode(null);
        setInputValue('');
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

  // Function to open the modal from a chat message
  const openPromptModal = (promptContent: string | undefined) => {
    if (promptContent) {
      setModalPromptContent(promptContent);
      setIsPromptModalOpen(true);
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

          return (
            <div 
              key={msg.id ?? `${msg.sender}-${index}-${msg.timestamp}`}
              className={cn(
                "flex", 
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div 
                onClick={isBuilderPrompt ? () => openPromptModal(msg.fullContent) : undefined}
                className={cn(
                  "p-3 rounded-lg max-w-[80%] flex items-start gap-2",
                  msg.sender === 'user' && 'bg-primary text-primary-foreground',
                  msg.sender === 'ai' && !isThinking && !isBuilderPrompt && 'bg-muted',
                  msg.sender === 'ai' && isThinking && 'bg-muted/50 text-muted-foreground italic',
                  msg.sender === 'system' && 'bg-secondary text-secondary-foreground text-xs italic w-full text-center',
                  isBuilderPrompt && 'bg-blue-900/30 hover:bg-blue-900/50 cursor-pointer border border-blue-700'
                )}
              >
                {isBuilderPrompt && <FileText className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />}
                {isThinking && <Loader className="h-4 w-4 animate-spin flex-shrink-0" />}

                {typeof msg.content === 'string' ? (
                  (msg.sender === 'ai' && !isThinking && !isBuilderPrompt) ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown components={{ /* Customize rendering if needed */ }}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
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

    </div>
  );
};

export default ChatPanel;
