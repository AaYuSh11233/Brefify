function addFontLink() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
  document.head.appendChild(link);
}

function addFontAwesomeLink() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
  document.head.appendChild(link);
}

addFontLink();
addFontAwesomeLink();

const API_KEY = "AIzaSyC-wr6H1HERa9gHYGF8YD--Y_5APKr-jRE";

function createChatButtons() {
  const chatButton = document.createElement('button');
  chatButton.className = 'chatbot-toggler';
  chatButton.innerHTML = '<span class="material-symbols-outlined">summarize</span><span class="material-symbols-outlined">close</span>';
  document.body.appendChild(chatButton);

  const summarizerButton = document.createElement('button');
  summarizerButton.className = 'chatbot-summarizer';
  summarizerButton.innerHTML = '<span class="material-symbols-outlined">smart_toy</span>';
  document.body.appendChild(summarizerButton);

  chatButton.addEventListener('click', toggleSummarizer);
  summarizerButton.addEventListener('click', toggleChatbot);
}

function createChatbot() {
  const chatbot = document.createElement('div');
  chatbot.className = 'chatbot';
  chatbot.innerHTML = `
    <header>
      <h1>Brefify - Bot</h1>
      <span class="close-btn material-symbols-outlined">close</span>
    </header>
    <ul class="chatbox">
      <li class="chat incoming">
        <span class="yume-logo"><img src="${chrome.runtime.getURL('bot.jpg')}" alt=""></span>
        <p>Yo!<br> What can I do for you today? </p>
      </li>
    </ul>
    <div class="chat-input">
      <textarea rows="2" placeholder="Enter a message" required></textarea>
      <span id="send-btn" class="material-symbols-outlined">send</span>
    </div>
  `;
  document.body.appendChild(chatbot);

  const closeBtn = chatbot.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toggleChatbot();
    });
  }

  const sendBtn = chatbot.querySelector('#send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', handleChat);
  }

  const textarea = chatbot.querySelector('textarea');
  if (textarea) {
    textarea.addEventListener('input', adjustTextareaHeight);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChat();
      }
    });
  }
}

function toggleChatbot() {
  const chatbot = document.querySelector('.chatbot');
  const summarizer = document.querySelector('.summarizer-container');
  const summarizerButton = document.querySelector('.chatbot-summarizer');
  const chatbotToggler = document.querySelector('.chatbot-toggler');

  if (chatbot) {
    chatbot.classList.toggle('show-chatbot');
    const isChatbotVisible = chatbot.classList.contains('show-chatbot');
    
    if (isChatbotVisible) {
      if (summarizer) summarizer.classList.remove('show-summarizer');
      chatbotToggler.style.display = 'flex';
      summarizerButton.classList.add('show-chatbot');
      document.body.classList.add('show-chatbot');
    } else {
      summarizerButton.classList.remove('show-chatbot');
      document.body.classList.remove('show-chatbot');
    }
  }

  // Always show the chatbot toggler (mode_comment button)
  chatbotToggler.style.display = 'flex';
}

function toggleSummarizer() {
  const chatbot = document.querySelector('.chatbot');
  const summarizer = document.querySelector('.summarizer-container');
  const summarizerButton = document.querySelector('.chatbot-summarizer');
  const chatbotToggler = document.querySelector('.chatbot-toggler');

  if (!summarizer) {
    createSummarizer();
  } else {
    summarizer.classList.toggle('show-summarizer');
  }

  if (chatbot) {
    chatbot.classList.remove('show-chatbot');
    summarizerButton.classList.remove('show-chatbot');
    document.body.classList.remove('show-chatbot');
  }

  // Show the summarizer button when toggling summarizer
  summarizerButton.style.display = 'flex';

  // Always keep the chatbot toggler (mode_comment button) visible
  chatbotToggler.style.display = 'flex';
}

