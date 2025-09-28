const path = require("node:path");
const { Pool } = require("pg");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const { body, validationResult } = require('express-validator');
const bcrypt = require("bcryptjs");
require('dotenv').config();



// establish database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

const app = express();
// Set path for views
app.set("views", path.join(__dirname, "views"));
// Set path for static files 
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));
app.use('/static', express.static(path.join(__dirname, 'public')));
// Set view engine
app.set("view engine", "ejs");

// Save sessions
app.use(session({secret: "cats", resave: false, saveUninitialized: false}));
// Store auth data in sessions
app.use(passport.session());
// Handle form data
app.use(express.urlencoded({ extended: false}));


// Establish Login Strategy Logic:

// Part 1:
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
      const user = rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password" })
      }
      return done(null, user);
    } catch(err) {
      return done(err);
    }
  })
);

// Part Two:

// Session check logic

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    const user = rows[0];

    done(null, user);
  } catch(err) {
    done(err);
  }
});


// User variable middleware:

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});
// The below function can be used like a decorated, listed as a callback before (req, res) in a route

function requireLogin(req, res, next) {
  if (!req.user) {
    return res.redirect('/'); 
  }
  next();
}

// Validators

const validateUsername = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .custom(async (value) => {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [value]
      );
      if (result.rows.length > 0) {
        throw new Error('Username already exists');
      }
      return true;
    }),
];

const passwordsMatch = [
  body('password').notEmpty().withMessage('Password is required'),
  body('passwordConfirmation')
  .custom((value, {req}) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match')
    }
    return true;
  }),

];

// Views

app.get("/", async (req, res) => {
  var { rows } = await pool.query("SELECT * FROM messages ORDER BY date DESC");
  const messages = rows
  var { rows } = await pool.query(`SELECT * FROM messages ORDER BY date ASC`);
  const replies = rows
  res.render("index", { user: req.user , title: "Odin Chat", messages: messages, replies: replies});
});

app.get("/verify", requireLogin, async (req, res) => {
  const errors = {}
  res.render("verify", { user: req.user , title: "Verify Access", errors: errors });
});

app.post("/verify", requireLogin, async (req, res) => {
  const user_id = req.user.id;
  const errors = {}

  if (req.body.key !== process.env.CLUB_PASSCODE) {
     if (req.body.key !== process.env.CLUB_PASSCODE) {
        errors.key = { msg: "Incorrect passcode. Try again." };
        return res.render("verify", {
          title: "Verify Access",
          errors: errors,
          user: req.user,
        });
  }
  }

  try {
    await pool.query(
      "UPDATE users SET verified = $1 WHERE id = $2",
      [true, user_id]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).send("Something went wrong");
  }
});

app.get("/sign-up", (req, res) => res.render("sign-up-form",
  {errors: {}, // empty object so EJS doesn't crash
    data: {},
  title: "Sign Up",
user: req.user} 
));

// Add user route
app.post("/sign-up", validateUsername, passwordsMatch, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     return res.render("sign-up-form", {
      errors: errors.mapped(),
      data: req.body,
      title: "Sign Up"          
    })
  }
 try {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const admin = req.body.admin;
  await pool.query("INSERT INTO users (username, password, admin) VALUES ($1, $2, $3)", [req.body.username, hashedPassword, admin]);
  res.redirect("/");
 } catch (error) {
    console.error(error);
    next(error);
   }
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
  })
);

app.get("/post", requireLogin, (req, res) => {
  res.render("post", { user: req.user , title: "New Post", reply_id: null});
});

app.get("/post/:id", requireLogin, (req, res) => {
  const reply_id = req.params.id;
  res.render("post", { user: req.user , title: "New Reply", reply_id: reply_id});
});

app.post("/post", requireLogin, async (req, res) => {
  const username = req.user.username;
  const message = req.body.message;
  await pool.query("INSERT INTO messages (username, message) VALUES ($1, $2)", [username, message]);
  console.log(message)
  res.redirect("/");
});

app.get("/login-page", (req, res) => {
  res.render("login", { user: req.user , title: "Login" });
});

app.post("/post/:id", requireLogin, async (req, res) => {
  const reply_id = req.params.id;
  const username = req.user.username;
  const message = req.body.message;
  await pool.query("INSERT INTO messages (username, message, parent) VALUES ($1, $2, $3)", [username, message, reply_id]);
  res.redirect("/");
});


app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});


app.listen(3000, (error) => {
    if (error) {
        throw error;
    }
    console.log("app listening on port 3000")
})