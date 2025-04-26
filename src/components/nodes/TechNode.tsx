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
    type: 'frontend' | 'backend' | 'database' | 'api' | 'deployment' | 'custom';
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
    frontend: 'bg-blue-500 text-white',
    backend: 'bg-green-500 text-white',
    database: 'bg-yellow-500 text-white',
    api: 'bg-purple-500 text-white',
    deployment: 'bg-red-500 text-white',
    custom: 'bg-gray-500 text-white',
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
      <div className={`relative px-3 py-2 shadow-md rounded-md w-40 h-24 ${nodeTypeColors[data.type] || nodeTypeColors.custom} flex flex-col justify-between`}>
        {/* Top Section: Label/Input and Details Button */}
        <div className="flex justify-between items-start">
          {!editing ? (
            <div className="text-sm font-bold pt-1">{data.label}</div>
          ) : (
            <input
              type="text"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              className="w-full text-sm bg-white/20 border border-white/30 rounded px-1 text-white mt-1 mr-6"
              autoFocus
            />
          )}
          {/* Details Button (Top Right) - Only shown when NOT editing */}
          {!editing && (
            <button 
              onClick={() => setIsDetailsOpen(true)}
              className="absolute top-1 right-1 p-1 hover:bg-white/20 rounded"
              title="Details"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>

        {/* Bottom Section: Type and Buttons */}
        <div className="flex justify-between items-end">
          {/* Type (Bottom Left) */}
          <div className="text-xs opacity-80 pb-1">{data.type}</div>
          
          {/* Buttons (Bottom Right) */}
          <div className="flex gap-1">
            {editing ? (
              // Save Button - Only shown when editing
              <button 
                onClick={handleLabelChange}
                className="p-1 hover:bg-white/20 rounded"
                title="Save"
              >
                <Save size={16} />
              </button>
            ) : (
              // Edit and Delete Buttons - Only shown when NOT editing
              <>
                <button 
                  onClick={() => setEditing(true)}
                  className="p-1 hover:bg-white/20 rounded"
                  title="Edit"
                >
                  <Pen size={16} />
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
        
        {/* Handles remain unchanged */}
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md w-[60vw] h-[40vh] flex flex-col p-4">
          <h2 className="text-lg font-semibold mb-2">Node Details</h2>
          <div className="flex-1 flex flex-col min-h-0">
            <Textarea
              value={currentDetails}
              onChange={(e) => setCurrentDetails(e.target.value)}
              placeholder="Enter node details..."
              className="flex-1 resize-none mb-4"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleDetailsSave}>Save Details</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default memo(TechNode);
