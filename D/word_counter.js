class WordCounter {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.counterElement = null;
        this.isActive = false;
        this.observer = null;
        this.currentText = '';
        this.init();
    }

    init() {
        this.createCounter();
        this.attachToInput();
    }

    createCounter() {
        // Create counter element
        this.counterElement = document.createElement('div');
        this.counterElement.id = 'gemini-word-counter';
        this.counterElement.className = 'gemini-word-counter';
        this.counterElement.innerHTML = `
            <span class="counter-text">0 characters / 0 words</span>
            <button class="counter-toggle" title="Toggle counter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
                    <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"/>
                </svg>
            </button>
        `;

        // Add event listener for toggle button
        const toggleButton = this.counterElement.querySelector('.counter-toggle');
        toggleButton.addEventListener('click', () => this.toggleCounter());

        // Inject counter styles
        this.injectStyles();
    }

    injectStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .gemini-word-counter {
                position: fixed;
                bottom: 100px;
                right: 20px;
                background: #2d2d2f;
                color: #e8eaed;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-family: 'Google Sans', 'Roboto', sans-serif;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                opacity: 0;
                transform: translateY(20px);
                pointer-events: none;
            }

            .gemini-word-counter.active {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }

            .gemini-word-counter.minimized .counter-text {
                display: none;
            }

            .gemini-word-counter.minimized {
                padding: 8px;
                border-radius: 50%;
            }

            .counter-text {
                font-weight: 500;
                white-space: nowrap;
            }

            .counter-toggle {
                background: none;
                border: none;
                color: #9aa0a6;
                cursor: pointer;
                padding: 2px;
                border-radius: 4px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .counter-toggle:hover {
                background: rgba(138, 180, 248, 0.1);
                color: #8ab4f8;
            }

            /* Light theme support */
            @media (prefers-color-scheme: light) {
                .gemini-word-counter {
                    background: #ffffff;
                    color: #1f1f1f;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    border: 1px solid #dadce0;
                }

                .counter-toggle {
                    color: #5f6368;
                }

                .counter-toggle:hover {
                    background: rgba(26, 115, 232, 0.1);
                    color: #1a73e8;
                }
            }

            /* Dark theme detection */
            body.dark-theme .gemini-word-counter,
            body.dark_mode_toggled .gemini-word-counter {
                background: #2d2d2f;
                color: #e8eaed;
                border: none;
            }

            body.dark-theme .counter-toggle,
            body.dark_mode_toggled .counter-toggle {
                color: #9aa0a6;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .gemini-word-counter {
                    bottom: 80px;
                    right: 16px;
                    font-size: 11px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    attachToInput() {
        // Function to find and attach to Gemini input
        const findAndAttachToInput = () => {
            const selectors = [
                '.ql-editor.textarea.new-input-ui',
                'rich-textarea .ql-editor',
                '.ql-editor[contenteditable="true"]',
                'div[contenteditable="true"][role="textbox"]'
            ];

            let geminiInput = null;
            
            for (const selector of selectors) {
                geminiInput = document.querySelector(selector);
                if (geminiInput) {
                    console.log(`Word counter attached to: ${selector}`);
                    break;
                }
            }

            if (geminiInput) {
                // Add counter to page
                document.body.appendChild(this.counterElement);
                
                // Set up observer for content changes
                this.setupObserver(geminiInput);
                
                // Initial count
                this.updateCount(geminiInput);
                
                // Show counter if there's text
                if (geminiInput.textContent.trim()) {
                    this.showCounter();
                }
                
                return true;
            }
            
            return false;
        };

        // Try to attach immediately
        if (!findAndAttachToInput()) {
            // If not found, try again after a delay
            setTimeout(() => {
                findAndAttachToInput();
            }, 1000);
        }
    }

    setupObserver(inputElement) {
        // Clean up existing observer
        if (this.observer) {
            this.observer.disconnect();
        }

        // Create new observer
        this.observer = new MutationObserver(() => {
            this.updateCount(inputElement);
        });

        // Start observing
        this.observer.observe(inputElement, {
            childList: true,
            characterData: true,
            subtree: true
        });

        // Also listen for input events
        inputElement.addEventListener('input', () => {
            this.updateCount(inputElement);
        });

        // Listen for focus/blur to show/hide counter
        inputElement.addEventListener('focus', () => {
            this.showCounter();
        });

        inputElement.addEventListener('blur', () => {
            // Hide counter after a delay if no text
            setTimeout(() => {
                if (!this.currentText.trim()) {
                    this.hideCounter();
                }
            }, 2000);
        });
    }

    updateCount(inputElement) {
        // Get text content
        const text = inputElement.textContent || inputElement.innerText || '';
        this.currentText = text;

        // Calculate counts
        const charCount = text.length;
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

        // Update counter display
        const counterText = this.counterElement.querySelector('.counter-text');
        counterText.textContent = `${charCount} characters / ${wordCount} words`;

        // Show counter if there's text
        if (charCount > 0) {
            this.showCounter();
        }
    }

    showCounter() {
        if (!this.isActive) {
            this.counterElement.classList.add('active');
            this.isActive = true;
        }
    }

    hideCounter() {
        if (this.isActive) {
            this.counterElement.classList.remove('active');
            this.isActive = false;
        }
    }

    toggleCounter() {
        this.counterElement.classList.toggle('minimized');
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        if (this.counterElement && this.counterElement.parentNode) {
            this.counterElement.parentNode.removeChild(this.counterElement);
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.WordCounter = WordCounter;
}