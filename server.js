import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from 'dotenv'
import listEndpoints from "express-list-endpoints";
import crypto from 'crypto'
import bcrypt from 'bcrypt'

import data from './data/marvel.json'

dotenv.config()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/book-api";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Auth ///
const User = mongoose.model('User', {
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    unique: false
  },
  age: {
    type: Number,
    unique: false
  },
  superhero: {
    type: String,
    unique: false
  },
  movie: {
    type: String,
    unique: false
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  },
  likedMovies: {

  }
})

export const likedMovies = async (req, res) => {
  const { id, userId } = req.params;

  try {
    const updatedLikedPost = await Post.findById(id);

    if (updatedLikedPost) {
      const likedByUser = await User.findByIdAndUpdate(
        userId,
        {
          $push: { likedPost: updatedLikedPost },
        },
        {
          new: true,
        }
      );
      res.status(201).json({ response: likedByUser, success: true });
    } else {
      res.status(404).json({ response: "No liked post", success: false });
    }
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
};

export const unlikedMovies = async (req, res) => {
  const { id, userId } = req.params;

  try {
    const updatedLikedPost = await Post.findById(id);

    if (updatedLikedPost) {
      const likedByUser = await User.findByIdAndUpdate(
        userId,
        {
          $pullAll: { likedPost: [updatedLikedPost] },
        },
        {
          new: true,
        }
      );
      res.status(201).json({ response: likedByUser, success: true });
    } else {
      res.status(404).json({ response: "No liked posts", success: false });
    }
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
};

app.post("/feed/:id/like/:userId", likedMovies);
app.post("/feed/:id/unlike/:userId", unlikedMovies);

const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({accessToken: req.header('Authorization')})
  if (user) {
    req.user = user
    next()
  } else {
    res.status(401).json({loggedOut: true})
  }
}

app.get('/sessions/:userId', authenticateUser)
app.get('/sessions/:userId', async (req, res) => {
  const { userId } = req.params

  try {
    const user = await User.findById(userId)
    if (user) {
      res.status(201).json({ email: user.email, fullName: user.fullName, age: user.age, superhero: user.superhero, movie: user.movie })
    } else {
      res.status(404).json({ success: false, message: 'Could not find profile information' })
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid request', error })
  }
  
})

app.post('/signup', async (req, res) => {
  const { username, password, email } = req.body

  try {
    const salt = bcrypt.genSaltSync()

    const newUser = await new User({ 
      username, 
      password: bcrypt.hashSync(password, salt),
      email 
    }).save()
    
    res.status(201).json({ 
      success: true,
      userId: newUser._id, 
      username: newUser.username, 
      email: newUser.email,
      accessToken: newUser.accessToken, 
    })
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'User already exists', fields: error.keyValue })
    }
    res.status(400).json({ success: false, message: 'Could not create user', error })
  }
})

app.post('/sessions', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await User.findOne({ username })

    if (user && bcrypt.compareSync(password, user.password)) {
      res.json({ 
        success: true, 
        userId: user._id, 
        username: user.username, 
        email: user.email, 
        accessToken: user.accessToken, 
        fullName: user.fullName, 
        age: user.age, 
        superhero: user.superhero, 
        movie: user.movie 
      })
    } else {
      res.status(404).json({ success: false, message: 'Could not find user' })
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid request', error })
  }
})

app.patch('/sessions/:userId', authenticateUser)
app.patch('/sessions/:userId', async (req, res) => {
  const { userId } = req.params

  try {
    const updateUser = await User.findByIdAndUpdate(userId, req.body, { new: true })

    if (updateUser) {
      res.json({ success: true, updateUser })
    } else {
      res.status(404).json({ success: false, message: 'Not found' })
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid request', error })
  }
})

// Marvel //

const Marvel = mongoose.model("Marvel", {
  "title": String,
  "medium": String,
  "release_date": String,
  "category": Array,
  "tags": Array,
  "director": String,
  "numberOfEpisodes": Number,
  "poster": String,
  "box_office": String,
  "oneShotLength": Number,
  "id": Number,
  "imdbRating": Number,
  "description": String
})

if (process.env.RESET_DB === 'true') {
  const seedDatabase = async () => {
    await Marvel.deleteMany({})

    data.forEach((item) => {
      const newMarvel = new Marvel(item)
      newMarvel.save()
    })
  }
  seedDatabase()
}



// ERROR HANDLING:
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1 ) { // 1 då restrande inte är connected. 1 = connected
    next() // Hanterar funktionen nedan, alltså när allt fungerar som vanligt
  } else {
    res.status(503).json({error: 'Service unavilable'})
  }
})

