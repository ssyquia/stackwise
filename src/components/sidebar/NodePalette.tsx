
import React from 'react';

interface NodeTypeOption {
  type: 'frontend' | 'backend' | 'database' | 'custom';
  label: string;
}

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: NodeTypeOption) => void;
}

const nodeTypes: NodeTypeOption[] = [
  { type: 'frontend', label: 'Frontend' },
  { type: 'backend', label: 'Backend' },
  { type: 'database', label: 'Database' },
  { type: 'custom', label: 'Custom' },
];

const NodePalette = ({ onDragStart }: NodePaletteProps) => {
  const nodeTypeColors = {
    frontend: 'bg-frontend',
    backend: 'bg-backend',
    database: 'bg-database',
    custom: 'bg-custom',
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-3">Node Types</h3>
      <div className="space-y-2">
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.type}
            className={`${nodeTypeColors[nodeType.type]} text-white p-2 rounded-md cursor-move text-sm`}
            draggable
            onDragStart={(event) => onDragStart(event, nodeType)}
          >
            {nodeType.label}
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        Drag and drop nodes onto the canvas
      </div>
    </div>
  );
};

export default NodePalette;
