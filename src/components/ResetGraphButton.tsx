import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button'; // Import ButtonProps
import { RotateCcw } from 'lucide-react'; // Example icon

// Extend ButtonProps to allow passing standard button props like 'disabled'
interface ResetGraphButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> { 
  onReset: () => void; // Callback function when button is clicked
}

const ResetGraphButton: React.FC<ResetGraphButtonProps> = ({ onReset, ...buttonProps }) => {
  return (
    <Button 
      variant="outline" 
      size="icon"      
      onClick={onReset} 
      aria-label="New Graph" 
      {...buttonProps} // Spread remaining props (like disabled)
    >
      <RotateCcw className="h-4 w-4" />
    </Button>
  );
};

export default ResetGraphButton; 