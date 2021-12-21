'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const util = require('util');
const path = require('path');
const fs = require('fs');

let network = require('./fabric/network.js');

const app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(cors());

const productionMode = true

if (productionMode) {
  const configPath = path.join(process.cwd(),'/config.json');
  // const configPath = '/mnt/c/users/nicki/blockchain_linux/evote/web-app/server/config.json';
  const configJSON = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configJSON);
}

// const configPath = path.join(process.cwd(),'/config.json'); // '../config.json'
console.log(__dirname);
// const configPath = path.resolve(__dirname, '../config.json');
// console.log(configPath)
// const configJSON = fs.readFileSync(configPath, 'utf8');
// const config = JSON.parse(configJSON);



//get voter info, create voter object, and update state with their voterId
app.post('/registerVoter', async (req, res) => {
  console.log('req.body: ');
  console.log(req.body);
  let voterId = req.body.voterId;

  //first create the identity for the voter and add to wallet
  let response = await network.registerVoter(voterId, req.body.password, req.body.firstName, req.body.lastName);
  console.log('response from registerVoter: ');
  console.log(response);
  if (response.error) {
    res.send(response.error);
  } else {
    console.log('req.body.voterId');
    console.log(req.body.voterId);
    let networkObj = await network.connectToNetwork(voterId);
    console.log('networkobj: ');
    console.log(networkObj);

    if (networkObj.error) {
      res.send(networkObj.error);
    }
    console.log('network obj');
    console.log(util.inspect(networkObj));


    req.body = JSON.stringify(req.body);
    let args = [req.body];
    //connect to network and update the state with voterId  

    let invokeResponse = await network.invoke(networkObj, false, 'createVoter', args);
    
    if (invokeResponse.error) {
      res.send(invokeResponse.error);
    } else {

      console.log('after network.invoke ');
      let parsedResponse = JSON.parse(invokeResponse);
      parsedResponse += 'Voter Successfully Registered';
      res.send(parsedResponse);

    }

  }


});


//vote for some candidates. This will increase the vote count for the votable objects
app.post('/castBallot', async (req, res) => {
  let networkObj = await network.connectToNetwork(req.body.voterId);
  console.log('util inspecting');
  console.log(util.inspect(networkObj));
  req.body = JSON.stringify(req.body);
  console.log('req.body');
  console.log(req.body);
  let args = [req.body];

  let response = await network.invoke(networkObj, false, 'castVote', args);
  if (response.error) {
    res.send(response.error);
  } else {
    console.log('response: ');
    console.log(response);
    // let parsedResponse = await JSON.parse(response);
    res.send(response);
  }
});

//query for certain objects within the world state
app.post('/queryWithQueryString', async (req, res) => {

  let networkObj = await network.connectToNetwork(appAdmin);
  let response = await network.invoke(networkObj, true, 'queryByObjectType', req.body.selected);
  let parsedResponse = await JSON.parse(response);
  res.send(parsedResponse);

});



//used as a way to login the voter to the app and make sure they haven't voted before 
app.post('/validateVoter', async (req, res) => {
  console.log('req.body: ');
  console.log(req.body);
  let networkObj = await network.connectToNetwork(req.body.voterId);
  console.log('networkobj: ');
  console.log(util.inspect(networkObj));

  if (networkObj.error) {
    res.send(networkObj);
  }

  let invokeResponse = await network.invoke(networkObj, true, 'readVoterAsset', req.body.voterId);
  if (invokeResponse.error) {
    res.send(invokeResponse);
  } else if (invokeResponse ) {

  } else {
    console.log('after network.invoke ');
    let parsedResponse = await JSON.parse(invokeResponse);
    if (parsedResponse.ballotCast) {
      let response = {};
      response.error = '';
      res.send(response);
    }
    // let response = `Voter with voterId ${parsedResponse.voterId} is ready to cast a ballot.`  
    res.send(parsedResponse);
  }

});

app.get('/getCurrentStanding', async (req, res) => {

  let networkObj = await network.connectToNetwork(appAdmin);
  let response = await network.invoke(networkObj, true, 'queryByObjectType', 'votableItem');
  let parsedResponse = await JSON.parse(response);
  console.log(parsedResponse);
  res.send(parsedResponse);

});

app.listen(process.env.PORT || 8081);