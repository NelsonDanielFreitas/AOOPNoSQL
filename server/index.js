require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// Conectar ao MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB."))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Esquema e modelo de Movie
const movieSchema = new mongoose.Schema({
  plot: String,
  genres: [String],
  runtime: Number,
  cast: [String],
  poster: String,
  title: String,
  fullplot: String,
  languages: [String],
  released: mongoose.Schema.Types.Mixed,
  directors: [String],
  rated: String,
  awards: { wins: Number, nominations: Number, text: String },
  lastupdated: String,
  year: Number,
  imdb: { rating: Number, votes: Number, id: Number },
  countries: [String],
  type: String,
  tomatoes: {
    viewer: { rating: Number, numReviews: Number, meter: Number },
    fresh: Number,
    critic: { rating: Number, numReviews: Number, meter: Number },
    rotten: Number,
    lastUpdated: mongoose.Schema.Types.Mixed,
  },
  num_mflix_comments: Number,
});
const Movie = mongoose.model("Movie", movieSchema, "movies");

// Esquema e modelo de Comment (em outra coleção)
const commentSchema = new mongoose.Schema({
  name: String,
  email: String,
  movie_id: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
  text: String,
  date: Date,
});
const Comment = mongoose.model("Comment", commentSchema, "comments");

// GET /api/movies -> filmes com comentários embutidos (limit 50)
app.get("/api/movies", async (req, res) => {
  try {
    // 1) Grab a batch of candidates (say 100) that at least have a non-empty poster
    const candidates = await Movie.aggregate([
      {
        $match: {
          poster: { $exists: true, $nin: ["", "N/A"] },
        },
      },
      { $limit: 100 },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "movie_id",
          as: "comments",
        },
      },
      {
        $addFields: {
          comments: { $map: { input: "$comments", as: "c", in: "$$c.text" } },
        },
      },
    ]);

    const validMovies = [];
    // 2) Check each poster URL with a HEAD request
    await Promise.all(
      candidates.map(async (m) => {
        if (validMovies.length >= 50) return; // we only need 50 final
        try {
          const head = await axios.head(m.poster, { timeout: 3000 });
          const ct = head.headers["content-type"] || "";
          if (head.status === 200 && ct.toLowerCase().startsWith("image/")) {
            validMovies.push(m);
          }
        } catch (err) {
          // either timeout, 404, non-image, etc. → skip
        }
      })
    );

    res.json(validMovies);
  } catch (error) {
    console.error("Erro na rota GET /api/movies:", error);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

// GET /api/movies/:id -> detalhes de um filme mais comentários
app.get("/api/movies/:id", async (req, res) => {
  try {
    const movieId = new mongoose.Types.ObjectId(req.params.id);
    const [movie] = await Movie.aggregate([
      { $match: { _id: movieId } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "movie_id",
          as: "comments",
        },
      },
      {
        $addFields: {
          comments: {
            $map: {
              input: "$comments",
              as: "c",
              in: {
                _id: "$$c._id",
                name: "$$c.name",
                text: "$$c.text",
                date: "$$c.date",
              },
            },
          },
        },
      },
    ]);

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json(movie);
  } catch (error) {
    console.error("Erro na rota GET /api/movies/:id:", error);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// POST /api/movies
app.post("/api/movies", async (req, res) => {
  try {
    const newMovie = new Movie(req.body);
    const savedMovie = await newMovie.save();
    res.status(201).json(savedMovie);
  } catch (error) {
    console.error("Erro na rota POST /api/movies:", error);
    res.status(500).json({ error: "Failed to create movie" });
  }
});

// POST /api/comments -> criar comentário em filme
app.post("/api/comments", async (req, res) => {
  try {
    const newComment = new Comment(req.body);
    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    console.error("Erro na rota POST /api/comments:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

app.delete("/api/comments/:id", async (req, res) => {
  try {
    const deleted = await Comment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Comment not found" });
    }
    // Optionally decrement movie comment count
    await Movie.findByIdAndUpdate(deleted.movie_id, {
      $inc: { num_mflix_comments: -1 },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Erro na rota DELETE /api/comments/:id:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
