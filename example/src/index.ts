import express, { Request, Response } from 'express';

const PORT = process.env.PORT || 8090;
const server = express();

server.use('/', (req: Request, res: Response) => {
  res.send('It works');
});

server.listen(PORT, () => console.log(`Server is running on ${PORT} port`));

