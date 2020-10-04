const express = require("express");
const router = express.Router();
const BlockChain = require("../BlockChain");
const uuid = require("uuid");
const bitcoin = new BlockChain();
const nodeAdress = uuid.v1().split("-").join("");
const { default: Axios } = require("axios");
const e = require("express");

router.get("/blockchain", (req, res) => {
  res.send(bitcoin);
});

router.post("/transaction", async (req, res) => {
  const newTransaction = await req.body;
  const index = bitcoin.addToPending(newTransaction);
  // res.json({note:"has been added successfully to"+index})
});

router.post("/transaction/broadcast", async (req, res) => {
  console.log(20);
  const transaction = await req.body;
  const createNewTransaction = bitcoin.createNewTransaction(
    transaction.amount,
    transaction.sender,
    transaction.recipient
  );
  bitcoin.addToPending(createNewTransaction);
  bitcoin.netWorkNodes.map(async (n) => {
    await Axios.post(n + "/api/transaction", createNewTransaction);
  });
  res.json({
    note: "its done",
  });
});

router.get("/mine", async (req, res) => {
  const lastBlock = bitcoin.getLastBlock();
  const previHash = lastBlock["hash"];
  const currBlock = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock["index"] + 1,
  };

  const nonce = bitcoin.proofOfWork(previHash, currBlock);
  const blockHash = bitcoin.hashBlock(previHash, currBlock, nonce);
  const newBlock = bitcoin.createNewBlock(nonce, previHash, blockHash);
  console.log(newBlock);
  bitcoin.netWorkNodes.map(async (n) => {
    const resp = await Axios.post(n + "/api/receive-new-block", {
      newBlock: newBlock,
    });
  });

  const resp = await Axios.post(
    bitcoin.currentNodeUrl + "/api/transaction/broadcast",
    {
      amount: 12,
      sender: "00",
      recipient: nodeAdress,
    }
  );
  console.log(resp.data);
  res.json({
    note: "new block",
    block: newBlock,
  });
});

router.post("/receive-new-block", async (req, res) => {
  console.log(53);
  const newBlock = await req.body.newBlock;
  const lastBlock = bitcoin.getLastBlock();
  const correcthash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock["index"] + 1 === newBlock["index"];
  if (correctIndex && correcthash) {
    bitcoin.chain.push(newBlock);
    bitcoin.pendingTransactions = [];
    res.json({
      note: "new block added ",
    });
  } else {
    res.json({
      note: "rejected block",
    });
  }
});

router.post("/register-node-broadcast-node", async function (req, res) {
  const newNodeUrl = await req.body.newNodeUrl;
  if (
    !bitcoin.netWorkNodes.includes(newNodeUrl) &&
    bitcoin.currentNodeUrl !== newNodeUrl
  ) {
    console.log(newNodeUrl);
    bitcoin.netWorkNodes.push(newNodeUrl);
    let data = {
      newNodeUrl: newNodeUrl,
    };
    bitcoin.netWorkNodes.map(async (n) => {
      const resp = await Axios.post(n + "/api/register-node", data);
      console.log(resp.data);
    });
    await Axios.post(newNodeUrl + "/api/register-node-bulk", {
      allNodes: [...bitcoin.netWorkNodes, bitcoin.currentNodeUrl],
    });
    res.json({
      message: "node has been registered",
    });
  } else
    res.json({
      note: "sorry its not possible",
    });
});

router.post("/register-node", async (req, res) => {
  const newNodeUrl = await req.body.newNodeUrl;
  console.log("58" + newNodeUrl);
  if (
    !bitcoin.netWorkNodes.includes(newNodeUrl) &&
    bitcoin.currentNodeUrl !== newNodeUrl
  ) {
    bitcoin.netWorkNodes.push(newNodeUrl);
    return res.json({
      message: "new node registered",
    });
  }
  res.json({
    message: "sorry we couldnot register  ",
  });
});

router.post("/register-node-bulk", async (req, res) => {
  const allNodes = await req.body.allNodes;
  console.log(allNodes);
  allNodes.forEach((node) => {
    if (
      !bitcoin.netWorkNodes.includes(node) &&
      bitcoin.currentNodeUrl !== node
    ) {
      bitcoin.netWorkNodes.push(node);
    }
  });
  res.json({
    meesage: "bulk registeration successful",
  });
});

router.get("/consenus", async (req, res) => {
  const allBlockChains = [];
  bitcoin.netWorkNodes.map(async (n) => {
    const resp = await Axios.get(n + "/api/blockchain");
    const allData = await resp.data;
    allBlockChains.push(allData);
  });

  const currentChainLength = bitcoin.chain.length;
  let maxChainLength = currentChainLength;
  let newLongestChain = null;
  let newPendingTransaction = null;
  allBlockChains.map((block) => {
    if (block.chain.length > maxChainLength) {
      maxChainLength = block.chain.length;
      newLongestChain = block.chain;
      newPendingTransaction = block.pendingTransactions;
    }
  });
  if (
    !newLongestChain ||
    (newLongestChain && !bitcoin.chainIsValid(newLongestChain))
  ) {
    res.json({
      note: "current chain has not been replaced",
    });
  } else if (newLongestChain & bitcoin.chainIsValid(newLongestChain)) {
    bitcoin.chain = newLongestChain;
    bitcoin.pendingTransactions = newPendingTransaction;
    res.json({
      note: "this chain has been replaced",
    });
  }
});

router.get("/block/:blockhash", async (req, res) => {
  const blockHash = req.params.blockHash;
  const correctBlock = bitcoin.getBlock(blockHash);
  if (correctBlock) {
    res.json({
      note: "this is the block",
      block: correctBlock,
    });
  } else {
    res.json({
      note: "there is no such a block",
    });
  }
});

router.get("/transaction/:transaction", async (req, res) => {
  const currentTransactionId = req.params.transactionId;
  const { block, transaction } = bitcoin.getTransaction(currentTransactionId);
  res.json({ block: block, transaction: transaction });
});

router.get("/address/:address", async (req, res) => {
  const address = req.params.address;
  const addressData=bitcoin.getAddress(address)
  res.json({addressData:addressData})
});


module.exports = router;
