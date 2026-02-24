import { app } from './app';
import { migrate } from './lib/migrate';

const port = Number(process.env.PORT ?? 3000);

migrate();

app.listen(port, () => {
  console.log(`Backend listening on ${port}`);
});
