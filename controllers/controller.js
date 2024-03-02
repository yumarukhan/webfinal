
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const PortfolioItem = require('../models/portfolioItemModel');
const path = require('path');

const fs = require('fs');




exports.register = catchAsync(async (req, res, next) => {
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] });

    if (existingUser) {
        return res.status(400).json({
            status: 'fail',
            message: 'Username or email already exists. Please choose a different one.'
        });
    }

    // If username and email are unique, proceed with creating the user
    const newUser = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: 'user',
        country: req.body.country,
        city: req.body.city,
        age: req.body.age,
        language: req.body.language
    });


if (newUser) {
    req.session.user = newUser;

}
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.DEV_EMAIL,
            pass: process.env.DEV_EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.DEV_EMAIL,
        to: newUser.email,
        subject: 'Welcome!',
        text: `Hello ${req.session.user.username}, from now you have access to my portfolio!`
    };
    transporter.sendMail(mailOptions);

    res.redirect('/home');

});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password'));
    }
    if (user) {
       /* req.session.user = { id: user._id, username: user.username, language: user.language};
*/
        req.session.user = user;
        console.log(req.session.user);
    }
    res.redirect('/home'); // Or any other target route after login
});



exports.addPortfolioItem = catchAsync(async (req, res, next) => {
    const images =  req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const newPortfolioItem = await PortfolioItem.create({
        titleenglish: req.body.titleenglish,
        titlerussian: req.body.titlerussian,
        descriptionenglish: req.body.descriptionenglish,
        descriptionrussian: req.body.descriptionrussian,
        images: images,
        lastModifyed: Date.now()
    });

    res.redirect('/dashboard');
});

exports.getAllPortfolioItems = catchAsync(async (req, res, next) => {
    const portfolioItems = await PortfolioItem.find();

    res.locals.data = { // Store data in res.locals
        portfolioItems
    };
    console.log(res.locals.data);
    next();
});

exports.editPortfolioItem = catchAsync(async (req, res, next) => {
    const postid = req.body.editid;

    const editedPost = {};

    if (req.body.titleenglish) {
        editedPost.titleenglish = req.body.titleenglish;
    }
    if (req.body.titlerussian) {
        editedPost.titlerussian = req.body.titlerussian;
    }
    if (req.body.descriptionenglish) {
        editedPost.descriptionenglish = req.body.descriptionenglish;
    }
    if (req.body.descriptionrussian) {
        editedPost.descriptionrussian = req.body.descriptionrussian;
    }
    if (req.files) {
        editedPost.images = req.files.map(file => `/uploads/${file.filename}`);
    }
    const updatedItem = await PortfolioItem.findByIdAndUpdate(postid, editedPost, {
        new: true, // Return the updated document
        runValidators: true // Run validators on the updated data
    });
    if (!updatedItem) {
        return next(new AppError('No portfolio item found with that ID', 404));
    }
    res.redirect('/dashboard');

});

exports.deletePortfolioItem = catchAsync(async (req, res, next) => {
    const deletedPost = await PortfolioItem.findByIdAndDelete(req.body.id);

    deletedPost.images.forEach(image => {
        const imagePath = path.join(__dirname, '../', image);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error(`Error deleting image: ${err}`);

            }
        });
    });
    res.redirect('/dashboard');
});