import { Input } from "@/components/ui/input";
import { Circle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BalanceDisplayProps {
  label: string;
  value: string;
  isLoading?: boolean;
  error?: string;
}

const BalanceDisplay = ({ label, value, isLoading, error }: BalanceDisplayProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        {label}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Circle 
                className={`w-2 h-2 ${
                  error ? 'fill-red-500' :
                  isLoading ? 'fill-yellow-500 animate-pulse' : 
                  'fill-green-500'
                }`} 
              />
            </TooltipTrigger>
            <TooltipContent>
              {error ? error : 
               isLoading ? 'Fetching balance...' : 
               'Balance updated'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </label>
      <Input 
        disabled 
        value={error ? 'Error' : value}
        className={`bg-white dark:bg-gray-800 ${error ? 'text-red-500' : ''}`}
      />
    </div>
  );
};

export default BalanceDisplay;