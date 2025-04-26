
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface TechNodeProps {
  data: {
    label: string;
    type: 'frontend' | 'backend' | 'database' | 'custom';
    icon?: React.ReactNode;
  };
  id: string;
}

const TechNode = ({ data }: TechNodeProps) => {
  const nodeTypeColors = {
    frontend: 'bg-frontend text-white',
    backend: 'bg-backend text-white',
    database: 'bg-database text-white',
    custom: 'bg-custom text-white',
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md w-40 ${nodeTypeColors[data.type]}`}>
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label}</div>
          <div className="text-xs">{data.type}</div>
        </div>
      </div>
      
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2"
      />
      
      {/* Output handles (bottom, left, right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-2 h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2"
      />
    </div>
  );
};

export default memo(TechNode);
