const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const geolib = require('geolib');

const app = express();


const MONGO_URI = 'mongodb+srv://surya:Surya3949S@edcattend.0kysi.mongodb.net/?retryWrites=true&w=majority&appName=EDCattend';
let db, userCollection;

// MongoDB connection
MongoClient.connect(MONGO_URI)
    .then(client => {
        db = client.db('EDC_Attendance');
        userCollection = db.collection('Students_Info');
    })
    .catch(error => console.error(error));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));


// Office coordinates (latitude, longitude)
const OFFICE_COORDINATES = { latitude: 22.55575821042349, longitude: 88.30909607413325 };
const ALLOWED_RADIUS = 50; // Allowable radius in meters (~11 km)

let globalUsr = null;
let globalPass = null;

app.get('/', (req, res) => {
    res.render('login');  // This is your main page
});

app.post('/check_location', (req, res) => {
    const userCoordinates = {
        latitude: req.body.latitude,
        longitude: req.body.longitude
    };
    const distance = geolib.getDistance(userCoordinates, OFFICE_COORDINATES);

    if (distance <= ALLOWED_RADIUS) {
        res.json({ status: 'Access granted' });
    } else {
        res.json({ status: 'Access denied' });
    }
});

app.get('/notinedc', (req, res) => {
    res.render('notInEDC.html');
});

app.get('/turnonlocation', (req, res) => {
    res.render('turnOnLocation');
});

app.get('/refresh', (req, res) => {
    res.render('refresh');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/signupaction', (req, res) => {
    const username = req.body.signupemail;
    const password = req.body.signuppass;
    const confirmPassword = req.body.confirmpass;

    globalUsr = username;
    globalPass = password;

    const data = {
        Username: username,
        Password: password
    };

    if (password === confirmPassword) {
        userCollection.findOne({ Username: username })
            .then(user => {
                if (user) {
                    res.render('UserAlreadyExists.html');
                } else {
                    userCollection.insertOne(data);
                    res.render('attendance.html' , { myvalue: username });
                }
            })
            .catch(error => console.error(error));
    } else {
        res.send('<script>alert("Passwords do not match. Please try again."); window.location.href = "/signup";</script>');
    }
});

app.post('/loginaction', (req, res) => {
    const username = req.body.loginemail;
    const password = req.body.loginpass;

    globalUsr = username;
    globalPass = password;

    userCollection.findOne({ Username: username })
        .then(user => {
            if (user && user.Password === password) {
                res.render('attendance.html' , { myvalue: username });
            } else if (user) {
                res.send('<script>alert("Incorrect Password"); window.location.href = "/login";</script>');
            } else {
                res.render('UsernotFound.html');
            }
        })
        .catch(error => console.error(error));
});


app.listen(5005, () => {
    console.log(`Server is running on http://127.0.0.1:5005`);
});

