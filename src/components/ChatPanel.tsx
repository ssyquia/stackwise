
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
      onGenerateGraph(prompt);
      setPrompt('');
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask me to generate a tech stack graph based on your requirements..."
          className="flex-1 resize-none min-h-[100px]"
          rows={1}
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
