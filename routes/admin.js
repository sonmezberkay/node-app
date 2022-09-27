const { body } = require('express-validator');

const path = require('path');
const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth.js');

const router = express.Router();


router.get('/add-product', isAuth, adminController.getAddProduct);


router.get('/products', isAuth, adminController.getProducts);


router.post(
    '/add-product',
    [
        body('title')
        .isString()
        .isLength({min: 3})
        .trim()
        .withMessage('Invalid URL. Please enter a valid URL!'),
        body('price')
        .isFloat()
        .withMessage('Invalid price!'),
        body('description')
        .isLength({min: 5, max: 400})
        .trim()
        .withMessage('Please enter a description longer than 5 characters!')
    ],
    isAuth,
    adminController.postAddProduct
);


router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);


router.post(
    '/edit-product',
    [
        body('title')
        .isString()
        .isLength({min: 3})
        .trim()
        .withMessage('Invalid URL. Please enter a valid URL!'),
        body('price')
        .isFloat()
        .withMessage('Invalid price!'),
        body('description')
        .isLength({min: 5, max: 400})
        .trim()
        .withMessage('Please enter a description longer than 5 characters!')
    ],
    isAuth,
    adminController.postEditProduct
);


router.post('/delete-product', isAuth, adminController.postDeleteProduct);


module.exports = router;
