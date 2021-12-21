/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');


// connect to the election data file
const electionDataPath = path.join(process.cwd(), './lib/data/electionData.json');
const electionDataJson = fs.readFileSync(electionDataPath, 'utf8');
const electionData = JSON.parse(electionDataJson);

//connect to the presidental election file
const ballotDataPath = path.join(process.cwd(), './lib/data/presElection.json');
const ballotDataJson = fs.readFileSync(ballotDataPath, 'utf8');
const ballotData = JSON.parse(ballotDataJson);

// import the files that contain our constructors and helper functions (ie, our entities)
let Ballot = require('./Ballot.js');
let Election = require('./Election.js');
let Voter = require('./Voter.js');
let VotableItem = require('./VotableItem.js');

class VoterAssetContract extends Contract {
         /*
     * init()
     * 
     * This function creates voter and gets the application ready for use bt creating an election
     * from the data files in the data directory
     * 
     * @param ctx - the context of the transaction
     * @returns the voters which are registered and ready to vote in the election
     * 
    */

    async init(ctx) {

        console.log('instantiate was called');

        let voters = [];
        let votableItems = [];
        let elections = [];
        let election;

        // Create voters
        let voter1 = await new Voter('12345', 'Azubike', 'Erewa', 'password');

        //update voter arry
        voters.push(voter1);

        //add the voter to the world state, the election class checks for registered voters
        await ctx.stub.putState(voter1.voterId, Buffer.from(JSON.stringify(voter1)));

        //query for election first before creating one
        let currElections = JSON.parse(await this.queryByObjectType(ctx, 'election'));

        if (currElections.length === 0) {

            // Election will start Dec 3
            let electionStartDate = new Date(2020, 11, 3);
            let electionEndDate = new Date(2020, 11, 20);

            // create the election
            election = await new Election(electionData.electionName, electionData.electionCountry,
                election.electionYear, electionStartDate, electionEndDate);

            //update elections array
            elections.push(election);

            await ctx.stub.putState(election.electionId, Buffer.from(JSON.stringify(election)));
        } else {
            election = currElections[0];
        }


        // create votableItems for the ballots
        let apcVotable = await new VotableItem(ctx, 'All Progressive Party', ballotData.apcBrief);
        let pdpVotable = await new VotableItem(ctx, 'People\'s Democratic Party', ballotData.pdpBrief);
        let sdpVotable = await new VotableItem(ctx, 'Social Democratic Party', ballotData.sdpBrief);
        let yppVotable = await new VotableItem(ctx, 'Youth Progressive Party', ballotData.yppBrief);

        //populate choices array so that the ballots can have all these choices
        votableItems.push(apcVotable);
        votableItems.push(pdpVotable);
        votableItems.push(sdpVotable);
        votableItems.push(yppVotable);

        //save votable choices in the world state
        for (let i = 0; i < votableItems.length; i++) {
            
            await ctx.stub.putState(votableItems[i].votableId, Buffer.from(JSON.stringify(votableItems[i])));
        }

        //generate ballots for all voters
        for (let i = 0; i < voters.length; i++) {
            if (!voters[i].ballot) {

                //give each registered voter a ballot
                await this.generateBallot(ctx, votableItems, election, voters[i]);

            } else {
                console.log('these voters already have ballots');
                break;
            }
        }

        return voters
    }

    /**
   *
   * generateBallot
   *
   * Creates a ballot in the world state, and updates voter ballot and castBallot properties.
   * 
   * @param ctx - the context of the transaction
   * @param votableItems - The different political parties and candidates you can vote for, which are on the ballot.
   * @param election - the election we are generating a ballot for. All ballots are the same for an election.
   * @param voter - the voter object
   * @returns - nothing - but updates the world state with a ballot for a particular voter object
   */
      async generateBallot(ctx, votableItems, election, voter) {

        //generate ballot
        let ballot = await new Ballot(ctx, votableItems, election, voter.voterId);
        
        //set reference to voters ballot
        voter.ballot = ballot.ballotId;
        voter.ballotCreated = true;

        // //update state with ballot object we just created
        await ctx.stub.putState(ballot.ballotId, Buffer.from(JSON.stringify(ballot)));

        await ctx.stub.putState(voter.voterId, Buffer.from(JSON.stringify(voter)));

    }
    

    

   /**
   *
   * createVoter
   *
   * Creates a voter in the world state, based on the args given.
   *  
   * @param args.voterId - the Id the voter, used as the key to store the voter object
   * @param args.registrarId - the registrar the voter is registered for
   * @param args.firstName - first name of voter
   * @param args.lastName - last name of voter
   * @returns - nothing - but updates the world state with a voter
   */
    async createVoter(ctx, args) {

        args = JSON.parse(args);

        //create a new voter
        let newVoter = await new Voter(args.voterId, args.password, args.firstName, args.lastName);

        //update state with new voter
        await ctx.stub.putState(newVoter.voterId, Buffer.from(JSON.stringify(newVoter)));

        //query state for elections
        let currElections = JSON.parse(await this.queryByObjectType(ctx, 'election'));

        if (currElections.length === 0) {
        let response = {};
        response.error = 'no elections. Run the init() function first.';
        return response;
        }

        //get the election that is created in the init function
        let currElection = currElections[0];

        let votableItems = JSON.parse(await this.queryByObjectType(ctx, 'votableItem'));
        
        //generate ballot with the given votableItems
        await this.generateBallot(ctx, votableItems, currElection, newVoter);

        let response = `voter with voterId ${newVoter.voterId} is updated in the world state`;
        return response;
    }

