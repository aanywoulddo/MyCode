// Make ExportChat globally available
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

    async navigateToChatAndExport(chatId, chatTitle) {
        try {
            // Find the conversation element
            const conversationElement = document.querySelector(`[data-conversation-id="${chatId}"], [data-chat-id="${chatId}"], #${chatId}`);
            
            if (conversationElement) {
                // Click on the conversation to navigate to it
                conversationElement.click();
                
                // Wait for the conversation to load
                await this.waitForConversationLoad();
                
                // Show export options modal
                this.showExportOptionsModal(chatId, chatTitle);
            } else {
                // If we can't find the specific element, try to find by title
                const conversations = this.getAllConversations();
                const targetConversation = conversations.find(conv => conv.title === chatTitle);
                
                if (targetConversation && targetConversation.element) {
                    targetConversation.element.click();
                    await this.waitForConversationLoad();
                    this.showExportOptionsModal(chatId, chatTitle);
                } else {
                    // Fallback: show export options for current conversation
                    this.showExportOptionsModal(null, 'Current Conversation');
                }
            }
        } catch (error) {
            console.error('Error navigating to chat:', error);
            // Fallback: show export options for current conversation
            this.showExportOptionsModal(null, 'Current Conversation');
        }
    }

    async waitForConversationLoad() {
        return new Promise((resolve) => {
            // Wait for conversation content to load
            const checkForContent = () => {
                const conversationContent = document.querySelector('div.conversation-container, message-content, user-query, [data-test-id="conversation-content"]');
                if (conversationContent) {
                    resolve();
                } else {
                    setTimeout(checkForContent, 100);
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

    performExport(modal) {
        const format = this.exportSettings.format;
        const fileName = this.exportSettings.fileName || 'gemini-chat-export';
        
        try {
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
        const messageElements = document.querySelectorAll('message-content, user-query, [data-test-id="message"], .message');
        
        messageElements.forEach((element, index) => {
            const role = this.determineMessageRole(element);
            const content = this.extractMessageContent(element);
            
            if (content) {
                messages.push({
                    role: role,
                    content: content,
                    timestamp: new Date().toISOString(),
                    index: index
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

    determineMessageRole(element) {
        const classes = element.className.toLowerCase();
        const testId = element.getAttribute('data-test-id') || '';
        
        if (classes.includes('user') || testId.includes('user') || element.querySelector('.user-message')) {
            return 'user';
        } else if (classes.includes('assistant') || testId.includes('assistant') || element.querySelector('.assistant-message')) {
            return 'assistant';
        } else {
            // Default to assistant if we can't determine
            return 'assistant';
        }
    }

    extractMessageContent(element) {
        // Try multiple selectors to find the message content
        const contentSelectors = [
            '.message-content',
            '.content',
            'p',
            'div',
            '[data-test-id="message-content"]'
        ];
        
        for (const selector of contentSelectors) {
            const contentElement = element.querySelector(selector);
            if (contentElement && contentElement.textContent.trim()) {
                return contentElement.textContent.trim();
            }
        }
        
        // Fallback to the element's own text content
        return element.textContent.trim();
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
        const html = this.formatAsHTML(chatContent);
        return html; // For now, return HTML that can be converted to PDF
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
                <div class="message-content">${this.escapeHtml(message.content)}</div>
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
            markdown += `${message.content}\n\n`;
            markdown += `---\n\n`;
        });
        
        return markdown;
    }

    formatAsJSON(chatContent) {
        return JSON.stringify(chatContent, null, 2);
    }

    formatAsText(chatContent) {
        let text = `${chatContent.title}\n`;
        text += `Exported on: ${new Date(chatContent.exportDate).toLocaleString()}\n`;
        text += `Total messages: ${chatContent.totalMessages}\n\n`;
        text += `==========================================\n\n`;
        
        chatContent.messages.forEach(message => {
            text += `${message.role.toUpperCase()}:\n`;
            text += `${message.content}\n\n`;
            text += `------------------------------------------\n\n`;
        });
        
        return text;
    }

    formatAsCSV(chatContent) {
        let csv = 'Role,Content,Timestamp\n';
        
        chatContent.messages.forEach(message => {
            const escapedContent = `"${message.content.replace(/"/g, '""')}"`;
            csv += `${message.role},${escapedContent},${message.timestamp}\n`;
        });
        
        return csv;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    downloadFile(content, fileName, format) {
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