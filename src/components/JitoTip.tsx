import { useState } from "react";
import { cn } from "@/lib/utils";

const tips = [
  { label: "Default", value: "0.00003" },
  { label: "High", value: "0.00008" },
  { label: "Ultra-High", value: "0.00015" },
  { label: "Custom", value: "0.001" },
];

interface JitoTipProps {
  onTipChange: (tip: string) => void;
}

const JitoTip = ({ onTipChange }: JitoTipProps) => {
  const [selectedTip, setSelectedTip] = useState(tips[2]); // Default to Ultra-High

  const handleTipSelect = (tip: typeof tips[0]) => {
    setSelectedTip(tip);
    onTipChange(tip.value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Jito MEV Tip</label>
        <span className="text-muted-foreground text-sm">ⓘ</span>
      </div>
      <div className="flex gap-2">
        {tips.map((tip) => (
          <button
            key={tip.value}
            onClick={() => handleTipSelect(tip)}
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              tip.value === selectedTip.value
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            {tip.label} {tip.value}
          </button>
        ))}
        <span className="flex items-center px-2">SOL</span>
      </div>
    </div>
  );
};

export default JitoTip;