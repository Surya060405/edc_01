const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const geolib = require('geolib');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/EDCAttendance', { useNewUrlParser: true, useUnifiedTopology: true });

const studentSchema = new mongoose.Schema({
    Username: String,
    Password: String,
});

const Student = mongoose.model('Student', studentSchema);

// Office coordinates (latitude, longitude)
const OFFICE_COORDINATES = { latitude: 22.55655514113349, longitude: 88.30784298509921 };
const ALLOWED_RADIUS = 1100; // Allowable radius in meters (~11 km)

let global_usr = null;
let global_pass = null;

// Set the directory for the static assets (e.g., CSS, JS, images)
app.use(express.static(path.join(__dirname, 'static')));

// Set the views directory and view engine
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'templates'));

// Routes
app.get('/', (req, res) => {
    res.render('index.html');
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
    res.render('turnOnLocation.html');
});

app.get('/refresh', (req, res) => {
    res.render('refresh.html');
});

app.get('/signup', (req, res) => {
    res.render('signup.html');
});

app.get('/login', (req, res) => {
    res.render('login.html');
});

app.post('/signupaction', async (req, res) => {
    const { signupemail, signuppass, confirmpass } = req.body;
    global_usr = signupemail;
    global_pass = signuppass;

    if (signuppass === confirmpass) {
        const existingUser = await Student.findOne({ Username: signupemail });
        if (existingUser) {
            return res.render('UserAlreadyExists.html');
        }

        const newStudent = new Student({ Username: signupemail, Password: signuppass });
        await newStudent.save();
        res.render('attendance.html', { myvalue : checkUser });
    } else {
        res.render('login.html');
    }
});

app.post('/loginaction', async (req, res) => {
    const { loginemail, loginpass } = req.body;
    global_usr = loginemail;
    global_pass = loginpass;

    const user = await Student.findOne({ Username: loginemail });

    if (user) {
        if (user.Password === loginpass) {
            res.render('attendance.html', { myvalue: global_usr });
        } else {
            res.send('Incorrect Password');
        }
    } else {
        res.render('UsernotFound.html');
    }
});

app.post('/usercheck', (req, res) => {
    const checkUser = req.body.usercheck;

    if (checkUser !== global_usr) {
        res.send('Wrong Username');
    } else {
        res.render('markAttendance.html', { myvalue: global_usr });
    }
});

app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
