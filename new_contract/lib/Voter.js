'use strict';

class Voter {
  /**
   *
   * Voter
   *
   * Constructor for a Voter object. Voter has a voterId and registrar that the
   * voter is . 
   *  
   * @param items - an array of choices 
   * @param election - what election you are making ballots for 
   * @param voterId - the unique Id which corresponds to a registered voter
   * @returns - registrar object
   */
  constructor(voterId, firstName, lastName, password) {

    if (this.validateVoter(voterId) && this.validatePassword(password)) {

      this.voterId = voterId;
      this.password = password;
      this.firstName = firstName;
      this.lastName = lastName;
      this.ballotCreated = false;
      this.type = 'voter';
      if (this.__isContract) {
        delete this.__isContract;
      }
      if (this.name) {
        delete this.name;
      }
      return this;

    } else if (!this.validateVoter(voterId)){
      throw new Error('the voterId is not valid.');
    } else {
      throw new Error('the password is not valid.');
    }

  }

  /**
   *
   * validateVoter
   *
   * check for valid ID card - stateID or drivers License.
   *  
   * @param voterId - an array of choices 
   * @returns - yes if valid Voter, no if invalid
   */
  async validateVoter(voterId) {
    //VoterId error checking here, i.e. check if valid drivers License, or state ID
    if (voterId) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * validatePassword
   *
   * check for valid password, should be cross checked with government
   *  
   * @param voterId - an array of choices 
   * @returns - yes if valid Voter, no if invalid
   */
  async validatePassword(password) {

    //password error checking here, i.e. check if valid drivers License, or state ID
    if (password) {
      return true;
    } else {
      return false;
    }
  }

}
module.exports = Voter;