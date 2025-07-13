// ================================================================
// VOICE_MODE.JS - Voice Mode Feature with Listen & Download
// ================================================================
class VoiceMode {
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
        this.processedResponses = new WeakSet();
        this.init();
    }

    async init() {
        if (this.isInitialized) return;

        console.log('Initializing Voice Mode feature...');

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

        // Check for existing responses with delay to avoid duplicates
        setTimeout(() => this.checkExistingResponses(), 1000);

        this.isInitialized = true;
        console.log('Voice Mode feature initialized');
    }

    loadVoices() {
        this.voices = speechSynthesis.getVoices();
        if (this.voices.length === 0) {
            setTimeout(() => this.loadVoices(), 100);
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get('voiceModeSettings');
            if (result.voiceModeSettings) {
                this.settings = { ...this.settings, ...result.voiceModeSettings };
            }
        } catch (error) {
            console.log('Using default voice settings');
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({ voiceModeSettings: this.settings });
        } catch (error) {
            console.error('Failed to save voice settings:', error);
        }
    }

    startResponseMonitoring() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Add a small delay to ensure DOM is fully rendered
                        setTimeout(() => this.checkForNewResponses(node), 500);
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
        const responseSelectors = [
            'message-content.model-response-text',
            '.model-response-text:not(.has-voice-buttons)',
            '.markdown.markdown-main-panel',
            '[data-message-author-role="assistant"]'
        ];

        responseSelectors.forEach(selector => {
            const responses = document.querySelectorAll(selector);
            responses.forEach(response => {
                if (!this.processedResponses.has(response) && !response.querySelector('.voice-mode-container')) {
                    this.addVoiceButtonsToResponse(response);
                }
            });
        });
    }

    checkForNewResponses(element) {
        const responseSelectors = [
            'message-content.model-response-text',
            '.model-response-text',
            '.markdown.markdown-main-panel',
            '[data-message-author-role="assistant"]'
        ];

        // Check if element itself is a response
        responseSelectors.forEach(selector => {
            if (element.matches && element.matches(selector)) {
                if (!this.processedResponses.has(element) && !element.querySelector('.voice-mode-container')) {
                    setTimeout(() => this.addVoiceButtonsToResponse(element), 100);
                }
            }
        });

        // Check child elements
        responseSelectors.forEach(selector => {
            const responses = element.querySelectorAll ? element.querySelectorAll(selector) : [];
            responses.forEach(response => {
                if (!this.processedResponses.has(response) && !response.querySelector('.voice-mode-container')) {
                    setTimeout(() => this.addVoiceButtonsToResponse(response), 100);
                }
            });
        });
    }

    addVoiceButtonsToResponse(responseElement) {
        // Double-check to prevent duplicates
        if (this.processedResponses.has(responseElement) || responseElement.querySelector('.voice-mode-container')) {
            return;
        }

        // Mark as processed immediately
        this.processedResponses.add(responseElement);
        responseElement.classList.add('has-voice-buttons');

        if (!this.isAIResponse(responseElement)) return;

        console.log('Adding voice buttons to response:', responseElement);

        const voiceContainer = this.createVoiceContainer(responseElement);
        const insertionPoint = this.findInsertionPoint(responseElement);
        
        if (insertionPoint) {
            insertionPoint.appendChild(voiceContainer);
        }
    }

    isAIResponse(element) {
        const text = element.textContent || '';
        if (text.trim().length < 10) return false;

        // Skip user messages
        if (element.closest('[data-message-author-role="user"]') ||
            element.closest('.user-message') ||
            element.closest('.human-message')) {
            return false;
        }

        // Check for AI response indicators
        const isGeminiResponse = element.classList.contains('model-response-text') ||
                                element.closest('.model-response-text') ||
                                element.querySelector('.markdown.markdown-main-panel');

        return isGeminiResponse;
    }

    findInsertionPoint(responseElement) {
        // Check if we already have a voice container
        const existing = responseElement.querySelector('.voice-mode-container');
        if (existing) return null;

        let insertionPoint = null;

        // Try to find existing action area
        const possibleContainers = [
            responseElement.querySelector('.response-footer'),
            responseElement.querySelector('.message-actions'),
            responseElement.querySelector('.response-actions'),
            responseElement.parentElement?.querySelector('.response-footer')
        ];

        for (const container of possibleContainers) {
            if (container && !container.querySelector('.voice-mode-container')) {
                insertionPoint = container;
                break;
            }
        }

        if (!insertionPoint) {
            // Create our own container
            insertionPoint = document.createElement('div');
            insertionPoint.className = 'voice-mode-actions';
            insertionPoint.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 12px;
                align-items: center;
                padding: 8px 0;
                border-top: 1px solid var(--border-color, #e0e0e0);
            `;

            // For Gemini, append to the parent of the markdown content
            const markdownContent = responseElement.querySelector('.markdown.markdown-main-panel');
            if (markdownContent && markdownContent.parentElement) {
                markdownContent.parentElement.appendChild(insertionPoint);
            } else {
                responseElement.appendChild(insertionPoint);
            }
        }

        return insertionPoint;
    }

    createVoiceContainer(responseElement) {
        const container = document.createElement('div');
        container.className = 'voice-mode-container';
        container.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
        `;

        // Create Listen button
        const listenButton = this.createListenButton(responseElement);
        
        // Create Download button
        const downloadButton = this.createDownloadButton(responseElement);

        container.appendChild(listenButton);
        container.appendChild(downloadButton);

        return container;
    }

    createListenButton(responseElement) {
        const button = document.createElement('button');
        button.className = 'voice-mode-listen-btn';
        
        const isDarkTheme = document.body.classList.contains('dark-theme') || 
                           document.body.classList.contains('dark_mode_toggled');

        button.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <span>Listen</span>
        `;

        button.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border: 1px solid ${isDarkTheme ? '#5f6368' : '#dadce0'};
            border-radius: 20px;
            background: transparent;
            color: ${isDarkTheme ? '#8ab4f8' : '#1a73e8'};
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: 'Google Sans', Roboto, sans-serif;
            white-space: nowrap;
        `;

        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = isDarkTheme ? 'rgba(138, 180, 248, 0.08)' : 'rgba(26, 115, 232, 0.08)';
            button.style.borderColor = isDarkTheme ? '#8ab4f8' : '#1a73e8';
        });

        button.addEventListener('mouseleave', () => {
            if (!button.classList.contains('playing')) {
                button.style.backgroundColor = 'transparent';
                button.style.borderColor = isDarkTheme ? '#5f6368' : '#dadce0';
            }
        });

        // Click handler
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleListenClick(responseElement, button);
        });

        return button;
    }

    createDownloadButton(responseElement) {
        const button = document.createElement('button');
        button.className = 'voice-mode-download-btn';
        button.title = 'Download as audio';
        
        const isDarkTheme = document.body.classList.contains('dark-theme') || 
                           document.body.classList.contains('dark_mode_toggled');

        button.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        button.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: 1px solid ${isDarkTheme ? '#5f6368' : '#dadce0'};
            border-radius: 50%;
            background: transparent;
            color: ${isDarkTheme ? '#8ab4f8' : '#1a73e8'};
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = isDarkTheme ? 'rgba(138, 180, 248, 0.08)' : 'rgba(26, 115, 232, 0.08)';
            button.style.borderColor = isDarkTheme ? '#8ab4f8' : '#1a73e8';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
            button.style.borderColor = isDarkTheme ? '#5f6368' : '#dadce0';
        });

        // Click handler
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDownloadClick(responseElement);
        });

        return button;
    }

    handleListenClick(responseElement, button) {
        const text = this.extractTextFromResponse(responseElement);
        if (!text) {
            alert('Could not extract text from this response.');
            return;
        }

        // If already playing this button, stop
        if (this.isPlaying && button.classList.contains('playing')) {
            this.stopSpeaking();
            return;
        }

        // Stop any other playing audio
        if (this.isPlaying) {
            this.stopSpeaking();
        }

        // Start playing
        this.playText(text, button);
    }

    handleDownloadClick(responseElement) {
        const text = this.extractTextFromResponse(responseElement);
        if (!text) {
            alert('Could not extract text from this response.');
            return;
        }

        // Use Web Speech API to generate audio blob
        this.generateAndDownloadAudio(text);
    }

    async generateAndDownloadAudio(text) {
        try {
            // Show loading state
            const downloadButtons = document.querySelectorAll('.voice-mode-download-btn');
            downloadButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            });

            // Create a more sophisticated approach using MediaRecorder
            const utterance = new SpeechSynthesisUtterance(text);
            
            if (this.voices.length > 0) {
                utterance.voice = this.voices[this.settings.selectedVoice];
            }
            utterance.rate = this.settings.rate;
            utterance.pitch = this.settings.pitch;
            utterance.volume = this.settings.volume;

            // For now, we'll create a text file with the content and settings
            // (Full audio generation would require a server-side API)
            const audioSettings = {
                text: text,
                voice: this.voices[this.settings.selectedVoice]?.name || 'Default',
                rate: this.settings.rate,
                pitch: this.settings.pitch,
                volume: this.settings.volume
            };

            const blob = new Blob([JSON.stringify(audioSettings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gemini-response-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show info message
            this.showToast('Downloaded response data. Note: Audio file generation requires additional setup.');

        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Download failed. Please try again.');
        } finally {
            // Reset button states
            const downloadButtons = document.querySelectorAll('.voice-mode-download-btn');
            downloadButtons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'voice-mode-toast';
        toast.textContent = message;
        
        const isDarkTheme = document.body.classList.contains('dark-theme') || 
                           document.body.classList.contains('dark_mode_toggled');

        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${isDarkTheme ? '#2d2d2f' : '#323232'};
            color: #fff;
            padding: 12px 24px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-family: 'Google Sans', Roboto, sans-serif;
        `;

        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.style.opacity = '1', 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    extractTextFromResponse(responseElement) {
        const clone = responseElement.cloneNode(true);
        
        // Remove non-content elements
        const selectorsToRemove = [
            'button', 
            '.response-actions', 
            '.message-actions', 
            '.voice-mode-container',
            '.voice-mode-actions',
            '.code-block-header',
            'pre',
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
            </svg>
            <span>Stop</span>
        `;
        
        const isDarkTheme = document.body.classList.contains('dark-theme') || 
                           document.body.classList.contains('dark_mode_toggled');
        button.style.backgroundColor = isDarkTheme ? 'rgba(138, 180, 248, 0.08)' : 'rgba(26, 115, 232, 0.08)';
        
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <span>Listen</span>
        `;
        button.style.backgroundColor = 'transparent';
    }

    // Voice settings modal (same as before)
    showVoiceSettings() {
        const existingModal = this.shadowRoot.getElementById('voice-settings-modal');
        if (existingModal) {
            existingModal.style.display = 'block';
            return;
        }

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

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        this.shadowRoot.appendChild(modalContainer.firstElementChild);

        this.addSettingsStyles();
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
        
        modal.querySelector('#close-voice-settings').onclick = () => {
            modal.style.display = 'none';
        };
        
        modal.querySelector('#voice-select').onchange = (e) => {
            this.settings.selectedVoice = parseInt(e.target.value);
            this.saveSettings();
        };
        
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
        
        modal.querySelector('#reset-voice-btn').onclick = () => {
            this.settings = {
                selectedVoice: 0,
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0
            };
            this.saveSettings();
            
            modal.querySelector('#voice-select').value = '0';
            modal.querySelector('#rate-slider').value = '1';
            modal.querySelector('#rate-value').textContent = '1';
            modal.querySelector('#pitch-slider').value = '1';
            modal.querySelector('#pitch-value').textContent = '1';
            modal.querySelector('#volume-slider').value = '1';
            modal.querySelector('#volume-value').textContent = '1';
        };
    }

    announcePresence() {
        console.log('Voice Mode feature is active');
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.VoiceMode = VoiceMode;
}