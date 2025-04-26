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

// Expanded list of technologies
const technologies = {
  frontend: [
    'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'jQuery', 
    'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'Bootstrap', 'Tailwind CSS', 
    'Material UI', 'Chakra UI', 'Ember.js', 'Backbone.js', 'Alpine.js'
  ],
  backend: [
    'Node.js', 'Python', 'Java', 'Ruby', 'PHP', 'Go', 'C#', '.NET', 'Express.js', 
    'Django', 'Flask', 'Spring Boot', 'Ruby on Rails', 'Laravel', 'ASP.NET Core', 
    'Koa', 'FastAPI', 'Gin', 'NestJS', 'AdonisJS'
  ],
  database: [
    'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Cassandra', 'MariaDB', 
    'Microsoft SQL Server', 'Oracle Database', 'Firebase Realtime Database', 
    'Firestore', 'DynamoDB', 'Couchbase', 'Neo4j', 'ArangoDB', 'InfluxDB'
  ],
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

  const renderTechList = (category: keyof typeof technologies) => {
    return technologies[category].map((tech) => (
      <div
        key={tech}
        className={`${nodeTypeColors[category]} text-white p-2 rounded-md cursor-move text-sm hover:opacity-80 transition-opacity`}
        draggable
        onDragStart={(e) => onDragStart(e, { type: category, label: tech })}
      >
        {tech}
      </div>
    ));
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-3">Node Types</h3>
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="frontend">
          <AccordionTrigger className={`${nodeTypeColors.frontend} text-white px-3 py-2 rounded-md`}>
            Frontend
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 grid grid-cols-2 gap-2">
              {renderTechList('frontend')}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="backend">
          <AccordionTrigger className={`${nodeTypeColors.backend} text-white px-3 py-2 rounded-md`}>
            Backend
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 grid grid-cols-2 gap-2">
              {renderTechList('backend')}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="database">
          <AccordionTrigger className={`${nodeTypeColors.database} text-white px-3 py-2 rounded-md`}>
            Database
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 grid grid-cols-2 gap-2">
              {renderTechList('database')}
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
                  className={`${nodeTypeColors.custom} text-white p-2 rounded-md cursor-move text-sm hover:opacity-80 transition-opacity`}
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
        Drag and drop items onto the canvas.
      </div>
    </div>
  );
};

export default NodePalette;
