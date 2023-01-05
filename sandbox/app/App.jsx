const { useEffect, useState } = React;
const {
  Box,
  colors,
  Container,
  createTheme,
  CssBaseline,
  Grid,
  ThemeProvider,
  Typography,
} = MaterialUI;

const TodoCard = await compileJsxModule('./TodoCard.jsx', 'TodoCard');

const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: colors.red.A400,
    },
  },
});

export function App() {
  const [todos, setTodos] = useState([]);
  useEffect(() => {
    const maxTodos = 6;
    const promises = [];
    for (let i = 0; i < maxTodos; i++) {
      promises.push(fetch(`https://jsonplaceholder.typicode.com/todos/${i + 1}`));
    }
    Promise.all(promises)
      .then((todos) => Promise.all(todos.map((todo) => todo.json())))
      .then((todos) => { setTodos(todos); });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Todo
          </Typography>
          <Container>
            <img src="./assets/static-image.png" alt="static-image" />
          </Container>
          <Grid container spacing={4}>
            {todos.map((todo) => (
              <TodoCard key={todo.id} todo={todo} />
            ))}
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  )
}
