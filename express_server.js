const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
const PORT = 8080;

app.set('view engine', "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['SomeKey']
}))

const CHARS = "0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
function generateRandomString() {
  let randomStr = "";
  while (randomStr.length < 6){
    let randChar = CHARS[Math.floor(Math.random() * CHARS.length)]
    randomStr += randChar;
  }
  return randomStr;
}

const urlDatabase = {
};

const users = {
}

const emailLookup = (email) => {
  for (let user of Object.values(users)){
    if (user.email === email) {
      return {data : user};
    }
  }
  return {data: null};
}

const urlsForUser = (id) => {
  const urls = {};
  for (let key in urlDatabase){
    let userUrl = urlDatabase[key].userID;
    if(id === userUrl) {
      urls[key] = urlDatabase[key]
    }
  }
  return urls;
}

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get('/urls', (req, res) => {
  const user = users[`user${req.session["user_id"]}`]
  let urls = {}
  if(user) {urls = urlsForUser(user.id)}
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
    if(urlsForUser(user.id)[shortURL]){
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

app.post("/urls/:shortURL", (req, res) => {
  const user = users[`user${req.session["user_id"]}`]
  if(user){
    let shortURL = req.params.shortURL
    if(urlsForUser(user.id)[shortURL]){
      urlDatabase[shortURL] = {longURL: req.body.updatedLongURL, userID: user.id}
      console.log(urlDatabase)
      res.redirect('/urls')
    }
  }
  res.status(403).send("Forbidden: Only users may edit their own urls.")
})


app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[`user${req.session["user_id"]}`]
  if(user){
    let shortURL = req.params.shortURL
    if(urlsForUser(user.id)[shortURL]){
      delete urlDatabase[req.params.shortURL]
      res.redirect('/urls');
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
  let user = emailLookup(email)
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
  if(emailLookup(email).data){
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
