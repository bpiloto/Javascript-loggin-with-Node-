if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mongoose = require("mongoose")

//connection to db
mongoose.set("useFindAndModify", false);
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, 
  () => {

  console.log("Connected to db!"); 

});

//models
const TodoTask = require("./models/TodoTask");

//för att använda passport lokalt 
const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

// Alla användare lagras lokalt i denna const... ingen db
const users = []

//Tell we are using ejs
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: true }))

// flash skriver meddelar om man till ex. har skrivit fel lösenordet, etc. 
app.use(flash())

//SESSION för att lagras användare info
app.use(session({
  secret: process.env.TOP_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.use((req,res,next) => {
  console.log(req.method, " ", req.path)
  next()
})

app.use(express.static('public'))

// Routers Get method
/* app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name })
}) */

app.get('/login', (req, res) => {
  res.render('login.ejs')
})

//Använda passport för login
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

// hashed password 🗝
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  }
  catch {
    res.redirect('/register')
  }
  //arrayn blir tom varje gång man gör ändringar, för att det finns ingen databas 
  console.log(users); 
})

//behövs vara inloggad för att kunna se index, redirects till /login sidan med method-override
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

//visa inte errors om man är utloggad
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

// Create a task and add to db
app.post('/',async (req, res) => {
  const todoTask = new TodoTask({
    content: req.body.content
  });
  try {
    await todoTask.save();
    res.redirect("/");
  } catch (err) {
    res.redirect("/");
  }
});

// Read from db
app.get('/', checkAuthenticated, (req, res) => {
  TodoTask.find({}, (err, tasks) => {
    res.render("index.ejs", { name: req.user.name, todoTasks: tasks });
  });
});

// Update - hämtas ej css :( 
app
.route("/edit/:id")
.get((req, res) => {
  const id = req.params.id;
  TodoTask.find({}, (err, tasks) => {
  res.render("todoEdit.ejs", {todoTasks: tasks, idTask: id });
  });
})
.post((req, res) => {
  const id = req.params.id;
  TodoTask.findByIdAndUpdate(id, { content: req.body.content }, err => {
    if (err) return res.send(500, err);
    res.redirect("/");
  });
});

// Delete 
app.route("/remove/:id").get((req, res) => {
  const id = req.params.id;
  TodoTask.findByIdAndRemove(id, err => {
    if (err) return res.send(500, err);
    res.redirect("/");
  });
}); 

app.listen(1153, () => console.log("Server started on port 1153"))

