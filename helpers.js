const CHARS = "0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
function generateRandomString() {
  let randomStr = "";
  while (randomStr.length < 6) {
    let randChar = CHARS[Math.floor(Math.random() * CHARS.length)]
    randomStr += randChar;
  }
  return randomStr;
};

const emailLookup = (email, db) => {
  for (let user of Object.values(db)) {
    if (user.email === email) {
      return {data : user};
    }
  }
  return {data: null};
};

const urlsForUser = (id, db) => {
  const urls = {};
  for (let key in db) {
    let userUrl = db[key].userID;
    if (id === userUrl) {
      urls[key] = db[key];
    }
  }
  return urls;
};

module.exports = {generateRandomString, emailLookup, urlsForUser};