    /**
   *
   * readVoterAsset
   *
   * Reads a key-value pair from the world state, based on the key given.
   *  
   * @param voterAssetId - the key of the asset to read
   * @returns - nothing - but reads the value in the world state
   */
     async readVoterAsset(ctx, voterAssetId) {

        const exists = await this.voterAssetExists(ctx, voterAssetId);
        if (!exists) {
            // throw new Error(`The voter asset ${voterAssetId} does not exist`);
            let response = {};
            // response.error = `The voter asset ${voterAssetId} does not exist`;
            response.error = "Voter not registered";
            return response
        }

        const buffer = await ctx.stub.getState(voterAssetId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

   /**
   *
   * voterAssetExists
   *
   * Checks to see if a key exists in the world state. 
   * @param voterAssetId - the key of the asset (Voter Contract) to read
   * @returns boolean indicating if the asset exists or not. 
   */
    async voterAssetExists(ctx, voterAssetId) {
        const buffer = await ctx.stub.getState(voterAssetId);
        return (!!buffer && buffer.length > 0);
    }

    /**
   *
   * castVote
   * 
   * First to checks that a particular voterId has not voted before, and then 
   * checks if it is a valid election time, and if it is, we increment the 
   * count of the political party that was picked by the voter and update 
   * the world state. 
   * 
   * @param electionId - the electionId of the election we want to vote in
   * @param voterId - the voterId of the voter that wants to vote
   * @param votableId - the Id of the candidate the voter has selected.
   * @returns an array which has the winning briefs of the ballot. 
   */
    async castVote(ctx, args) {
        args = JSON.parse(args);

        //get the political party the voter voted for, also the key
        let votableId = args.picked;

        //check to make sure the election exists
        let electionExists = await this.VoterAssetExists(ctx, args.electionId);

        if (electionExists) {

        //make sure we have an election
        let electionAsBytes = await ctx.stub.getState(args.electionId);
        let election = await JSON.parse(electionAsBytes);
        let voterAsBytes = await ctx.stub.getState(args.voterId);
        let voter = await JSON.parse(voterAsBytes);

        if (voter.ballotCast) {
            let response = {};
            response.error = 'You have already cast your vote. You can check the current standings to know who is leading the elections';
            return response;
        }

        //check the date of the election, to make sure the election is still open
        let currentTime = new Date(2020, 11, 3);

        //parse date objects
        let parsedCurrentTime = Date.parse(currentTime);
        let electionStart = Date.parse(election.startDate);
        let electionEnd = Date.parse(election.endDate);

        //only allow vote if the election has started 
        if (parsedCurrentTime >= electionStart && parsedCurrentTime < electionEnd) {

            let votableExists = await this.VoterAssetExists(ctx, votableId);
            if (!votableExists) {
            let response = {};
            response.error = 'VotableId does not exist!';
            return response;
            }

            //get the votable object from the state - with the votableId the user picked
            let votableAsBytes = await ctx.stub.getState(votableId);
            let votable = await JSON.parse(votableAsBytes);

            //increase the vote of the political party that was picked by the voter
            votable.count++;

            //update the state with the new vote count
            let result = await ctx.stub.putState(votableId, Buffer.from(JSON.stringify(votable)));
            console.log(result);

            //make sure this voter cannot vote again! 
            voter.ballotCast = true;
            voter.picked = {};
            voter.picked = args.picked;

            //update state to say that this voter has voted, and who they picked
            let response = await ctx.stub.putState(voter.voterId, Buffer.from(JSON.stringify(voter)));
            console.log(response);
            return voter;

        } else {
            let response = {};
            response.error = 'Sorry. The election is over. You can no longer cast a vote';
            return response;
        }

        } else {
        let response = {};
        response.error = 'Invalid/Unregistered voter. Input your registered Voter ID';
        return response;
        }
    }

    /**
     * Evaluate a queryString
     *
     * @param {Context} ctx the transaction context
     * @param {String} queryString the query string to be evaluated
    */
     async queryWithQueryString(ctx, queryString) {

        console.log('query String');
        console.log(JSON.stringify(queryString));

        let resultsIterator = await ctx.stub.getQueryResult(queryString);

        let allResults = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
            let res = await resultsIterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};

                console.log(res.value.value.toString('utf8'));

                jsonRes.Key = res.value.key;

                try {
                jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                console.log(err);
                jsonRes.Record = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                console.log(JSON.stringify(allResults));
                return JSON.stringify(allResults);
            }
        }
    }



    async deleteVoterAsset(ctx, voterAssetId) {
        const exists = await this.voterAssetExists(ctx, voterAssetId);
        if (!exists) {
            throw new Error(`The voter asset ${voterAssetId} does not exist`);
        }
        await ctx.stub.deleteState(voterAssetId);
    }

}

module.exports = VoterAssetContract;
