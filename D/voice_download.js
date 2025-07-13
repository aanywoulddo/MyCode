// ================================================================
// VOICE_DOWNLOAD.JS - Fixed Voice Download Feature
// ================================================================
class VoiceDownload {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.isInitialized = false;
        this.currentAudio = null;
        this.isPlaying = false;
        this.voices = [];
        this.settings = {
            selectedVoice: 0,
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
        this.voiceButtonsAdded = new WeakSet();
        this.init();
    }

    async init() {
        if (this.isInitialized) return;

        console.log('Initializing Voice Download feature...');

        // Load settings from storage
        await this.loadSettings();

        // Initialize voices
        this.loadVoices();

        // Set up voice change listener
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }

        // Start monitoring for new AI responses
        this.startResponseMonitoring();

        // Check for existing responses
        this.checkExistingResponses();

        this.isInitialized = true;
        console.log('Voice Download feature initialized');
    }

    loadVoices() {
        this.voices = speechSynthesis.getVoices();
        if (this.voices.length === 0) {
            // Retry after a short delay if voices aren't loaded yet
            setTimeout(() => this.loadVoices(), 100);
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get('voiceDownloadSettings');
            if (result.voiceDownloadSettings) {
                this.settings = { ...this.settings, ...result.voiceDownloadSettings };
            }
        } catch (error) {
            console.log('Using default voice settings');
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({ voiceDownloadSettings: this.settings });
        } catch (error) {
            console.error('Failed to save voice settings:', error);
        }
    }

    startResponseMonitoring() {
        // Use MutationObserver to detect new AI responses
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.checkForNewResponses(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    checkExistingResponses() {
        // Check all existing responses on the page
        const responseSelectors = [
            'message-content.model-response-text',
            '.model-response-text',
            '.markdown.markdown-main-panel',
            'model-response',
            '[data-message-author-role="assistant"]',
            '.conversation-turn.assistant',
            '.response-content'
        ];

        responseSelectors.forEach(selector => {
            const responses = document.querySelectorAll(selector);
            responses.forEach(response => {
                if (!this.voiceButtonsAdded.has(response)) {
                    this.addVoiceButtonToResponse(response);
                }
            });
        });
    }

    checkForNewResponses(element) {
        // Look for Gemini AI response containers
        const responseSelectors = [
            'message-content.model-response-text',
            '.model-response-text',
            '.markdown.markdown-main-panel',
            'model-response',
            '[data-message-author-role="assistant"]',
            '.conversation-turn.assistant'
        ];

        responseSelectors.forEach(selector => {
            const responses = element.querySelectorAll ? element.querySelectorAll(selector) : [];
            responses.forEach(response => {
                if (!this.voiceButtonsAdded.has(response)) {
                    this.addVoiceButtonToResponse(response);
                }
            });

            // Also check if the element itself matches
            if (element.matches && element.matches(selector)) {
                if (!this.voiceButtonsAdded.has(element)) {
                    this.addVoiceButtonToResponse(element);
                }
            }
        });
    }

    addVoiceButtonToResponse(responseElement) {
        // Skip if button already exists
        if (this.voiceButtonsAdded.has(responseElement)) return;

        // Mark as processed
        this.voiceButtonsAdded.add(responseElement);

        // Skip if this doesn't look like an AI response
        if (!this.isAIResponse(responseElement)) return;

        console.log('Adding voice button to response:', responseElement);

        const voiceButton = this.createVoiceButton(responseElement);

        // Try to find a good place to insert the button
        const insertionPoint = this.findInsertionPoint(responseElement);
        if (insertionPoint) {
            insertionPoint.appendChild(voiceButton);
        }
    }

    isAIResponse(element) {
        // Check various indicators that this is an AI response
        const text = element.textContent || '';

        // Skip very short responses
        if (text.trim().length < 10) return false;

        // Skip user messages
        if (element.closest('[data-message-author-role="user"]')) return false;
        if (element.closest('.user-message')) return false;
        if (element.closest('.human-message')) return false;

        // Look for AI response indicators
        const aiIndicators = [
            'model-response',
            'assistant-message',
            'bot-message',
            'ai-response',
            'model-response-text'
        ];

        const hasAIIndicator = aiIndicators.some(indicator =>
            element.classList.contains(indicator) ||
            element.closest(`.${indicator}`) ||
            element.hasAttribute('data-' + indicator.replace('-', '_'))
        );

        // For Gemini specifically, check for model response text
        const isGeminiResponse = element.classList.contains('model-response-text') ||
                                element.closest('.model-response-text') ||
                                element.querySelector('.markdown.markdown-main-panel');

        return hasAIIndicator || isGeminiResponse;
    }

    findInsertionPoint(responseElement) {
        // For Gemini, try to find the bottom of the response area
        let insertionPoint = null;

        // Try to find existing action area
        const possibleContainers = [
            responseElement.querySelector('.response-footer'),
            responseElement.querySelector('.message-actions'),
            responseElement.querySelector('.response-actions'),
            responseElement.parentElement?.querySelector('.response-footer')
        ];

        for (const container of possibleContainers) {
            if (container) {
                insertionPoint = container;
                break;
            }
        }

        if (!insertionPoint) {
            // Create our own action container
            insertionPoint = document.createElement('div');
            insertionPoint.className = 'voice-download-actions';
            insertionPoint.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 12px;
                align-items: center;
                padding: 8px 0;
                border-top: 1px solid var(--gf-border-color, #e0e0e0);
            `;

            // For Gemini, append to the parent of the markdown content if it exists
            const markdownContent = responseElement.querySelector('.markdown.markdown-main-panel');
            if (markdownContent && markdownContent.parentElement) {
                markdownContent.parentElement.appendChild(insertionPoint);
            } else {
                responseElement.appendChild(insertionPoint);
            }
        }

        return insertionPoint;
    }

    createVoiceButton(responseElement) {
        const button = document.createElement('button');
        button.className = 'voice-download-btn';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C11.4477 2 11 2.44772 11 3V11C11 11.5523 11.4477 12 12 12C12.5523 12 13 11.5523 13 11V3C13 2.44772 12.5523 2 12 2Z" fill="currentColor"/>
                <path d="M8 6C7.44772 6 7 6.44772 7 7V11C7 11.5523 7.44772 12 8 12C8.55228 12 9 11.5523 9 11V7C9 6.44772 8.55228 6 8 6Z" fill="currentColor"/>
                <path d="M16 6C15.4477 6 15 6.44772 15 7V11C15 11.5523 15.4477 12 16 12C16.5523 12 17 11.5523 17 11V7C17 6.44772 16.5523 6 16 6Z" fill="currentColor"/>
                <path d="M4 9C3.44772 9 3 9.44772 3 10V11C3 11.5523 3.44772 12 4 12C4.55228 12 5 11.5523 5 11V10C5 9.44772 4.55228 9 4 9Z" fill="currentColor"/>
                <path d="M20 9C19.4477 9 19 9.44772 19 10V11C19 11.5523 19.4477 12 20 12C20.5523 12 21 11.5523 21 11V10C21 9.44772 20.5523 9 20 9Z" fill="currentColor"/>
                <rect x="6" y="14" width="12" height="8" rx="2" fill="currentColor"/>
            </svg>
            <span>Listen</span>
        `;

        // Detect theme and apply appropriate styles
        const isDarkTheme = document.body.classList.contains('dark-theme') || 
                           document.body.classList.contains('dark_mode_toggled');

        button.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border: 1px solid ${isDarkTheme ? '#5f6368' : '#dadce0'};
            border-radius: 20px;
            background: transparent;
            color: ${isDarkTheme ? '#8ab4f8' : '#1a73e8'};
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: 'Google Sans', Roboto, sans-serif;
            white-space: nowrap;
            margin-right: 8px;
        `;

        // Add hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = isDarkTheme ? 'rgba(138, 180, 248, 0.08)' : 'rgba(26, 115, 232, 0.08)';
            button.style.borderColor = isDarkTheme ? '#8ab4f8' : '#1a73e8';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
            button.style.borderColor = isDarkTheme ? '#5f6368' : '#dadce0';
        });

        // Add click handler
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleVoiceButtonClick(responseElement, button);
        });

        return button;
    }

    handleVoiceButtonClick(responseElement, button) {
        const text = this.extractTextFromResponse(responseElement);
        if (!text) {
            alert('Could not extract text from this response.');
            return;
        }

        // If already playing, stop
        if (this.isPlaying && button.classList.contains('playing')) {
            this.stopSpeaking();
            return;
        }

        // Stop any other playing audio
        if (this.isPlaying) {
            this.stopSpeaking();
        }

        // Start playing this text
        this.playText(text, button);
    }

    extractTextFromResponse(responseElement) {
        // Clone the element to avoid modifying the live DOM
        const clone = responseElement.cloneNode(true);
        
        // Remove known non-content elements
        const selectorsToRemove = [
            'button', 
            '.response-actions', 
            '.message-actions', 
            '.action-buttons',
            '.voice-download-btn',
            '.voice-download-actions',
            '.code-block-header',
            'pre', // Remove code blocks
            'code',
            '.copy-code-button'
        ];
        
        selectorsToRemove.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // For Gemini, prefer markdown content
        const markdownContent = clone.querySelector('.markdown.markdown-main-panel');
        if (markdownContent) {
            return markdownContent.innerText || markdownContent.textContent || '';
        }
        
        // Fallback to full content
        return clone.innerText || clone.textContent || '';
    }

    playText(text, button) {
        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        if (this.voices.length > 0) {
            utterance.voice = this.voices[this.settings.selectedVoice] || this.voices[0];
        }
        utterance.rate = this.settings.rate;
        utterance.pitch = this.settings.pitch;
        utterance.volume = this.settings.volume;
        
        // Update button state
        button.classList.add('playing');
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
            </svg>
            <span>Stop</span>
        `;
        
        utterance.onstart = () => {
            this.isPlaying = true;
            this.currentButton = button;
        };

        utterance.onend = () => {
            this.resetButton(button);
            this.isPlaying = false;
            this.currentButton = null;
        };

        utterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            this.resetButton(button);
            this.isPlaying = false;
            this.currentButton = null;
        };
        
        speechSynthesis.speak(utterance);
    }

    stopSpeaking() {
        speechSynthesis.cancel();
        if (this.currentButton) {
            this.resetButton(this.currentButton);
        }
        this.isPlaying = false;
        this.currentButton = null;
    }

    resetButton(button) {
        button.classList.remove('playing');
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C11.4477 2 11 2.44772 11 3V11C11 11.5523 11.4477 12 12 12C12.5523 12 13 11.5523 13 11V3C13 2.44772 12.5523 2 12 2Z" fill="currentColor"/>
                <path d="M8 6C7.44772 6 7 6.44772 7 7V11C7 11.5523 7.44772 12 8 12C8.55228 12 9 11.5523 9 11V7C9 6.44772 8.55228 6 8 6Z" fill="currentColor"/>
                <path d="M16 6C15.4477 6 15 6.44772 15 7V11C15 11.5523 15.4477 12 16 12C16.5523 12 17 11.5523 17 11V7C17 6.44772 16.5523 6 16 6Z" fill="currentColor"/>
                <path d="M4 9C3.44772 9 3 9.44772 3 10V11C3 11.5523 3.44772 12 4 12C4.55228 12 5 11.5523 5 11V10C5 9.44772 4.55228 9 4 9Z" fill="currentColor"/>
                <path d="M20 9C19.4477 9 19 9.44772 19 10V11C19 11.5523 19.4477 12 20 12C20.5523 12 21 11.5523 21 11V10C21 9.44772 20.5523 9 20 9Z" fill="currentColor"/>
                <rect x="6" y="14" width="12" height="8" rx="2" fill="currentColor"/>
            </svg>
            <span>Listen</span>
        `;
    }

    // Voice settings modal
    showVoiceSettings() {
        // Check if modal already exists
        const existingModal = this.shadowRoot.getElementById('voice-settings-modal');
        if (existingModal) {
            existingModal.style.display = 'block';
            return;
        }

        // Create modal HTML
        const modalHTML = `
            <div id="voice-settings-modal" class="modal">
                <div class="modal-content" style="width: 500px;">
                    <div class="modal-header">
                        <h2>Voice Settings</h2>
                        <button class="icon-btn close-button" id="close-voice-settings">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-group">
                            <label for="voice-select">Voice:</label>
                            <select id="voice-select" class="settings-select">
                                ${this.voices.map((voice, index) => 
                                    `<option value="${index}" ${index === this.settings.selectedVoice ? 'selected' : ''}>
                                        ${voice.name} (${voice.lang})
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="settings-group">
                            <label for="rate-slider">Speed: <span id="rate-value">${this.settings.rate}</span></label>
                            <input type="range" id="rate-slider" min="0.5" max="2" step="0.1" value="${this.settings.rate}">
                        </div>
                        
                        <div class="settings-group">
                            <label for="pitch-slider">Pitch: <span id="pitch-value">${this.settings.pitch}</span></label>
                            <input type="range" id="pitch-slider" min="0.5" max="2" step="0.1" value="${this.settings.pitch}">
                        </div>
                        
                        <div class="settings-group">
                            <label for="volume-slider">Volume: <span id="volume-value">${this.settings.volume}</span></label>
                            <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="${this.settings.volume}">
                        </div>
                        
                        <div class="settings-actions">
                            <button class="button primary" id="test-voice-btn">Test Voice</button>
                            <button class="button secondary" id="reset-voice-btn">Reset Defaults</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to shadow DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        this.shadowRoot.appendChild(modalContainer.firstElementChild);

        // Add styles
        this.addSettingsStyles();

        // Add event listeners
        this.addSettingsEventListeners();
    }

    addSettingsStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .settings-group {
                margin-bottom: 20px;
            }
            
            .settings-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--gf-text-primary);
            }
            
            .settings-select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--gf-border-color);
                border-radius: 6px;
                background: var(--gf-bg-input);
                color: var(--gf-text-primary);
                font-size: 14px;
            }
            
            input[type="range"] {
                width: 100%;
                margin-top: 8px;
            }
            
            .settings-actions {
                display: flex;
                gap: 12px;
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid var(--gf-border-color);
            }
        `;
        
        this.shadowRoot.appendChild(styles);
    }

    addSettingsEventListeners() {
        const modal = this.shadowRoot.getElementById('voice-settings-modal');
        
        // Close button
        modal.querySelector('#close-voice-settings').onclick = () => {
            modal.style.display = 'none';
        };
        
        // Voice select
        modal.querySelector('#voice-select').onchange = (e) => {
            this.settings.selectedVoice = parseInt(e.target.value);
            this.saveSettings();
        };
        
        // Sliders
        ['rate', 'pitch', 'volume'].forEach(param => {
            const slider = modal.querySelector(`#${param}-slider`);
            const value = modal.querySelector(`#${param}-value`);
            
            slider.oninput = (e) => {
                const val = parseFloat(e.target.value);
                this.settings[param] = val;
                value.textContent = val.toFixed(1);
                this.saveSettings();
            };
        });
        
        // Test voice button
        modal.querySelector('#test-voice-btn').onclick = () => {
            const testText = "Hello! This is a test of the voice settings. How does this sound?";
            const utterance = new SpeechSynthesisUtterance(testText);
            
            if (this.voices.length > 0) {
                utterance.voice = this.voices[this.settings.selectedVoice];
            }
            utterance.rate = this.settings.rate;
            utterance.pitch = this.settings.pitch;
            utterance.volume = this.settings.volume;
            
            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);
        };
        
        // Reset button
        modal.querySelector('#reset-voice-btn').onclick = () => {
            this.settings = {
                selectedVoice: 0,
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0
            };
            this.saveSettings();
            
            // Update UI
            modal.querySelector('#voice-select').value = '0';
            modal.querySelector('#rate-slider').value = '1';
            modal.querySelector('#rate-value').textContent = '1';
            modal.querySelector('#pitch-slider').value = '1';
            modal.querySelector('#pitch-value').textContent = '1';
            modal.querySelector('#volume-slider').value = '1';
            modal.querySelector('#volume-value').textContent = '1';
        };
    }

    // Method to show this is active (for debugging)
    announcePresence() {
        console.log('Voice Download feature is active');
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.VoiceDownload = VoiceDownload;
}