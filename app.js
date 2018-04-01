require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const mysql = require('mysql');
const app = express();

const db = mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

//make connection with MYSQL database
db.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + db.threadId);
});

//get all posts && checks if you are authorized with JWT
app.get('/api/posts', verifyToken, (req, res) => {
    console.log('test');
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) res.json({ status:403,message:'JWT token is not valid' });
       
        let sql = `SELECT * FROM posts`;
        db.query(sql, (err, posts) => {
            if(err) return res.json({status:404,message: 'no posts found'});
            res.json({
                data: posts, 
                authData: authData
            })
        });
    })
})

//Gives back a JWT token if login process was valid
app.post('/api/login', (req, res) => {
    //check if email & password are set in the body
    if (typeof req.body.email !== 'undefined' && typeof req.body.password !== 'undefined') {
        //build up query
        let sql = `SELECT * FROM users WHERE email='${req.body.email}'`;
        db.query(sql, (err, user) => {
                if (user.length === 0 && err === null) return res.json({message: 'User does not exist', status: 403})
                //check if passwords match
                bcrypt.compare(req.body.password, user[0].password, function(err, pwCheck) {
                    if(pwCheck) {
                        jwt.sign({user}, 'secretkey', {expiresIn: '10h'}, (err, token) => {
                            return res.json({user: user, message: token})
                        });
                    } else {
                        return res.json({message: 'Wrong credentials', status: 403})
                    }             
                });
        });
    } else {
        return res.json({message: 'email & password need to be set in the body', status: 400})
    }
})

//create new useraccount, store password as hash in DB
app.post('/api/signup', (req, res) => {
    //check if email & password are set in the body
    if (typeof req.body.email !== 'undefined' && typeof req.body.password !== 'undefined') {
        // Store hash in your password DB.
        let sql = `SELECT * FROM users WHERE email='${req.body.email}'`;
        db.query(sql, (err, user) => {
            console.log(user);
            if (user.length > 0 && err === null) return res.json({message: 'User already exists', status: 403})
            //hash the password
            bcrypt.genSalt(saltRounds, function (err, salt) {
                bcrypt.hash(req.body.password, salt, function (err, hash) {
                        //check if user already exists!!! Store hash in your password DB.
                        let sql = `INSERT INTO users (email,password) VALUES('${req.body.email}','${hash}')`;
                        db.query(sql, (err, user) => {
                            if (err) return res.json({message: 'Something went wrong while signing up', status: 403})
                            res.json({message: 'User was succesfully added', status: 200})
                        });
                    });
            });
        });
    } else {
        res.json({message: 'email & password need to be set in the body', status: 400})
    }
})

function verifyToken(req, res, next) {
    //get auth header value
    const bearerHeader = req.headers['authorization'];
    //check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        //split at space
        //FORMAT OF TOKEN authorization: Bearer <access_token>
        const bearerToken = bearerHeader.split(' ')[1];
        //set token
        req.token = bearerToken;
        //next middleware
        next();
    } else {
        //forbidden
        res.sendStatus(403);
    }

}

//startup server on port 5000
app.listen(process.env.API_PORT, () => console.log(`server listening on port ${process.env.API_PORT}`))