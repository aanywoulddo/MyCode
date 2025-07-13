// Gemini Toolbox - Enhanced Chat Export System

window.ExportChat = class ExportChat {
    constructor() {
        this.exportSettings = {
            format: 'pdf',
            fileName: 'gemini-chat-export',
            pdfTheme: 'auto',
            orientation: 'portrait',
            compression: false
        };
        this.selectedChat = null;
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('gemini-export-settings');
            if (saved) {
                this.exportSettings = { ...this.exportSettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading export settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('gemini-export-settings', JSON.stringify(this.exportSettings));
        } catch (error) {
            console.error('Error saving export settings:', error);
        }
    }

    setupEventListeners() {
        // This will be called from the main injector
    }

    showExportModal() {
        // First show chat selection
        this.showChatSelectionModal();
    }

    showChatSelectionModal() {
        const modalHTML = this.getChatSelectionHTML();
        this.openModal("chat-selection-modal", "Select Chat to Export", modalHTML, 800);
    }

    showExportOptionsModal(selectedChatId, selectedChatTitle) {
        const modalHTML = this.getExportModalHTML(selectedChatId, selectedChatTitle);
        this.openModal("export-options-modal", "Export Chat", modalHTML, 700);
    }

    getChatSelectionHTML() {
        const isDark = this.detectTheme() === 'dark';
        const themeClass = isDark ? 'dark-theme' : 'light-theme';
        
        return `
            <div class="chat-selection-content ${themeClass}">
                <div class="chat-selection-section">
                    <h3>Select a Chat to Export</h3>
                    <div class="chat-search-container">
                        <input type="text" id="chat-search-input" placeholder="Search chats..." class="chat-search-input">
                    </div>
                    <div class="chat-list-container">
                        <div id="chat-list" class="chat-list">
                            <!-- Chat list will be populated here -->
                        </div>
                    </div>
                </div>
                
                <div class="chat-selection-actions">
                    <button class="btn-secondary" id="cancel-chat-selection">Cancel</button>
                    <button class="btn-primary" id="select-chat-btn" disabled>Select Chat</button>
                </div>
            </div>
        `;
    }

    getExportModalHTML(selectedChatId = null, selectedChatTitle = null) {
        const isDark = this.detectTheme() === 'dark';
        const themeClass = isDark ? 'dark-theme' : 'light-theme';
        
        const selectedChatInfo = selectedChatTitle ? 
            `<div class="selected-chat-info">
                <span class="selected-chat-label">Selected Chat:</span>
                <span class="selected-chat-title">${selectedChatTitle}</span>
            </div>` : '';
        
        return `
            <div class="export-modal-content ${themeClass}">
                ${selectedChatInfo}
                
                <div class="export-section">
                    <h3>Export Options</h3>
                    <div class="export-format-grid">
                        <div class="format-option" data-format="pdf">
                            <div class="format-icon">📄</div>
                            <div class="format-info">
                                <div class="format-name">PDF</div>
                                <div class="format-desc">High-quality document</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="html">
                            <div class="format-icon">🌐</div>
                            <div class="format-info">
                                <div class="format-name">HTML</div>
                                <div class="format-desc">Web page format</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="md">
                            <div class="format-icon">📝</div>
                            <div class="format-info">
                                <div class="format-name">Markdown</div>
                                <div class="format-desc">Plain text with formatting</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="json">
                            <div class="format-icon">📊</div>
                            <div class="format-info">
                                <div class="format-name">JSON</div>
                                <div class="format-desc">Structured data</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="txt">
                            <div class="format-icon">📄</div>
                            <div class="format-info">
                                <div class="format-name">Text</div>
                                <div class="format-desc">Plain text file</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="csv">
                            <div class="format-icon">📊</div>
                            <div class="format-info">
                                <div class="format-name">CSV</div>
                                <div class="format-desc">Spreadsheet format</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="export-section">
                    <h3>Settings</h3>
                    <div class="setting-group">
                        <label for="export-filename">File Name:</label>
                        <input type="text" id="export-filename" value="${this.exportSettings.fileName}" placeholder="Enter file name">
                    </div>
                    
                    <div class="setting-group">
                        <label>Theme:</label>
                        <div class="theme-options">
                            <label class="radio-option">
                                <input type="radio" name="theme" value="light" ${this.exportSettings.pdfTheme === 'light' ? 'checked' : ''}>
                                <span>Light</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="dark" ${this.exportSettings.pdfTheme === 'dark' ? 'checked' : ''}>
                                <span>Dark</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="auto" ${this.exportSettings.pdfTheme === 'auto' ? 'checked' : ''}>
                                <span>Auto</span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-group">
                        <label>Orientation:</label>
                        <div class="orientation-options">
                            <label class="radio-option">
                                <input type="radio" name="orientation" value="portrait" ${this.exportSettings.orientation === 'portrait' ? 'checked' : ''}>
                                <span>Portrait</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="orientation" value="landscape" ${this.exportSettings.orientation === 'landscape' ? 'checked' : ''}>
                                <span>Landscape</span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-group">
                        <label class="checkbox-option">
                            <input type="checkbox" id="compression-toggle" ${this.exportSettings.compression ? 'checked' : ''}>
                            <span>Enable compression (smaller file size)</span>
                        </label>
                    </div>
                </div>

                <div class="export-section">
                    <h3>Export Range</h3>
                    <div class="export-range-options">
                        <label class="radio-option">
                            <input type="radio" name="export-range" value="current" checked>
                            <span>Current conversation</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="export-range" value="selected">
                            <span>Selected messages</span>
                        </label>
                    </div>
                </div>

                <div class="export-actions">
                    <button class="btn-secondary" id="cancel-export">Cancel</button>
                    <button class="btn-primary" id="start-export">Export Chat</button>
                </div>
            </div>
        `;
    }

    openModal(id, title, contentHTML, width = 600) {
        // Create a properly centered modal
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-container" style="max-width: ${width}px;">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-btn" id="close-export-modal">×</button>
                </div>
                <div class="modal-body">
                    ${contentHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Ensure modal is properly centered and visible
        setTimeout(() => {
            modal.style.display = 'flex';
            modal.classList.add('show');
        }, 10);
        
        this.setupModalEventListeners(modal);
    }

    setupModalEventListeners(modal) {
        const modalId = modal.id;
        
        if (modalId === 'chat-selection-modal') {
            this.setupChatSelectionListeners(modal);
        } else if (modalId === 'export-options-modal') {
            this.setupExportOptionsListeners(modal);
        }
    }

    setupChatSelectionListeners(modal) {
        // Load chat list
        this.loadChatList(modal);
        
        // Search functionality
        const searchInput = modal.querySelector('#chat-search-input');
        searchInput.addEventListener('input', () => {
            this.filterChatList(modal, searchInput.value);
        });

        // Select chat button
        const selectBtn = modal.querySelector('#select-chat-btn');
        selectBtn.addEventListener('click', () => {
            const selectedChat = modal.querySelector('.chat-item.selected');
            if (selectedChat) {
                const chatId = selectedChat.dataset.chatId;
                const chatTitle = selectedChat.querySelector('.chat-title').textContent;
                this.closeModal(modal);
                this.navigateToChatAndExport(chatId, chatTitle);
            }
        });

        // Cancel button
        const cancelBtn = modal.querySelector('#cancel-chat-selection');
        cancelBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Close button
        const closeBtn = modal.querySelector('#close-export-modal');
        closeBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Backdrop click
        const backdrop = modal.querySelector('.modal-backdrop');
        backdrop.addEventListener('click', () => {
            this.closeModal(modal);
        });
    }

    setupExportOptionsListeners(modal) {
        // Format selection
        modal.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', () => {
                modal.querySelectorAll('.format-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.exportSettings.format = option.dataset.format;
            });
        });

        // Theme selection
        modal.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.exportSettings.pdfTheme = radio.value;
            });
        });

        // Orientation selection
        modal.querySelectorAll('input[name="orientation"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.exportSettings.orientation = radio.value;
            });
        });

        // Compression toggle
        const compressionToggle = modal.querySelector('#compression-toggle');
        compressionToggle.addEventListener('change', () => {
            this.exportSettings.compression = compressionToggle.checked;
        });

        // Filename input
        const filenameInput = modal.querySelector('#export-filename');
        filenameInput.addEventListener('input', () => {
            this.exportSettings.fileName = filenameInput.value.trim();
        });

        // Export button
        const exportBtn = modal.querySelector('#start-export');
        exportBtn.addEventListener('click', () => {
            this.performExport(modal);
        });

        // Cancel button
        const cancelBtn = modal.querySelector('#cancel-export');
        cancelBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Close button
        const closeBtn = modal.querySelector('#close-export-modal');
        closeBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Backdrop click
        const backdrop = modal.querySelector('.modal-backdrop');
        backdrop.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Set initial selected format
        const currentFormatOption = modal.querySelector(`[data-format="${this.exportSettings.format}"]`);
        if (currentFormatOption) {
            currentFormatOption.classList.add('selected');
        }
    }

    loadChatList(modal) {
        const chatList = modal.querySelector('#chat-list');
        const conversations = this.getAllConversations();
        
        if (conversations.length === 0) {
            chatList.innerHTML = `
                <div class="no-chats-message">
                    <p>No conversations found. Please start a conversation first.</p>
                </div>
            `;
            return;
        }

        const chatListHTML = conversations.map(chat => `
            <div class="chat-item" data-chat-id="${chat.id}">
                <div class="chat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="chat-info">
                    <div class="chat-title">${chat.title}</div>
                    <div class="chat-preview">${chat.preview}</div>
                </div>
                <div class="chat-date">${chat.date}</div>
            </div>
        `).join('');

        chatList.innerHTML = chatListHTML;

        // Add click listeners to chat items
        chatList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                chatList.querySelectorAll('.chat-item').forEach(chat => chat.classList.remove('selected'));
                item.classList.add('selected');
                modal.querySelector('#select-chat-btn').disabled = false;
            });
        });
    }

    filterChatList(modal, searchTerm) {
        const chatItems = modal.querySelectorAll('.chat-item');
        const searchLower = searchTerm.toLowerCase();

        chatItems.forEach(item => {
            const title = item.querySelector('.chat-title').textContent.toLowerCase();
            const preview = item.querySelector('.chat-preview').textContent.toLowerCase();
            
            if (title.includes(searchLower) || preview.includes(searchLower)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    getAllConversations() {
        const conversations = [];
        
        // Get all conversation elements from the sidebar
        const conversationElements = document.querySelectorAll('conversations-list div[data-test-id="conversation"], conversations-list .conversation-item, [data-test-id="conversation"], .conversation-item');
        
        conversationElements.forEach((element, index) => {
            const titleElement = element.querySelector('.conversation-title, .title, h3, h4, [data-test-id="conversation-title"]');
            const previewElement = element.querySelector('.conversation-preview, .preview, p, [data-test-id="conversation-preview"]');
            const dateElement = element.querySelector('.conversation-date, .date, time, [data-test-id="conversation-date"]');
            
            const title = titleElement ? titleElement.textContent.trim() : `Conversation ${index + 1}`;
            const preview = previewElement ? previewElement.textContent.trim() : 'No preview available';
            const date = dateElement ? dateElement.textContent.trim() : '';
            
            // Generate a unique ID for the conversation
            const chatId = this.generateChatId(element, index);
            
            conversations.push({
                id: chatId,
                title: title,
                preview: preview.length > 100 ? preview.substring(0, 100) + '...' : preview,
                date: date,
                element: element
            });
        });

        return conversations;
    }

    generateChatId(element, index) {
        // Try to get existing ID from element
        const existingId = element.getAttribute('data-conversation-id') || 
                          element.getAttribute('data-chat-id') || 
                          element.id;
        
        if (existingId) {
            return existingId;
        }
        
        // Generate a new ID based on title and index
        const titleElement = element.querySelector('.conversation-title, .title, h3, h4');
        const title = titleElement ? titleElement.textContent.trim() : `conversation-${index}`;
        const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        
        return `chat-${sanitizedTitle}-${index}`;
    }

    getScrollHost() {
        let scroller = document.querySelector('#chat-history[data-test-id="chat-history-container"]');
        if (scroller) return scroller;

        scroller = document.querySelector("infinite-scroller.chat-history");
        if (scroller) return scroller;

        scroller = document.querySelector(".chat-history-scroll-container");
        if (scroller) return scroller;

        const mainArea = document.querySelector("main .conversation-area");
        if (mainArea) {
            const divs = mainArea.querySelectorAll("div");
            for (const div of divs) {
                const style = window.getComputedStyle(div);
                if ((style.overflowY === "auto" || style.overflowY === "scroll") && div.clientHeight > 300) {
                    return div;
                }
            }
        }

        scroller = document.querySelector("infinite-scroller");
        if (scroller) return scroller;

        return document.documentElement;
    }

    async scrollToTopAndWait(options = {}) {
        const { loadWaitTimeout = 2000, maxTotalTime = 30000, maxScrollAttempts = 100 } = options;
        return new Promise(async (resolve, reject) => {
            let scroller;
            try {
                scroller = this.getScrollHost();
                if (!scroller) throw new Error("Scroll container returned null.");
                const scrollElement = scroller === document.documentElement ? document.body : scroller;
                if (scrollElement.scrollHeight <= scrollElement.clientHeight) {
                    return resolve();
                }
            } catch (err) {
                return reject(new Error("Scroll container lookup failed. Cannot scroll."));
            }

            const startTime = Date.now();
            let attempts = 0;
            const messageSelector = "div.conversation-container";
            const delay = ms => new Promise(res => setTimeout(res, ms));

            const scrollHost = scroller === document.documentElement ? window : scroller;

            while (attempts < maxScrollAttempts) {
                if (Date.now() - startTime > maxTotalTime) {
                    return reject(new Error(`Scroll process timed out after ${maxTotalTime}ms.`));
                }

                const currentMessages = scroller.querySelectorAll(messageSelector).length;
                const currentScrollTop = scrollHost === window ? window.scrollY : scrollHost.scrollTop;

                if (currentScrollTop === 0 && attempts > 0) {
                    await delay(loadWaitTimeout);
                    const newMessages = scroller.querySelectorAll(messageSelector).length;
                    if (newMessages === currentMessages) {
                        return resolve();
                    }
                }

                if (scrollHost === window) {
                    window.scrollTo(0, 0);
                } else {
                    scrollHost.scrollTop = 0;
                    scrollHost.dispatchEvent(new Event("scroll"));
                }

                let loadedNew = false;
                const waitStart = Date.now();
                while (Date.now() - waitStart < loadWaitTimeout) {
                    const newMessages = scroller.querySelectorAll(messageSelector).length;
                    if (newMessages > currentMessages) {
                        loadedNew = true;
                        break;
                    }
                    await delay(100);
                }

                if (!loadedNew) {
                    const finalScrollTop = scrollHost === window ? window.scrollY : scrollHost.scrollTop;
                    if (finalScrollTop === 0) {
                        return resolve();
                    }
                }

                attempts++;
                await delay(50);
            }

            resolve();
        });
    }

    async navigateToChatAndExport(chatId, chatTitle) {
        try {
            // Find the conversation element
            let conversationElement = document.querySelector(`[data-conversation-id="${chatId}"], [data-chat-id="${chatId}"], #${chatId}`);
            
            if (!conversationElement) {
                // Fallback: find by title
                const conversations = this.getAllConversations();
                const targetConversation = conversations.find(conv => conv.id === chatId || conv.title === chatTitle);
                if (targetConversation && targetConversation.element) {
                    conversationElement = targetConversation.element;
                }
            }

            if (conversationElement) {
                // Instead of click, get href if it's a link
                let navigated = false;
                if (conversationElement.tagName === 'A' && conversationElement.href) {
                    window.location.href = conversationElement.href;
                    navigated = true;
                } else {
                    conversationElement.click();
                    navigated = true;
                }
                
                if (navigated) {
                    // Wait for the conversation to load
                    await this.waitForConversationLoad();
                }
                
                // Show export options modal
                this.showExportOptionsModal(chatId, chatTitle);
            } else {
                // Fallback: show export options for current conversation
                this.showExportOptionsModal(null, 'Current Conversation');
            }
        } catch (error) {
            console.error('Error navigating to chat:', error);
            // Fallback: show export options for current conversation
            this.showExportOptionsModal(null, 'Current Conversation');
        }
    }

    async waitForConversationLoad() {
        return new Promise((resolve) => {
            const maxWait = 10000; // 10 seconds max wait
            const interval = 200;
            let elapsed = 0;

            const checkForContent = () => {
                const conversationContent = document.querySelector('div.conversation-container, message-content, user-query, [data-test-id="conversation-content"]');
                if (conversationContent) {
                    resolve();
                } else if (elapsed >= maxWait) {
                    console.warn('Timeout waiting for conversation load');
                    resolve(); // Proceed anyway
                } else {
                    elapsed += interval;
                    setTimeout(checkForContent, interval);
                }
            };
            
            checkForContent();
        });
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    async performExport(modal) {
        const format = this.exportSettings.format;
        const fileName = this.exportSettings.fileName || 'gemini-chat-export';
        
        try {
            await this.scrollToTopAndWait();
            const chatContent = this.extractChatContent();
            const exportData = this.formatExportData(chatContent, format);
            
            this.downloadFile(exportData, fileName, format);
            this.showSuccessNotification();
            this.saveSettings();
            this.closeModal(modal);
        } catch (error) {
            console.error('Export failed:', error);
            this.showErrorNotification('Export failed. Please try again.');
        }
    }

    extractChatContent() {
        const messages = [];
        const containers = document.querySelectorAll('div.conversation-container');

        containers.forEach((container, index) => {
            const userEl = container.querySelector('user-query');
            if (userEl) {
                const textEl = userEl.querySelector('.query-text-line');
                const html = textEl ? textEl.innerHTML : userEl.innerHTML;
                const text = textEl ? textEl.textContent.trim() : userEl.textContent.trim();
                messages.push({
                    role: 'user',
                    html,
                    text,
                    timestamp: new Date().toISOString(),
                    index
                });
            }

            const assistantEl = container.querySelector('message-content');
            if (assistantEl) {
                const mdEl = assistantEl.querySelector('.markdown-main-panel, .output-content .markdown, .output-content');
                const html = mdEl ? mdEl.innerHTML : assistantEl.innerHTML;
                const text = mdEl ? mdEl.textContent.trim() : assistantEl.textContent.trim();
                messages.push({
                    role: 'assistant',
                    html,
                    text,
                    timestamp: new Date().toISOString(),
                    index
                });
            }
        });
        
        return {
            title: this.getConversationTitle(),
            messages: messages,
            exportDate: new Date().toISOString(),
            totalMessages: messages.length
        };
    }

    getConversationTitle() {
        const titleElement = document.querySelector('.conversation-title, .title, h1, h2, [data-test-id="conversation-title"]');
        return titleElement ? titleElement.textContent.trim() : 'Gemini Chat Export';
    }

    formatExportData(chatContent, format) {
        switch (format) {
            case 'pdf':
                return this.formatAsPDF(chatContent);
            case 'html':
                return this.formatAsHTML(chatContent);
            case 'md':
                return this.formatAsMarkdown(chatContent);
            case 'json':
                return this.formatAsJSON(chatContent);
            case 'txt':
                return this.formatAsText(chatContent);
            case 'csv':
                return this.formatAsCSV(chatContent);
            default:
                return this.formatAsText(chatContent);
        }
    }

    formatAsPDF(chatContent) {
        // Use html2pdf to generate actual PDF from HTML
        const html = this.formatAsHTML(chatContent);
        const element = document.createElement('div');
        element.innerHTML = html;
        const options = {
            margin: 0.5,
            filename: `${chatContent.title}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: this.exportSettings.orientation }
        };
        html2pdf().from(element).set(options).save();
        return ''; // No direct return, as it's handled by html2pdf
    }

    formatAsHTML(chatContent) {
        const theme = this.exportSettings.pdfTheme === 'auto' ? this.detectTheme() : this.exportSettings.pdfTheme;
        const isDark = theme === 'dark';
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chatContent.title}</title>
    <style>
        body {
            font-family: 'Google Sans', 'Roboto', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: ${isDark ? '#1a1a1a' : '#ffffff'};
            color: ${isDark ? '#ffffff' : '#000000'};
        }
        .chat-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .chat-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid ${isDark ? '#333' : '#e0e0e0'};
        }
        .chat-title {
            font-size: 24px;
            font-weight: 500;
            margin-bottom: 10px;
        }
        .chat-meta {
            font-size: 14px;
            color: ${isDark ? '#888' : '#666'};
        }
        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid;
        }
        .message.user {
            background: ${isDark ? '#2a2a2a' : '#f8f9fa'};
            border-left-color: #4285f4;
        }
        .message.assistant {
            background: ${isDark ? '#333' : '#ffffff'};
            border-left-color: #34a853;
            border: 1px solid ${isDark ? '#444' : '#e0e0e0'};
        }
        .message-role {
            font-weight: 500;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 8px;
            color: ${isDark ? '#888' : '#666'};
        }
        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .export-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid ${isDark ? '#333' : '#e0e0e0'};
            text-align: center;
            font-size: 12px;
            color: ${isDark ? '#888' : '#666'};
        }
        @media print {
            body { margin: 0; }
            .chat-container { max-width: none; }
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <div class="chat-title">${chatContent.title}</div>
            <div class="chat-meta">
                Exported on ${new Date(chatContent.exportDate).toLocaleString()} | 
                ${chatContent.totalMessages} messages
            </div>
        </div>
        
        ${chatContent.messages.map(message => `
            <div class="message ${message.role}">
                <div class="message-role">${message.role}</div>
                <div class="message-content">${message.html}</div>
            </div>
        `).join('')}
        
        <div class="export-footer">
            Exported using Gemini Toolbox Export Chat Feature
        </div>
    </div>
</body>
</html>`;
    }

    formatAsMarkdown(chatContent) {
        let markdown = `# ${chatContent.title}\n\n`;
        markdown += `**Exported on:** ${new Date(chatContent.exportDate).toLocaleString()}\n`;
        markdown += `**Total messages:** ${chatContent.totalMessages}\n\n`;
        markdown += `---\n\n`;
        
        chatContent.messages.forEach(message => {
            markdown += `### ${message.role.charAt(0).toUpperCase() + message.role.slice(1)}\n\n`;
            markdown += `${this.convertHtmlToMarkdown(message.html)}\n\n`;
            markdown += `---\n\n`;
        });
        
        return markdown;
    }

    formatAsJSON(chatContent) {
        const jsonContent = {
            ...chatContent,
            messages: chatContent.messages.map(msg => ({ ...msg, html: msg.html, text: msg.text }))
        };
        return JSON.stringify(jsonContent, null, 2);
    }

    formatAsText(chatContent) {
        let text = `${chatContent.title}\n`;
        text += `Exported on: ${new Date(chatContent.exportDate).toLocaleString()}\n`;
        text += `Total messages: ${chatContent.totalMessages}\n\n`;
        text += `==========================================\n\n`;
        
        chatContent.messages.forEach(message => {
            text += `${message.role.toUpperCase()}:\n`;
            text += `${message.text}\n\n`;
            text += `------------------------------------------\n\n`;
        });
        
        return text;
    }

    formatAsCSV(chatContent) {
        let csv = 'Role,Content,Timestamp\n';
        
        chatContent.messages.forEach(message => {
            const escapedContent = `"${message.text.replace(/"/g, '""')}"`;
            csv += `${message.role},${escapedContent},${message.timestamp}\n`;
        });
        
        return csv;
    }

    convertHtmlToMarkdown(html) {
        if (!html) return '';
        let content = html;
        const tempDiv = document.createElement('div');

        function processNode(node) {
            if (!node || typeof node.nodeName !== 'string') return '';
            let md = '';
            switch (node.nodeName) {
                case '#text':
                    md = (node.textContent || '').replace(/([*_~])/g, '\\$1');
                    break;
                case 'P':
                    md = processChildren(node) + '\n\n';
                    break;
                case 'H1':
                    md = '# ' + processChildren(node) + '\n\n';
                    break;
                case 'H2':
                    md = '## ' + processChildren(node) + '\n\n';
                    break;
                case 'H3':
                    md = '### ' + processChildren(node) + '\n\n';
                    break;
                case 'H4':
                    md = '#### ' + processChildren(node) + '\n\n';
                    break;
                case 'H5':
                    md = '##### ' + processChildren(node) + '\n\n';
                    break;
                case 'H6':
                    md = '###### ' + processChildren(node) + '\n\n';
                    break;
                case 'UL':
                    md = Array.from(node.children).map(li => '* ' + processChildren(li).trim()).join('\n') + '\n\n';
                    break;
                case 'OL':
                    md = Array.from(node.children).map((li, idx) => `${idx + 1}. ${processChildren(li).trim()}`).join('\n') + '\n\n';
                    break;
                case 'LI':
                case 'DIV':
                case 'SPAN':
                default:
                    md = processChildren(node);
                    break;
                case 'A':
                    md = `[${processChildren(node)}](${node.href || ''})`;
                    break;
                case 'STRONG':
                case 'B':
                    md = '**' + processChildren(node) + '**';
                    break;
                case 'EM':
                case 'I':
                    md = '*' + processChildren(node) + '*';
                    break;
                case 'CODE-BLOCK':
                    const preCode = node.querySelector('pre code, pre');
                    const langMatch = preCode?.className?.match(/language-(\S+)/);
                    md = `\`\`\`${langMatch ? langMatch[1] : ''}\n${preCode?.textContent || node.textContent || ''}\n\`\`\`\n\n`;
                    break;
                case 'PRE':
                    md = node.closest('code-block') ? processChildren(node) : `\`\`\`\n${node.textContent || ''}\n\`\`\`\n\n`;
                    break;
                case 'CODE':
                    md = node.closest('pre, code-block') ? node.textContent || '' : '`' + node.textContent + '`';
                    break;
                case 'BLOCKQUOTE':
                    md = '> ' + processChildren(node).replace(/\n/g, '\n> ') + '\n\n';
                    break;
                case 'HR':
                    md = '---\n\n';
                    break;
                case 'TABLE':
                    const headerRow = node.querySelector('thead tr, tr:first-child');
                    const bodyRows = Array.from(node.querySelectorAll('tbody tr, tr:not(:first-child)'));
                    let tableMd = '';
                    if (headerRow) {
                        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(th => processChildren(th).trim());
                        tableMd += `| ${headers.join(' | ')} |\n`;
                        tableMd += `| ${headers.map(() => '---').join(' | ')} |\n`;
                    }
                    bodyRows.forEach(row => {
                        const cells = Array.from(row.querySelectorAll('td')).map(td => processChildren(td).trim());
                        tableMd += `| ${cells.join(' | ')} |\n`;
                    });
                    md = tableMd + '\n';
                    break;
                case 'IMG':
                    md = `![${node.alt || 'image'}](${node.src || ''})\n`;
                    break;
                case 'BR':
                    md = '  \n';
                    break;
            }
            return md;
        }

        function processChildren(node) {
            return node && node.childNodes ? Array.from(node.childNodes).map(processNode).join('') : '';
        }

        tempDiv.innerHTML = html;
        tempDiv.querySelectorAll('div.code-block-decoration, sources-carousel-inline, sources-carousel, source-footnote').forEach(el => el.remove());
        content = processChildren(tempDiv);
        content = content.replace(/\n{3,}/g, '\n\n').trim();
        return content;
    }

    downloadFile(content, fileName, format) {
        if (format === 'pdf') return; // Handled in formatAsPDF
        const blob = new Blob([content], { 
            type: this.getMimeType(format) 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    getMimeType(format) {
        const mimeTypes = {
            'pdf': 'application/pdf',
            'html': 'text/html',
            'md': 'text/markdown',
            'json': 'application/json',
            'txt': 'text/plain',
            'csv': 'text/csv'
        };
        return mimeTypes[format] || 'text/plain';
    }

    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'export-success-notification';
        notification.innerHTML = `
            <span>✅</span>
            <span>Chat exported successfully!</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'export-success-notification';
        notification.style.background = '#f44336';
        notification.innerHTML = `
            <span>❌</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    detectTheme() {
        const body = document.body;
        if (body.classList.contains('dark-theme') || body.classList.contains('dark_mode_toggled')) {
            return 'dark';
        }
        
        const htmlTheme = document.documentElement.getAttribute('data-theme');
        if (htmlTheme === 'dark') {
            return 'dark';
        }
        
        const bodyBgColor = window.getComputedStyle(body).backgroundColor;
        if (bodyBgColor) {
            const rgb = bodyBgColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
                return brightness < 128 ? 'dark' : 'light';
            }
        }
        
        return 'light';
    }
}

// Initialize the ExportChat system
if (typeof window !== 'undefined') {
    window.exportChatInstance = new ExportChat();
    window.exportChatInstance.init();
}