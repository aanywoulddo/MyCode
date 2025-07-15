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
        this.processedElements = new Set(); // Track processed elements by their unique identifier
        this.responseCounter = 0;
        this.currentUtterance = null;
        this.currentButton = null;
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
                        setTimeout(() => this.checkForNewResponses(node), 200);
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
            '.model-response-text',
            '[data-message-author-role="assistant"]',
            '.markdown.markdown-main-panel'
        ];

        let totalFound = 0;
        responseSelectors.forEach(selector => {
            const responses = document.querySelectorAll(selector);
            responses.forEach(response => {
                this.addVoiceButtonsToResponse(response);
                totalFound++;
            });
        });

        console.log(`Voice Mode: Found ${totalFound} existing responses`);
    }

    checkForNewResponses(element) {
        const responseSelectors = [
            '.model-response-text',
            '[data-message-author-role="assistant"]',
            '.markdown.markdown-main-panel'
        ];

        // Check if element itself is a response
        responseSelectors.forEach(selector => {
            if (element.matches && element.matches(selector)) {
                this.addVoiceButtonsToResponse(element);
            }
        });

        // Check child elements
        responseSelectors.forEach(selector => {
            const responses = element.querySelectorAll ? element.querySelectorAll(selector) : [];
            responses.forEach(response => {
                this.addVoiceButtonsToResponse(response);
            });
        });
    }

    getElementIdentifier(element) {
        // Create a unique identifier for the element
        if (!element.dataset.voiceId) {
            element.dataset.voiceId = `voice-response-${++this.responseCounter}`;
        }
        return element.dataset.voiceId;
    }

    addVoiceButtonsToResponse(responseElement) {
        if (!responseElement || !this.isAIResponse(responseElement)) return;

        const elementId = this.getElementIdentifier(responseElement);
        
        // Check if already processed
        if (this.processedElements.has(elementId)) {
            return;
        }

        // Check if buttons already exist
        if (responseElement.querySelector('.voice-mode-container')) {
            this.processedElements.add(elementId);
            return;
        }

        console.log('Adding voice buttons to response:', elementId);

        // Mark as processed immediately
        this.processedElements.add(elementId);

        const voiceContainer = this.createVoiceContainer(responseElement);
        const insertionPoint = this.findInsertionPoint(responseElement);
        
        if (insertionPoint && voiceContainer) {
            insertionPoint.appendChild(voiceContainer);
            console.log('Voice buttons added successfully to:', elementId);
        } else {
            console.warn('Failed to find insertion point for:', elementId);
            // Remove from processed set so it can be tried again
            this.processedElements.delete(elementId);
        }
    }

    isAIResponse(element) {
        const text = element.textContent || '';
        if (text.trim().length < 20) return false;

        // Skip user messages
        if (element.closest('[data-message-author-role="user"]') ||
            element.closest('.user-message')) {
            return false;
        }

        // Check for AI response indicators
        return element.classList.contains('model-response-text') ||
               element.closest('.model-response-text') ||
               element.querySelector('.markdown.markdown-main-panel') ||
               element.closest('[data-message-author-role="assistant"]');
    }

    findInsertionPoint(responseElement) {
        // Look for existing action containers
        const actionContainers = [
            responseElement.querySelector('.response-footer'),
            responseElement.querySelector('.message-actions'),
            responseElement.parentElement?.querySelector('.response-footer')
        ];

        for (const container of actionContainers) {
            if (container && !container.querySelector('.voice-mode-container')) {
                return container;
            }
        }

        // Create new container if none found
        const newContainer = document.createElement('div');
        newContainer.className = 'voice-actions-wrapper';
        newContainer.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #e8eaed;
            align-items: center;
        `;

        // Find the best place to insert
        const markdownContent = responseElement.querySelector('.markdown.markdown-main-panel');
        if (markdownContent) {
            markdownContent.parentElement.appendChild(newContainer);
        } else {
            responseElement.appendChild(newContainer);
        }

        return newContainer;
    }

    createVoiceContainer(responseElement) {
        const container = document.createElement('div');
        container.className = 'voice-mode-container';
        container.dataset.responseId = responseElement.dataset.voiceId;
        
        container.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;

        // Create Listen button
        const listenButton = this.createListenButton(responseElement);
        const downloadButton = this.createDownloadButton(responseElement);

        container.appendChild(listenButton);
        container.appendChild(downloadButton);

        return container;
    }

    createListenButton(responseElement) {
        const button = document.createElement('button');
        button.className = 'voice-listen-btn';
        button.title = 'Listen to response';
        
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;

        this.styleVoiceButton(button);

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleListenClick(responseElement, button);
        });

        return button;
    }

    createDownloadButton(responseElement) {
        const button = document.createElement('button');
        button.className = 'voice-download-btn';
        button.title = 'Download as audio (experimental)';
        
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;

        this.styleVoiceButton(button);

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDownloadClick(responseElement, button);
        });

        return button;
    }

    styleVoiceButton(button) {
        const isDarkTheme = document.body.classList.contains('dark-theme') || 
                           document.body.classList.contains('dark_mode_toggled');

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

        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = isDarkTheme ? 'rgba(138, 180, 248, 0.08)' : 'rgba(26, 115, 232, 0.08)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
        });
    }

    handleListenClick(responseElement, button) {
        const text = this.extractTextFromResponse(responseElement);
        if (!text) {
            this.showToast('Could not extract text from this response.');
            return;
        }

        // If this button is currently playing, stop it
        if (this.isPlaying && this.currentButton === button) {
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

    handleDownloadClick(responseElement, button) {
        const text = this.extractTextFromResponse(responseElement);
        if (!text) {
            this.showToast('Could not extract text from this response.');
            return;
        }

        // Create and download audio using Web Speech API
        this.downloadAudioFromSpeech(text, responseElement.dataset.voiceId);
    }

    downloadAudioFromSpeech(text, responseId) {
        this.showToast('Starting audio generation... This may take a moment.');

        // Create a simple WAV file with speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        if (this.voices.length > 0 && this.voices[this.settings.selectedVoice]) {
            utterance.voice = this.voices[this.settings.selectedVoice];
        }
        utterance.rate = this.settings.rate;
        utterance.pitch = this.settings.pitch;
        utterance.volume = this.settings.volume;

        // Since we can't directly capture browser speech synthesis,
        // we'll create a comprehensive audio instruction file
        const audioInstructions = this.createAudioInstructions(text, responseId);
        this.downloadTextFile(audioInstructions, `gemini-speech-${responseId || Date.now()}.txt`);
        
        this.showToast('Audio instructions downloaded! Use any TTS service to generate audio.');
    }

    createAudioInstructions(text, responseId) {
        const selectedVoice = this.voices[this.settings.selectedVoice];
        
        return `GEMINI RESPONSE - Audio Generation Package
==========================================
Response ID: ${responseId || 'unknown'}
Generated: ${new Date().toLocaleString()}

RECOMMENDED TTS SETTINGS:
========================
Voice: ${selectedVoice?.name || 'Default System Voice'}
Language: ${selectedVoice?.lang || 'en-US'}
Speed: ${this.settings.rate}x
Pitch: ${this.settings.pitch}
Volume: ${this.settings.volume}

QUICK GENERATION OPTIONS:
========================
1. Online TTS Services:
   • https://ttsmaker.com (Free, high quality)
   • https://www.naturalreaders.com (Free tier available)
   • https://speechify.com (Premium features)

2. API Services (for developers):
   • Google Cloud Text-to-Speech
   • Amazon Polly
   • Microsoft Azure Speech Services

3. Desktop Software:
   • Windows: Built-in Narrator
   • macOS: Built-in Speech
   • Linux: espeak or festival

INSTRUCTIONS:
=============
1. Copy the text below
2. Paste into any TTS service
3. Apply the recommended settings above
4. Generate and download the audio file

========================================
TEXT TO CONVERT:
========================================

${text}

========================================
END OF PACKAGE
========================================`;
    }

    downloadTextFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    playText(text, button) {
        if (!text) return;

        this.currentButton = button;
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        if (this.voices.length > 0 && this.voices[this.settings.selectedVoice]) {
            this.currentUtterance.voice = this.voices[this.settings.selectedVoice];
        }
        this.currentUtterance.rate = this.settings.rate;
        this.currentUtterance.pitch = this.settings.pitch;
        this.currentUtterance.volume = this.settings.volume;
        
        // Update button to show playing state
        this.updateButtonToPlaying(button);
        
        // Set up event handlers
        this.currentUtterance.onstart = () => {
            this.isPlaying = true;
        };
        
        this.currentUtterance.onend = () => {
            this.resetButton(button);
            this.isPlaying = false;
            this.currentButton = null;
            this.currentUtterance = null;
        };
        
        this.currentUtterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            this.resetButton(button);
            this.isPlaying = false;
            this.currentButton = null;
            this.currentUtterance = null;
            this.showToast('Speech synthesis failed. Please try again.');
        };
        
        // Start speaking
        speechSynthesis.speak(this.currentUtterance);
    }

    stopSpeaking() {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        if (this.currentButton) {
            this.resetButton(this.currentButton);
        }
        
        this.isPlaying = false;
        this.currentButton = null;
        this.currentUtterance = null;
    }

    updateButtonToPlaying(button) {
        button.style.backgroundColor = '#1a73e8';
        button.style.color = 'white';
        button.title = 'Stop speaking';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
            </svg>
        `;
    }

    resetButton(button) {
        const isDarkTheme = document.body.classList.contains('dark-theme') || 
                           document.body.classList.contains('dark_mode_toggled');
        
        button.style.backgroundColor = 'transparent';
        button.style.color = isDarkTheme ? '#8ab4f8' : '#1a73e8';
        button.title = 'Listen to response';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    }

    extractTextFromResponse(responseElement) {
        const clone = responseElement.cloneNode(true);
        
        // Remove unwanted elements
        const selectorsToRemove = [
            'button', 
            '.voice-mode-container',
            '.voice-actions-wrapper',
            '.code-block-header',
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

    showToast(message) {
        // Remove existing toast
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

    // Settings modal methods (simplified)
    openSettingsModal() {
        // This would open a settings modal for voice configuration
        // Implementation can be added later if needed
        this.showToast('Voice settings - coming soon!');
    }
}