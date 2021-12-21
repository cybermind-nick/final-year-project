//Import Hyperledger Fabric 1.4 programming model - fabric-network
'use strict';

const { Wallets, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');

//connect to the config file
// const configPath = path.join(process.cwd(), './config.json');
const configPath = '/mnt/c/users/nicki/blockchain_linux/evote/web-app/server/config.json';
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);

// connect to the connection file
// const ccpPath = path.join(process.cwd(), './ibpConnection.json');
const ccpPath = '/mnt/c/users/nicki/blockchain_linux/evote/web-app/server/ibpConnection.json';
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const connectionProfile = JSON.parse(ccpJSON);

// A wallet stores a collection of identities for use
const walletPath = path.join(process.cwd(), './wallet');
// const walletPath = '/mnt/c/users/nicki/blockchain_linux/evote/web-app/server/wallet';
const wallet = Wallets.newFileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

const peerIdentity = '';

async function queryAll() {
  
  try {

    let response;

    // Check to see if we've already enrolled the user.
    const userExists = await wallet.get(peerIdentity);
    if (!userExists) {
      console.log('An identity for the user ' + peerIdentity + ' does not exist in the wallet');
      console.log('Run the registerUser.js application before retrying');
      response.error = 'An identity for the user ' + peerIdentity + ' does not exist in the wallet. Register ' + peerIdentity + ' first';
      return response;
    }

    //connect to Fabric Network, but starting a new gateway
    const gateway = new Gateway();

    //use our config file, our peerIdentity, and our discovery options to connect to Fabric network.
    await gateway.connect(connectionProfile, { wallet, identity: peerIdentity, discovery: config.gatewayDiscovery });

    //connect to our channel that has been created on IBM Blockchain Platform
    const network = await gateway.getNetwork('mychannel');

    //connect to our contract that has been installed / instantiated on IBM Blockchain Platform
    const contract = await network.getContract('contract'); 
    //submit transaction to the smart contract that is installed / instnatiated on the peers
    console.log('calling contract.evaluateTransaction, with args');
    response = await contract.submitTransaction('queryAll');
    response = JSON.parse(response.toString());
    console.log(`response from evaluateTransaction: ${(response)}`)
   

    console.log('Transaction has been submitted');

    // Disconnect from the gateway.
    await gateway.disconnect();

  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
  }
}
// let args = ["V1"]
// args = args.toString();
queryAll();
