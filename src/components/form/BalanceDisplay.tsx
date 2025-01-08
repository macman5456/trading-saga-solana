import { Input } from "@/components/ui/input";
import { Circle } from "lucide-react";

interface BalanceDisplayProps {
  label: string;
  value: string;
  isLoading?: boolean;
}

const BalanceDisplay = ({ label, value, isLoading }: BalanceDisplayProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        {label}
        <Circle className={`w-2 h-2 ${isLoading ? 'fill-yellow-500' : 'fill-green-500'}`} />
      </label>
      <Input 
        disabled 
        value={value}
        className="bg-white dark:bg-gray-800"
      />
    </div>
  );
};

export default BalanceDisplay;