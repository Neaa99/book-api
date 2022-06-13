import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from 'dotenv'
import listEndpoints from "express-list-endpoints";

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
  location: {
    type: String,
    unique: false
  },
  description: {
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
  }
})

const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({accessToken: req.header('Authorization')})
  if (user) {
    req.user = user
    next()
  } else {
    res.status(401).json({loggedOut: true})
  }
}

app.get('/sessions/:id', authenticateUser)
app.get('/sessions/:id', async (req, res) => {
  const { id } = req.params

  try {
    const user = await User.findById(id)
    if (user) {
      res.status(201).json({ email: user.email, fullName: user.fullName, age: user.age, location: user.location, description: user.description })
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
      id: newUser._id, 
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
        id: user._id, 
        username: user.username, 
        email: user.email, 
        accessToken: user.accessToken, 
        fullName: user.fullName, 
        age: user.age, 
        location: user.location, 
        description: user.description 
      })
    } else {
      res.status(404).json({ success: false, message: 'Could not find user' })
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid request', error })
  }
})

app.patch('/sessions/:id', authenticateUser)
app.patch('/sessions/:id', async (req, res) => {
  const { id } = req.params

  try {
    const updateUser = await User.findByIdAndUpdate(id, req.body, { new: true })

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

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

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


// Find marvel by release date
// app.get('/marvel/release_date/:release_date', async (req, res) => {
//   try {
//     const marvelRelease = await Marvel.findOne({ release_date: req.params.release_date})
//     if (marvelRelease.length === 0) {
//       res.status(404).json({error: 'Release date not found'})
//     } else {
//       res.json(marvelRelease)
//     }
//   } catch (err) {
//     res.status(400).json({ error: 'Invalid Release date'})
//   }
// })

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



// Find marvel by director
// app.get('/marvel/directors/:director', async (req, res) => {
//   try {
//     const marvelDirector= await Marvel.find({ director: req.params.director})
//     if (marvelDirector.length === 0) {
//       res.status(404).json({error: 'Director not found'})
//     } else {
//       res.json(marvelDirector)
//     }
//   } catch (err) {
//     res.status(400).json({ error: 'Invalid Director'})
//   }
// })

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

// Find marvel by imdb rating
// app.get(`/marvel/ratings/:imdbRating`, async (req, res) => {
//   try {
//     const marvelRating = await Marvel.find({ imdbRating: req.params.imdbRating})
//     if (marvelRating.length === 0) {
//       res.status(404).json({error: 'Rating not found'})
//     } else {
//       res.json(marvelRating)
//     }
//   } catch (err) {
//     res.status(400).json({ error: 'Invalid rating'})
//   }
// })

// Find marvel series by number of episodes
// app.get('/marvel/numberOfEpisodes/:numberOfEpisodes', async (req, res) => {
//   try {
//     const marvelEpisodes = await Marvel.find({ numberOfEpisodes: req.params.numberOfEpisodes})
//     if (marvelEpisodes.length === 0) {
//       res.status(404).json({error: 'Episode number not found'})
//     } else {
//       res.json(marvelEpisodes)
//     }
//   } catch (err) {
//     res.status(400).json({ error: 'Invalid episode number'})
//   }
// })


// Here you can find diffrent querys with multible outcomes. Eg: /hammarby/players?position=goalkeeper
app.get("/marvel/q", async (req, res) => {
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

// Here you can find diffrent querys with one outcome. Eg: /hammarby/players?shirt_number=15 or /hammarby/players?age=18&position=striker
app.get("/marvel/q", async (req, res) => {
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
