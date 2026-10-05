import { tmdbAccessToken } from "./config";
import { createApp } from "./app";

const port = 3000;
const app = createApp(tmdbAccessToken);

app.listen(port, () => {
  console.log(`Example app in TypeScript listening on port ${port}`);
});
