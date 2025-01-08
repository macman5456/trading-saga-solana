import { Input } from "@/components/ui/input";

interface PrivateKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PrivateKeyInput = ({ value, onChange }: PrivateKeyInputProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Private Key</label>
      <Input 
        type="password" 
        placeholder="Enter Private Key" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default PrivateKeyInput;