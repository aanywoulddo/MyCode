import asyncio
import json
import random
import os
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from playwright.async_api import Page
from typing import Tuple

async def get_last_response_text(page: Page) -> str:
    """Gets the text content of the last response from Claude."""
    for _ in range(3): # Retry up to 3 times
        try:
            # First, scroll up to get the full conversation history
            scroller_selector = ".relative.h-full.flex-1.flex.overflow-x-hidden.overflow-y-scroll.pt-6"
            await page.evaluate(f"document.querySelector('{scroller_selector}').scrollTop = 0")
            await page.wait_for_timeout(1000) # Wait for content to load after scrolling

            last_text = await page.evaluate(f"""() => {{
                const chatContainer = document.querySelector('div.group.flex.flex-col.items-start');
                if (!chatContainer) return null;
                const responseElements = chatContainer.querySelectorAll('div[data-scroll-anchor]');
                if (responseElements.length === 0) return null;
                return responseElements[responseElements.length - 1].innerText;
            }}""")
            return last_text
        except Exception as e:
            if "Execution context was destroyed" in str(e):
                print("Execution context was destroyed, retrying...")
                await asyncio.sleep(1) # Wait a bit before retrying
                continue
            raise e
    return None # Return None if all retries fail

async def detect_artifact_button(page):
    """Detects if the latest response contains an artifact button."""
    try:
        # Look for the artifact button in the latest message
        artifact_button_selector = 'button[aria-label="Preview contents"]'
        
        # Check if any artifact buttons exist in the latest message area
        artifact_buttons = await page.locator(artifact_button_selector).all()
        
        if artifact_buttons:
            # Get the last (most recent) artifact button
            return artifact_buttons[-1]
        return None
    except Exception as e:
        print(f"Error detecting artifact button: {e}")
        return None

async def extract_artifact_code(page, turn_number):
    """Detects, clicks artifact button, and extracts code from Code Canvas."""
    try:
        print("Checking for artifact button...")
        try:
            # First, try to find the "Copy" button for the code canvas
            copy_button_selector = 'button:has-text("Copy")'
            copy_button = page.locator(copy_button_selector).first
            await copy_button.wait_for(timeout=10000) # Increased timeout
            print("Copy button found! Clicking to get code from Code Canvas...")
            
            # A more robust way to get clipboard content
            await page.evaluate('navigator.clipboard.writeText("")') # Clear clipboard first
            await copy_button.click()
            await page.wait_for_timeout(500) # Wait for clipboard to be populated
            clipboard_content = await page.evaluate('navigator.clipboard.readText()')
            
            if clipboard_content:
                filename = f"turn_{turn_number}_artifact_code.js"
                with open(os.path.join("FINAL WORK", filename), "w") as f:
                    f.write(clipboard_content)
                print(f"--- Code from artifact saved to {os.path.join("FINAL WORK", filename)} ---")
            else:
                print("Could not get code from clipboard.")

        except Exception as e:
            print(f"Could not find or interact with the copy button: {e}")
            # Fallback to the old method if the copy button isn't there
            try:
                artifact_button_selector = 'button:has-text("Open Code Canvas")'
                artifact_button = page.locator(artifact_button_selector).first
                await artifact_button.wait_for(timeout=5000)
                print("Artifact button found! Clicking to open Code Canvas...")
                await artifact_button.click()
                await page.wait_for_timeout(2000)

                # The user-provided, precise selector for the code content.
                final_selector = "body > div:nth-child(14) > div > div > main > div > div > div.flex-1.overflow-hidden.h-full.bg-bg-100 > div > div > div.flex-1.overflow-auto > div > div > div > div.cm-scroller > div.cm-content.cm-lineWrapping"
                
                extracted_code = None
                try:
                    print(f"Trying final selector: {final_selector}")
                    code_element = page.locator(final_selector)
                    
                    await code_element.wait_for(state='visible', timeout=10000)
                    
                    code_text = await code_element.text_content()
                    
                    if code_text and code_text.strip():
                        extracted_code = code_text.strip()
                        print("Successfully extracted code using final selector.")
                        
                except Exception as e:
                    print(f"Final selector failed: {e}")
                    # Fallback to previous logic if the final selector fails for some reason
                    # This part is omitted for brevity but could be reinstated if needed
                    print("Could not extract code from Code Canvas.")

                if extracted_code:
                    # Save the code to a file
                    os.makedirs("FINAL WORK", exist_ok=True)
                    artifact_filename = f"FINAL WORK/turn_{turn_number}_artifact_code.py"
                    
                    try:
                        with open(artifact_filename, "w", encoding="utf-8") as f:
                            f.write(extracted_code)
                        print(f"--- Artifact code saved to {artifact_filename} ---")
                        
                        preview = extracted_code[:500] + '...' if len(extracted_code) > 500 else extracted_code
                        print(f"Extracted code preview:\n{preview}")
                        
                    except Exception as e:
                        print(f"Error saving artifact code: {e}")
                else:
                    print("Could not extract code from Code Canvas")
                
                # Try to close the Code Canvas
                try:
                    close_button = page.locator('button[aria-label="Close"]').first
                    await close_button.wait_for(state='visible', timeout=5000)
                    await close_button.click()
                    print("Code Canvas closed.")

                    print("Reloading page to ensure input box is ready.")
                    await page.reload()
                    await page.wait_for_load_state('networkidle')

                except Exception as e:
                    print(f"Could not close Code Canvas: {e}")
                    
                await asyncio.sleep(1)
                    
                return extracted_code
                    
            except Exception as e:
                print(f"An error occurred in extract_artifact_code: {e}")
                return None
            
    except Exception as e:
        print(f"An error occurred in extract_artifact_code: {e}")
        return None

