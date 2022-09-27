const express = require('express');
const router = express.Router();
const { getLogin, postLogin, postLogout, getSignup, postSignup, getReset, postReset, getNewPassword, postNewPassword } = require('../controllers/auth');
const User = require('../models/user');

const { check, body } = require('express-validator');


router.get('/login', getLogin);

router.get('/signup', getSignup);

router.post(
    '/login',
    [
        check('email').isEmail()
            .withMessage('Please enter a valid E-Mail!')
            .normalizeEmail()
            .custom((value, {req}) => {
                return User.findOne({ email: value })
                .then(userDoc => {
                    if (!userDoc) {
                        return Promise.reject("This E-Mail doesn't exist. Please sign up first!");
                    }
                })
            }),
        check('password').isLength({min: 5, max: 15})
            .withMessage('The password you have entered is not valid.')
            .trim()
    ],
    postLogin);


router.post(
'/signup',
[
    check('email').isEmail()
        .withMessage('Please enter a valid E-Mail!')
        .normalizeEmail() 
        .custom((value, {req}) => {

            return User.findOne({ email: value })
            .then(userDoc => {
                if (userDoc) {
                    return Promise.reject('This E-Mail already exists!');
                }
            });
        }),
            
    body('password', 'Please enter a password with only numbers and text and at least 5 characters!')
        .isLength({ min: 5, max: 15 })
        .isAlphanumeric()
        .trim(),                                  

    body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match!')
            }
                return true;
        })
],
postSignup);


router.post('/logout', postLogout);

router.get('/reset', getReset);

router.post('/reset', postReset);

router.get('/reset/:token', getNewPassword);

router.post('/new-password', postNewPassword);

module.exports = router;