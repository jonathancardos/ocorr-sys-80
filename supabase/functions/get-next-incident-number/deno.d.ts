declare namespace Deno {
  export const serve: (handler: (request: Request) => Response | Promise<Response>) => void;
  export const env: {
    get(key: string): string | undefined;
  };
}