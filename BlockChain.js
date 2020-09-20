const sha = require('sha256')
const currentUrl=process.argv[3]

class BlockChain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.currentNodeUrl=currentUrl
        this.netWorkNodes=[]
        this.createNewBlock(100,'0','0')
    }
    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash
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
            amount: amount,
            sender: sender,
            recipient: recipient
        };
        this.pendingTransactions.push(newTransaction);
        return newTransaction;
    }
    hashBlock(prevBlock, currentBlock, nonce) {
        const dataString = prevBlock + nonce.toString() + JSON.stringify(currentBlock);
        const hash = sha(dataString);
        return hash;
    }
    proofOfWork(prevHash, currentHash) {
        let nonce = 0;
        let hash = this.hashBlock(prevHash, currentHash, nonce);

        while (hash.substring(0, 4) !== '0000') {
            nonce++;
            hash = this.hashBlock(prevHash, currentHash, nonce);
        }

        return nonce;
    }
}


module.exports=BlockChain