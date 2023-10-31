require('dotenv').config();
const express = require('express');
const cors = require('cors');
const shortid = require('shortid');
const app = express();
const mongoose = require('mongoose')
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = new mongoose.Schema(
  {
      original: { type: String, required: true },
      short: { type: String, required: true }
  }
);

const Url = mongoose.model('Url', urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const short = req.params.short_url;

  Url.findOne({ short: short })
  .exec()
  .then((data) => {
    if (!data) {
      return res.json("URL not found");
    } else {
      res.redirect(data.original);
    }
  })
  .catch((err) => {
    console.error(err);
    res.json("Error occurred while looking up the URL");
  });
});

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;
  const pattern = /^https?:\/\/(www\.)?[\w-]+\.[a-z]+(\.[a-z]+)?(\/\S*)?$/;

  if (pattern.test(url)) {
    const short = shortid.generate();

    Url.findOneAndUpdate(
      { original: url },
      { original: url, short: short },
      { new: true, upsert: true }
    )
      .exec()
      .then((newUrl) => {
        res.json({ original_url: url, short_url: newUrl.short });
      })
      .catch((err) => {
        console.error(err);
        res.json({ error: "An error occurred while creating the short URL" });
      });
  } else {
    res.json({ error: 'invalid url' });
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
