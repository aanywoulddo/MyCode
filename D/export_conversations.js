class ExportConversations {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.isInitialized = false;
    }

    init() {
        if (!this.isInitialized) {
            this.setupEventListeners();
            this.isInitialized = true;
        }
    }

    setupEventListeners() {
        // This will be called after HTML is loaded
        console.log('Setting up export conversations event listeners');
        
        const closeButton = this.shadowRoot.querySelector('.export-close-button');
        const exportModal = this.shadowRoot.getElementById('export-conversations-modal');
        const exportTextBtn = this.shadowRoot.getElementById('export-text-btn');
        const exportPdfBtn = this.shadowRoot.getElementById('export-pdf-btn');
        const exportJsonBtn = this.shadowRoot.getElementById('export-json-btn');
        
        if (closeButton) {
            closeButton.onclick = () => this.hide();
        }

        if (exportModal) {
            exportModal.onclick = (event) => {
                if (event.target === exportModal) {
                    this.hide();
                }
            };
        }

        if (exportTextBtn) {
            exportTextBtn.onclick = () => this.exportAsText();
        }

        if (exportPdfBtn) {
            exportPdfBtn.onclick = () => this.exportAsPdf();
        }

        if (exportJsonBtn) {
            exportJsonBtn.onclick = () => this.exportAsJson();
        }
    }

    show() {
        const modal = this.shadowRoot.getElementById('export-conversations-modal');
        if (modal) {
            modal.style.display = 'block';
            this.updateConversationPreview();
        }
    }

    hide() {
        const modal = this.shadowRoot.getElementById('export-conversations-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    updateConversationPreview() {
        const previewElement = this.shadowRoot.getElementById('conversation-preview');
        if (!previewElement) return;

        const conversationData = this.extractConversationData();
        previewElement.innerHTML = `
            <p><strong>Conversation Title:</strong> ${conversationData.title || 'Untitled Conversation'}</p>
            <p><strong>Date:</strong> ${conversationData.date}</p>
            <p><strong>Messages:</strong> ${conversationData.messages.length}</p>
            <p><strong>Preview:</strong></p>
            <div class="preview-content">
                ${conversationData.messages.slice(0, 3).map(msg => 
                    `<div class="preview-message">
                        <strong>${msg.role}:</strong> ${msg.content.substring(0, 100)}...
                    </div>`
                ).join('')}
                ${conversationData.messages.length > 3 ? '<div class="preview-more">... and more messages</div>' : ''}
            </div>
        `;
    }

    extractConversationData() {
        // Extract conversation data from Gemini page
        const messages = [];
        const conversationTitle = this.getConversationTitle();
        
        // Find all message groups in Gemini
        const messageContainers = document.querySelectorAll('[data-is-streaming], .font-claude-message, [class*="message"]');
        
        // If no specific message containers found, try broader selectors
        const fallbackContainers = document.querySelectorAll('div[class*="conversation"], div[class*="chat"], div[class*="message"]');
        const containers = messageContainers.length > 0 ? messageContainers : Array.from(fallbackContainers).slice(0, 10);

        containers.forEach((container, index) => {
            const text = container.textContent?.trim();
            if (text && text.length > 10) {
                // Try to determine if it's user or AI based on context
                const isUserMessage = this.isUserMessage(container, index);
                messages.push({
                    role: isUserMessage ? 'User' : 'Gemini',
                    content: text,
                    timestamp: new Date().toISOString()
                });
            }
        });

        return {
            title: conversationTitle,
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toISOString(),
            messages: messages
        };
    }

    isUserMessage(container, index) {
        // Simple heuristic to determine if message is from user
        // This can be improved with better selectors specific to Gemini
        const text = container.textContent?.trim();
        const hasUserClass = container.classList.toString().includes('user') || 
                            container.closest('[class*="user"]');
        
        // Even indexed messages are often user messages in many chat UIs
        const isEvenIndex = index % 2 === 0;
        
        return hasUserClass || isEvenIndex;
    }

    getConversationTitle() {
        // Try to find conversation title in Gemini interface
        const titleSelectors = [
            'h1',
            '[class*="title"]',
            '[class*="conversation"]',
            'title'
        ];

        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim()) {
                return element.textContent.trim();
            }
        }

        return 'Gemini Conversation';
    }

    exportAsText() {
        const data = this.extractConversationData();
        const textContent = this.formatAsText(data);
        this.downloadFile(textContent, `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, 'text/plain');
        this.hide();
    }

    exportAsJson() {
        const data = this.extractConversationData();
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`, 'application/json');
        this.hide();
    }

    async exportAsPdf() {
        try {
            // Simple PDF export using browser's print functionality
            const data = this.extractConversationData();
            const htmlContent = this.formatAsHtml(data);
            
            // Create a new window with the conversation content
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${data.title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .message { margin-bottom: 15px; padding: 10px; border-radius: 5px; }
                        .user { background-color: #e3f2fd; }
                        .ai { background-color: #f3e5f5; }
                        .role { font-weight: bold; margin-bottom: 5px; }
                        .timestamp { font-size: 0.8em; color: #666; }
                    </style>
                </head>
                <body>${htmlContent}</body>
                </html>
            `);
            
            printWindow.document.close();
            
            // Give the window time to load then trigger print
            setTimeout(() => {
                printWindow.print();
                setTimeout(() => printWindow.close(), 1000);
            }, 500);
            
            this.hide();
        } catch (error) {
            console.error('Error exporting as PDF:', error);
            alert('Error exporting as PDF. Please try another format.');
        }
    }

    formatAsText(data) {
        let text = `${data.title}\n`;
        text += `Date: ${data.date}\n`;
        text += `Exported: ${new Date().toLocaleString()}\n`;
        text += '='.repeat(50) + '\n\n';

        data.messages.forEach((message, index) => {
            text += `${message.role}:\n${message.content}\n\n`;
            if (index < data.messages.length - 1) {
                text += '-'.repeat(30) + '\n\n';
            }
        });

        text += '\n' + '='.repeat(50) + '\n';
        text += 'Exported from Gemini Toolbox\n';
        
        return text;
    }

    formatAsHtml(data) {
        let html = `<h1>${data.title}</h1>`;
        html += `<p><strong>Date:</strong> ${data.date}</p>`;
        html += `<p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>`;

        data.messages.forEach(message => {
            const cssClass = message.role.toLowerCase() === 'user' ? 'user' : 'ai';
            html += `
                <div class="message ${cssClass}">
                    <div class="role">${message.role}:</div>
                    <div class="content">${message.content.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        });

        html += '<p><em>Exported from Gemini Toolbox</em></p>';
        return html;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    initializeEventListeners() {
        // Public method to initialize event listeners after HTML is loaded
        this.init();
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ExportConversations = ExportConversations;
}