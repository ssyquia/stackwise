import React, { useState, useRef, MutableRefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, User, Bot, Terminal, Loader, PanelRightClose } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai' | 'system';
  content: string | object; 
  timestamp: string;
}

interface ChatPanelProps {
  onGenerateGraph: (prompt: string) => void;
  isGenerating: boolean;
  messages: ChatMessage[];
  chatContainerRef: MutableRefObject<HTMLDivElement | null>;
  onCollapse: () => void;
}

const ChatPanel = ({ 
  onGenerateGraph, 
  isGenerating, 
  messages, 
  chatContainerRef,
  onCollapse
}: ChatPanelProps) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerateGraph(prompt);
      setPrompt('');
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
          return (
            <div 
              key={msg.id ?? `${msg.sender}-${index}-${msg.timestamp}`}
              className={cn(
                "flex", 
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div 
                className={cn(
                  "p-3 rounded-lg max-w-[80%] flex items-center gap-2",
                  msg.sender === 'user' && 'bg-primary text-primary-foreground',
                  msg.sender === 'ai' && !isThinking && 'bg-muted',
                  msg.sender === 'ai' && isThinking && 'bg-muted/50 text-muted-foreground italic',
                  msg.sender === 'system' && 'bg-secondary text-secondary-foreground text-xs italic w-full text-center'
                )}
              >
                {isThinking && <Loader className="h-4 w-4 animate-spin flex-shrink-0" />}

                {typeof msg.content === 'string' ? (
                  (msg.sender === 'ai' && !isThinking) ? (
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

      <div className="border-t p-4 flex-shrink-0 bg-background">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2"> 
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your project requirements..."
            className="flex-grow resize-none max-h-[150px] bg-background"
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
            className="h-9 w-9 p-0 flex-shrink-0"
            variant="ghost"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
