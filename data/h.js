import crypto from 'crypto'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt-nodejs'


// Install bcrypt-nodejs

const mongoUrl = process.env.Mongo_Url || 'mongodb://localhost/auth'
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const User = mongoose.model('User', {
    name: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    accessToken:{
        type: String,
        default: () => crypto.randomBytes(128).toString('hex') // Creates to long string of random letters and numbers. Uniqe identifyer
    }
})

//Exapmle
// Post Request
const request = {name: 'Bob', password: 'foobar'};

//DB Entry
const dbEntry = {name: 'Bob', password:'5abbc32983def'}

bcrypt.compareSync(request.password, dbEntry.password) //Compares

// One-way encryption - creates a random hex to foobar so nobody can see the users password, even the ones with the code database
const user = new User ({name:"Bob", password:bcrypt.hashSync('foobar')})
userInfo.save()

app.post('/sessions', async (req, res) => {
    const user = await User.findOne({name: req.body.name})
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
        // Success
        res.json({id: user._id, asscessToken: user.accessTokej})
    } else {
        // Failure ex User do not exist ot password don't match
        res.json({notFound: true})
    }
})