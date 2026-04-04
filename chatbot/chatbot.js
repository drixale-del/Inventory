/* ============================================================
   PRECISION POS — CHATBOT MODULE LOGIC
   ============================================================ */

(async function initChatbot() {
  // Prevent duplicate injection if loaded multiple times
  if (document.getElementById('chatbot-fab')) return;

  // 1. Inject CSS and API Config
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '../chatbot/chatbot.css';
  document.head.appendChild(link);

  const apiScript = document.createElement('script');
  apiScript.src = '../chatbot/integration/ai-service.js';
  document.head.appendChild(apiScript);

  // 2. Fetch DOM HTML file and Inject it
  let htmlContent = "";
  try {
    const res = await fetch('../chatbot/chatbot.html');
    if (res.ok) {
      htmlContent = await res.text();
    } else {
      console.error("Failed to load chatbot HTML:", res.status);
      return;
    }
  } catch (err) {
    console.error("Failed to fetch chatbot HTML:", err);
    return;
  }

  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // 3. Elements
  const fab = document.getElementById('chatbot-fab');
  const win = document.getElementById('chatbot-window');
  const msgArea = document.getElementById('chatbot-messages');
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');

  // 4. State
  let isOpen = false;
  // Shared chat history? We can use sessionStorage to persist across pages during a session
  const SESSION_KEY = 'precision_chat_history';

  // 5. Functions
  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      fab.classList.add('open');
      win.classList.add('open');
      input.focus();
      scrollToBottom();
    } else {
      fab.classList.remove('open');
      win.classList.remove('open');
    }
  }

  function formatTime(date) {
    let h = date.getHours();
    let m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m} ${ampm}`;
  }

  function appendMessage(sender, text, timestamp = null, save = true) {
    if (!text.trim()) return;
    const time = timestamp || formatTime(new Date());

    const msgDiv = document.createElement('div');
    msgDiv.className = `chatbot-msg ${sender}`;
    msgDiv.innerHTML = `
      <div class="chatbot-bubble">${text}</div>
      <div class="chatbot-time">${time}</div>
    `;
    msgArea.appendChild(msgDiv);
    scrollToBottom();

    if (save) saveHistory(sender, text, time);
  }

  function saveHistory(sender, text, time) {
    const history = getHistory();
    history.push({ sender, text, time });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(history));
  }

  function getHistory() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function loadHistory() {
    const history = getHistory();
    if (history.length === 0) {
      // Add welcome message if none
      appendMessage('bot', 'Hello! I am Precision AI. How can I assist you with your warehouse and sales today?');
    } else {
      history.forEach(msg => appendMessage(msg.sender, msg.text, msg.time, false));
    }
  }

  function scrollToBottom() {
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    
    // User message
    appendMessage('user', text);
    input.value = '';
    sendBtn.disabled = true;

    // Optional visually satisfying small delay, then API call
    setTimeout(async () => {
      if (window.PrecisionAI) {
        // We pass the exact session history object to the AI Service which hits the endpoint!
        const history = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || [];
        const botResponse = await window.PrecisionAI.generateResponse(history);
        appendMessage('bot', botResponse);
      } else {
        appendMessage('bot', "⚠️ Integration module not found. Please review ai-service.js!");
      }
    }, 400);
  }

  // 6. Event Listeners
  fab.addEventListener('click', toggleChat);

  input.addEventListener('input', () => {
    sendBtn.disabled = input.value.trim() === '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);

  // Close when clicking safely outside chatbot window area
  document.addEventListener('click', (e) => {
    if (isOpen && !container.contains(e.target)) {
      toggleChat();
    }
  });

  // Initialize
  loadHistory();

  // If we want to auto-open lightly on first launch:
  // setTimeout(toggleChat, 1000); 

})();
