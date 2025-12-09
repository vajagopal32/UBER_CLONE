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

module.exports = router;
