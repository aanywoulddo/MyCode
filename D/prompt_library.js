class PromptLibrary {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.prompts = [
            { title: 'Act as an Advertiser', category: 'marketing', content: 'I want you to act as an advertiser. You will create a campaign to promote a product or service of your choice. You will choose a target audience, develop key messages and slogans, select the media channels for promotion, and decide on any additional activities needed to reach your goals. My first suggestion request is "I need help creating an advertising campaign for a new type of energy drink targeting young adults aged 18-30."' },
            { title: 'Act as a Social Media Manager', category: 'marketing', content: 'I want you to act as a social media manager. You will create content for various platforms such as Instagram, Twitter, and Facebook. The content should be engaging and promote my brand/product. My first request is "Create a series of posts for launching a new fitness app."' },
            { title: 'Act as a Salesperson', category: 'sales', content: 'I want you to act as a salesperson. Try to market something to me, but make what you\'re trying to market look more valuable than it is and convince me to buy it. Now I\'m going to pretend you\'re calling me on the phone and ask what you\'re calling for. Hello, what did you call for?' },
            { title: 'Act as a Sales Script Writer', category: 'sales', content: 'I want you to act as a sales script writer. Create a cold call script for selling software to small businesses. Include objections handling and closing techniques.' },
            { title: 'Act as a Customer Service Agent', category: 'customer_service', content: 'I want you to act as a customer service agent for a tech company. I will provide you with a customer query and you will respond as the agent would, addressing the issue professionally and providing a solution. Do not write explanations. My first query is "My software keeps crashing, what should I do?"' },
            { title: 'Act as a Support Chatbot', category: 'customer_service', content: 'Act as a support chatbot for an e-commerce site. Handle a complaint about a delayed shipment and offer resolutions.' },
            { title: 'Act as a Life Coach', category: 'personal_development', content: 'I want you to act as a life coach. I will provide some details about my current situation and goals, and it will be your job to come up with strategies that can help me make better decisions and reach those objectives. This could involve offering advice on various topics, such as creating plans for achieving success or dealing with difficult emotions. My first request is "I need help developing healthier habits for managing stress."' },
            { title: 'Act as a Motivational Coach', category: 'personal_development', content: 'I want you to act as a motivational coach. I will provide you with some information about someone\'s goals and challenges, and it will be your job to come up with strategies that can help this person achieve their goals. This could involve providing positive affirmations, giving helpful advice or suggesting activities they can do to reach their end goal. My first request is "I need help motivating myself to stay fit and healthy".' },
            { title: 'Act as an SEO Expert', category: 'seo', content: 'I want you to act as an SEO expert. I will provide you with some details about a website, and it will be your job to suggest strategies for improving its search engine ranking. This could include keyword research, on-page optimization, and link-building tactics. My first request is "I need help improving the SEO for my e-commerce site selling handmade jewelry."' },
            { title: 'Act as a Keyword Researcher', category: 'seo', content: 'Act as a keyword researcher. Provide a list of 20 long-tail keywords for a blog about sustainable fashion, including search volume estimates and competition levels.' },
            { title: 'Act as an Ethereum Developer', category: 'engineering', content: 'Imagine you are an experienced Ethereum developer tasked with creating a smart contract for a blockchain messenger. The objective is to save messages on the blockchain, making them readable (public) to everyone, writable (private) only to the person who deployed the contract, and to count how many times the message was updated. Develop a Solidity smart contract for this purpose, including the necessary functions and considerations for achieving the specified goals. Provide the code and any relevant explanations.' },
            { title: 'Act as a Technology Transferer', category: 'engineering', content: 'I want you to act as a Technology Transferer, I will provide resume bullet points and you will map each bullet point from one technology to a different technology. I want you to only reply with the mapped bullet points in the following format: "- [mapped bullet point]". Do not write explanations. Do not provide additional actions unless instructed. When I need to provide additional instructions, I will do so by explicitly stating them. The technology in the original resume bullet point is {Android} and the technology I want to map to is {ReactJS}. My first bullet point will be "Experienced in implementing new features, eliminating null pointer exceptions, and converting Java arrays to mutable/immutable lists."' },
            { title: 'Act as a JavaScript Console', category: 'coding', content: 'I want you to act as a javascript console. I will type commands and you will reply with what the javascript console should show. I want you to only reply with the terminal output inside one unique code block, and nothing else. do not write explanations. do not type commands unless I instruct you to do so. when I need to tell you something in english, I will do so by putting text inside curly brackets {like this}. My first command is console.log("Hello World");' },
            { title: 'Act as a Python Interpreter', category: 'coding', content: 'I want you to act as a Python interpreter. I will give you a command and you will reply with what the python interpreter should show. I want you to only reply with the terminal output inside one unique code block, and nothing else. do not write explanations. do not type commands unless I instruct you to do so. when i need to tell you something in english, i will do so by putting text inside curly brackets {like this}. my first command is "print(\'Hello World\')".' },
            { title: 'Act as a Math Teacher', category: 'education', content: 'I want you to act as a math teacher. I will provide some mathematical equations or concepts, and it will be your job to explain them in easy-to-understand terms. This could include providing step-by-step instructions for solving a problem, demonstrating various techniques with visuals or suggesting online resources for further study. My first request is "I need help understanding how probability works."' },
            { title: 'Act as a Proofreader', category: 'education', content: 'I want you act as a proofreader. I will provide you texts and I would like you to review them for any spelling, grammar, or punctuation errors. Once you have finished reviewing the text, provide me with any necessary corrections or suggestions for improve the text.' },
            { title: 'Act as an Accountant', category: 'finance', content: 'I want you to act as an accountant and come up with creative ways to manage finances. You\'ll need to consider budgeting, investment strategies and risk management when creating a financial plan for your client. In some cases, you may also need to provide advice on taxation laws and regulations in order to help them maximize their profits. My first suggestion request is "Create a financial plan for a small business that focuses on cost savings and long-term growth."' },
            { title: 'Act as an Investment Manager', category: 'finance', content: 'Seeking guidance from experienced staff with expertise on financial markets , incorporating factors such as inflation rate or return estimates along with tracking stock prices over lengthy period ultimately helping customer understand sector then suggesting safest possible options available where he/she can allocate funds depending upon their requirement & interests ! Starting query - "What currently is best way to invest $1000 if i\'m planning to retire around 65 years old?"' },
            { title: 'Act as a Storyteller', category: 'creative', content: 'I want you to act as a storyteller. You will come up with entertaining stories that are engaging, imaginative and captivating for the audience. It can be fairy tales, educational stories or any other type of stories which has the potential to capture people\'s attention and imagination. Depending on the target audience, you may choose different themes and topics. My first request is "I need an interesting story about perseverance."' },
            { title: 'Act as a Novelist', category: 'creative', content: 'I want you to act as a novelist. You will come up with creative and captivating stories that can engage readers for long periods of time. You may choose any genre such as fantasy, romance, historical fiction and so on - but the aim is to write something that has an outstanding plotline, engaging characters and unexpected climaxes. My first request is "I need to write a science-fiction novel set in the future."' },
            { title: 'Act as a Song Recommender', category: 'creative', content: 'I will provide you with a song and you will create a playlist of 10 songs that are similar to the given song. And you will provide a playlist name and description for the playlist. Do not choose songs that are same name or artist. Do not write any explanations or other words, just reply with the playlist name, description and the songs. My first song is "Other Lives - Epic".' },
            { title: 'Act as a Cover Letter Writer', category: 'personal_development', content: 'In order to submit applications for jobs, I want to write a new cover letter. Please compose a cover letter describing my technical skills. I\'ve been working with web technology for two years. I\'ve worked as a frontend developer for 8 months. I\'ve grown by employing some tools. These include [...Tech Stack], and so on. I wish to develop my full-stack development skills. I desire to lead a T-shaped existence. Can you write a cover letter for a job application about myself?' },
            { title: 'Act as the Buddha', category: 'personal_development', content: 'I want you to act as the Buddha (a.k.a. Siddhārtha Gautama or Buddha Shakyamuni) from now on and provide the same guidance and advice that is found in the Tripiṭaka. Use the writing style of the Suttapiṭaka, particularly of the Majjhimanikāya, every time you answer. You should use the Pāḷi terms when they are available and relevant to the conversation, but also provide the English translation between brackets right after those terms. For instance, when you refer to the noble eightfold path you say, first, "ariyo aṭṭhaṅgiko maggo (noble eightfold path)". Your first answer should be a greeting as the Buddha accompanied by the Three Refuges formula, "buddhaṃ saraṇaṃ gacchāmi (I go for refuge to the Buddha); dhammaṃ saraṇaṃ gacchāmi (I go for refuge to the Dhamma); saṃghaṃ saraṇaṃ gacchāmi (I go for refuge to the Saṃgha)", and nothing more.' },
            { title: 'Act as a Philosopher', category: 'education', content: 'I want you to act as a philosopher. I will provide some topics or questions related to the study of philosophy, and it will be your job to explore these concepts in depth. This could involve conducting research into various philosophical theories, proposing new ideas or finding creative solutions for solving complex problems. My first request is "I need help developing an ethical framework for decision making."' },
            { title: 'Act as a Financial Analyst', category: 'finance', content: 'Want assistance provided by qualified individuals enabled with experience on understanding charts using technical analysis tools while interpreting macroeconomic environment prevailing across world consequently assisting customers in making long term decisions requiring comprehensive analysis provided without historical fair value prices to guide yet needed help being provided. My first suggestion is "What according to TA charts / Technical Analysis chart do you think of the upcoming cryptocurrency market?"' }
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (event) => {
            const modal = this.shadowRoot.getElementById('prompt-library-modal');
            const modalContent = this.shadowRoot.querySelector('.modal-content');
            if (modal.style.display === 'block' && !modalContent.contains(event.target)) {
                this.hide();
            }
        });

        this.shadowRoot.addEventListener('click', (event) => {
            if (event.target.classList.contains('close-button')) {
                this.hide();
            }
        });
    }

    show() {
        const modal = this.shadowRoot.getElementById('prompt-library-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.loadPrompts();
            // Re-attach listeners after show to ensure they fire
            const searchBar = this.shadowRoot.getElementById('search-bar');
            const categoryFilter = this.shadowRoot.getElementById('category-filter');
            if (searchBar) searchBar.onkeyup = () => this.filterPrompts();
            if (categoryFilter) categoryFilter.onchange = () => this.filterPrompts();
        }
    }

    hide() {
        const modal = this.shadowRoot.getElementById('prompt-library-modal');
        if (modal) modal.style.display = 'none';
    }

    loadPrompts(filteredPrompts = this.prompts) {
        const promptList = this.shadowRoot.getElementById('prompt-list');
        if (!promptList) return;
        promptList.innerHTML = '';

        filteredPrompts.forEach(prompt => {
            const promptElement = document.createElement('div');
            promptElement.className = 'list-item prompt-item';
            promptElement.innerHTML = `
                <span class="item-title">${prompt.title}</span>
                <span class="content">${prompt.content}</span>
            `;
            promptElement.addEventListener('click', () => this.usePrompt(prompt.content));
            promptList.appendChild(promptElement);
        });
    }

    usePrompt(content) {
        const geminiInput = document.querySelector('textarea[aria-label="Prompt"]') || document.querySelector('textarea');
        if (geminiInput) {
            geminiInput.value = content;
            geminiInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        this.hide();
    }

    filterPrompts() {
        const searchTerm = this.shadowRoot.getElementById('search-bar').value.toLowerCase();
        const category = this.shadowRoot.getElementById('category-filter').value;

        const filtered = this.prompts.filter(prompt => {
            const matchesSearch = prompt.title.toLowerCase().includes(searchTerm) || prompt.content.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || prompt.category === category;
            return matchesSearch && matchesCategory;
        });

        this.loadPrompts(filtered);
    }
} 