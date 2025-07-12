class PromptLibrary {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.prompts = [
            // Marketing
            { title: 'Marketing Copy', content: 'Write a catchy marketing slogan for a new coffee brand.', category: 'marketing' },
            { title: 'Product Description', content: 'Create a compelling product description for [product name] that highlights its key features and benefits.', category: 'marketing' },
            { title: 'Social Media Post', content: 'Write an engaging social media post about [topic] that encourages interaction and shares.', category: 'marketing' },
            { title: 'Email Marketing', content: 'Create a persuasive email marketing campaign for [product/service] targeting [audience].', category: 'marketing' },
            
            // Sales
            { title: 'Sales Email', content: 'Draft a follow-up email to a potential client who has shown interest in our product.', category: 'sales' },
            { title: 'Sales Pitch', content: 'Create a compelling 2-minute sales pitch for [product/service] addressing common objections.', category: 'sales' },
            { title: 'Cold Outreach', content: 'Write a professional cold outreach message for [target audience] about [product/service].', category: 'sales' },
            
            // Coding
            { title: 'Code Generation', content: 'Generate a Python function to calculate the factorial of a number.', category: 'coding' },
            { title: 'Code Review', content: 'Review this code and suggest improvements for performance, readability, and best practices: [paste code here]', category: 'coding' },
            { title: 'Bug Fix', content: 'Help me debug this code. Here\'s the error I\'m getting: [error message] and here\'s the code: [paste code]', category: 'coding' },
            { title: 'API Documentation', content: 'Create comprehensive API documentation for this function: [paste function]', category: 'coding' },
            { title: 'Unit Tests', content: 'Write unit tests for this function: [paste function]', category: 'coding' },
            
            // Creative
            { title: 'Creative Writing', content: 'Write a short story about a robot who discovers music.', category: 'creative' },
            { title: 'Blog Post', content: 'Write a comprehensive blog post about [topic] that is engaging and informative.', category: 'creative' },
            { title: 'Video Script', content: 'Create a script for a 5-minute video explaining [topic] to [target audience].', category: 'creative' },
            { title: 'Content Ideas', content: 'Generate 10 creative content ideas for [topic/industry] that would engage [target audience].', category: 'creative' },
            
            // Personal Development
            { title: 'Goal Setting', content: 'Help me create a SMART goal framework for achieving [specific objective] within [timeframe].', category: 'personal_development' },
            { title: 'Career Advice', content: 'Provide career advice for someone looking to transition from [current role] to [desired role].', category: 'personal_development' },
            { title: 'Learning Plan', content: 'Create a structured learning plan to master [skill/topic] in [timeframe].', category: 'personal_development' },
            { title: 'Resume Review', content: 'Review and improve this resume for a [target position]: [paste resume]', category: 'personal_development' },
            
            // Customer Service
            { title: 'Customer Support', content: 'Write a helpful customer support response for a client who [describe issue].', category: 'customer_service' },
            { title: 'Complaint Response', content: 'Draft a professional response to this customer complaint: [paste complaint]', category: 'customer_service' },
            { title: 'FAQ Creation', content: 'Create comprehensive FAQ answers for common questions about [product/service].', category: 'customer_service' },
            
            // SEO
            { title: 'SEO Content', content: 'Write SEO-optimized content about [topic] targeting the keyword "[keyword]".', category: 'seo' },
            { title: 'Meta Descriptions', content: 'Create compelling meta descriptions for pages about [topic] that are under 160 characters.', category: 'seo' },
            { title: 'Keyword Research', content: 'Suggest relevant keywords and search terms for content about [topic].', category: 'seo' },
            
            // Engineering
            { title: 'Technical Documentation', content: 'Write technical documentation for [system/process] that explains how it works and how to use it.', category: 'engineering' },
            { title: 'Architecture Design', content: 'Help me design a system architecture for [project description] considering scalability and performance.', category: 'engineering' },
            { title: 'Requirements Analysis', content: 'Analyze these requirements and identify potential issues or improvements: [paste requirements]', category: 'engineering' },
            
            // Education
            { title: 'Lesson Plan', content: 'Create a lesson plan for teaching [topic] to [target audience/grade level].', category: 'education' },
            { title: 'Study Guide', content: 'Create a comprehensive study guide for [subject/topic] covering key concepts and practice questions.', category: 'education' },
            { title: 'Quiz Generator', content: 'Generate a quiz with 10 questions about [topic] with multiple choice answers.', category: 'education' },
            
            // Finance
            { title: 'Budget Analysis', content: 'Help me analyze this budget and suggest optimizations: [paste budget details]', category: 'finance' },
            { title: 'Investment Advice', content: 'Provide general investment guidance for someone with [financial situation] and [risk tolerance].', category: 'finance' },
            { title: 'Financial Planning', content: 'Create a basic financial plan for achieving [financial goal] within [timeframe].', category: 'finance' },
        ];
        this.init();
    }

    init() {
        // Only setup event listeners if elements exist
        if (this.shadowRoot.getElementById('prompt-library-modal')) {
            this.setupEventListeners();
        }
    }

    // Public method to initialize event listeners after HTML is loaded
    initializeEventListeners() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('Setting up event listeners for prompt library');
        
        const closeButton = this.shadowRoot.querySelector('.close-button');
        const searchBar = this.shadowRoot.getElementById('search-bar');
        const categoryFilter = this.shadowRoot.getElementById('category-filter');
        const modal = this.shadowRoot.getElementById('prompt-library-modal');

        console.log('Elements found:', {
            closeButton: !!closeButton,
            searchBar: !!searchBar,
            categoryFilter: !!categoryFilter,
            modal: !!modal
        });

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                console.log('Close button clicked');
                this.hide();
            });
        }

        if (searchBar) {
            searchBar.addEventListener('keyup', () => this.filterPrompts());
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterPrompts());
        }

        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    console.log('Modal background clicked');
                    this.hide();
                }
            });
        }
    }

    show() {
        console.log('Showing prompt library modal');
        const modal = this.shadowRoot.getElementById('prompt-library-modal');
        if (modal) {
            modal.style.display = 'block';
            this.loadPrompts();
        } else {
            console.error('Modal element not found when trying to show');
        }
    }

    hide() {
        console.log('Hiding prompt library modal');
        const modal = this.shadowRoot.getElementById('prompt-library-modal');
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.error('Modal element not found when trying to hide');
        }
    }

    loadPrompts(filteredPrompts = this.prompts) {
        const promptList = this.shadowRoot.getElementById('prompt-list');
        promptList.innerHTML = '';

        filteredPrompts.forEach(prompt => {
            const promptElement = document.createElement('div');
            promptElement.className = 'prompt-item';
            promptElement.setAttribute('data-category', prompt.category);
            promptElement.innerHTML = `
                <div class="prompt-header">
                    <div class="title">${prompt.title}</div>
                    <button class="copy-btn" title="Copy prompt">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                <div class="content">${prompt.content}</div>
            `;
            
            // Click on prompt inserts it
            promptElement.addEventListener('click', (e) => {
                if (!e.target.closest('.copy-btn')) {
                    this.usePrompt(prompt.content);
                }
            });
            
            // Copy button functionality
            const copyBtn = promptElement.querySelector('.copy-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(prompt.content).then(() => {
                    copyBtn.innerHTML = '✓';
                    setTimeout(() => {
                        copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                        </svg>`;
                    }, 1000);
                });
            });
            
            promptList.appendChild(promptElement);
        });
    }

    usePrompt(content) {
        // Updated selectors based on the actual Gemini HTML structure
        const selectors = [
            '.ql-editor.textarea.new-input-ui', // This matches your HTML exactly
            'rich-textarea .ql-editor',
            '.ql-editor[contenteditable="true"]',
            'div[contenteditable="true"][role="textbox"]'
        ];

        let geminiInput = null;
        
        for (const selector of selectors) {
            geminiInput = document.querySelector(selector);
            if (geminiInput) {
                console.log(`Found input using: ${selector}`);
                break;
            }
        }

        if (geminiInput && geminiInput.contentEditable === 'true') {
            // Clear existing content first
            geminiInput.innerHTML = '';
            
            // Insert the prompt
            const p = document.createElement('p');
            p.textContent = content;
            geminiInput.appendChild(p);
            
            // Remove the ql-blank class if present
            geminiInput.classList.remove('ql-blank');
            
            // Focus the input
            geminiInput.focus();
            
            // Trigger input event for Gemini to recognize the change
            geminiInput.dispatchEvent(new Event('input', { bubbles: true }));
            geminiInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Set cursor at end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(geminiInput);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            
            this.hide();
        } else {
            console.error('Could not find Gemini input field');
            alert('Could not find the chat input field. Please make sure you are on the Gemini chat page.');
        }
    }

    filterPrompts() {
        const searchBar = this.shadowRoot.getElementById('search-bar');
        const categoryFilter = this.shadowRoot.getElementById('category-filter');
        
        if (!searchBar || !categoryFilter) {
            console.log('Search bar or category filter not found');
            return;
        }

        const searchTerm = searchBar.value.toLowerCase();
        const category = categoryFilter.value;

        console.log('Filtering prompts - Search:', searchTerm, 'Category:', category);

        const filtered = this.prompts.filter(prompt => {
            const matchesSearch = prompt.title.toLowerCase().includes(searchTerm) || prompt.content.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || prompt.category === category;
            return matchesSearch && matchesCategory;
        });

        console.log('Filtered prompts count:', filtered.length);
        this.loadPrompts(filtered);
    }
} 