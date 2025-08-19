// server.js
import cors from "cors";
import express from "express";
import { userRoutes, sessionRoutes, leaveRoutes , reportRoutes} from "./routes/index.js";
import session from "express-session";
import pgSession from "connect-pg-simple";
import user from "./models/user.js"
import { requireAuth } from "./middlewares/authSession.js";
import {
  PORT,
  NODE_ENV,
  sequelize,
  SESS_NAME,
  SESS_SECRET,
  SESS_LIFETIME,
  pgPool
} from "./config.js";

const PgSession = pgSession(session);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected");
    // await sequelize.sync({ force: true });
    await sequelize.sync({ force: false, alter : true });  //backend testing only
    const app = express();

    app.use(
      cors({
        origin: "http://localhost:3001", // frontend Vite dev server
        credentials: true,
      })
    );
    app.disable("x-powered-by");
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(
      session({
        name: SESS_NAME,
        secret: SESS_SECRET,
        saveUninitialized: false,
        resave: false,
        rolling: true,
        store: new PgSession({
          pool: pgPool,
          tableName: "session",
          ttl: parseInt(SESS_LIFETIME) / 1000, // in seconds
          createTableIfMissing: true,
          pruneSessionInterval: 5, // for backend testing only
        }),
        cookie: {
          sameSite: true,
          secure: NODE_ENV === "production",
          maxAge: SESS_LIFETIME,
        },
      })
    );

    app.use((req, res, next) => {
      console.log(
        `${req.method} ${req.path} — Session:`,
        req.session?.user || "No session"
      );
      next();
    });

    // Export the app before listening
    const apiRouter = express.Router();
    app.use("/api", apiRouter);
    apiRouter.use("/session", sessionRoutes);

    // <-- FOR PRODUCTION
    // apiRouter.use("/users", requireAuth, userRoutes);
    // apiRouter.use("/leave", requireAuth, leaveRoutes);
    // apiRouter.use("/report",  reportRoutes);
    // -->

    // <-- REMOVE IN PRODUCTION
    apiRouter.use("/users",  userRoutes);
    apiRouter.use("/leave",  leaveRoutes);
    apiRouter.use("/report",  reportRoutes);
    // -->

    // Start server (optional - could move to index.js)
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  } catch (err) {
    console.log(err);
  }
})();
