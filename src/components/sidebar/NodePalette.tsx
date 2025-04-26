import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

interface NodeTypeOption {
  type: 'frontend' | 'backend' | 'database' | 'api' | 'deployment' | 'custom';
  label: string;
}

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: NodeTypeOption) => void;
}

const frameworks = {
  frontend: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Remix', 'Gatsby', 'HTML/CSS/JS'],
  backend: ['Node.js', 'Django', 'Spring Boot', 'Flask', 'Ruby on Rails', 'Go (Gin)', 'Python (FastAPI)', 'PHP (Laravel)'],
  database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'SQLite', 'DynamoDB', 'Firebase RTDB', 'Supabase DB'],
  api: ['REST API', 'GraphQL API', 'gRPC', 'Stripe API', 'Twilio API', 'Google Maps API', 'Auth0', 'SendGrid'],
  deployment: ['Docker', 'Kubernetes', 'AWS EC2', 'AWS Lambda', 'AWS S3', 'Vercel', 'Netlify', 'Heroku', 'Google Cloud Run', 'Azure App Service'],
};

const NodePalette = ({ onDragStart }: NodePaletteProps) => {
  const [customLabel, setCustomLabel] = useState('');
  
  const nodeTypeColors = {
    frontend: 'bg-blue-500',
    backend: 'bg-green-500',
    database: 'bg-yellow-500',
    api: 'bg-purple-500',
    deployment: 'bg-red-500',
    custom: 'bg-gray-500',
  };

  const handleCustomDragStart = (event: React.DragEvent) => {
    if (customLabel.trim()) {
      onDragStart(event, { type: 'custom', label: customLabel });
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-3">Node Types</h3>
      <Accordion type="single" collapsible className="space-y-2" defaultValue="frontend">
        <AccordionItem value="frontend">
          <AccordionTrigger className={`${nodeTypeColors.frontend} text-white px-3 py-2 rounded-md`}>
            Frontend
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 grid grid-cols-2 gap-2">
              {frameworks.frontend.map((framework) => (
                <div
                  key={framework}
                  className={`${nodeTypeColors.frontend} text-white p-2 rounded-md cursor-move text-sm`}
                  draggable
                  onDragStart={(e) => onDragStart(e, { type: 'frontend', label: framework })}
                >
                  {framework}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="backend">
          <AccordionTrigger className={`${nodeTypeColors.backend} text-white px-3 py-2 rounded-md`}>
            Backend
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 grid grid-cols-2 gap-2">
              {frameworks.backend.map((framework) => (
                <div
                  key={framework}
                  className={`${nodeTypeColors.backend} text-white p-2 rounded-md cursor-move text-sm`}
                  draggable
                  onDragStart={(e) => onDragStart(e, { type: 'backend', label: framework })}
                >
                  {framework}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="database">
          <AccordionTrigger className={`${nodeTypeColors.database} text-white px-3 py-2 rounded-md`}>
            Database
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 grid grid-cols-2 gap-2">
              {frameworks.database.map((db) => (
                <div
                  key={db}
                  className={`${nodeTypeColors.database} text-white p-2 rounded-md cursor-move text-sm`}
                  draggable
                  onDragStart={(e) => onDragStart(e, { type: 'database', label: db })}
                >
                  {db}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="api">
          <AccordionTrigger className={`${nodeTypeColors.api} text-white px-3 py-2 rounded-md`}>
            API / Service
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 grid grid-cols-2 gap-2">
              {frameworks.api.map((api) => (
                <div
                  key={api}
                  className={`${nodeTypeColors.api} text-white p-2 rounded-md cursor-move text-sm`}
                  draggable
                  onDragStart={(e) => onDragStart(e, { type: 'api', label: api })}
                >
                  {api}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="deployment">
          <AccordionTrigger className={`${nodeTypeColors.deployment} text-white px-3 py-2 rounded-md`}>
            Deployment
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 grid grid-cols-2 gap-2">
              {frameworks.deployment.map((deploy) => (
                <div
                  key={deploy}
                  className={`${nodeTypeColors.deployment} text-white p-2 rounded-md cursor-move text-sm`}
                  draggable
                  onDragStart={(e) => onDragStart(e, { type: 'deployment', label: deploy })}
                >
                  {deploy}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="custom">
          <AccordionTrigger className={`${nodeTypeColors.custom} text-white px-3 py-2 rounded-md`}>
            Custom
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Enter custom node label"
                className="mb-2"
              />
              {customLabel.trim() && (
                <div
                  className={`${nodeTypeColors.custom} text-white p-2 rounded-md cursor-move text-sm`}
                  draggable
                  onDragStart={handleCustomDragStart}
                >
                  {customLabel}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="mt-4 text-xs text-muted-foreground">
        Click to expand categories, then drag and drop items onto the canvas
      </div>
    </div>
  );
};

export default NodePalette;
