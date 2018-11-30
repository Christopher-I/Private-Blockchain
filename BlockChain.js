/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {

    constructor() {
        this.db = new LevelSandbox.LevelSandbox();
       //check if genesisblock has been created
        this.getBlockHeight().then((height) => {            
            if(height > 0){
              console.log("genesis block already included" );
              return;
        }else{
          //create genesis block
        this.generateGenesisBlock(new Block.Block("First block in the chain - Genesis block"));
        console.log("now creating genesis block" );
        } 
      });
    }

    // Auxiliar method to create a Genesis Block (always with height= 0)
    // You have to options, because the method will always execute when you create your blockchain
    
    // will not create the genesis block
    generateGenesisBlock(genesisblock){
        // check if a previous genesisblock has be previous created
        genesisblock.time = new Date().getTime().toString().slice(0,-3);
        genesisblock.hash = SHA256(JSON.stringify(genesisblock)).toString();
        this.db.addLevelDBData(genesisblock.height,JSON.stringify(genesisblock).toString());
    }

    // Get block height, it is auxiliar method that return the height of the blockchain
    getBlockHeight() {
        // Query the database to get block height        
        return this.db.getHeight();
    }

    // Add new block
    addBlock(newBlock) {
        let self = this;
        return new Promise(function(resolve, reject) {
        // First we need to get the block height
        self.getBlockHeight().then((height)=>{                 
           
            newBlock.height = height + 1; 
            newBlock.time = new Date().getTime().toString().slice(0,-3);//get UTC time and convert to readable format            
            
        self.getBlock(height).then((prevBlock)=>{
            newBlock.previousBlockHash = JSON.parse(prevBlock).hash;

            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();//get blockhash

            resolve(self.db.addLevelDBData(newBlock.height,JSON.stringify(newBlock).toString())); 
        })
        })
    })
    }

    // Get Block By Height
    getBlock(height) {
        // Query the database to fetch block
        return this.db.getLevelDBData(height);
    }

    // Validate if Block is being tampered by Block Height
    validateBlock(blockHeight) {
        let self = this;
        return new Promise(function(resolve, reject) {
            //first retrive block from database
        self.getBlock(blockHeight).then((block)=>{
            //parse block to make it redable
            block = JSON.parse(block);         
        // get block hash
        let blockHash = block.hash;
         
          // remove block hash to test block integrity
            block.hash = '';
          // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();      

      if ((blockHash)===(validBlockHash)) {
         resolve ("Block is Valid");
        } else {
          console.log('Block #' + blockHeight +' invalid hash:\n'+ blockHash + '<>' + validBlockHash);
          reject ("Block is not Valid");
        }
    })
    })
    }

// Validate Blockchain
    validateChain() {
          let errorLog = [];
          let allBlocks = [];
          let self = this;
        return new Promise(function(resolve, reject) {
         self.getBlockHeight().then((height)=>{
            for (var i = 0; i <= height; i++) {
             // validate all blocks by calling the validate block function
        self.validateBlock(i).then((result)=>{
            //store any errors in the error log array
            if(result ==="Block is not Valid"){
                let errMessage = "Block " + i + " invalid";
                errorLog.push(errMessage);
            }else{
                return;
            }       
    })     
            let p = i;// declare an alternative variable to i, which can be used inside the getBlock function below      
            //get current block from database
         self.getBlock(i).then((block) =>{            
            allBlocks.push(JSON.parse(block));//store all block information in an array
            //get the next block from data base
            if(p>=1){
                if (allBlocks[p].previousBlockHash === allBlocks[p-1].hash){//validate all hash values by comparing to the previous block hash of the bext block
                    return;
                }else{
                    errorLog.push("the previous hash of block height " + p + "does not equal the block hash of " + (p+1));
             }
            }         
     }) 
     }           
     //check if the error log is empty
              if(errorLog.length >0){
                for (var i = 0; i <= height; i++) {
                    console.log(errorLog[i]);
                    reject(errorLog);
                }
            }else{
                //if the error log is empty then blockchain is ok
                resolve(errorLog);
                console.log("The Blockhain is in good shape, all current blocks are valid");
            }         
    })     
    })
    }    

   
}

module.exports.Blockchain = Blockchain;