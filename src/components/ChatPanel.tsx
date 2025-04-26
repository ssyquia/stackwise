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

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me to generate a tech stack graph based on your requirements..."
            className="pr-12 resize-none min-h-[60px] max-h-[200px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isGenerating}
          />
          <Button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
            variant="ghost"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
