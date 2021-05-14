const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const {generateRandomString, emailLookup, urlsForUser, getUserFromSession} = require('./helpers');
const bcrypt = require('bcrypt');
const PORT = 8080;

const app = express();

app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['keys1', "keys2"]
}));

const urlDatabase = {
};

const users = {
};

app.get("/", (req, res) => {
  const user = getUserFromSession(req.session, users);
  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  const user = getUserFromSession(req.session, users);
  const templateVars = {user};
  if (user) {
    templateVars.urls = urlsForUser(user.id, urlDatabase);
    res.render("urls_index", templateVars);
  } else {
    templateVars.error = {status: 403, msg: "Please log in to access URLs"};
    res.status(404).render("urls_error", templateVars);
  }
});

app.post("/urls", (req, res) => {
  const user = getUserFromSession(req.session, users);
  if (user) {
    const shortID = generateRandomString();
    let longURL = req.body.longURL;
    if (longURL.slice(0,7) !== "http://") {
      longURL = "http://" + longURL;
    }
    urlDatabase[shortID] = {longURL, userID: user.id};
    res.redirect(`/urls/${shortID}`);
  } else {
    const templateVars = {user, error: {status: 403, msg: "Please log in to add urls"}};
    res.status(403).render("urls_error", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const user = getUserFromSession(req.session, users);
  const templateVars = {user, urls: urlDatabase };
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const user = getUserFromSession(req.session, users);
  let {shortURL} = req.params;
  const templateVars = {user};

  if (!urlDatabase[shortURL]) {
    templateVars.error = {status : 400, msg: "Short URL does not exist"};
    return res.status(400).render("urls_error", templateVars);
  }

  if (user) {
    if (urlsForUser(user.id, urlDatabase)[shortURL]) {
      let longURL = urlDatabase[shortURL].longURL;
      let templateVars = {user, shortURL, longURL};
      res.render("urls_show", templateVars);
    } else {
      templateVars.error = {status: 403, msg: "This isn't your URL"};
      res.status(403).render("urls_error", templateVars);
    }
  } else {
    templateVars.error = {status: 403, msg: "You must be logged in to update URLs"};
    res.status(403).render("urls_error", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const urlObj = urlDatabase[req.params.shortURL];
  if (urlObj) {
    res.redirect(urlObj.longURL);
  } else {
    res.status(404).send("Error: Short URL does not exist");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const user = getUserFromSession(req.session, users);
  if (user) {
    let {shortURL, longURL} = req.params;
    if (longURL.slice(0,7) !== "http://") {
      longURL = `http://` + longURL;
    }
    if (urlsForUser(user.id, urlDatabase)[shortURL]) {
      urlDatabase[shortURL] = {longURL, userID: user.id};
      return res.redirect('/urls');
    }
  }
  const templateVars = {user, error : {status : 403, msg: "Users may only edit their own urls."}};
  res.status(403).render("urls_error", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = getUserFromSession(req.session, users);
  if (user) {
    let shortURL = req.params.shortURL;
    if (urlsForUser(user.id, urlDatabase)[shortURL]) {
      delete urlDatabase[req.params.shortURL];
      return res.redirect('/urls');
    }
  }
  const templateVars = {user, error : {status : 403, msg: "Users may only delete their own urls."}};
  res.status(403).render("urls_error", templateVars);
});

//Login and Registration Routes
app.get('/login', (req, res) => {
  if (getUserFromSession(req.session, users)) {
    return res.redirect('/urls');
  }
  res.render("urls_login");
});

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    const templateVars = {user: null, error : {status: 400, msg: "Email or Password must not be empty"}};
    return res.status(400).render("urls_error", templateVars);
  }
  let user = emailLookup(email, users);
  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user.id;
      res.redirect("/urls");
    } else {
      const templateVars = {user, error : {status: 403, msg: "Password does not match!"}};
      res.status(403).render("urls_error", templateVars);
    }
  } else {
    const templateVars = {user, error : {status: 404, msg: "User does not exist"}};
    res.status(404).render("urls_error", templateVars);
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get('/register', (req, res) => {
  if (getUserFromSession(req.session, users)) {
    return res.redirect('/urls');
  }
  res.render("urls_register");
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    const templateVars = {user : null, error : {status: 400, msg: "Email and Password fields must not be empty"}};
    return res.status(400).render("urls_error", templateVars);
  }
  
  if (emailLookup(email, users)) {
    const templateVars = {user : null, error : {status: 400, msg: "Email already exists. Please use a different email address to register"}};
    return res.status(400).render("urls_error", templateVars);
  }
  const uid = generateRandomString();

  const newUser = {
    id: uid,
    email,
    password: bcrypt.hashSync(password, 10)
  };
  users[`user${uid}`] = newUser;

  req.session.user_id = uid;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});