async def send_message_and_wait(page: Page, message: str, timeout: int = 120000) -> Tuple[bool, str]:
    """Sends a message and waits for the response to be complete."""
    print(f"Sending: {message}")
    
    input_selector = 'div[contenteditable="true"]'
    await page.fill(input_selector, message)
    
    print("Waiting for input box to be ready...")
    await page.wait_for_selector(input_selector, state='visible', timeout=10000)
      
    await page.wait_for_function(
         f"document.querySelector('{input_selector}') && !document.querySelector('{input_selector}').getAttribute('aria-disabled')",
          timeout=10000
    )
      
    input_box = page.locator(input_selector)
    
    await input_box.click()
    await page.keyboard.press("Meta+A")
    await page.keyboard.press("Backspace")
    
    await input_box.fill(message)
    await page.click('button[aria-label="Send message"]')
    
    print("Waiting for a new response to appear...")
    
    try:
        # Wait for the "Copy" button to appear, which indicates the response is complete
        copy_button_selector = 'button:has-text("Copy")'
        await page.locator(copy_button_selector).first.wait_for(timeout=timeout)
        print("Response is complete (Copy button found).")
        response_text = await get_last_response_text(page)
        return True, response_text
    except PlaywrightTimeoutError:
        print("Timeout: Did not receive a complete new response in time.")
        return False, await get_last_response_text(page)

async def find_claude_tab(browser):
    contexts = browser.contexts
    for context in contexts:
        for page in context.pages:
            if 'claude.ai' in page.url:
                return page
    return None

async def get_claude_page(context):
    """Finds the claude.ai page within a context."""
    for page in context.pages:
        if 'claude.ai' in page.url:
            return page
    return None

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp("http://localhost:9222")
        context = browser.contexts[0]
        page = context.pages[0]

        # Find the right tab
        target_url = "https://claude.ai"
        found_tab = False
        for p in context.pages:
            if target_url in p.url:
                page = p
                found_tab = True
                break
        
        if not found_tab:
            print(f"No tab with URL containing '{target_url}' found. Using the first tab: {page.url}")
        else:
            print(f"Found claude.ai tab: {page.url}")

        output_dir = "FINAL WORK"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        await page.bring_to_front()
        await page.wait_for_load_state('networkidle')
        
        conversations = [
            """I'm having trouble displaying a list of prompts in my Chrome extension's prompt library. The modal appears, but the prompts are not styled correctly and the full list is not showing up. I suspect there's a mismatch between my CSS and the HTML I'm generating in JavaScript.

Here's my `prompt_library.css` for the prompt items:
```css
.prompt-item {
  background: #ffffff;
  border: 1px solid #e8eaed;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.prompt-item .title {
  font-size: 16px;
  font-weight: 500;
  color: #202124;
  margin-bottom: 8px;
  line-height: 1.4;
}
.prompt-item .content {
  font-size: 14px;
  color: #5f6368;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

And here's the JavaScript I'm using to create the prompt items in `prompt_library.js`:
```javascript
const promptElement = document.createElement('div');
promptElement.className = 'prompt-item';
promptElement.innerHTML = `
    <h4>${prompt.title}</h4>
    <p>${prompt.content}</p>
`;
promptList.appendChild(promptElement);
```

Please identify the issue and provide the corrected JavaScript code for creating the prompt items so that the CSS is applied correctly. Also, please confirm that the large array of prompts I've added to `this.prompts` is being correctly used by the `loadPrompts` function.
"""
        ]
        
        for i, message in enumerate(conversations):
            print(f"--- Turn {i+1} ---")
            
            success, response_text = await send_message_and_wait(page, message)
            
            if not success:
                print(f"Failed to get complete response for turn {i+1}")
                break

            if response_text:
                printable_text = response_text[:1000] + '...' if len(response_text) > 1000 else response_text
                print(f"Claude:\n{printable_text}")
                
                file_path = f"FINAL WORK/turn_{i+1}_response.txt"
                try:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(response_text)
                    print(f"--- Full response saved to {file_path} ---")
                except Exception as e:
                    print(f"--- Error saving response to file: {e} ---")

            await extract_artifact_code(page, i + 1)

            await asyncio.sleep(2)
        
        print("\nConversation completed!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
