const express = require('express');
const axios = require('axios');
require('dotenv').config();
const readline = require('readline');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(__dirname));

const url = process.env.MONGODB_URI; 
const dbName = 'nationalityPredictor';
let db;

MongoClient.connect(url)
    .then(client => {
        db = client.db(dbName);
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => console.error('MongoDB connection error:', err));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/search', async (req, res) => {
    const name = req.query.name;
    try {
        const response = await axios.get(`https://api.nationalize.io?name=${name}`);
        const data = response.data;
        res.json(data);
    } catch (error) {
        console.error('Error fetching nationality data:', error.message);
        res.status(500).json({ error: 'Error fetching nationality data', details: error.message });
    }
});



app.post('/api/submit', async (req, res) => {
    console.log('Received request for /api/submit');
    const entry = {
        name: req.body.name,
        coolness: req.body.coolness,
        accuracy: req.body.accuracy
    };
    try {
        const result = await db.collection('entries').insertOne(entry);
        console.log('Entry saved successfully:', result);
        res.status(200).send('Entry saved');
    } catch (err) {
        console.error('Error inserting entry:', err);
        res.status(500).send(err);
    }
});


app.get('/api/results', async (req, res) => {
    console.log('Received request for /api/results');
    try {
        const results = await db.collection('entries').find({}).toArray();
        console.log('Fetching results');
        res.json(results);
        console.log('Results fetched:', results);
    } catch (err) {
        console.error('Error fetching results:', err);
        res.status(500).send(err);
    }
});


app.delete('/api/clear', async (req, res) => {
    console.log('Received request for /api/clear');
    try {
        const result = await db.collection('entries').deleteMany({});
        console.log('All entries clearing');
        console.log('Delete result:', result);
        res.status(200).send('All entries cleared');
        console.log('All entries cleared');
    } catch (err) {
        console.error('Error clearing results:', err);
        res.status(500).send(err);
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    if (input.trim() === 'stop') {
        console.log('Stopping the server...');
        process.exit(0);
    }
});

app.get('/index.html', (req, res) => {
    res.sendFile(__dirname + '/index.html', {
        headers: {
            'Content-Type': 'text/html'
        }
    });
});


app.get('/script.js', (req, res) => {
    res.send(`
    document.addEventListener('DOMContentLoaded', () => {
        // Predict Ethnicity Button
        document.getElementById('predictEthnicity').addEventListener('click', async () => {
            const name = document.getElementById('name').value;
            try {
                const response = await fetch(\`/search?name=\${encodeURIComponent(name)}\`);
                const data = await response.json();
                const resultsDiv = document.getElementById('ethnicityResults');
                resultsDiv.innerHTML = \`<h2>These countries may be \${data.name}'s ethnicity:</h2>\`;
                let tableContent = \`<table><thead><tr><th>Country Abbreviation</th><th>Probability (%)</th></tr></thead><tbody>\`;
                data.country.forEach(country => {
                    tableContent += \`<tr><td>\${country.country_id}</td><td>\${(country.probability * 100).toFixed(2)}</td></tr>\`;
                });
                tableContent += \`</tbody></table>\`;
                resultsDiv.innerHTML += tableContent;
            } catch (error) {
                console.error('Error fetching ethnicity data:', error);
            }
        });

        // Submit Form Button
        const form = document.getElementById('nameForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('name').value;
            const coolness = document.getElementById('coolness').value;
            const accuracy = document.getElementById('accuracy').value;

            try {
                await fetch('/api/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, coolness, accuracy })
                });
                console.log('Form data submitted successfully');
            } catch (error) {
                console.error('Error submitting form data:', error);
            }
        });
    });
`);
});