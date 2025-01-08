interface TransactionLogProps {
  successCount: number;
}

const TransactionLog = ({ successCount }: TransactionLogProps) => {
  return (
    <div className="p-4 border rounded-lg bg-secondary/50 sticky top-4">
      <h3 className="text-lg font-semibold mb-4">New Address Buy Log</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Transactions:</span>
          <span className="text-sm">{successCount}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Successfully completed transactions this session
        </div>
      </div>
    </div>
  );
};

export default TransactionLog;