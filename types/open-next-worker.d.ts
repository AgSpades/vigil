declare module "*.open-next/worker.js" {
  type WorkerContext = {
    waitUntil: (promise: Promise<unknown>) => void;
  };

  const worker: {
    fetch: (
      request: Request,
      env: unknown,
      ctx: WorkerContext,
    ) => Promise<Response>;
  };

  export default worker;
}
