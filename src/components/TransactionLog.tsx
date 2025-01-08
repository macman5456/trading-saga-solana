import { useEffect, useState } from "react";

interface TransactionLogProps {
  successCount: number;
}

const TransactionLog = ({ successCount }: TransactionLogProps) => {
  return (
    <div className="mt-4 p-4 border rounded-lg bg-secondary/50">
      <h3 className="text-sm font-medium mb-2">New Address Buy Log</h3>
      <div className="text-sm text-muted-foreground">
        Transactions completed this session: {successCount}
      </div>
    </div>
  );
};

export default TransactionLog;