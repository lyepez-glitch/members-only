require('dotenv').config();
const express = require('express');
const app = express();
const async = require('async');
const await = require('await');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const sessionStore = new MongoStore({ mongooseConnection: mongoose.connection });
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var User = require('./model.js').User;
var Message = require('./model.js').Message;
const { body, check, validationResult } = require('express-validator');
app.use(session({ secret: "cats", store: MongoStore.create({ mongoUrl: process.env.MONGOLAB_URI }), resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
passport.use(
    new LocalStrategy((username, password, done) => {
        User.findOne({ username: username }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }
            bcrypt.compare(password, user.password, (err, res) => {
                    if (res) {
                        // passwords match! log user in
                        return done(null, user)
                    } else {
                        // passwords do not match!
                        return done(null, false, { message: "Incorrect password" })
                    }
                })
                //return done(null, user);
        });
    })
);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

app.get('/home', function(req, res) {
    res.render('home');
});

app.get('/signup', function(req, res) {
    res.render('signup');
});


app.post('/signup', check('password').exists(), /*body('email').isEmail().normalizeEmail(),*/
    body('username').not().isEmpty().trim().escape(),
    body('notifyOnReply').toBoolean(), body('password').isLength({ min: 5 }), body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }

        // Indicates the success of this synchronous custom validator
        return true;
    }),
    (req, res) => {
        // Handle the request
        var err = validationResult(req);
        if (!err.isEmpty()) {
            console.log(err.mapped())
                // you stop here
        } else {
            // you pass req and res on to your controller
            const { username, password, isAdmin } = req.body;

            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) return done(err)
                const user = new User({
                    username: username,
                    password: hashedPassword,
                    membershipStatus: 'none',
                    isAdmin: isAdmin
                }).save(err => {
                    if (err) {
                        return next(err);
                    }
                    console.log('successfully saved');
                    res.redirect("/login");
                });
            });
        }
    })




app.get('/join-club', (req, res) => {
    res.render('join-club');
})

app.get('/delete', (req, res) => {
    User.deleteMany({ age: {} }).then(function() {
        console.log("Data deleted"); // Success
        res.redirect('/dashboard');
    }).catch(function(error) {
        console.log(error); // Failure
    });
})


app.get('/dashboard', (req, res) => {
    const { username } = req.user;

    let isAdmin = req.user.isAdmin || "";

    User.find({}, (error, users) => {
            if (error) return done(error);


            User.findOne({ username }, function(error, user) {
                let status = user.membershipStatus;

                res.render('dashboard', { users: users, username: user.username, status: status, isAdmin: isAdmin });
            })


        })
        // Message.find({}, (error, messages) => {
        //     if (error) {
        //         console.error(error);
        //     } else {
        //         // console.log(messages);
        //         // let messages = {};
        //         // for (var i = 0; i < users.length; i++) {
        //         //     messages[users[i]] = [];
        //         //     if (users[i].messages.length > 0) {
        //         //         messages[users[i]].push(users[i].messages);
        //         //     }
        //         // }
        //         console.log(req.session.username)
        //         User.findOne({ username: req.session.username }, (error, user) => {
        //             console.log('here is user', user)
        //             console.log('these are the messages', messages)
        //             res.render('dashboard', { username: req.session.username, messages: messages, membershipStatus: user.membershipStatus });
        //         })

    //     }

    // });

})



app.post('/delete/:id', async function(req, res) {

    //let userid = new mongoose.Types.ObjectId(req.params.id);
    //userid = userid.substring(1, userid.length - 1);
    const message = await Message.find({ _id: req.params.id });
    const author = message.author;
    const deleted_message = await Message.deleteOne({ _id: req.params.id });
    console.log("deleted message", deleted_message);
    // console.log("message", message);
    // console.log("author", message[0].author);
    const user = await User.find({ username: message[0].author });
    // console.log("user", user);
    let found_user = user[0];
    for (var i = 0; i < found_user.messages.length; i++) {

        let message = found_user.messages[i];
        if (message._id = req.params.id) {
            console.log(true, 'user message', message);
            found_user.messages.splice(i, 1);
        }

    }
    await found_user.save();
    res.redirect('/dashboard');


    // console.log("message", author);
    // const deletedMessage = await Message.deleteOne({ _id: req.params.id });
    // console.log(deletedMessage);
    // const user = await User.find({ username: author });
    // console.log("user", user)

    // res.redirect('/dashboard');

});

app.post('/join-club', async(req, res, done) => {
    if (req.body.secret === 'secret') {
        let doc = await User.findOneAndUpdate({ username: req.body.username }, { membershipStatus: "Updated" });
        // await doc.save().then((err, success) => {
        //     if (err) return done(err);
        //     res.redirect('/home');
        // });
        res.redirect('/home');
    } else {
        res.redirect('/join-club');
    }

    //find the user in db
    // check for secret in body
    //if secret add membership status

})

app.get('/createMessage', function(req, res) {
    res.render('createMessage');
});

app.post('/createMessage', function(req, res) {
    console.log('here', req.session.username)
    const { title, text } = req.body;
    //   User.findOne({ username: username }, (err, user) => {
    //     or
    // });
    const message = new Message({
        title: title,
        timestamp: Date.now(),
        text: text,
        author: req.session.username
    }).save((err, message) => {
        if (err) {
            return next(err);
        }
        User.findOne({ username: req.session.username }, (error, user) => {
            user.messages.push(message)
            user.save();
        })
        console.log('successfully saved');
        res.redirect("/dashboard");
    });

});

app.get('/login', function(req, res) {
    res.render('login');
});



app.post("/login", passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login"
}));



app.get('/profile', (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    req.session.username = req.user.username; // store the username in the session

    res.redirect('dashboard');
});

app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error(error);
        } else {
            res.redirect('/home');
        }
    });
});


app.listen(process.env.PORT || 3000);