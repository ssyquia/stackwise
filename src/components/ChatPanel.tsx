import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatPanelProps {
  onGenerateGraph: (prompt: string) => void;
  isGenerating: boolean;
}

const ChatPanel = ({ onGenerateGraph, isGenerating }: ChatPanelProps) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerateGraph(prompt);
      setPrompt('');
    }
  };

  // Use flex-col and h-full to structure the panel
  return (
    <div className="flex flex-col h-full bg-background/95">
      {/* Message Display Area (Placeholder) - Takes up most space */}
      <div className="flex-grow p-4 overflow-y-auto">
         {/* Placeholder for chat messages - Replace with actual message rendering */}
         <div className="text-center text-muted-foreground text-sm py-10">
           Chat history will appear here...
         </div>
      </div>

      {/* Input Area - Stays at the bottom */}
      <div className="border-t p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2"> 
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me to generate a tech stack graph..."
            className="flex-grow resize-none max-h-[150px]" // Adjusted max-height
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isGenerating}
            aria-label="Chat input"
          />
          <Button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="h-9 w-9 p-0 flex-shrink-0" // Adjusted size slightly
            variant="ghost"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {/* Removed redundant helper text as placeholder is sufficient */}
        {/* <div className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div> */}
      </div>
    </div>
  );
};

export default ChatPanel;
