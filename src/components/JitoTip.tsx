const tips = [
  { label: "Default", value: "0.00003" },
  { label: "High", value: "0.00008" },
  { label: "Ultra-High", value: "0.00015" },
  { label: "Custom", value: "0.001" },
];

const JitoTip = () => {
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
            className={`px-4 py-2 rounded-md transition-colors ${
              tip.label === "Ultra-High"
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
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