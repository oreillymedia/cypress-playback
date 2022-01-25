const {
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
} = MaterialUI;

export function TodoCard({ todo }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <CardMedia
          component="img"
          sx={{
            maxHeight: 200,
            maxWidth: 300
          }}
          image={`https://www.fillmurray.com/300/${200 + todo.id * 2}`}
          alt="random"
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography>
            {todo.title}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}
