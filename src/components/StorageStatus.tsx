import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Cloud, HardDrive } from 'lucide-react';

interface StorageStatusProps {
  className?: string;
}

const StorageStatus: React.FC<StorageStatusProps> = ({ className = '' }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <HardDrive size={12} />
        <span>Local Storage</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Cloud size={12} />
      <span>Cloud Storage</span>
    </div>
  );
};

export default StorageStatus; 