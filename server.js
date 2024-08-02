const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config()
const app = express();
const port = process.env.PORT;
console.log(port);
let username = "";



app.use(cors({
  origin: ['https://zack-white-github-io.onrender.com', 'https://jumbogptv2.onrender.com' ],
  credentials: true
}));
app.use(express.json());
mongoose.connect(process.env.MONGO_LOGIN,
 { useNewUrlParser: true, useUnifiedTopology: true })
 .then(() => console.log('Connected to MongoDB Atlas'))
 .catch(error => console.error('Could not connect to MongoDB Atlas:', error));


const conversationSchema = new mongoose.Schema({
  username: String,
  messages: [{ sender: String, message: String, direction: String }]
});

const Conversation = mongoose.model('Conversation', conversationSchema);

app.get('/api/', (req, res) => {
        console.log("hello, world");
        res.send('Hello, World!');
});

app.get('/api/grab', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ username });
    if (!conversation) {
      conversation = new Conversation({ username, messages: [{sender: 'assistant', message: 'Hello, welcome to JumboGPT!', direction: 'incoming'}]});;
    }
    res.status(200).json(conversation);
  } catch (error) {
    console.error('Get conversation error: ', error.message);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});


app.post('/api/login', async (req, res) => {
        username = req.body.username;
  try {
    const response = await axios.post('https://tl-onboarding-project-dxm7krgnwa-uc.a.run.app/login', req.body, {
      headers: {
        Authorization: req.headers.authorization // Forward the Authorization header
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(error.response ? error.response.status : 500).json({ error: 'Proxy request failed' });
  }
});

app.post('/api/write', async (req,res) => {
  let bro = req.body.userMessage.message;
  try{
      let conversation = await Conversation.findOne({ username });
      if(!conversation) {
        conversation = new Conversation({ username, messages: []});
      }
      conversation.messages.push( { sender: 'user', message: bro, direction: 'outgoing'});
      await conversation.save();
      res.status(200).json({ success: true });
  } catch (error){
    console.error('write error: ', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({error: 'Proxy request failed'});
  }
})


app.post('/api/proxy', async (req, res) => {
        try {
          const response = await axios.post('https://tl-onboarding-project-dxm7krgnwa-uc.a.run.app/prompt', req.body, {
            headers: {
              Authorization: req.headers.authorization, // Forward the Authorization header
              'Content-Type': 'application/json'
            }
          });
          let conversation = await Conversation.findOne({ username });
          if (!conversation) {
            conversation = new Conversation({ username, messages: []});
          }
          conversation.messages.push({ sender: 'assistant', message: response.data.message.content, direction: 'incoming' });
          await conversation.save();
      
          res.json(response.data); 
        } catch (error) {
          console.error('Proxy error:', error.response ? error.response.data : error.message);
          res.status(error.response ? error.response.status : 500).json({ error: 'Proxy request failed' });
        }
});

app.listen(port, () => {
  console.log(`Proxy server listening at https://localhost:3000`);
});
