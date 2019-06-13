// The application requires the Express module.
// The express variable will allow us to use the features of the Express module.

/** @type {function} */
const express = require('express')
/** @type {function} */
const responseTime = require('response-time')
/** @type {function} */
const axios = require('axios')
/** @type {object} */
const redis = require('redis')

// We define the server params

/** @type {string} */
const hostname = 'localhost'
/** @type number */
const port = 3000
/** @type {function} */
const app = express()

// create and connect redis client to specific host
// due to docker on windows

/** @type {object} */
const client = redis.createClient({
    host: '192.168.99.100',
})

// Print redis errors to the console
client.on('error', err => {
    console.log('Error ' + err)
})

// use response-time as a middleware
app.use(responseTime())

app.get('/api', (req, res) => {
    res.send('Welcome on your API!')
})

app.get('/api/search', (req, res) => {
    /** @type {string} */
    const query = req.query.query.trim() // Extract the query from url and trim trailing spaces
    /** @type {string} */
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=${query}` // Build the Wikipedia API url

    // Try fetching the result from Redis first in case we have it cached
    client.get(`wikipedia:${query}`, (err, result) => {
        // If that key exist in Redis store
        if (result) {
            /** @type {object} */
            const resultJSON = JSON.parse(result)
            
            res.status(200).json(resultJSON)
        } else {
            // Key does not exist in Redis store
            // Fetch directly from Wikipedia API
            axios.get(searchUrl)
                .then(response => {
                    /** @type {object} */
                    const responseJSON = response.data
                    // Save the Wikipedia API response in Redis store
                    client.setex(
                        `wikipedia:${query}`,
                        3600,
                        JSON.stringify({
                            source: 'Redis Cache',
                            ...responseJSON,
                        })
                    )
                    
                    // Send JSON response to client
                    res.status(200).json({ source: 'Wikipedia API', ...responseJSON })
                })
                .catch(err => {
                    res.json(err)
                })
        }
    })
})

// Start server
app.listen(port, hostname, function() {
    console.log(
        'Server running at http://' + hostname + ':' + port + '\n'
    )
})
