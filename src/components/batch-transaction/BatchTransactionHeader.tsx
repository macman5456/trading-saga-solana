import React from "react";

const BatchTransactionHeader = () => {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Batch Transactions (Mainnet)</h1>
      <p className="text-muted-foreground">
        Automatically create new wallet addresses, complete the buy transaction,
        transfer to the main wallet, and close the account.
      </p>
    </div>
  );
};

export default BatchTransactionHeader;