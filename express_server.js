const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({extended: true}));
const PORT = 8080;

app.set('view engine', "ejs");
app.use(cookieParser())

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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "user123D45": {
    id: "123D45", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

const emailLookup = (email) => {
  for (let user of Object.values(users)){
    if (user.email === email) {
      return {data : user};
    }
  }
  return {data: null};
}

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get('/urls', (req, res) => {
  const user = users[`user${req.cookies["user_id"]}`]
  const templateVars = {user, urls: urlDatabase };
  res.render("urls_index", templateVars)
})

app.post("/urls", (req, res) => {
  const short = generateRandomString();
  urlDatabase[short] = req.body.longURL
  res.redirect(`/urls/${short}`)       
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const user = users[`user${req.cookies["user_id"]}`]
  const templateVars = {user, urls: urlDatabase };
  if(user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

app.get('/urls/:shortURL', (req, res) => {
  let url = req.params.shortURL
  const user = users[`user${req.cookies["user_id"]}`]
  const templateVars = {user, shortURL: url, longURL: urlDatabase[url]};
  res.render("urls_show", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  if(longURL) {
    res.redirect(longURL);
  } else {
    res.redirect('/') //Maybe redirect to an error page
  }
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.updatedLongURL
  res.redirect('/urls')
})

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect('/urls')
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
    if(user.data.password === password){
      res.cookie("user_id", user.data.id);
      res.redirect("/urls")
    } else {
      res.status(403).send("Password does not match!")
    }
  } else {
    res.status(403).send("Error. User does not exist")
  }
})

app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
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
    password
  }
  users[`user${uid}`] = newUser;
  console.log(users)

  res.cookie("user_id", uid)
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
