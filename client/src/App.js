import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Box,
  Paper,
  Divider,
  Pagination,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [page, setPage] = useState(1);

  const moviesPerPage = 15;

  useEffect(() => {
    fetch("https://aoopnosql.onrender.com/api/movies")
      .then((res) => res.json())
      .then((data) => setMovies(data))
      .catch((err) => console.error("Error fetching movies:", err));
  }, []);

  const handlePageChange = (_event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchMovieDetails = (id) => {
    fetch(`https://aoopnosql.onrender.com/api/movies/${id}`)
      .then((res) => res.json())
      .then((data) => setSelectedMovie(data))
      .catch((err) => console.error("Error fetching movie details:", err));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const payload = {
      movie_id: selectedMovie._id,
      name: "Anonymous",
      email: "",
      text: newComment,
      date: new Date().toISOString(),
    };
    fetch("https://aoopnosql.onrender.com/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((comment) => {
        setSelectedMovie((prev) => ({
          ...prev,
          comments: [...prev.comments, comment],
        }));
        setNewComment("");
      })
      .catch((err) => console.error("Error posting comment:", err));
  };

  const handleDeleteComment = (id) => {
    fetch(`https://aoopnosql.onrender.com/api/comments/${id}`, {
      method: "DELETE",
    })
      .then(() => {
        setSelectedMovie((prev) => ({
          ...prev,
          comments: prev.comments.filter((c) => c._id !== id),
        }));
      })
      .catch((err) => console.error("Error deleting comment:", err));
  };

  const indexOfLast = page * moviesPerPage;
  const indexOfFirst = indexOfLast - moviesPerPage;
  const currentMovies = movies.slice(indexOfFirst, indexOfLast);

  return (
    <Paper elevation={6} sx={{ bgcolor: "#fafafa", minHeight: "100vh" }}>
      <AppBar position="sticky" sx={{ bgcolor: "#212121" }}>
        <Toolbar>
          <Typography
            variant="h4"
            sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 2 }}
          >
            My MFlix
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 5 }}>
        {!selectedMovie ? (
          <>
            <Grid container spacing={4}>
              {currentMovies.map((movie) => (
                <Grid item key={movie._id} xs={12} sm={6} md={4} lg={3}>
                  <Card
                    elevation={3}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.3s, box-shadow 0.3s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 6,
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={movie.poster || "/placeholder.jpg"}
                      alt={movie.title}
                      sx={{ height: 260, objectFit: "cover" }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography
                        variant="subtitle1"
                        noWrap
                        sx={{ fontWeight: 600 }}
                      >
                        {movie.title}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                      <Button
                        size="medium"
                        variant="contained"
                        color="primary"
                        onClick={() => fetchMovieDetails(movie._id)}
                      >
                        Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={Math.ceil(movies.length / moviesPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </>
        ) : (
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setSelectedMovie(null)}
              sx={{ mb: 3, color: "#616161" }}
            >
              Back
            </Button>
            <Grid container spacing={5}>
              <Grid item xs={12} md={4}>
                <Card elevation={4} sx={{ borderRadius: 2 }}>
                  <CardMedia
                    component="img"
                    image={selectedMovie.poster || "/placeholder.jpg"}
                    alt={selectedMovie.title}
                    sx={{ height: 440, objectFit: "cover", borderRadius: 2 }}
                  />
                </Card>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 800 }}>
                  {selectedMovie.title}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Released in {selectedMovie.year}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
                  {selectedMovie.plot}
                </Typography>
                <Typography variant="body2" paragraph sx={{ mb: 4 }}>
                  <strong>Cast:</strong>{" "}
                  {selectedMovie.cast?.join(", ") || "N/A"}
                </Typography>
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                  Comments
                </Typography>
                <List disablePadding>
                  {selectedMovie.comments?.length > 0 ? (
                    selectedMovie.comments.map((comment) => (
                      <ListItem
                        key={comment._id}
                        sx={{
                          mb: 2,
                          bgcolor: "#f0f0f0",
                          borderRadius: 1,
                          px: 2,
                          py: 1,
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            <DeleteIcon sx={{ color: "#b0b0b0" }} />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={comment.text}
                          secondary={`— ${comment.name}, ${new Date(
                            comment.date
                          ).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No comments yet. Be the first to comment!
                    </Typography>
                  )}
                </List>
                <Box sx={{ display: "flex", mt: 4 }}>
                  <TextField
                    fullWidth
                    label="Write a comment..."
                    variant="outlined"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button
                    sx={{ ml: 2 }}
                    variant="contained"
                    color="secondary"
                    onClick={handleAddComment}
                  >
                    Post
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </Paper>
  );
}
export default App;
