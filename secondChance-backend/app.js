/*jshint esversion: 8 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoLogger = require('./logger');

const connectToDatabase = require('./models/db');
const {loadData} = require("./util/import-mongo/index");


const app = express();
app.use("*",cors());
const port = 3060;

// Connect to MongoDB; we just do this one time
connectToDatabase().then(() => {
    pinoLogger.info('Connected to DB');
})
    .catch((e) => console.error('Failed to connect to DB', e));


app.use(express.json());

// Route files
const secondChanceItemsRoutes = require('./routes/secondChanceItemsRoutes');
const searchRoutes = require('./routes/searchRoutes');


const pinoHttp = require('pino-http');
const logger = require('./logger');

app.use(pinoHttp({ logger }));

// Use Routes
app.use('/api/secondchance/items', secondChanceItemsRoutes);
app.use('/api/secondchance/search', searchRoutes);


// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★ THIS IS THE NEW SENTIMENT ANALYSIS ROUTE YOU NEED TO ADD ★★★
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
app.post('/sentiment/analysis', (req, res) => {
    try {
        // Task 4: extract the sentence parameter from the query string
        const { sentence } = req.query;

        // A simple check to make sure the sentence parameter exists
        if (!sentence) {
            return res.status(400).json({ message: 'A sentence query parameter is required.' });
        }

        // This is a placeholder for a real sentiment analysis.
        // We'll simulate a 'score' based on the length of the sentence for this example.
        const analysisResult = sentence.length - 30; // Dummy score calculation

        // Task 5: set sentiment to negative or positive based on score rules
        let sentiment = 'neutral';
        if (analysisResult > 0) {
            sentiment = 'positive';
        } else if (analysisResult < 0) {
            sentiment = 'negative';
        }
        
        // Task 6: send a status code of 200 with the result
        res.status(200).json({ sentimentScore: analysisResult, sentiment: sentiment });

    } catch (error) {
        logger.error(`Error performing sentiment analysis: ${error}`);
        // Task 7: if there is an error, return a HTTP code of 500
        res.status(500).json({ message: 'Error performing sentiment analysis' });
    }
});


// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

app.get("/",(req,res)=>{
    res.send("Inside the server")
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});