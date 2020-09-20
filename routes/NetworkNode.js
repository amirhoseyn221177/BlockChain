const express=require('express')
const router= express.Router();
const BlockChain=require('../BlockChain')
const uuid=require('uuid');
const bitcoin=new BlockChain()
const port =process.argv[2]
const currentUrl=process.argv[3]
const nodeAdress=uuid.v1().split('-').join('')
const rp= require('request-promise');
const { default: Axios } = require('axios');

router.get('/blockchain',(req,res)=>{
    res.send(bitcoin)
})

router.post('/transaction',(req,res)=>{
    const blockIndex= bitcoin.createNewTransaction(req.body.amount,req.body.sender,req.body.recipient)
    res.json({note:`Transaction will be added in block ${blockIndex}`})
})


router.get('/mine',(req,res)=>{
    const lastBlock=bitcoin.getLastBlock()
    const previHash=lastBlock['hash']
    const currBlock={
        transactions:bitcoin.pendingTransactions,
        index:lastBlock['index']+1
    }

    bitcoin.createNewTransaction(12.5,"00",nodeAdress)
    const nonce = bitcoin.proofOfWork(previHash,currBlock)
    const blockHash=bitcoin.hashBlock(previHash,currBlock,nonce)
    const newBlock= bitcoin.createNewBlock(nonce,previHash,blockHash)
    res.json({note:"new block",block:newBlock})
})

router.post('/register-node-broadcast-node',async function (req, res) {
        const newNodeUrl = await req.body.newNodeUrl;
        if (!bitcoin.netWorkNodes.includes(newNodeUrl)) {
            console.log(newNodeUrl);
            bitcoin.netWorkNodes.push(newNodeUrl);
            let data = { newNodeUrl: newNodeUrl };
            bitcoin.netWorkNodes.map(async(n)=>{
                const resp= await Axios.post(n+'/api/register-node',data)
                console.log(resp.data)
            })

         const bulkResp=await Axios.post(newNodeUrl+'/api/register-node-bulk',{allNodes:[...bitcoin.netWorkNodes,bitcoin.currentNodeUrl]})
         console.log(bulkResp.data)
         res.json({message:'node has been registered'})
        }
    }
    
)

router.post('/register-node',async(req,res)=>{
    const newNodeUrl= await req.body.newNodeUrl
    console.log("58"+newNodeUrl)
        if(!bitcoin.netWorkNodes.includes(newNodeUrl)&&bitcoin.currentNodeUrl!==newNodeUrl){
            bitcoin.netWorkNodes.push(newNodeUrl)
         return res.json({message:"new node registered"})
        }
         res.json({message:"sorry we couldnot register  "})
 
})

router.post('/register-node-bulk',async(req,res)=>{
    const allNodes=await req.body.allNodes
    console.log(allNodes)
    allNodes.forEach(node=>{
        if(!bitcoin.netWorkNodes.includes(node)&&bitcoin.currentNodeUrl!==node){
            bitcoin.netWorkNodes.push(node)
        }
    })
    res.json({meesage:"bulk registeration successful"})
})

module.exports=router