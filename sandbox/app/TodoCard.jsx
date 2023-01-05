const {
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
} = MaterialUI;

const ids = [
  "9781491952016",
  "9781800562523",
  "9781492071198",
  "9780136502166",
  "9781492055747",
  "9781098122249",
  "9781617295867",
  "9781801079976",
  "9781789539509",
  "9780136752899",
];

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
          image={`https://learning.oreilly.com/covers/urn:orm:book:${ids[todo.id]}/300w/`}
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
