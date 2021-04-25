import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

// Managa DB
const withDB = async (operations, res) => {
    try {
        
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');

        await operations(db);

    } catch (error) {
        res.status(500).json( {message: 'Error connecting to db', error })
    }
};

// Get Data
app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articlesInfo);
    }, res);
});

// Upvote a blog post
app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        // get data from articles
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        
        // add one upvote
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articlesInfo.upvotes+1,
            },
        });

        // call the updated data 
        const updatedArticlesInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticlesInfo);
    }, res);
});

// Update comments
app.post('/api/articles/:name/add-comment', (req, res) => {
    
    withDB(async (db) => {
        const { username, text } = req.body;
        const articleName = req.params.name;

        // get data from articles
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });

         // add one comment
         await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articlesInfo.comments.concat({ username, text }),
            },
        });

         // call the updated data 
         const updatedArticlesInfo = await db.collection('articles').findOne({ name: articleName });

         res.status(200).json(updatedArticlesInfo);

    }, res)
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

app.listen(8000, () => console.log("Listening on port 8000"));