'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  request = require('request'),
  dotenv = require('dotenv').config();

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

      console.log(entry.messaging[0].recipient);

      // Recipient's Id
      let recipientId = entry.messaging[0].recipient.id;

      // // User's Response
      // let userResponse = {
      //   'recipient': {
      //     'id': recipientId,
      //   },
      //   'message': {
      //     'text': webhookEvent,
      //   }
      // };

      // Returns a response to the user
      request.post('https://graph.facebook.com/v2.6/me/messages?access_token=' + process.env.PAGE_ACCESS_TOKEN, {'recipient': {'id':  entry.messaging[0].recipient.id}, 'message': {'text': webhookEvent}}, (error, response, body) => {
        // If an error occured
        console.log('Error: ', error);

        // Check response StatusCode code
        console.log('StatusCode: ', response && response.StatusCode);

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
