
import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

interface NodeTypeOption {
  type: 'frontend' | 'backend' | 'database' | 'custom';
  label: string;
}

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: NodeTypeOption) => void;
}

const frameworks = {
  frontend: ['React', 'Vue', 'Angular', 'Svelte'],
  backend: ['Node.js', 'Django', 'Spring Boot', 'Laravel'],
  database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis'],
};

const NodePalette = ({ onDragStart }: NodePaletteProps) => {
  const [customLabel, setCustomLabel] = useState('');
  
  const nodeTypeColors = {
    frontend: 'bg-frontend',
    backend: 'bg-backend',
    database: 'bg-database',
    custom: 'bg-custom',
  };

  const handleCustomDragStart = (event: React.DragEvent) => {
    if (customLabel.trim()) {
      onDragStart(event, { type: 'custom', label: customLabel });
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-3">Node Types</h3>
      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="frontend">
          <AccordionTrigger className={`${nodeTypeColors.frontend} text-white px-3 py-2 rounded-md`}>
            Frontend
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 space-y-2">
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
            <div className="pt-2 space-y-2">
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
            <div className="pt-2 space-y-2">
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