function createChatLi(message, className) {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);
  let chatContent = className === "outgoing" ? `<p></p>` : `<span class="yume-logo"><img src="${chrome.runtime.getURL('bot.jpg')}" alt=""></span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
}

async function generateResponse(incomingChatLi, userMessage) {
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;
  const messageElement = incomingChatLi.querySelector("p");

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      contents: [{ 
        role: "user", 
        parts: [{ text: userMessage }] 
      }] 
    })
  };

  try {
    const response = await fetch(API_URL, requestOptions);
    
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      messageElement.textContent = data.candidates[0].content.parts[0].text;
      incomingChatLi.classList.add("incoming-response");
    } else {
      throw new Error("Invalid response structure");
    }
  } catch (error) {
    if (messageElement) {
      messageElement.classList.add("error");
      messageElement.textContent = "Oops! Something went wrong. Please try again.";
    }
    console.error(error);
  } finally {
    scrollToBottom();
  }
}

function scrollToBottom() {
  const chatbox = document.querySelector('.chatbox');
  if (chatbox) {
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
}

function handleChat() {
  const chatInput = document.querySelector(".chat-input textarea");
  const chatbox = document.querySelector(".chatbox");

  let userMessage = chatInput.value.trim();
  if (!userMessage) return;

  chatInput.value = "";
  adjustTextareaHeight();

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  scrollToBottom();

  setTimeout(() => {
    const incomingChatLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(incomingChatLi);
    scrollToBottom();
    generateResponse(incomingChatLi, userMessage);
  }, 600);
}

function adjustTextareaHeight() {
  const textarea = document.querySelector(".chat-input textarea");
  if (textarea) {
    textarea.style.height = "auto";
    textarea.style.height = (textarea.scrollHeight) + "px";
  }
}

function createSummarizer() {
  const summarizerContainer = document.createElement('div');
  summarizerContainer.className = 'summarizer-container';
  summarizerContainer.innerHTML = `
    <div class="summarizer">
      <header>
        <h1>Brefify - Summarizer</h1>
        <span class="close-btn material-symbols-outlined">close</span>
      </header>
      <div class="summarizer-content">
        <div class="language-selector">
          <input type="text" id="language-input" value="English" readonly>
          <div id="language-dropdown" class="hidden">
            <div id="language-list"></div>
          </div>
        </div>
        <div class="button-container">
          <button id="summarize-btn">Summarize</button>
          <button id="rewrite-btn">Rewrite</button>
        </div>
        <div id="summary-output"></div>
      </div>
    </div>
  `;
  document.body.appendChild(summarizerContainer);

  const languageInput = summarizerContainer.querySelector('#language-input');
  const languageDropdown = summarizerContainer.querySelector('#language-dropdown');
  const languageList = summarizerContainer.querySelector('#language-list');
  const languages = {
    'af': 'Afrikaans', 'sq': 'Albanian', 'am': 'Amharic', 'ar': 'Arabic', 'hy': 'Armenian', 'as': 'Assamese', 'ay': 'Aymara', 'az': 'Azerbaijani', 'bm': 'Bambara', 'eu': 'Basque', 'be': 'Belarusian', 'bn': 'Bengali', 'bho': 'Bhojpuri', 'bs': 'Bosnian', 'bg': 'Bulgarian', 'ca': 'Catalan', 'ceb': 'Cebuano', 'ny': 'Chichewa', 'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)', 'co': 'Corsican', 'hr': 'Croatian', 'cs': 'Czech', 'da': 'Danish', 'dv': 'Dhivehi', 'doi': 'Dogri', 'nl': 'Dutch', 'en': 'English', 'eo': 'Esperanto', 'et': 'Estonian', 'ee': 'Ewe', 'tl': 'Filipino', 'fi': 'Finnish', 'fr': 'French', 'fy': 'Frisian', 'gl': 'Galician', 'ka': 'Georgian', 'de': 'German', 'el': 'Greek', 'gn': 'Guarani', 'gu': 'Gujarati', 'ht': 'Haitian Creole', 'ha': 'Hausa', 'haw': 'Hawaiian', 'iw': 'Hebrew', 'hi': 'Hindi', 'hmn': 'Hmong', 'hu': 'Hungarian', 'is': 'Icelandic', 'ig': 'Igbo', 'ilo': 'Ilocano', 'id': 'Indonesian', 'ga': 'Irish', 'it': 'Italian', 'ja': 'Japanese', 'jw': 'Javanese', 'kn': 'Kannada', 'kk': 'Kazakh', 'km': 'Khmer', 'rw': 'Kinyarwanda', 'gom': 'Konkani', 'ko': 'Korean', 'kri': 'Krio', 'ku': 'Kurdish (Kurmanji)', 'ckb': 'Kurdish (Sorani)', 'ky': 'Kyrgyz', 'lo': 'Lao', 'la': 'Latin', 'lv': 'Latvian', 'ln': 'Lingala', 'lt': 'Lithuanian', 'lg': 'Luganda', 'lb': 'Luxembourgish', 'mk': 'Macedonian', 'mai': 'Maithili', 'mg': 'Malagasy', 'ms': 'Malay', 'ml': 'Malayalam', 'mt': 'Maltese', 'mi': 'Maori', 'mr': 'Marathi', 'mni-Mtei': 'Meiteilon (Manipuri)', 'lus': 'Mizo', 'mn': 'Mongolian', 'my': 'Myanmar (Burmese)', 'ne': 'Nepali', 'no': 'Norwegian', 'or': 'Odia (Oriya)', 'om': 'Oromo', 'ps': 'Pashto', 'fa': 'Persian', 'pl': 'Polish', 'pt': 'Portuguese', 'pa': 'Punjabi', 'qu': 'Quechua', 'ro': 'Romanian', 'ru': 'Russian', 'sm': 'Samoan', 'sa': 'Sanskrit', 'gd': 'Scots Gaelic', 'nso': 'Sepedi', 'sr': 'Serbian', 'st': 'Sesotho', 'sn': 'Shona', 'sd': 'Sindhi', 'si': 'Sinhala', 'sk': 'Slovak', 'sl': 'Slovenian', 'so': 'Somali', 'es': 'Spanish', 'su': 'Sundanese', 'sw': 'Swahili', 'sv': 'Swedish', 'tg': 'Tajik', 'ta': 'Tamil', 'tt': 'Tatar', 'te': 'Telugu', 'th': 'Thai', 'ti': 'Tigrinya', 'ts': 'Tsonga', 'tr': 'Turkish', 'tk': 'Turkmen', 'ak': 'Twi', 'uk': 'Ukrainian', 'ur': 'Urdu', 'ug': 'Uyghur', 'uz': 'Uzbek', 'vi': 'Vietnamese', 'cy': 'Welsh', 'xh': 'Xhosa', 'yi': 'Yiddish', 'yo': 'Yoruba', 'zu': 'Zulu', 'he': 'Hebrew', 'jv': 'Javanese', 'zh': 'Chinese (Simplified)'
  };
  
  let selectedLanguage = 'en';

  function updateLanguageList(searchTerm = '') {
    languageList.innerHTML = '';
    Object.entries(languages)
      .filter(([code, name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
      .forEach(([code, name]) => {
        const div = document.createElement('div');
        div.textContent = name;
        div.className = code === selectedLanguage ? 'selected' : '';
        div.addEventListener('click', () => {
          selectedLanguage = code;
          languageInput.value = name;
          languageDropdown.classList.add('hidden');
          languageInput.readOnly = true;
        });
        languageList.appendChild(div);
      });
  }

  languageInput.addEventListener('click', () => {
    languageDropdown.classList.toggle('hidden');
    if (!languageDropdown.classList.contains('hidden')) {
      languageInput.readOnly = false;
      languageInput.select();
      updateLanguageList();
    }
  });

  languageInput.addEventListener('input', (e) => {
    updateLanguageList(e.target.value);
  });

  languageInput.addEventListener('blur', () => {
    setTimeout(() => {
      languageDropdown.classList.add('hidden');
      languageInput.readOnly = true;
      languageInput.value = languages[selectedLanguage];
    }, 200);
  });

  document.addEventListener('click', (e) => {
    if (!summarizerContainer.contains(e.target)) {
      languageDropdown.classList.add('hidden');
      languageInput.readOnly = true;
      languageInput.value = languages[selectedLanguage];
    }
  });

  const closeBtn = summarizerContainer.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    toggleSummarizer();
    // Ensure both buttons are visible after closing
    document.querySelector('.chatbot-toggler').style.display = 'flex';
    document.querySelector('.chatbot-summarizer').style.display = 'flex';
  });

  const summarizeBtn = summarizerContainer.querySelector('#summarize-btn');
  summarizeBtn.addEventListener('click', () => summarizeContent(selectedLanguage));

  const rewriteBtn = summarizerContainer.querySelector('#rewrite-btn');
  rewriteBtn.addEventListener('click', () => rewriteSummary(selectedLanguage));

  summarizerContainer.classList.add('show-summarizer');
}

async function summarizeContent(language) {
  const summaryOutput = document.querySelector('#summary-output');
  summaryOutput.textContent = 'Summarizing...';

  try {
    const pageContent = document.body.innerText;
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ 
          role: "user", 
          parts: [{ text: `Summarize the following content in ${language} (up to 200 words):\n\n${pageContent}` }] 
        }]
      })
    });

    const data = await response.json();
    if (data && data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      summaryOutput.textContent = data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected response structure');
    }
  } catch (error) {
    console.error('Error summarizing content:', error);
    summaryOutput.textContent = 'Error summarizing content. Please try again.';
  }
}

async function rewriteSummary(language) {
  const summaryOutput = document.querySelector('#summary-output');
  const currentSummary = summaryOutput.textContent;
  summaryOutput.textContent = 'Rewriting...';

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ 
          role: "user", 
          parts: [{ text: `Rewrite the following summary in ${language} (up to 200 words):\n\n${currentSummary}` }] 
        }]
      })
    });

    const data = await response.json();
    if (data && data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      summaryOutput.textContent = data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected response structure');
    }
  } catch (error) {
    console.error('Error rewriting summary:', error);
    summaryOutput.textContent = 'Error rewriting summary. Please try again.';
  }
}

function addStyles() {
  const style = document.createElement('style');
  // Replace __MSG_@@extension_id__ with actual extension ID at runtime
  const styles = document.querySelector('.chatbot .chatbox')?.style.cssText
    .replace('__MSG_@@extension_id__', chrome.runtime.id);
  
  if (styles) {
    style.textContent = styles;
    document.head.appendChild(style);
  }
}

function initializeChatbot() {
  createChatButtons();
  createChatbot();
  addStyles();
  // Both buttons should be visible initially
  const chatbotToggler = document.querySelector('.chatbot-toggler');
  const summarizerButton = document.querySelector('.chatbot-summarizer');
  if (chatbotToggler) chatbotToggler.style.display = 'flex';
  if (summarizerButton) summarizerButton.style.display = 'flex';
}

initializeChatbot();