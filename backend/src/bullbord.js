import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { reportQueue } from "./queues/reportQueue.js";

export default function setupBullBoard(app) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(reportQueue)],
    serverAdapter,
  });

  // FIX: use getRouter() to get the actual middleware
  app.use("/admin/queues", serverAdapter.getRouter());
}
