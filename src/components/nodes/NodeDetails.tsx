import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NodeDetailsProps {
  children: React.ReactNode;
  nodeId: string;
  details: string;
  onDetailsChange: (id: string, details: string) => void;
}

const NodeDetails = ({ children, nodeId, details, onDetailsChange }: NodeDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDetails, setCurrentDetails] = useState(details);

  const handleSave = () => {
    onDetailsChange(nodeId, currentDetails);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-6 px-2 text-xs mr-2"
          onClick={() => setIsOpen(true)}
        >
          Details
        </Button>
      </div>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl w-[80vw] h-[60vh] flex flex-col">
          <div className="flex-1 space-y-4">
            <h2 className="text-lg font-semibold">Node Details</h2>
            <Textarea
              value={currentDetails}
              onChange={(e) => setCurrentDetails(e.target.value)}
              placeholder="Enter node details..."
              className="min-h-[calc(60vh-150px)] flex-1 resize-none"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Details</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NodeDetails;
