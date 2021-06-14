const express = require('express');
const session = require('express-session');
const crypto = require('crypto-js');

const html = (title, bodyElements) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | Nura Programmer</title>
        <!--  CSS  -->
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
        <!--  jquery  -->
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <!--  javascript  -->
        <script src="https://maxcdn.bootstrap.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
        <!-- [if lt IE 9]>
        <script src="http://html5shiv.google.com/svn/trunk/html5.js" charset="utf-8"></script>
      <! [endif] -->
    </head>
    <body>
      <div class="container d-flex align-content-center justify-content-center flex-column">
          ${bodyElements}
      </div>
    </body>
    </html>
`;

const users = [
  {
    _id: 1,
    name: 'sololearn',
    email: 'sololearn@gmail.com',
    password: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  },
  {
    _id: 2,
    name: 'nura programmer',
    email: 'nurapro@gmail.com',
    password: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  },
  {
    _id: 3,
    name: 'your name',
    email: 'yourname@gmail.com',
    password: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  }
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
  PORT = 5670,
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

app.get('/bootstrap.min.css', (req, res) =>
  res.download('./data/bootstrap.min.css')
);

app.get('/jquery-3.3.1.js', (req, res) =>
  res.download('/data/jquery-3.3.1.js')
);

app.get('/bootstrap.min.js', (req, res) =>
  res.download('/data/bootstrap.min.js')
);

app.get('/', (req, res) => {
  const { token } = req.session;

  const body = `
    <h1 class="text-center m-5">Welcome</h1>
    ${
      token
        ? `
        <div class="row justify-content-around">
          <a href="/dashboard" class="btn btn-outline-success">Dashboard</a>
          <form method="POST" action="/logout" onsubmit="alert('Logout successful')">
              <button class="btn btn-outline-danger">Logout</button>
          </form>
        </div>
        `
        : `
        <div class="row justify-content-around">
        <a href="/login" class="btn btn-primary col-5">Login</a>
        <a href="/register" class="btn btn-success col-5">Register</a>
        </div>
        `
    }`;

  res.send(html('Home', body));
});

app.get('/dashboard', redirectLogin, (req, res) => {
  const user = users.find(user => user._id === req.session.token);

  const body = `
    <h1 class="text-center mt-5 mb-3">Dashboard</h1>
    <div class="row justify-content-around m-4">
      <a href="/" class="btn btn-outline-success">Home</a>
      <form method="POST" action="/logout" onsubmit="alert('Logout successful')">
          <button class="btn btn-outline-danger">Logout</button>
      </form>
    </div>
    <ul class="list-group">
        <li class="list-group-item">Name: ${user.name}</li>
        <li class="list-group-item">Email: ${user.email}</li>
    </ul>
    `;

  res.send(html('Dashboard', body));
});

app.get('/login', redirectHome, (req, res) => {
  const body = `
    <h1>Login</h1>
    <form method="post" action="/login">
        <div class="form-group align-content-around">
        <input type="email" class="form-control m-2" name="email" placeholder="Email" required />
        <input type="password" class="form-control m-2" name="password" placeholder="Password" required />
        <input type="submit" value="Login" class="form-control btn btn-primary m-2" />
        </div>
    </form>
    <a href="/register" class="btn btn-link">Register</a>
    `;

  res.send(html('Login', body));
});

app.get('/register', redirectHome, (req, res) => {
  const body = `
    <h1>Register</h1>
    <form method="post" action="/register">
        <div class="form-group">
          <input name="name" class="form-control m-2" placeholder="Name" required />
        <input type="email" class="form-control m-2" name="email" placeholder="Email" required />
        <input type="password" class="form-control m-2" name="password" placeholder="Password" required />
        <input type="submit" value="Register" class="form-control m-2 btn btn-primary" />
        </div>
    </form>
    <a href="/login" class="btn btn-link">Login</a>
    `;

  res.send(html('Register', body));
});

app.post('/register', redirectHome, (req, res) => {
  const { name, email, password } = req.body;

  if (name && email && password) {
    const userExist = users.some(user => user.email === email);

    if (!userExist) {
      const passwordHash = crypto.SHA256(password).toString();

      const user = {
        _id: users.length + 1,
        name,
        email,
        password: passwordHash
      };

      users.push(user);

      req.session.token = user._id;

      return res.redirect('/dashboard');
    }
  }

  res.redirect('/register');
});

app.post('/login', redirectHome, (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    const passwordHash = crypto.SHA256(password).toString();

    const user = users.find(
      user => user.email === email && user.password === passwordHash
    );

    if (user) {
      req.session.token = user._id;
      return res.redirect('/dashboard');
    }
  }

  res.redirect('/login');
});

app.post('/logout', redirectLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) return res.redirect('/home');

    res.clearCookie(SESS_NAME);
    res.redirect('/login');
  });
});

app.listen(PORT, () => console.log(`server running on Port: ${PORT}`));
