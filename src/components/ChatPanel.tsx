
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatPanelProps {
  onGenerateGraph: (prompt: string) => void;
}

const ChatPanel = ({ onGenerateGraph }: ChatPanelProps) => {
  const [prompt, setPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerateGraph(prompt);
      setPrompt('');
    }
  };

  return (
    <div className={`border-t bg-background transition-all duration-300 ${isExpanded ? 'h-64' : 'h-14'}`}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="font-medium">AI Assistant</div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-4 pt-0">
          <div className="mb-4 border rounded-md p-3 h-24 overflow-y-auto bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Ask me to generate a tech stack graph based on your requirements...
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the tech stack you need..."
              className="flex-1"
            />
            <Button type="submit">Generate</Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
