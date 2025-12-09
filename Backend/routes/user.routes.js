const express = require('express');
const router = express.Router();
const { body } = require("express-validator");
const userController = require('../controllers/user.controller');

router.post('/register', [
    body('email').isEmail().withMessage('Invelid Email'),
    body('fullname.firstname').isLength({ min: 3 }).withMessage(
        'First name must be at least 3 charecters long'
    ),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 charecters long')
],
    userController.registerUser
);

router.post('/login',[
    body('email').isEmail().withMessage('Invaalid Email'),
    body('password').isLength({min:6}).withMessage("password 6 length")
],
    userController.loginUser
)

module.exports = router;
