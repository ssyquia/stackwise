
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface NodeDetailsProps {
  children: React.ReactNode;
}

const NodeDetails = ({ children }: NodeDetailsProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent>
        <div className="p-4">
          <h3 className="font-medium mb-2">Node Details</h3>
          <p className="text-sm text-muted-foreground">Additional information will be displayed here.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NodeDetails;
