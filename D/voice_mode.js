// ================================================================
// VOICE_MODE.JS - Voice Mode Feature with Listen & Download (Fixed)
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
        this.audioContext = null;
        this.mediaRecorder = null;
        this.currentButton = null;
        this.responseCounter = 0; // Counter to track processed responses
        this.init();
    }

    async init() {
        if (this.isInitialized) return;

        console.log('Initializing Voice Mode feature...');

        // Initialize audio context for recording
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Failed to create audio context:', e);
        }

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
        console.log('Checking for existing responses...');
        
        const responseSelectors = [
            'message-content.model-response-text',
            '.model-response-text',
            '.markdown.markdown-main-panel',
            '[data-message-author-role="assistant"]',
            // Additional selectors for broader detection
            '.response-container',
            '.assistant-response',
            '.ai-message',
            '.gemini-response'
        ];

        let totalFound = 0;
        let totalProcessed = 0;

        responseSelectors.forEach(selector => {
            const responses = document.querySelectorAll(selector);
            console.log(`Found ${responses.length} elements for selector: ${selector}`);
            totalFound += responses.length;
            
            responses.forEach(response => {
                this.addVoiceButtonsToResponse(response);
                totalProcessed++;
            });
        });

        console.log(`Voice Mode: Found ${totalFound} potential responses, processed ${totalProcessed}`);

        // Fallback: Look for any element containing substantial text that looks like AI response
        setTimeout(() => this.fallbackResponseDetection(), 2000);
    }

    fallbackResponseDetection() {
        console.log('Running fallback response detection...');
        
        // Look for any div or p elements with substantial text content
        const allElements = document.querySelectorAll('div, p, article, section');
        let fallbackCount = 0;

        allElements.forEach(element => {
            const text = element.textContent || '';
            
            // Skip if already processed or has voice controls
            if (this.processedResponses.has(element) || 
                element.querySelector('.voice-mode-container')) {
                return;
            }

            // Check for AI-like response patterns
            if (text.length > 50 && 
                !element.closest('[data-message-author-role="user"]') &&
                !element.closest('.user-message') &&
                (text.includes('I\'m') || text.includes('I can') || text.includes('Here\'s') || 
                 text.includes('According to') || text.includes('Based on') ||
                 text.length > 200)) {
                
                console.log('Fallback detected potential AI response:', element);
                this.addVoiceButtonsToResponse(element);
                fallbackCount++;
            }
        });

        console.log(`Fallback detection processed ${fallbackCount} additional elements`);
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
                setTimeout(() => this.addVoiceButtonsToResponse(element), 100);
            }
        });

        // Check child elements
        responseSelectors.forEach(selector => {
            const responses = element.querySelectorAll ? element.querySelectorAll(selector) : [];
            responses.forEach(response => {
                setTimeout(() => this.addVoiceButtonsToResponse(response), 100);
            });
        });
    }

    addVoiceButtonsToResponse(responseElement) {
        // Check if we've already processed this element
        if (this.processedResponses.has(responseElement)) {
            return;
        }

        if (!this.isAIResponse(responseElement)) return;

        // Check if buttons already exist in this specific element or its immediate children
        const existingContainer = responseElement.querySelector('.voice-mode-container');
        if (existingContainer) {
            this.processedResponses.add(responseElement);
            return;
        }

        // Mark as processed immediately to prevent duplicates
        this.processedResponses.add(responseElement);
        
        // Assign unique ID for tracking
        if (!responseElement.dataset.voiceId) {
            responseElement.dataset.voiceId = `voice-${++this.responseCounter}`;
        }

        console.log('Adding voice buttons to response:', responseElement.dataset.voiceId);

        const voiceContainer = this.createVoiceContainer(responseElement);
        const insertionPoint = this.findInsertionPoint(responseElement);
        
        if (insertionPoint && voiceContainer) {
            insertionPoint.appendChild(voiceContainer);
            console.log('Voice buttons added successfully to:', responseElement.dataset.voiceId);
        } else {
            console.warn('Failed to find insertion point for:', responseElement.dataset.voiceId);
            // Remove from processed set so it can be tried again
            this.processedResponses.delete(responseElement);
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

        // More comprehensive check for AI response indicators
        const isGeminiResponse = element.classList.contains('model-response-text') ||
                                element.closest('.model-response-text') ||
                                element.querySelector('.markdown.markdown-main-panel') ||
                                element.closest('[data-message-author-role="assistant"]') ||
                                element.closest('.model-response') ||
                                element.closest('.ai-response') ||
                                element.closest('.assistant-message');

        console.log('Checking if AI response:', {
            element: element,
            hasText: text.length > 10,
            isGemini: isGeminiResponse,
            classes: element.className,
            parent: element.parentElement?.className
        });

        return isGeminiResponse;
    }

    findInsertionPoint(responseElement) {
        let insertionPoint = null;

        // Try to find existing action area first
        const possibleContainers = [
            responseElement.querySelector('.response-footer'),
            responseElement.querySelector('.message-actions'),
            responseElement.querySelector('.response-actions'),
            responseElement.parentElement?.querySelector('.response-footer'),
            responseElement.parentElement?.querySelector('.message-actions')
        ];

        for (const container of possibleContainers) {
            if (container && !container.querySelector('.voice-mode-container')) {
                insertionPoint = container;
                break;
            }
        }

        if (!insertionPoint) {
            // Create our own container - simplified approach
            insertionPoint = document.createElement('div');
            insertionPoint.className = 'voice-mode-actions';
            insertionPoint.dataset.voiceControls = 'true';
            insertionPoint.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 12px;
                align-items: center;
                padding: 8px 0;
                border-top: 1px solid var(--border-color, #e0e0e0);
            `;

            // Try multiple insertion strategies
            const markdownContent = responseElement.querySelector('.markdown.markdown-main-panel');
            if (markdownContent && markdownContent.parentElement) {
                markdownContent.parentElement.appendChild(insertionPoint);
            } else if (responseElement.parentElement) {
                responseElement.parentElement.appendChild(insertionPoint);
            } else {
                responseElement.appendChild(insertionPoint);
            }
        }

        return insertionPoint;
    }

    createVoiceContainer(responseElement) {
        const container = document.createElement('div');
        container.className = 'voice-mode-container';
        container.dataset.responseId = responseElement.dataset.voiceId;
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
        button.dataset.responseId = responseElement.dataset.voiceId;
        
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
        button.dataset.responseId = responseElement.dataset.voiceId;
        button.title = 'Download as audio file';
        
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
            this.handleDownloadClick(responseElement, button);
        });

        return button;
    }

    handleListenClick(responseElement, button) {
        const text = this.extractTextFromResponse(responseElement);
        if (!text) {
            this.showToast('Could not extract text from this response.');
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

    async handleDownloadClick(responseElement, button) {
        const text = this.extractTextFromResponse(responseElement);
        if (!text) {
            this.showToast('Could not extract text from this response.');
            return;
        }

        // Show loading state
        button.disabled = true;
        button.style.opacity = '0.5';
        const originalTitle = button.title;
        button.title = 'Generating audio...';

        try {
            // Try to generate actual audio using a more reliable method
            const audioBlob = await this.generateAudioBlobV2(text);
            
            if (audioBlob) {
                // Download the audio file
                const url = URL.createObjectURL(audioBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gemini-response-${responseElement.dataset.voiceId || Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showToast('Audio downloaded successfully!');
            } else {
                // Fallback: Create a data URL with speech synthesis instructions
                this.downloadSpeechInstructions(text, responseElement.dataset.voiceId);
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Audio generation failed. Downloading speech instructions instead.');
            this.downloadSpeechInstructions(text, responseElement.dataset.voiceId);
        } finally {
            // Reset button state
            button.disabled = false;
            button.style.opacity = '1';
            button.title = originalTitle;
        }
    }

    async generateAudioBlobV2(text) {
        return new Promise((resolve) => {
            try {
                // Check browser support
                if (!this.audioContext || !window.MediaRecorder) {
                    console.warn('Audio recording not supported');
                    resolve(null);
                    return;
                }

                const utterance = new SpeechSynthesisUtterance(text);
                
                // Apply voice settings
                if (this.voices.length > 0 && this.voices[this.settings.selectedVoice]) {
                    utterance.voice = this.voices[this.settings.selectedVoice];
                }
                utterance.rate = this.settings.rate;
                utterance.pitch = this.settings.pitch;
                utterance.volume = this.settings.volume;

                // Create audio destination
                const destination = this.audioContext.createMediaStreamDestination();
                const mediaRecorder = new MediaRecorder(destination.stream, {
                    mimeType: 'audio/webm;codecs=opus'
                });

                const chunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    if (chunks.length > 0) {
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        resolve(blob);
                    } else {
                        resolve(null);
                    }
                };

                // Set up speech synthesis events
                utterance.onstart = () => {
                    try {
                        mediaRecorder.start();
                    } catch (e) {
                        console.error('Failed to start recording:', e);
                        resolve(null);
                    }
                };

                utterance.onend = () => {
                    setTimeout(() => {
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                    }, 500);
                };

                utterance.onerror = (error) => {
                    console.error('Speech synthesis error:', error);
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                    resolve(null);
                };

                // Start speech synthesis
                speechSynthesis.speak(utterance);

                // Timeout fallback
                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                    if (chunks.length === 0) {
                        resolve(null);
                    }
                }, 60000); // 1 minute timeout

            } catch (error) {
                console.error('Error in generateAudioBlobV2:', error);
                resolve(null);
            }
        });
    }

    downloadSpeechInstructions(text, responseId) {
        const instructions = `GEMINI RESPONSE - Text-to-Speech Package
=========================================
Response ID: ${responseId || 'unknown'}
Generated: ${new Date().toLocaleString()}

SPEECH SETTINGS:
================
Voice: ${this.voices[this.settings.selectedVoice]?.name || 'Default System Voice'}
Language: ${this.voices[this.settings.selectedVoice]?.lang || 'en-US'}
Speed: ${this.settings.rate}x
Pitch: ${this.settings.pitch}
Volume: ${this.settings.volume}

INSTRUCTIONS:
=============
1. Copy the text content below
2. Use any text-to-speech service:
   - Google Cloud Text-to-Speech
   - Amazon Polly
   - Microsoft Azure Speech
   - Or your system's built-in TTS

3. Apply the settings above for best results

ALTERNATIVE METHODS:
===================
- Online TTS: https://ttsmaker.com or https://www.naturalreaders.com
- Browser: Use Web Speech API with the provided settings
- Mobile: Use device accessibility features

=========================================
TEXT CONTENT:
=========================================

${text}

=========================================
End of Package
`;

        const blob = new Blob([instructions], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini-tts-${responseId || Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Downloaded TTS instructions package.');
    }

    showToast(message) {
        // Remove any existing toast
        const existingToast = document.querySelector('.voice-mode-toast');
        if (existingToast) {
            existingToast.remove();
        }

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
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            max-width: 300px;
            text-align: center;
        `;

        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.style.opacity = '1', 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
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
            '.copy-code-button',
            'script',
            'style'
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
        if (this.voices.length > 0 && this.voices[this.settings.selectedVoice]) {
            utterance.voice = this.voices[this.settings.selectedVoice];
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
            this.showToast('Speech synthesis failed. Please try again.');
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

    // Settings modal remains the same but simplified
    showVoiceSettings() {
        if (this.shadowRoot.getElementById('voice-settings-modal')) {
            this.shadowRoot.getElementById('voice-settings-modal').style.display = 'block';
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

        this.addSettingsEventListeners();
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
            
            if (this.voices.length > 0 && this.voices[this.settings.selectedVoice]) {
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
            
            // Update UI
            modal.querySelector('#voice-select').value = '0';
            modal.querySelector('#rate-slider').value = '1.0';
            modal.querySelector('#rate-value').textContent = '1.0';
            modal.querySelector('#pitch-slider').value = '1.0';
            modal.querySelector('#pitch-value').textContent = '1.0';
            modal.querySelector('#volume-slider').value = '1.0';
            modal.querySelector('#volume-value').textContent = '1.0';
        };
    }
}

export default VoiceMode;