// Start defining your routes here
app.get("/", (req, res) => {
  res.send(
    {"Welcome":"This is an open Marvel API by Linnea Frisk.",
      "Endpoints": "/endpoints"}
  )
});

app.get('/endpoints', (req, res) => {
  res.send(listEndpoints(app));
})

// Get all marvel
app.get('/marvel', async (req, res) => {
  const marvels = await Marvel.find()
  res.json(marvels)
})

// Marvel endpoint title
app.get('/marvel/:title', async (req, res) => {
  try {
    const marvelTitle = await Marvel.findOne({ title: req.params.title})
    if (marvelTitle.length === 0) {
      res.status(404).json({error: 'Title not found'})
    } else {
      res.json(marvelTitle)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid Title'})
  }
})

// Marvel endpoint Medium
app.get('/marvel/medium/:medium', async (req, res) => {
  try {
    const bookMedium = await Marvel.find({ medium: req.params.medium})
    if (bookMedium.length === 0) {
      res.status(404).json({error: 'Medium not found'})
    } else {
      res.json(bookMedium)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid medium'})
  }
})

// Marvel endpoint Tags
app.get('/marvel/tags/:tags', async (req, res) => {
  try {
    const marvelTags = await Marvel.find({ tags: req.params.tags})
    if (marvelTags.length === 0) {
      res.status(404).json({error: 'Tag not found'})
    } else {
      res.json(marvelTags)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid tag'})
  }
})

// Find marvel by category - Endpoint
app.get('/marvel/categories/:category', async (req, res) => {
  try {
    const marvelCategory = await Marvel.find({ category: req.params.category})
    if (marvelCategory.length === 0) {
      res.status(404).json({error: 'Category not found'})
    } else {
      res.json(marvelCategory)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid Category'})
  }
})

app.get('/marvel/medium/:medium', async (req, res) => {
  try {
    const marvelMedium = await Marvel.find({ medium: req.params.medium})
    if (marvelMedium.length === 0) {
      res.status(404).json({error: 'Medium not found'})
    } else {
      res.json(marvelMedium)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid medium'})
  }
})

// Find marvel by id
app.get(`/marvel/:id`, async (req, res) => {
  try {
    const marvelId = await Marvel.findOne({ id: req.params.id})
    if (marvelId.length === 0) {
      res.status(404).json({error: 'Id not found'})
    } else {
      res.json(marvelId)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid Id'})
  }
})


// Here you can find diffrent querys with multible outcomes. Eg: /marvel/search/q?tags=Rhodey
app.get("/marvel/search/q", async (req, res) => {
  try {
    let allMarvel = await Marvel.find(req.query);
    if (req.query.x) {
      const marvels = await Marvel.find().lt(
        "x",
        req.query.x
      );
      allMarvel = marvels;
    }
    if (!allMarvel.length) {
      res.status(404).json(`Sorry, no query found.`)
    } else {
      res.json(allMarvel);
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid'})
  }
 
});

// Here you can find diffrent querys with one outcomes. Eg: /marvel/search/q?title=Iron Man
app.get("/marvel/search/q", async (req, res) => {
  try {
    let allMarvel = await Marvel.findOne(req.query);
    if (req.query.x) {
      const marvels = await Marvel.findOne().lt(
        "x",
        req.query.x
      );
      allMarvel = marvels;
    }
    if (!allMarvel.length) {
      res.status(404).json(`Sorry, no query found.`)
    } else {
      res.json(allMarvel);
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid'})
  }
 
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
