import { Input } from "@/components/ui/input";

interface AddressDisplayProps {
  value: string;
}

const AddressDisplay = ({ value }: AddressDisplayProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Address</label>
      <Input 
        disabled 
        placeholder="Address will appear here" 
        value={value}
      />
    </div>
  );
};

export default AddressDisplay;