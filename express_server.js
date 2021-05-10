const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const PORT = 8080;

app.set('view engine', "ejs");

function generateRandomString() {
  let chars = "0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
  let randomStr = "";
  while (randomStr.length < 6){
    let randChar = chars[Math.floor(Math.random() * chars.length)]
    randomStr += randChar;
  }
  return randomStr;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const short = generateRandomString();
  urlDatabase[short] = req.body.longURL
  console.log(req.body);
  console.log("Adding url to DB...")
  console.log(urlDatabase)
  res.redirect(`/urls/${short}`)       
});

app.get('/urls/:shortURL', (req, res) => {
  let url = req.params.shortURL
  const templateVars = { shortURL: url, longURL: urlDatabase[url]};
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
