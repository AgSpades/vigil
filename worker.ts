import openNextWorker from "./.open-next/worker.js";
import { getAllActiveUsers } from "./lib/db/users";
import { checkHeartbeat } from "./lib/scheduler/check-heartbeat";

type WorkerContext = {
  waitUntil: (promise: Promise<unknown>) => void;
};

async function runHeartbeatSweep() {
  const users = await getAllActiveUsers();
  await Promise.all(users.map((user) => checkHeartbeat(user.id)));
}

const worker = {
  fetch(request: Request, env: unknown, ctx: WorkerContext): Promise<Response> {
    return (
      openNextWorker as {
        fetch: (
          req: Request,
          e: unknown,
          c: WorkerContext,
        ) => Promise<Response>;
      }
    ).fetch(request, env, ctx);
  },
  scheduled(_controller: unknown, _env: unknown, ctx: WorkerContext): void {
    ctx.waitUntil(runHeartbeatSweep());
  },
};

export default worker;
