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
}

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get('/urls', (req, res) => {
  const templateVars = {username: req.cookies["username"], urls: urlDatabase };
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
  res.render("urls_new");
});

app.get('/urls/:shortURL', (req, res) => {
  let url = req.params.shortURL
  const templateVars = {username: req.cookies["username"], shortURL: url, longURL: urlDatabase[url]};
  res.render("urls_show.ejs", templateVars);
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
  //console.log(urlDatabase)
  urlDatabase[req.params.shortURL] = req.body.updatedLongURL
  //console.log("Updating the long URL...")
  //console.log(urlDatabase)
  res.redirect('/urls')
})

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect('/urls')
})

app.post('/login', (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls")
})

app.post('/logout', (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls")
})

app.get('/register', (req, res) => {
  res.render("urls_register")
})

app.post('/register', (req, res) => {
  const uid = generateRandomString()
  const newUser = {
    id: uid,
    email: req.body.email,
    password: req.body.password
  }
  users[`user${uid}`] = newUser;
  console.log(users)

  res.cookie("user_id", uid)
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
