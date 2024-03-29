/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { VoterAssetContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logger = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('VoterAssetContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new VoterAssetContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"voter asset 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"voter asset 1002 value"}'));
    });

    describe('#voterAssetExists', () => {

        it('should return true for a voter asset', async () => {
            await contract.voterAssetExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a voter asset that does not exist', async () => {
            await contract.voterAssetExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createVoterAsset', () => {

        it('should create a voter asset', async () => {
            await contract.createVoterAsset(ctx, '1003', 'voter asset 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"voter asset 1003 value"}'));
        });

        it('should throw an error for a voter asset that already exists', async () => {
            await contract.createVoterAsset(ctx, '1001', 'myvalue').should.be.rejectedWith(/The voter asset 1001 already exists/);
        });

    });

    describe('#readVoterAsset', () => {

        it('should return a voter asset', async () => {
            await contract.readVoterAsset(ctx, '1001').should.eventually.deep.equal({ value: 'voter asset 1001 value' });
        });

        it('should throw an error for a voter asset that does not exist', async () => {
            await contract.readVoterAsset(ctx, '1003').should.be.rejectedWith(/The voter asset 1003 does not exist/);
        });

    });

    describe('#updateVoterAsset', () => {

        it('should update a voter asset', async () => {
            await contract.updateVoterAsset(ctx, '1001', 'voter asset 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"voter asset 1001 new value"}'));
        });

        it('should throw an error for a voter asset that does not exist', async () => {
            await contract.updateVoterAsset(ctx, '1003', 'voter asset 1003 new value').should.be.rejectedWith(/The voter asset 1003 does not exist/);
        });

    });

    describe('#deleteVoterAsset', () => {

        it('should delete a voter asset', async () => {
            await contract.deleteVoterAsset(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a voter asset that does not exist', async () => {
            await contract.deleteVoterAsset(ctx, '1003').should.be.rejectedWith(/The voter asset 1003 does not exist/);
        });

    });

});
