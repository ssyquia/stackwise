
import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Trash2, Pen, Save } from 'lucide-react';

interface TechNodeProps {
  data: {
    label: string;
    type: 'frontend' | 'backend' | 'database' | 'custom';
    icon?: React.ReactNode;
    onDelete?: (id: string) => void;
    onLabelChange?: (id: string, label: string) => void;
  };
  id: string;
}

const TechNode = ({ data, id }: TechNodeProps) => {
  const [editing, setEditing] = useState(false);
  const [nodeLabel, setNodeLabel] = useState(data.label);
  
  const nodeTypeColors = {
    frontend: 'bg-frontend text-white',
    backend: 'bg-backend text-white',
    database: 'bg-database text-white',
    custom: 'bg-custom text-white',
  };

  const handleLabelChange = () => {
    if (data.onLabelChange && nodeLabel.trim()) {
      data.onLabelChange(id, nodeLabel);
      setEditing(false);
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md w-40 ${nodeTypeColors[data.type]}`}>
      <div className="flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2">
          {!editing ? (
            <div className="text-sm font-bold">{data.label}</div>
          ) : (
            <input
              type="text"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              className="w-full text-sm bg-white/20 border border-white/30 rounded px-1 text-white"
              autoFocus
            />
          )}
          <div className="flex gap-1">
            {editing ? (
              <button 
                onClick={handleLabelChange}
                className="p-1 hover:bg-white/20 rounded"
                title="Save"
              >
                <Save size={14} />
              </button>
            ) : (
              <button 
                onClick={() => setEditing(true)}
                className="p-1 hover:bg-white/20 rounded"
                title="Edit"
              >
                <Pen size={14} />
              </button>
            )}
            <button 
              onClick={handleDelete}
              className="p-1 hover:bg-white/20 rounded text-red-200"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="text-xs">{data.type}</div>
      </div>
      
      {/* Input handle (top) - Only target */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2"
      />
      
      {/* Output handle (bottom) - Only source */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2"
      />
    </div>
  );
};

export default memo(TechNode);
