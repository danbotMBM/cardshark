import collections
import json
import asyncio
from websockets.server import serve
import time


print("started")
a = asyncio.Queue()
start_time = time.time()

async def handle_connection(websocket, path):
    async for message in websocket:
        t = time.time()
        print(f"{message} at time: {t:.6f} seconds")
        a.append(message)
async def print_queue():
    while True:
        t = time.time()
        print(f"{a.get()} at time: {t:.6f} seconds")

async def main():
    server = asyncio.create_task(print_queue())
    print("past")
    start_server = serve(handle_connection, "0.0.0.0", 8080)
    await asyncio.gather(start_server, server)


if __name__ == "__main__":
    asyncio.run(main())
