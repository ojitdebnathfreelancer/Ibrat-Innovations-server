const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Ibrat emoerce server running')
});

const jwtVirify = (req, res, next) => {
    const Mtoken = req.headers.authoraization;

    if (!Mtoken) {
        return res.status(403).send({ message: "Your access forbiden" })
    }

    const token = Mtoken.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(403).send("Your access forbiden")
        }

        req.decoded = decoded;
    })
    next()
};
// jwt verify with some user info 

const uri = "mongodb+srv://ibratDB:Uv2jk7FvOOp47cih@cluster0.r7d25w3.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const ibratMongo = async () => {
    try {
        const productsData = client.db('ibrat').collection('products');
        const usersData = client.db('ibrat').collection('users');
        const cartData = client.db('ibrat').collection('cart');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
            res.send({ token });
        });
        // jwt token sing 

        app.post('/user', jwtVirify, async (req, res) => {
            const user = req.body;
            const result = await usersData.insertOne(user);
            res.send(result);
        });
        // save user to DB 

        app.get('/users', jwtVirify, async (req, res) => {
            const data = await usersData.find({}).toArray();
            res.send(data);
        });
        // get all user inside website 

        app.get('/products', async (req, res) => {
            const data = await productsData.find({}).toArray();
            res.send(data);
        });
        // get user cart data 

        app.post('/cart', jwtVirify, async (req, res) => {
            const decodeEmail = req.decoded.email;
            const email = req.query.email;
            const book = req.body;

            if (email !== decodeEmail) {
                return res.status(401).send("You have login problem")
            }

            const query = { productId: book.productId, buyerEmail: email };
            const alreadyExist = await cartData.findOne(query);

            if (alreadyExist) {
                const updateDoc = {
                    $set: {
                        quantity: alreadyExist.quantity + 1
                    }
                };

                await cartData.updateOne(query, updateDoc);
                res.send({ message: "Product added" });
                return;
            }

            await cartData.insertOne(book);
            res.send({ message: "Product added" });
        });
        // book product save to DB 

        app.get('/cart', jwtVirify, async (req, res) => {
            const decodeEmail = req.decoded.email;
            const email = req.query.email;
            const query = { buyerEmail: email };

            if (email !== decodeEmail) {
                return res.status(401).send("You have login problem")
            }

            const data = await cartData.find(query).toArray();
            res.send(data);
        });
        // get data of user booked 

        app.delete('/cart/:id', jwtVirify, async (req, res) => {
            const id = req.params.id;
            await cartData.deleteOne({ _id: ObjectId(id) });
            res.send({ message: "Product deleted" })
        });
        // delete single produt 
    }
    finally {

    }
}
ibratMongo().catch(error => console.log(error))


app.listen(port, () => {
    console.log('server running', port);
})