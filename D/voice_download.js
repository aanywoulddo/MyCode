// Voice Download Feature for Gemini Toolbox
// Inspired by ChatGPT Toolbox capabilities

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
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
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
        
        this.isInitialized = true;
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

    checkForNewResponses(element) {
        // Look for Gemini AI response containers
        const responseSelectors = [
            '[data-response-index]',
            '.model-response-text',
            '.response-content',
            '[role="presentation"] .markdown',
            '.conversation-turn',
            'model-response'
        ];

        responseSelectors.forEach(selector => {
            const responses = element.querySelectorAll ? element.querySelectorAll(selector) : [];
            responses.forEach(response => this.addVoiceButtonToResponse(response));
            
            // Also check if the element itself matches
            if (element.matches && element.matches(selector)) {
                this.addVoiceButtonToResponse(element);
            }
        });
    }

    addVoiceButtonToResponse(responseElement) {
        // Skip if button already exists
        if (responseElement.querySelector('.voice-download-btn')) return;
        
        // Skip if this doesn't look like an AI response
        if (!this.isAIResponse(responseElement)) return;

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
        
        // Skip user messages (usually have different styling/position)
        if (element.closest('[data-is-user-message="true"]')) return false;
        if (element.closest('.user-message')) return false;
        
        // Look for AI response indicators
        const aiIndicators = [
            'model-response',
            'assistant-message',
            'bot-message',
            'ai-response'
        ];
        
        return aiIndicators.some(indicator => 
            element.classList.contains(indicator) || 
            element.closest(`.${indicator}`) ||
            element.hasAttribute('data-' + indicator.replace('-', '_'))
        );
    }

    findInsertionPoint(responseElement) {
        // Look for existing action buttons container
        let actionContainer = responseElement.querySelector('.response-actions, .message-actions, .action-buttons');
        
        if (!actionContainer) {
            // Create our own action container
            actionContainer = document.createElement('div');
            actionContainer.className = 'voice-download-actions';
            actionContainer.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 8px;
                align-items: center;
                font-size: 14px;
            `;
            
            // Try to append to the end of the response
            responseElement.appendChild(actionContainer);
        }
        
        return actionContainer;
    }

    createVoiceButton(responseElement) {
        const button = document.createElement('button');
        button.className = 'voice-download-btn';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="2"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" stroke-width="2"/>
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>Voice</span>
        `;
        
        button.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 18px;
            background: var(--surface-color, #fff);
            color: var(--text-color, #333);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
            white-space: nowrap;
        `;
        
        // Add hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'var(--hover-color, #f5f5f5)';
            button.style.borderColor = 'var(--accent-color, #1976d2)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'var(--surface-color, #fff)';
            button.style.borderColor = 'var(--border-color, #e0e0e0)';
        });
        
        // Add click handler
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleVoiceButtonClick(responseElement, button);
        });
        
        return button;
    }

    handleVoiceButtonClick(responseElement, button) {
        // Show voice options dropdown
        this.showVoiceOptions(responseElement, button);
    }

    showVoiceOptions(responseElement, button) {
        // Remove any existing dropdown
        const existingDropdown = document.querySelector('.voice-options-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        const dropdown = document.createElement('div');
        dropdown.className = 'voice-options-dropdown';
        dropdown.innerHTML = `
            <div class="voice-option" data-action="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                </svg>
                <span>Play Audio</span>
            </div>
            <div class="voice-option" data-action="download">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2"/>
                    <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>Download MP3</span>
            </div>
            <div class="voice-option" data-action="settings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 1v6m0 6v6m11-5l-6-3.5 6-3.5M1 12l6 3.5L1 15.5" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>Voice Settings</span>
            </div>
        `;
        
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            background: var(--surface-color, #fff);
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            min-width: 150px;
            margin-top: 4px;
        `;
        
        // Position relative to button
        button.style.position = 'relative';
        button.appendChild(dropdown);
        
        // Add click handlers for options
        dropdown.querySelectorAll('.voice-option').forEach(option => {
            option.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                font-size: 13px;
                color: var(--text-color, #333);
            `;
            
            option.addEventListener('mouseenter', () => {
                option.style.backgroundColor = 'var(--hover-color, #f5f5f5)';
            });
            
            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = 'transparent';
            });
            
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = option.dataset.action;
                this.handleVoiceAction(action, responseElement, button);
                dropdown.remove();
            });
        });
        
        // Close dropdown on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown() {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            });
        }, 0);
    }

    handleVoiceAction(action, responseElement, button) {
        const text = this.extractTextFromResponse(responseElement);
        
        switch (action) {
            case 'play':
                this.playText(text, button);
                break;
            case 'download':
                this.downloadAudio(text, responseElement);
                break;
            case 'settings':
                this.showVoiceSettings();
                break;
        }
    }

    extractTextFromResponse(responseElement) {
        // Get clean text content, removing any UI elements
        let text = responseElement.textContent || '';
        
        // Remove common UI text that shouldn't be read
        const uiTexts = [
            'Copy code',
            'Copied!',
            'Show more',
            'Show less',
            'Voice',
            'Download',
            'Settings'
        ];
        
        uiTexts.forEach(uiText => {
            text = text.replace(new RegExp(uiText, 'gi'), '');
        });
        
        return text.trim();
    }

    playText(text, button) {
        // Stop any currently playing audio
        if (this.currentAudio) {
            speechSynthesis.cancel();
            this.currentAudio = null;
            this.isPlaying = false;
        }
        
        if (!text || text.length === 0) {
            alert('No text found to convert to speech');
            return;
        }
        
        // Create speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        if (this.voices.length > 0 && this.settings.selectedVoice < this.voices.length) {
            utterance.voice = this.voices[this.settings.selectedVoice];
        }
        utterance.rate = this.settings.rate;
        utterance.pitch = this.settings.pitch;
        utterance.volume = this.settings.volume;
        
        // Update button state
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
            </svg>
            <span>Stop</span>
        `;
        
        utterance.onend = () => {
            button.innerHTML = originalHTML;
            this.currentAudio = null;
            this.isPlaying = false;
        };
        
        utterance.onerror = () => {
            button.innerHTML = originalHTML;
            this.currentAudio = null;
            this.isPlaying = false;
            alert('Error playing audio');
        };
        
        // Add stop functionality to button
        const stopHandler = (e) => {
            e.stopPropagation();
            speechSynthesis.cancel();
            button.innerHTML = originalHTML;
            button.removeEventListener('click', stopHandler);
            this.currentAudio = null;
            this.isPlaying = false;
        };
        
        button.addEventListener('click', stopHandler);
        
        this.currentAudio = utterance;
        this.isPlaying = true;
        speechSynthesis.speak(utterance);
    }

    async downloadAudio(text, responseElement) {
        if (!text || text.length === 0) {
            alert('No text found to convert to audio');
            return;
        }

        try {
            // Create a blob URL for the audio
            const audioBlob = await this.textToAudioBlob(text);
            
            // Generate filename
            const title = this.generateFilename(text, responseElement);
            const filename = `gemini_voice_${title}.wav`;
            
            // Create download link
            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error generating audio download:', error);
            alert('Error generating audio file. Your browser might not support this feature.');
        }
    }

    async textToAudioBlob(text) {
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Apply settings
            if (this.voices.length > 0 && this.settings.selectedVoice < this.voices.length) {
                utterance.voice = this.voices[this.settings.selectedVoice];
            }
            utterance.rate = this.settings.rate;
            utterance.pitch = this.settings.pitch;
            utterance.volume = this.settings.volume;
            
            // Note: This is a simplified implementation
            // Modern browsers don't provide direct access to the audio data from speechSynthesis
            // This creates a basic audio file using MediaRecorder if available
            
            if (!window.MediaRecorder) {
                reject(new Error('MediaRecorder not supported'));
                return;
            }
            
            // Create an audio context for recording
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const destination = audioContext.createMediaStreamDestination();
            const mediaRecorder = new MediaRecorder(destination.stream);
            const chunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                chunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                resolve(blob);
            };
            
            utterance.onstart = () => {
                mediaRecorder.start();
            };
            
            utterance.onend = () => {
                setTimeout(() => mediaRecorder.stop(), 100);
            };
            
            utterance.onerror = () => {
                reject(new Error('Speech synthesis error'));
            };
            
            speechSynthesis.speak(utterance);
        });
    }

    generateFilename(text, responseElement) {
        // Try to get conversation title or generate from text
        const conversationTitle = document.querySelector('.conversation-title, [data-conversation-title]');
        if (conversationTitle) {
            return this.sanitizeFilename(conversationTitle.textContent.slice(0, 30));
        }
        
        // Generate from first few words of the response
        const words = text.split(' ').slice(0, 5).join('_');
        return this.sanitizeFilename(words);
    }

    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    }

    showVoiceSettings() {
        // Remove any existing settings modal
        const existingModal = document.querySelector('.voice-settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = this.createSettingsModal();
        document.body.appendChild(modal);
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'voice-settings-modal';
        modal.innerHTML = `
            <div class="voice-settings-backdrop">
                <div class="voice-settings-content">
                    <div class="voice-settings-header">
                        <h3>Voice Settings</h3>
                        <button class="voice-settings-close" type="button">×</button>
                    </div>
                    <div class="voice-settings-body">
                        <div class="voice-setting-group">
                            <label for="voice-select">Voice:</label>
                            <select id="voice-select" class="voice-control">
                                ${this.voices.map((voice, index) => 
                                    `<option value="${index}" ${index === this.settings.selectedVoice ? 'selected' : ''}>
                                        ${voice.name} (${voice.lang})
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="voice-setting-group">
                            <label for="rate-slider">Speed: <span id="rate-value">${this.settings.rate}</span></label>
                            <input type="range" id="rate-slider" class="voice-control" min="0.5" max="2" step="0.1" value="${this.settings.rate}">
                        </div>
                        <div class="voice-setting-group">
                            <label for="pitch-slider">Pitch: <span id="pitch-value">${this.settings.pitch}</span></label>
                            <input type="range" id="pitch-slider" class="voice-control" min="0.5" max="2" step="0.1" value="${this.settings.pitch}">
                        </div>
                        <div class="voice-setting-group">
                            <label for="volume-slider">Volume: <span id="volume-value">${this.settings.volume}</span></label>
                            <input type="range" id="volume-slider" class="voice-control" min="0" max="1" step="0.1" value="${this.settings.volume}">
                        </div>
                        <div class="voice-setting-group">
                            <button id="test-voice" class="voice-test-btn" type="button">Test Voice</button>
                        </div>
                    </div>
                    <div class="voice-settings-footer">
                        <button id="save-voice-settings" class="voice-save-btn" type="button">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
        
        this.addSettingsModalStyles(modal);
        this.addSettingsModalHandlers(modal);
        
        return modal;
    }

    addSettingsModalStyles(modal) {
        const style = document.createElement('style');
        style.textContent = `
            .voice-settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            }
            .voice-settings-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .voice-settings-content {
                background: var(--surface-color, #fff);
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            }
            .voice-settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
            }
            .voice-settings-header h3 {
                margin: 0;
                color: var(--text-color, #333);
                font-size: 18px;
            }
            .voice-settings-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-color, #666);
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .voice-settings-body {
                padding: 20px;
            }
            .voice-setting-group {
                margin-bottom: 20px;
            }
            .voice-setting-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--text-color, #333);
                font-size: 14px;
            }
            .voice-control {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #ddd);
                border-radius: 6px;
                font-size: 14px;
                background: var(--surface-color, #fff);
                color: var(--text-color, #333);
            }
            .voice-test-btn {
                background: var(--accent-color, #1976d2);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s ease;
            }
            .voice-test-btn:hover {
                background: var(--accent-hover-color, #1565c0);
            }
            .voice-settings-footer {
                padding: 20px;
                border-top: 1px solid var(--border-color, #e0e0e0);
                display: flex;
                justify-content: flex-end;
            }
            .voice-save-btn {
                background: var(--success-color, #4caf50);
                color: white;
                border: none;
                padding: 10px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s ease;
            }
            .voice-save-btn:hover {
                background: var(--success-hover-color, #45a049);
            }
        `;
        modal.appendChild(style);
    }

    addSettingsModalHandlers(modal) {
        // Close button
        modal.querySelector('.voice-settings-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Backdrop click to close
        modal.querySelector('.voice-settings-backdrop').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                modal.remove();
            }
        });
        
        // Update value displays
        modal.querySelector('#rate-slider').addEventListener('input', (e) => {
            modal.querySelector('#rate-value').textContent = e.target.value;
        });
        
        modal.querySelector('#pitch-slider').addEventListener('input', (e) => {
            modal.querySelector('#pitch-value').textContent = e.target.value;
        });
        
        modal.querySelector('#volume-slider').addEventListener('input', (e) => {
            modal.querySelector('#volume-value').textContent = e.target.value;
        });
        
        // Test voice button
        modal.querySelector('#test-voice').addEventListener('click', () => {
            const testText = "This is a test of the voice settings. How does it sound?";
            const tempSettings = {
                selectedVoice: parseInt(modal.querySelector('#voice-select').value),
                rate: parseFloat(modal.querySelector('#rate-slider').value),
                pitch: parseFloat(modal.querySelector('#pitch-slider').value),
                volume: parseFloat(modal.querySelector('#volume-slider').value)
            };
            
            this.playTestVoice(testText, tempSettings);
        });
        
        // Save settings button
        modal.querySelector('#save-voice-settings').addEventListener('click', () => {
            this.settings.selectedVoice = parseInt(modal.querySelector('#voice-select').value);
            this.settings.rate = parseFloat(modal.querySelector('#rate-slider').value);
            this.settings.pitch = parseFloat(modal.querySelector('#pitch-slider').value);
            this.settings.volume = parseFloat(modal.querySelector('#volume-slider').value);
            
            this.saveSettings();
            modal.remove();
        });
    }

    playTestVoice(text, tempSettings) {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (this.voices.length > 0 && tempSettings.selectedVoice < this.voices.length) {
            utterance.voice = this.voices[tempSettings.selectedVoice];
        }
        utterance.rate = tempSettings.rate;
        utterance.pitch = tempSettings.pitch;
        utterance.volume = tempSettings.volume;
        
        speechSynthesis.speak(utterance);
    }

    show() {
        // This method can be called to activate the feature
        // It's already initialized automatically
        console.log('Voice Download feature is active');
    }
}

// Auto-initialize when the script loads
if (typeof window !== 'undefined') {
    window.VoiceDownload = VoiceDownload;
}