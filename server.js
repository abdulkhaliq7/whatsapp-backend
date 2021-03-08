//?? importing 
import express from  'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';

//?? app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1166047",
    key: "34b31072964195e5c3e5",
    secret: "4050a554997519ad7fbb",
    cluster: "ap1",
    useTLS: true
  });

//?? middleware
app.use(express.json())

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Origin', '*')
    next();
});

//?? DB config
const connection__url = 'mongodb+srv://admin:wygLyedAhcxKAhJy@cluster0.znzsi.mongodb.net/whatsapdb?retryWrites=true&w=majority'
mongoose.connect(connection__url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})

const db = mongoose.connection

db.once('open', () => {
    console.log('DB connected')

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch()

    changeStream.on('change', (change) => {
        console.log('A change occured',change)

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument
            pusher.trigger('messages', 'inserted', 
                {
                    name: messageDetails.name,
                    message: messageDetails.message
                }
            );
        } else {
            console.log('Error triggering Pusher')
        }
    });
});

//?? api routes
app.get('/',(req,res)=>res.status(200).send('hello world'))

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

//?? listen
app.listen(port, ()=>console.log(`Listening on localhost:${port}`))
