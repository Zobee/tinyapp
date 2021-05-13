const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const {generateRandomString, emailLookup, urlsForUser} = require('./helpers')
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
const PORT = 8080;

app.set('view engine', "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['keys1', "keys2"]
}))

const urlDatabase = {
};

const users = {
}

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get('/urls', (req, res) => {
  const user = users[`user${req.session["user_id"]}`]
  let urls = {}
  if(user) {urls = urlsForUser(user.id, urlDatabase)}
  const templateVars = {user, urls};
  res.render("urls_index", templateVars)
})

app.post("/urls", (req, res) => {
  const user = users[`user${req.session["user_id"]}`]
  const short = generateRandomString();
  urlDatabase[short] = {longURL: req.body.longURL, userID: user.id};
  res.redirect(`/urls/${short}`)       
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const user = users[`user${req.session["user_id"]}`]
  const templateVars = {user, urls: urlDatabase };
  if(user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const user = users[`user${req.session["user_id"]}`]
  if(user){
    let shortURL = req.params.shortURL
    if(urlsForUser(user.id, urlDatabase)[shortURL]){
      let longURL = urlDatabase[shortURL].longURL
      const templateVars = {user, shortURL, longURL};
      res.render("urls_show", templateVars);
    } else {
      res.status(403).send("Forbidden: This isn't your URL")
    }
  } else {
    res.redirect('/')
  }
})

app.get("/u/:shortURL", (req, res) => {
  const {longURL} = urlDatabase[req.params.shortURL]
  if(longURL) {
    res.redirect(longURL);
  } else {
    res.redirect('/') //Maybe redirect to an error page
  }
});

//Causes header error
app.post("/urls/:shortURL", (req, res) => {
  const user = users[`user${req.session["user_id"]}`]
  if(user){
    let shortURL = req.params.shortURL
    if(urlsForUser(user.id, urlDatabase)[shortURL]){
      urlDatabase[shortURL] = {longURL: req.body.updatedLongURL, userID: user.id}
      console.log(urlDatabase)
      return res.redirect('/urls')
    }
  }
  res.status(403).send("Forbidden: Only users may edit their own urls.")
})

//Causes header error
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[`user${req.session["user_id"]}`]
  if(user){
    let shortURL = req.params.shortURL
    if(urlsForUser(user.id, urlDatabase)[shortURL]){
      delete urlDatabase[req.params.shortURL]
      return res.redirect('/urls');
    } 
  }
  res.status(403).send("Forbidden: Only users may delete their own urls.")
})

app.get('/login', (req, res) => {
  res.render("urls_login")
})

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  if(!email || !password) {
    return res.status(400).send("Error: Email or Password must not be empty.")
  }
  let user = emailLookup(email, users)
  if(user.data){
    if(bcrypt.compareSync(password, user.data.password)){
      req.session.user_id = user.data.id;
      res.redirect("/urls")
    } else {
      res.status(403).send("Password does not match!")
    }
  } else {
    res.status(403).send("Error. User does not exist")
  }
})

app.post('/logout', (req, res) => {
  req.session = null
  res.redirect("/urls")
})

app.get('/register', (req, res) => {
  res.render("urls_register")
})

app.post('/register', (req, res) => {
  const {email, password} = req.body
  if(!email || !password) {
    return res.status(400).send("Error: Email or Password must not be empty.")
  }
  if(emailLookup(email, users).data){
    return res.status(400).send("Error: Email already exists.");
  }
  const uid = generateRandomString()
  const newUser = {
    id: uid,
    email,
    password: bcrypt.hashSync(password, 10)
  }
  users[`user${uid}`] = newUser;
  console.log(users)

  req.session.user_id = uid;
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
