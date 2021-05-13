const { assert } = require('chai');
const { emailLookup } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('emailLookup', function() {
  it('should return a user with valid email', function() {
    const user = emailLookup("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    
    assert.equal(user.id, expectedOutput)
  });

  it("should return null if the email does not exist in the db", () => {
    const user = emailLookup("fake@notreal.com", testUsers)
    assert.isUndefined(user)
  })
});