const { validationResult } = require('express-validator');

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/user');

// using "sendgrid.com" as mailing service
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: 'API_KEY'
  }
}));


exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: req.flash('error'),
    oldInput: {email: "", password: ""},
    validationErrors: []
  });
};


exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: req.flash('error'),
    oldInput: {email: "", password: "", passwordConfirm: ""},
    validationErrors: []
  });
};


exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422)
      .render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: errors.array()[0].msg,
        oldInput: { email: email, password: password },
        validationErrors: errors.array()
      });
  }

  User.findOne({ email: email })
  .then(user => {
    if (!user) {
      return res.status(422)
      .render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: errors.array()[0].msg,
        oldInput: { email: email, password: password },
        validationErrors: errors.array()
      });
    }
    bcrypt.compare(password, user.password)
    .then(passwordsMatch => {
      if (passwordsMatch) {
        req.session.isLoggedIn = true;
        req.session.user = user;

        return req.session.save((err) => {
        console.log(err);
        res.redirect('/');
      })
    }
    req.flash('error', 'User credentials do not match!');
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
    })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array())
    return res.status(422)
      .render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: errors.array()[0].msg,

        oldInput: { email: email, password: password, confirmPassword: req.body.confirmPassword },
        validationErrors: errors.array()
      });
  }

  bcrypt.hash(password, 12)
    .then(hashedPassword => {
    const user = new User({
      email: email,
      password: hashedPassword,
      cart: { items: [] }
    });
    return user.save();
  })
  .then(result => {
    res.redirect('/login');
    return transporter.sendMail({
      to: email,
      from: 'berkay.nyc@gmail.com',
      subject: 'signup succeeded!',
      html: '<h1>You successfully signed up!</h1>'
    });
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};


exports.postLogout  = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  });
};


exports.getReset = (req, res, next) => {
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: req.flash('error')
  })
};


exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }

    const token = buffer.toString('hex');

    User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        req.flash('error', 'No account with that email found!');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
      transporter.sendMail({
        to: req.body.email,
        from: 'berkay.nyc@gmail.com',
        subject: 'Password Reset',
        html: `
          <p>You requested a password reset!</p>
          <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
        `
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  });
};


exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({ resetToken: token, resetTokenExpiration: {$gt: Date.now()} }) 
  .then(user => {
    if (!user) {
      alert("Couldn't change the password!");
    }
    res.render('auth/newPassword', {
    path: '/new-password',
    pageTitle: 'New Password',
    errorMessage: req.flash('error'),
    userId: user._id.toString(),
    passwordToken: token
  });
  })
  .catch(err => {
    console.log(err);
  })
};


exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({ resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId })
  .then(user => {
    resetUser = user;
    return bcrypt.hash(newPassword, 12);
  })
  .then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
  })
  .then(result => {
    res.redirect('/login');
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};