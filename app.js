const express = require('express');
const session = require('express-session');
const cors = require('cors');

const html = (title, bodyElement)`
  <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | Nura Programmer</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" 
        integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
        <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" 
        crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" 
        integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"
        integrity="sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI" crossorigin="anonymous"></script>
        <!-- [if lt IE 9]>
        <script src="http://html5shiv.google.com/svn/trunk/html5.js" charset="utf-8"></script>
      <! [endif] -->
    </head>
    <body>
        ${bodyElements}
    </body>
    </html>
`;

const users = [
  {
    _id: 1,
    name: 'sololearn',
    email: 'sololearn@gmail.com',
    password: '12345'
  },
  {
    _id: 2,
    name: 'nura programmer',
    email: 'nuraprogrammer@gmail.com',
    password: '12345'
  },
  { _id: 1, name: 'your name', email: 'yourname@gmail.com', password: '12345' }
];

const redirectLogin = (req, res, next) => {
  if (!req.session.token) return res.redirect('/login');
  next();
};

const redirectHome = (req, res, next) => {
  if (req.session.token) return res.redirect('/home');
  next();
};

const TEN_MINS = 1000 * 60 * 10;

const {
  NODE_ENV = 'development',

  SESS_NAME = 'sid',
  SESS_SECRET = 'yourSemetricKeyOrAnyRandomStringOrSentence',
  SESS_LIFETIME = TEN_MINS
} = process.env;

const IN_PROD = NODE_ENV === 'production';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
      maxAge: SESS_LIFETIME,
      sameSite: true,
      secure: IN_PROD
    }
  })
);

app.get('/', (req, res) => {
  console.log('GET:home', req.body);
  const { token } = req.session;

  const body = `
    <h1>Welcome</h1>
    ${
      token
        ? `
        <a href="/dashboard">Dashboard</a>
        <form method="POST" action="/logout">
            <button>Logout</button>
        </form>
        `
        : `
        <a href="/login">Login</a>
        <a href="/register">Register</a>
        `
    }`;

  res.send(html('Home', body));
});

app.get('/dashboard', redirectLogin, (req, res) => {
  console.log('GET:dashboard', req.body);
  const user = users.find(user => user._id === req.session.token);

  const body = `
    <h1>Dashboard</h1>
    <a href="/">Home</a>
    <ul>
        <li>Name: ${user.name}</li>
        <li>Email: ${user.email}</li>
    </ul>
    `;

  res.send(html('Dashboard', body));
});

app.get('/login', redirectHome, (req, res) => {
  console.log('GET:login', req.body);
  const body = `
    <h1>Login</h1>
    <form method="post" action="/login">
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <input type="submit"/>
    </form>
    <a href="/register">Register</a>
    `;

  res.send(html('Login', body));
});

app.get('/register', redirectHome, (req, res) => {
  console.log('GET:register', req.body);
  const body = `
    <h1>Register</h1>
    <form method="post" action="/register">
        <input name="name" placeholder="Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <input type="submit"/>
    </form>
    <a href="/login">Login</a>
    `;

  res.send(html('Register', body));
});

app.post('/register', redirectHome, (req, res) => {
  console.log('POST:register', req.body);
  const { name, email, password } = req.body;

  if (name && email && password) {
    const userExist = users.some(user => user.email === email);

    if (!userExist) {
      const user = { _id: users.length + 1, name, email, password };

      users.push(user);

      req.session.token = user._id;

      return res.redirect('/dashboard');
    }
  }

  res.redirect('/register');
});

app.post('/login', redirectHome, (req, res) => {
  console.log('POST:login', req.body);
  const { email, password } = req.body;

  if (email && email) {
    const user = users.find(
      user => user.email === email && user.password === password
    );

    if (user) {
      req.session.token = user._id;
      return res.redirect('/dashboard');
    }
  }

  res.redirect('/login');
});

app.post('/logout', redirectLogin, (req, res) => {
  console.log('POST:ogout', req.body);
  req.session.destroy(err => {
    if (err) return res.redirect('/home');

    res.clearCookie(SESS_NAME);
    res.redirect('/login');
  });
});

module.exports = app;
