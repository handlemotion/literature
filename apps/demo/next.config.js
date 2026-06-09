import { withLiterature } from "@handlemotion/literature";

export default withLiterature(
  {
    allowedDevOrigins: [
      "localhost",
      "127.0.0.1",
      "*.localhost",
      "literature.localhost",
      "*.literature.localhost",
    ],
  },
  { projectRoot: process.cwd() },
);
