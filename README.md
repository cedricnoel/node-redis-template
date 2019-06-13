# NodeJS / Redis Template

This is an exmple project of how to use redis with nodejs app.
To run the app, first run:

    npm install

Then you have multiple choice:

Using docker:

    docker-compose up -d

If you want to develop, a more comfortable way is to up only the redis container, and then run the server with node: 

    docker-compose up -d redis && node server.js