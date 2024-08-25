from flask import Flask,session,request, jsonify, render_template, redirect , url_for
import geopy
from flask import *
from geopy.distance import geodesic
from flask_pymongo import PyMongo
from pymongo import MongoClient
import json
import requests

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/EDCAttendance"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///EDCAttendance.db'
mongo = PyMongo(app)
connection = MongoClient('localhost', 5000)
# Office coordinates (latitude, longitude)
OFFICE_COORDINATES = (22.55655514113349, 88.30784298509921)  # Replace with your office's latitude and longitude
ALLOWED_RADIUS = 435  # Allowable radius in degrees (~11 km)

global_usr = None ;
global_pass = None ;



@app.route('/')
def home():

    return render_template('index.html')  # This is your main page

@app.route('/check_location', methods=['POST','GET'])
def check_location():
    data = request.json
    user_coordinates = (data['latitude'], data['longitude'])
    distance = geodesic(user_coordinates, OFFICE_COORDINATES).km

    if distance <= ALLOWED_RADIUS:
        return jsonify({'status': 'Access granted'})
    else:
        return jsonify({'status': 'Access denied'})

@app.route('/notinedc' , methods=['POST','GET'])
def notinedc():

    return render_template('notinedc.html')

@app.route('/turnonlocation' , methods=['POST','GET'])
def turnonlocation():
    return render_template('turnOnLocation.html')

@app.route('/refresh' , methods=['POST','GET'])
def refresh():
    return render_template('refresh.html')

@app.route('/signup' , methods=['POST','GET'])
def signup():
    return render_template('signup.html')
@app.route('/login' , methods=['POST','GET'])
def login():
    return render_template('login.html')
@app.route('/redirect' , methods=['POST','GET'])

@app.route('/signupaction' , methods=['POST','GET'])
def signupaction():
    username = request.form['signupemail']
    password = request.form['signuppass']
    confirm_password = request.form['confirmpass']
    global global_usr
    global global_pass
    global_usr = username
    global_pass = password
    data = {
        'Username': username,
        'Password': password,
    }

    if password == confirm_password:
        for x in mongo.db.StudentsInfo.find({},{"Username":1}):
            if(username == x['Username']):
                return render_template("UserAlreadyExists.html")
        mongo.db.StudentsInfo.insert_one(data)
        return render_template("Attendance.html")
    else:

        return render_template('login.html')

@app.route('/loginaction' , methods=['POST','GET'])
def loginaction():
    username = request.form['loginemail']
    password = request.form['loginpass']
    global global_usr
    global global_pass
    global_usr = username
    global_pass = password
    for x in mongo.db.StudentsInfo.find({},{"Username":1 , "Password":1}):
        if(username == x['Username']):
            if(password == x['Password']):
                return render_template("attendance.html")
            else :
                return "Incorrect Password"

        else:
            continue

    return render_template('UsernotFound.html')

@app.route('/usercheck', methods=['POST','GET'])
def usercheck():
    checkUser = request.form['usercheck']


    if(checkUser != global_usr):
        return "Wrong Username"
    else:
        return  render_template("markAttendance.html" , myvalue = checkUser)


if __name__ == '__main__':
    app.run(debug=True)
