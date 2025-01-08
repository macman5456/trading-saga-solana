const counts = [4, 40, 100, 500, 1000];

const AddressCounter = () => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Buy Address Count</label>
      <div className="flex gap-2">
        {counts.map((count) => (
          <button
            key={count}
            className={`px-4 py-2 rounded-md transition-colors ${
              count === 4
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            {count}
          </button>
        ))}
        <input
          type="number"
          className="w-20 px-3 py-2 rounded-md border"
          placeholder="Custom"
        />
      </div>
    </div>
  );
};

export default AddressCounter;