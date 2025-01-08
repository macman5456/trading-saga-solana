import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function createAndFundWallet(
  connection: Connection,
  amount: number,
  jitoTip: number,
  fromWallet: Keypair
) {
  // Create new wallet
  const newWallet = Keypair.generate();
  
  // Create transfer transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: newWallet.publicKey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  // Add Jito tip to transaction
  if (jitoTip > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
        lamports: jitoTip * LAMPORTS_PER_SOL,
      })
    );
  }

  // Send transaction
  const signature = await connection.sendTransaction(transaction, [fromWallet]);
  await connection.confirmTransaction(signature);

  return newWallet;
}

export async function closeWallet(
  connection: Connection,
  walletToClose: Keypair,
  destinationWallet: PublicKey
) {
  const balance = await connection.getBalance(walletToClose.publicKey);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: walletToClose.publicKey,
      toPubkey: destinationWallet,
      lamports: balance,
    })
  );

  const signature = await connection.sendTransaction(transaction, [walletToClose]);
  await connection.confirmTransaction(signature);
}