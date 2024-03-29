/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets, X509Provider } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// capture network variables from config.json
const configPath = path.join(process.cwd(), './config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
console.log(configJSON);
const config = JSON.parse(configJSON);

// capturing connection details from ibpConnection.json
const ccPath = path.join(process.cwd(), './ibpConnection.json');
// const ccPath = '/mnt/c/users/nicki/blockchain_linux/evote/web-app/server/ibpConnection.json';
const ccJSON = fs.readFileSync(ccPath, 'utf8');
const ccp = JSON.parse(ccJSON);
console.log(ccp);



// let connection_file = config.connection_file;
let appAdmin = config.appAdmin;
console.log(appAdmin)
let appAdminSecret = config.appAdminSecret;
let orgMSPID = config.orgMSPID;
console.log(orgMSPID)
let caName = config.caName;

// const ccpPath = path.join(process.cwd(), './www/blockchain/ibpConnection.json');
// const ccpPath = path.join(process.cwd(), './ibpConnection.json');
// const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
// const ccp = JSON.parse(ccpJSON);

async function main() {
  try {

    // Create a new CA client for interacting with the CA.
    const caURL = caName;
    const ca = new FabricCAServices(caURL);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the admin user.
    const adminExists = await wallet.get(appAdmin);
    console.log(adminExists)
    if (adminExists) {
      console.log('An identity for the admin user "admin" already exists in the wallet');
      return;
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await ca.enroll({ enrollmentID: appAdmin, enrollmentSecret: appAdminSecret });
    console.log(enrollment.certificate)
    console.log(enrollment.key)

    //New Code Block
    // const identityLabel = '';
    const identity = {
      credentials: {
        certificate: enrollment.certificate,
        privatekey: enrollment.key.toBytes(),
      },
      mspID: orgMSPID,
      type: 'X.509',
    };

    await wallet.put(appAdmin, identity);
    console.log("msg: Successfully enrolled admin user ' + appAdmin + ' and imported it into the wallet");
    // New Code Block end

    // const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
    // wallet.import(appAdmin, identity);
    // console.log('msg: Successfully enrolled admin user ' + appAdmin + ' and imported it into the wallet');

  } catch (error) {
    console.error(`Failed to enroll admin user ' + ${appAdmin} + : ${error}`);
    process.exit(1);
  }
}

main();
