import asyncio
import json
import random
import os
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

async def get_last_response_text(page):
    """Gets the inner text of the very last response message using page.evaluate for robustness."""
    last_message_selector = "div.font-claude-message"
    
    last_text = await page.evaluate(f"""() => {{
        const messages = document.querySelectorAll('{last_message_selector}');
        if (messages.length > 0) {{
            return messages[messages.length - 1].textContent;
        }}
        return null;
    }}""")
    return last_text

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
        artifact_button = await detect_artifact_button(page)
        
        if not artifact_button:
            print("No artifact button found in latest response.")
            return None
            
        print("Artifact button found! Clicking to open Code Canvas...")
        await artifact_button.click()

        # Wait for Code Canvas to load
        await asyncio.sleep(2)

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

async def send_message_and_wait(page, message, timeout=60000):
    """Sends a message and waits for a new, complete response by polling."""
    print(f"Sending: {message}")

    last_response_before_send = await get_last_response_text(page)
    
    input_selector = 'div[contenteditable="true"]'
    
    print("Waiting for input box to be ready...")
    await page.wait_for_selector(input_selector, state='visible', timeout=10000)
    
    await page.wait_for_function(
        f"document.querySelector('{input_selector}') && !document.querySelector('{input_selector}').disabled",
        timeout=10000
    )
    
    input_box = page.locator(input_selector)
    
    await input_box.click()
    await input_box.fill('')
    await input_box.fill(message)
    await input_box.press('Enter')

    print("Waiting for a new response to appear...")
    
    end_time = asyncio.get_event_loop().time() + timeout / 1000
    new_response_text = None
    success = False

    while asyncio.get_event_loop().time() < end_time:
        current_last_response = await get_last_response_text(page)
        
        if current_last_response and current_last_response != last_response_before_send:
            print("New response text detected. Checking for completion...")
            
            last_message_group = page.locator('[data-is-streaming]').last
            copy_button = last_message_group.locator('svg[data-testid="action-bar-copy"]')
            
            try:
                await copy_button.wait_for(state='visible', timeout=5000)
                print("Response is complete (Copy button found).")
                new_response_text = current_last_response
                success = True
                break
            except PlaywrightTimeoutError:
                print("Response text found, but not yet complete. Continuing to wait...")
        
        await asyncio.sleep(1)

    if not success:
        print("Timeout: Did not receive a complete new response in time.")

    return success, new_response_text

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
        page = await get_claude_page(context)

        if not page:
            print("Could not find claude.ai tab. Please ensure it's open.")
            return

        print(f"Found claude.ai tab: {page.url}")
        
        await page.bring_to_front()
        await page.wait_for_load_state('networkidle')
        
        conversations = [
            "Show a code on code canvas.",
            "That's a great example. Can you explain what a 'generator function' is in the context of this code?",
            "Thank you!"
        ]
        
        for i, message in enumerate(conversations):
            print(f"\n--- Turn {i+1} ---")
            
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