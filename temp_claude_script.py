import asyncio
from playwright.async_api import async_playwright
import sys

# Increase the max size of the standard output buffer
# This is crucial for handling large outputs like generated code
sys.stdout.reconfigure(encoding='utf-8')

async def get_claude_response(prompt):
    """
    Connects to Chrome, sends a single prompt to Claude, and returns the response.
    """
    async with async_playwright() as p:
        try:
            browser = await p.chromium.connect_over_cdp("http://localhost:9222")
            context = browser.contexts[0]
            
            page = None
            for p_iter in context.pages:
                if "claude.ai" in p_iter.url:
                    page = p_iter
                    break
            
            if not page:
                print("Error: Could not find an open tab with claude.ai.", file=sys.stderr)
                return None

            await page.bring_to_front()

            # Start a new chat to ensure a clean slate
            try:
                new_chat_button_locator = page.locator("button:has(svg > path[d^='M10 3'])")
                await new_chat_button_locator.wait_for(state="visible", timeout=5000)
                await new_chat_button_locator.click()
                await page.locator("div[contenteditable='true']").wait_for(state="visible", timeout=10000)
            except Exception:
                # If it fails, just continue in the current chat.
                print("Could not start a new chat, continuing in the current one.", file=sys.stderr)

            # Send the prompt
            await page.locator("div[contenteditable='true']").fill(prompt)
            await page.locator("button[aria-label='Send message']").click()

            # Wait for the response to finish
            newest_claude_response_group = page.locator("div.group").filter(has=page.locator("div.font-claude-message")).last
            copy_button_locator = newest_claude_response_group.locator("button:has(svg[data-testid='action-bar-copy'])")
            
            # Increased timeout for potentially long code generation
            await copy_button_locator.wait_for(state="visible", timeout=120000) 

            response_text_container = newest_claude_response_group.locator("div.font-claude-message")
            claude_response = await response_text_container.inner_text()
            
            # The actual response is all we print to stdout
            print(claude_response.strip())

            return claude_response.strip()

        except Exception as e:
            print(f"An error occurred: {e}", file=sys.stderr)
            return None

async def main():
    # Read the entire prompt from stdin
    prompt = sys.stdin.read()
    await get_claude_response(prompt)

if __name__ == "__main__":
    asyncio.run(main()) 