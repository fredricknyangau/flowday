import asyncio
from modules.push.tasks import send_push_notifications

async def main():
    print("Triggering push notifications manually...")
    await send_push_notifications()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
