'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  request = require('request'),
  dotenv = require('dotenv').config(),
  mongoose = require('mongoose');

// Database Connection
mongoose.connect(process.env.MONGODB_URI);
let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', () => {
  // Connection Established...
  console.log('Database Connected!');
});

// Define User Schema
let userSchema = mongoose.Schema({
  originalName: String,
  botGeneratedName: String,
  senderId: Number,
  userLocale: String,
  onlineStatus: Boolean
});

// User's Data
userSchema.methods.data = () => {
  // User's Available Information
  let currentUser = {
    originalName: this.originalName ? this.originalName : "Original Name Not Available.",
    botGeneratedName: this.tuttBottGeneratedName ? this.tuttBottGeneratedName : "Generated Name Not Available.",
    senderId: this.senderId ? this.senderId : "Sender Id Not Available",
    userLocale: this.userLocale ? this.userLocale : "Locale Not Available",
  };

  // Return User's Information
  return currentUser;
};

// User Model
let User = mongoose.model('User', userSchema);

// Name Generation
let generateName = () => 'BotUser-' + Math.random().toString(36).substring(7);

// New User Creation Method
let newUser = (userOriginalName, userBotGeneratedName, userSenderId, userUserLocale, userOnlineStatus) => {
  let theUser = new User({
                        originalName: userOriginalName,
                        botGeneratedName: userBotGeneratedName,
                        senderId: userSenderId,
                        userLocale: userUserLocale,
                        onlineStatus: userOnlineStatus
                    });
  theUser.save((err, theUser) => {
    if (err) return "User could not be saved; please try again";
    console.log(theUser);
  });
};

// Sets server port and logs message on success
app.listen(process.env.PORT || 3000, () => console.log('webhook is listening'));

// Default Application Response
app.get('/', (req, res) => {
  res.send("You Are Very Welcome! :) ");
});

app.post('/webhook', (req, res) => {

  // Define body
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhookEvent = entry.messaging[0];
      console.log(webhookEvent);

      // Recipient's Id
      let recipientId = entry.messaging[0].sender.id;

      // Recipient's Message
      let recipientMessage = entry.messaging[0].message.text;

      // Get & Save Available User
      newUser('User\'sFacebookName', generateName(), entry.messaging[0].sender.id, 'User\'sLocale', true);

      // User's Response
      let userResponse = {
        'recipient': {
          'id': recipientId,
        },
        'message': {
          'text': newUser.botGeneratedName ? "Your Id For This Session Is " + newUser.botGeneratedName : recipientMessage,
        }
      };


      // Returns a response to the user
      request({
        method: 'POST',
        uri: 'https://graph.facebook.com/v2.6/me/messages?access_token=' + process.env.PAGE_ACCESS_TOKEN,
        json: userResponse
      }, (error, response, body) => {
        // If an error occured
        console.log('Error: ', error);

        // Check response StatusCode code
        console.log('StatusCode: ', response, response.StatusCode);

        // Response Body
        console.log('Body: ', response.body);
      });

    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "TuttBottVerified"

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
