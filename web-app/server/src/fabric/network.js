//Import Hyperledger Fabric 1.4 programming model - fabric-network
'use strict';

const { Wallets, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');
const fs = require('fs');

//connect to the config file
console.log(__dirname)
// const configPath = path.resolve(__dirname, '../../config.json');
const configPath = '/mnt/c/users/nicki/blockchain_linux/evote/web-app/server/config.json';
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);
// let connection_file = config.connection_file;

// let userName = config.userName;
let gatewayDiscovery = config.gatewayDiscovery;
let appAdmin = config.appAdmin;
let orgMSPID = config.orgMSPID;

// connect to the connection file
// const connectionDir = require('../../connectionDir');


// console.log('lil  ' + connectionDir.connectionDirectory());

// const ccpPath = path.join(process.cwd(), connection_file);
// let ccpPath_temp = '';
//  (async () => {
//    console.log('..awaiting');
//  ccpPath_temp = await connectionDir.connectionDirectory();
//  console.log('..still waiting');
// })()

// let seconds = 5
// var waitTill = new Date(new Date().getTime() + seconds * 2000);
// while(waitTill > new Date()){}

const ccpPath = '/mnt/c/users/nicki/blockchain_linux/evote/web-app/server/ibpConnection.json';

const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


const util = require('util');

exports.connectToNetwork = async function (userName) {
  
  const gateway = new Gateway();

  try {
    // const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet('../../wallet');
    console.log(`Wallet path: ${walletPath}`);
    console.log('userName: ');
    console.log(userName);

    console.log('wallet: ');
    console.log(util.inspect(wallet));
    console.log('ccp: ');
    console.log(util.inspect(ccp));
    // userName = 'V123412';
    const userExists = await wallet.get(userName);
    if (!userExists) {
      console.log('An identity for the user ' + userName + ' does not exist in the wallet');
      console.log('Run the registerUser.js application before retrying');
      let response = {};
      response.error = 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first';
      return response;
    }

    console.log('before gateway.connect: ');

    await gateway.connect(ccp, { wallet, identity: userName, discovery: gatewayDiscovery });

    // Connect to our local fabric
    const network = await gateway.getNetwork('mychannel');

    console.log('Connected to mychannel. ');
    // Get the contract we have installed on the peer
    const contract = await network.getContract('contract');


    let networkObj = {
      contract: contract,
      network: network,
      gateway: gateway
    };

    return networkObj;

  } catch (error) {
    console.log(`Error processing transaction. ${error}`);
    console.log(error.stack);
    let response = {};
    response.error = error;
    return response;
  } finally {
    console.log('Done connecting to network.');
    // gateway.disconnect();
  }
};

exports.invoke = async function (networkObj, isQuery, func, args) {
  try {
    console.log('inside invoke');
    console.log(`isQuery: ${isQuery}, func: ${func}, args: ${args}`);
    console.log(util.inspect(networkObj));


    // console.log(util.inspect(JSON.parse(args[0])));

    if (isQuery === true) {
      console.log('inside isQuery');

      if (args) {
        console.log('inside isQuery, args');
        console.log(args);
        let response = await networkObj.contract.evaluateTransaction(func, args);
        console.log(response);
        console.log(`Transaction ${func} with args ${args} has been evaluated`);
  
        await networkObj.gateway.disconnect();
  
        return response;
        
      } else {

        let response = await networkObj.contract.evaluateTransaction(func);
        console.log(response);
        console.log(`Transaction ${func} without args has been evaluated`);
  
        await networkObj.gateway.disconnect();
  
        return response;
      }
    } else {
      console.log('notQuery');
      if (args) {
        console.log('notQuery, args');
        console.log('$$$$$$$$$$$$$ args: ');
        console.log(args);
        console.log(func);
        console.log(typeof args);

        args = JSON.parse(args[0]);

        console.log(util.inspect(args));
        args = JSON.stringify(args);
        console.log(util.inspect(args));

        console.log('before submit');
        console.log(util.inspect(networkObj));
        let response = await networkObj.contract.submitTransaction(func, args);
        console.log('after submit');

        console.log(response);
        console.log(`Transaction ${func} with args ${args} has been submitted`);
  
        await networkObj.gateway.disconnect();
  
        return response;


      } else {
        let response = await networkObj.contract.submitTransaction(func);
        console.log(response);
        console.log(`Transaction ${func} with args has been submitted`);
  
        await networkObj.gateway.disconnect();
  
        return response;
      }
    }

  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    return error;
  }
};

exports.registerVoter = async function (voterId, password, firstName, lastName) {

  console.log('password');
  console.log(password);

  console.log('voterId ');
  console.log(voterId);

  if (!password || !voterId || !firstName || !lastName) {
    let response = {};
    response.error = 'Error! You need to fill all fields before you can register!';
    return response;
  }

  try {

    // Create a new file system based wallet for managing identities.
    const walletPath = '/mnt/c/users/nicki/blockchain_linux/evote/web-app/server/wallet';
    const wallet = Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    console.log(wallet);

    // Check to see if we've already enrolled the user.
    const userExists = await wallet.get(voterId);
    if (userExists) {
      let response = {};
      console.log(`An identity for the user ${voterId} already exists in the wallet`);
      response.error = `Error! An identity for the user ${voterId} already exists in the wallet. Please enter
        a different license number.`;
      return response;
    }

    // Check to see if we've already enrolled the admin user.
    const adminExists = await wallet.get(appAdmin);
    if (!adminExists) {
      console.log(`An identity for the admin user ${appAdmin} does not exist in the wallet`);
      console.log('Run the enrollAdmin.js application before retrying');
      let response = {};
      response.error = `An identity for the admin user ${appAdmin} does not exist in the wallet. 
        Run the enrollAdmin.js application before retrying`;
      return response;
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: appAdmin, discovery: gatewayDiscovery });

    // Get the CA client object from the gateway for interacting with the CA.
    const ca = gateway.getClient().getCertificateAuthority();
    const adminIdentity = gateway.getCurrentIdentity();
    console.log(`AdminIdentity: + ${adminIdentity}`);

    // Register the user, enroll the user, and import the new identity into the wallet.
    const secret = await ca.register({ affiliation: '', enrollmentID: voterId, role: 'client' }, adminIdentity);

    const enrollment = await ca.enroll({ enrollmentID: voterId, enrollmentSecret: secret });
    const userIdentity = await X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
    await wallet.import(voterId, userIdentity);
    console.log(`Successfully registered voter ${firstName} ${lastName}. Use voterId ${voterId} to login above.`);
    let response = `Successfully registered voter ${firstName} ${lastName}. Use voterId ${voterId} to login above.`;
    return response;
  } catch (error) {
    console.error(`Failed to register user + ${voterId} + : ${error}`);
    let response = {};
    response.error = error;
    return response;
  }
};