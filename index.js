const express = require("express");
var bodyParser = require("body-parser");

const app = express();

app.use('/static', express.static('static'));

var admin = require("firebase-admin");

var serviceAccount = require("./acm-leader-board-firebase-adminsdk-rstaw-1ba74e98a7.json");

makeid = length => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

app.use(bodyParser.urlencoded({ extended: true }));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://acm-leader-board.firebaseio.com"
});
var db = admin.database();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/form.html");
});

app.get("/leaderboard", (req, res) => {
  res.sendFile(__dirname + "/leaderboard.html");
});

app.get("/count", (req, res) => {
  res.sendFile(__dirname + "/count.html");
});

app.post("/", (req, res) => {
  var refCode;

  db.ref("student")
    .once("value", snapshot => {
      if (snapshot.child(req.body.sap).exists()) {
        var user = snapshot.child(req.body.sap).val();
        user.points = user.points + 10;
        snapshot.ref.child(req.body.sap).update({
          points: user.points
        });
      } else {
        refCode = req.body.sap + "#" + makeid(5);
        snapshot.ref.child(req.body.sap).set({
          name: req.body.winner,
          points: 10,
          refCode: refCode
        });
      }
    })
    .then(() => {
      db.ref("student")
        .orderByChild("refCode")
        .equalTo(req.body.referral)
        .once("value")
        .then(snapshot => {
          var key = req.body.referral;
          var sapKey = key.split("#");

          if (req.body.sap === sapKey[0]) {
            console.log('ref code exist');
          }
          else{
            const user = snapshot.child(sapKey[0]).val();
            var userPoints = user.points;
            userPoints = userPoints + 5;
            snapshot.ref.child(sapKey[0]).update({
              points: userPoints
            });
          }
        
        });
    })
    .then(() => {
      res.send({ refCode });
    })
});

app.get("/showscores", (req, res) => {
  var leader = [];
  var count = 10;
  if (Math.round(Number(req.query.count)) > 0) count = Math.round(Number(req.query.count));
  var ref = db.ref("student");
  ref
    .orderByChild("points")
    .limitToLast(count)
    .once("value")
    .then(snapshot => {
      snapshot.forEach(childSnapshot => {
        leader = [
          ...leader,
          { sap: childSnapshot.key, val: childSnapshot.val() }
        ];
      });
      leader.reverse();
      res.send(leader);
    });
});

app.listen(3000);
