const sha = require("sha256");
const currentUrl = process.argv[3];
const uuid = require("uuid");

class BlockChain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.currentNodeUrl = currentUrl;
    this.netWorkNodes = [];
    this.createNewBlock(100, "0", "0");
  }
  createNewBlock(nonce, previousBlockHash, hash) {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      nonce: nonce,
      hash: hash,
      previousBlockHash: previousBlockHash,
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
  }
  getLastBlock() {
    console.log(this.chain);
    return this.chain[this.chain.length - 1];
  }

  createNewTransaction(amount, sender, recipient) {
    const newTransaction = {
      Id: uuid.v1().split("-").join(""),
      amount: amount,
      sender: sender,
      recipient: recipient,
    };
    // this.pendingTransactions.push(newTransaction);
    return newTransaction;
  }

  addToPending(transaction) {
    console.log(transaction);
    this.pendingTransactions.push(transaction);
    return this.getLastBlock["index"] + 1;
  }

  hashBlock(prevBlock, currentBlock, nonce) {
    const dataString =
      prevBlock + nonce.toString() + JSON.stringify(currentBlock);
    const hash = sha(dataString);
    return hash;
  }
  proofOfWork(prevHash, currentHash) {
    let nonce = 0;
    let hash = this.hashBlock(prevHash, currentHash, nonce);

    while (hash.substring(0, 4) !== "0000") {
      nonce++;
      hash = this.hashBlock(prevHash, currentHash, nonce);
    }

    return nonce;
  }
  chainIsValid(blockChain) {
    let validChain = true;
    for (let i = 1; i < blockChain.length; i++) {
      const currBlock = blockChain[i];
      const prevBlock = blockChain[i - 1];
      const blockHash = this.hashBlock(
        prevBlock["hash"],
        { transaction: currBlock["transactions"], index: currBlock["index"] },
        currentBlock["nonce"]
      );
      if (blockHash.substring(0, 4) !== "0000") validChain = false;
      if (currBlock["previousBlockHash"] !== prevBlock["hash"]) {
        validChain = false;
      }
    }
    const genesisBlock = blockChain[0];
    const correctNonce = genesisBlock["nonce"] === 100;
    const correctPreviousHash = genesisBlock["previousBlockHash"] === "0";
    const correctHash = genesisBlock["hash"] === "0";
    const correctTransaction = genesisBlock["transactions"].length === 0;
    if (
      correctHash ||
      correctNonce ||
      correctPreviousHash ||
      correctTransaction
    )
      validChain = false;
    return validChain;
  }

  getBlock(hash) {
    let correctBlock = null;
    this.chain.forEach((b) => {
      if (b.hash === hash) {
        correctBlock = b;
      }
    });
    return correctBlock;
  }

  getTransaction(transactionId) {
    let correctTransaction = null;
    let correctBlock = null;
    this.chain.forEach((b) => {
      b.pendingTransactions.forEach((t) => {
        if (t.transactionId === transactionId) {
          correctTransaction = t;
          correctBlock = b;
        }
      });
    });
    return { block: correctBlock, transaction: correctTransaction };
  }

  getAddress(address) {
    const addressTransactions = [];
    this.chain.forEach((b) => {
      b.forEach((t) => {
        if (transaction.sender === address || transaction.recipient === address)
          addressTransactions.push(t);
      });
    });
    let balance = 0;
    addressTransactions.forEach((t) => {
      if (t.recipient === address) balance += t.amount;
      else if (t.sender === address) balance -= t.amount;
    });

    return { transaction: addressTransactions, balance: balance };
  }
}

module.exports = BlockChain;
