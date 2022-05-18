import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from 'dotenv'
import listEndpoints from "express-list-endpoints";

import data from './data/books.json'

dotenv.config()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo-books";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8090;
const app = express();

const Book = mongoose.model('Player', {
  "bookID": Number,
  "title": String,
  "authors": String,
  "average_rating": Number,
  "isbn": Number,
  "isbn13": Number,
  "language_code": String,
  "num_pages": Number,
  "ratings_count": Number,
  "text_reviews_count": Number,
  "category": String,
  "collection": String
})

if (process.env.RESET_DB === 'true') {
  const seedDatabase = async () => {
    await Book.deleteMany({})

    data.forEach((item) => {
      const newBook = new Book(item)
      newBook.save()
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
    {"Welcome":"This is an open API with Books.",
    "Database": "MongoDB",
    "Endpoints": "/endpoints",
    "Routes":[{
    "/books":"Get all books",
    "/books/titles/:title":"Get a book by title",
    "/books/authors/:author":"Get all the books by a specific author",
    "/books/ratings/:average_rating":"Get book by rating (1-5)",
    "/books/isbn/:isbn":"Book ISBN",
    "/books/pages/:num_pages":"Book based on page number",
    "/books/languages/:language":"Book based on language"
  }],
  "Querys":[{
    "/books/q?bookID=bookID":"BookID",
    "/books/q?title=title":"Book title",
    "/books/q?authors=author":"Book author",
    "/books/q?ratings=rating":"Book ratings",
    "/books/q?isbn=isbn":"Book ISBN",
    "/books/q?languages=language":"Book language",
    }]
}
  )
});

app.get('/endpoints', (req, res) => {
  res.send(listEndpoints(app));
})

// Get all players
app.get('/books', async (req, res) => {
  const books = await Book.find()
  res.json(books)
})

// Find book by title
app.get('/books/titles/:title', async (req, res) => {
  try {
    const bookTitle = await Book.find({ title: req.params.title})
    if (bookTitle.length === 0) {
      res.status(404).json({error: 'position not found'})
    } else {
      res.json(bookTitle)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid position'})
  }
})

// Find book by authors
app.get('/books/authors/:authors', async (req, res) => {
  try {
    const bookAuthor = await Book.find({ authors: req.params.authors})
    if (bookAuthor.length === 0) {
      res.status(404).json({error: 'Nationality not found'})
    } else {
      res.json(bookAuthor)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid nationality'})
  }
})

// Find book by BookID
app.get('/books/bookID/:bookID', async (req, res) => {
  try {
    const bookID = await Book.findOne({ bookID: req.params.bookID})
    if (bookID.length === 0) {
      res.status(404).json({error: 'Name not found'})
    } else {
      res.json(bookID)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid name'})
  }
})

// Find books by ratings
app.get('/books/ratings/:average_rating', async (req, res) => {
  try {
    const bookRatings = await Book.find({ average_rating: req.params.average_rating})
    if (bookRatings.length === 0) {
      res.status(404).json({error: 'Name not found'})
    } else {
      res.json(bookRatings)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid name'})
  }
})

// Find book by ISBN
app.get('/books/isbn/:isbn', async (req, res) => {
  try {
    const bookISBN = await Book.findOne({ isbn: req.params.isbn})
    if (bookISBN.length === 0) {
      res.status(404).json({error: 'Number not found'})
    } else {
      res.json(bookISBN)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid number'})
  }
})

// Find book by language
app.get('/books/languages/:language', async (req, res) => {
  try {
    const bookLanguage= await Book.find({ language: req.params.language_code})
    if (bookLanguage.length === 0) {
      res.status(404).json({error: 'goal not found'})
    } else {
      res.json(bookLanguage)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid goal'})
  }
})

// Find book by number of pages
app.get('/books/pages/:num_pages', async (req, res) => {
  try {
    const bookPages = await Book.find({ num_pages: req.params.num_pages})
    if (bookPages.length === 0) {
      res.status(404).json({error: 'Number not found'})
    } else {
      res.json(bookPages)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid number'})
  }
})

// Find book by category
app.get('/books/categorys/:category', async (req, res) => {
  try {
    const booksCategory = await Book.find({ category: req.params.category})
    if (booksCategory.length === 0) {
      res.status(404).json({error: 'Number not found'})
    } else {
      res.json(booksCategory)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid number'})
  }
})

// Find book by collection
app.get('/books/collections/:collection', async (req, res) => {
  try {
    const bookCollection = await Book.find({ collection: req.params.collection})
    if (bookCollection.length === 0) {
      res.status(404).json({error: 'Number not found'})
    } else {
      res.json(bookCollection)
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid number'})
  }
})


// Here you can find diffrent querys with multible outcomes. Eg: /hammarby/players?position=goalkeeper
app.get("/books/q", async (req, res) => {
  try {
    let allBooks = await Book.find(req.query);
    if (req.query.x) {
      const books = await Book.find().lt(
        "x",
        req.query.x
      );
      allBooks = books;
    }
    if (!allBooks.length) {
      res.status(404).json(`Sorry, no query found.`)
    } else {
      res.json(allBooks);
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid'})
  }
 
});

// Here you can find diffrent querys with one outcome. Eg: /hammarby/players?shirt_number=15 or /hammarby/players?age=18&position=striker
app.get("/books/q", async (req, res) => {
  try {
    let allBooks = await Book.findOne(req.query);
    if (req.query.x) {
      const books = await Book.findOne().lt(
        "x",
        req.query.x
      );
      allBooks = books;
    }
    if (!allBooks.length) {
      res.status(404).json(`Sorry, no query found.`)
    } else {
      res.json(allBooks);
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid'})
  }
 
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
