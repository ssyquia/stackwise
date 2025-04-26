import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Trash2, Pen, Save, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TechNodeProps {
  data: {
    label: string;
    details?: string;
    type: 'frontend' | 'backend' | 'database' | 'custom';
    icon?: React.ReactNode;
    onDelete?: (id: string) => void;
    onLabelChange?: (id: string, label: string) => void;
    onDetailsChange?: (id: string, details: string) => void;
  };
  id: string;
}

const TechNode = ({ data, id }: TechNodeProps) => {
  const [editing, setEditing] = useState(false);
  const [nodeLabel, setNodeLabel] = useState(data.label);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentDetails, setCurrentDetails] = useState(data.details || '');
  
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

  const handleDetailsSave = () => {
    if (data.onDetailsChange) {
      data.onDetailsChange(id, currentDetails);
    }
    setIsDetailsOpen(false);
  };

  return (
    <>
      <div className={`px-4 py-3 shadow-md rounded-md w-48 ${nodeTypeColors[data.type]}`}>
        <div className="flex flex-col">
          <div className="w-full flex justify-between items-center mb-3">
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
                  <Save size={16} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setEditing(true)}
                    className="p-1 hover:bg-white/20 rounded"
                    title="Edit"
                  >
                    <Pen size={16} />
                  </button>
                  <button 
                    onClick={() => setIsDetailsOpen(true)}
                    className="p-1 hover:bg-white/20 rounded"
                    title="Details"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="p-1 hover:bg-white/20 rounded text-red-200"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="text-xs opacity-80">{data.type}</div>
        </div>
        
        <Handle
          type="target"
          position={Position.Top}
          className="w-2 h-2"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-2 h-2"
        />
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md w-[60vw] h-[40vh] flex flex-col">
          <div className="flex-1 space-y-2">
            <h2 className="text-base font-semibold">Node Details</h2>
            <Textarea
              value={currentDetails}
              onChange={(e) => setCurrentDetails(e.target.value)}
              placeholder="Enter node details..."
              className="min-h-[calc(40vh-120px)] flex-1 resize-none"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleDetailsSave}>Save Details</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default memo(TechNode);
