const express = require('express');
var bodyParser = require('body-parser');

const app = express()
var admin = require("firebase-admin");

var serviceAccount = require("./acm-leader-board-firebase-adminsdk-rstaw-1ba74e98a7.json");

app.use(bodyParser.urlencoded({extended:true}));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://acm-leader-board.firebaseio.com"
});
var db = admin.database();

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/form.html');
})

app.get('/count', function (req, res) {
    res.sendFile(__dirname + '/count.html');
})

 app.post('/savewinner', (req, res) => {
     console.log(req.body);
     res.sendFile(__dirname + '/form.html');
    
    db.ref('student').once("value", function(snapshot) {
        if (snapshot.child(req.body.sap).exists()) {
            console.log(snapshot.val());
            var user = snapshot.child(req.body.sap).val();
            
            user.points = user.points + 10;
            console.log(user.points);
           snapshot.ref.child(req.body.sap).update({
               points: user.points
           });
          }
          else {
              db.ref('student').child(req.body.sap).set({
                  name: req.body.winner,
                  points: 10
              })
          }
    })
     res.send('save');
 });
 
app.post('/showscores', (req, res) => {
    var leader = [];
    console.log(req.body);
    var count = 10;
    if(Number(req.body.count) > 0)
        count = Number(req.body.count); 
    var ref = db.ref('student');
    ref.orderByChild("points").limitToLast(count).once("value").then(function(snapshot){
        // var jsonData = snapshot.val();
        // console.log(snapshot.val());
        // res.send(jsonData);
        snapshot.forEach(function(childSnapshot){
           console.log(childSnapshot.val());
           leader.push(childSnapshot.val());
        });
        res.send(leader);
    });
});
app.listen(3000)