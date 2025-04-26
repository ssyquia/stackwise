
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatPanelProps {
  onGenerateGraph: (prompt: string) => void;
}

const ChatPanel = ({ onGenerateGraph }: ChatPanelProps) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        onGenerateGraph(prompt);
        setPrompt('');
        setIsLoading(false);
      }, 1000);
    }
  };

  const textareaRows = Math.min(5, Math.max(2, prompt.split('\n').length));

  return (
    <div className="border-t bg-background p-4">
      <div className="mb-4 border rounded-md p-3 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Ask me to generate a tech stack graph based on your requirements...
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the tech stack you need..."
          className="flex-1 resize-none"
          rows={textareaRows}
        />
        <div className="self-end">
          <Button type="submit" disabled={isLoading || !prompt.trim()}>
            {isLoading ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
