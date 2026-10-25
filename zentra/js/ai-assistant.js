/**
 * ZENTRA - Floating "Zentra AI" Assistant
 * Vanilla JavaScript ES6+
 * 
 * Features:
 * - Floating trigger button in bottom-right with pulsating status beacon
 * - Interactive chat modal with typing simulation indicator
 * - Rule-based conversational AI knowledge engine
 * - Dynamic live data integration:
 *   - Real-time route and seat queries from localStorage
 *   - Live user application & pass status lookups
 * - Quick suggestion buttons
 * - Chat history preservation during session & clear chat action
 */

let isAiChatOpen = false;
let isAiTyping = false;
let aiChatMessages = [];

// Default suggestions
const AI_SUGGESTIONS = [
  'How do I apply?',
  'How do I pay?',
  'What does pending mean?',
  'Show available routes',
  'How does the employee pass work?',
  'Where is my bus pass?'
];

/**
 * Initializes and mounts Zentra AI Floating Assistant into the DOM
 */
function initAiAssistant() {
  // Check if already mounted
  if (document.getElementById('aiAssistantRoot')) return;

  const root = document.createElement('div');
  root.id = 'aiAssistantRoot';

  root.innerHTML = `
    <!-- Floating Trigger Button -->
    <button class="ai-widget-button" id="aiTriggerBtn" onclick="toggleAiChatWindow()">
      <div class="ai-widget-pulse"></div>
      <span>Zentra AI</span>
      <span style="font-size:1.1rem;">👋</span>
    </button>

    <!-- Chat Window -->
    <div class="ai-chat-window hidden" id="aiChatWindow">
      <div class="ai-chat-header">
        <div class="ai-chat-header-info">
          <div class="ai-avatar">🤖</div>
          <div>
            <div class="ai-chat-title">Zentra AI Assistant</div>
            <div class="ai-chat-subtitle">Campus Transit Support Bot</div>
          </div>
        </div>
        <div class="ai-chat-actions">
          <button class="ai-btn-icon" onclick="clearAiChatHistory()" title="Clear Chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <button class="ai-btn-icon" onclick="toggleAiChatWindow()" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Body -->
      <div class="ai-chat-body" id="aiChatBody">
        <!-- Messages rendered here -->
      </div>

      <!-- Quick Suggestion Chips -->
      <div class="ai-suggestions-tray" id="aiSuggestionsTray">
        ${AI_SUGGESTIONS.map(s => `
          <button class="ai-suggestion-chip" onclick="handleAiSuggestionClick('${s.replace(/'/g, "\\'")}')">${s}</button>
        `).join('')}
      </div>

      <!-- Input Bar -->
      <form class="ai-chat-input-bar" id="aiChatForm" onsubmit="handleAiMessageSubmit(event)">
        <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Ask Zentra AI anything..." autocomplete="off">
        <button type="submit" class="btn btn-primary btn-sm" id="aiSendBtn">
          Send
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(root);

  // Send Initial Greeting
  appendAiMessage('bot', "Hi! I’m Zentra AI 👋\nHow can I help you today? Ask me about bus passes, fee payment, routes, or real-time seat availability.");
}

/**
 * Toggles Chat Window
 */
function toggleAiChatWindow() {
  const windowEl = document.getElementById('aiChatWindow');
  if (!windowEl) return;

  isAiChatOpen = !isAiChatOpen;
  windowEl.classList.toggle('hidden', !isAiChatOpen);

  if (isAiChatOpen) {
    const input = document.getElementById('aiChatInput');
    if (input) setTimeout(() => input.focus(), 200);
    scrollToBottomAiChat();
  }
}

/**
 * Handles clicking a quick suggestion chip
 * @param {string} text 
 */
function handleAiSuggestionClick(text) {
  sendUserAiMessage(text);
}

/**
 * Handles form submit
 * @param {Event} event 
 */
function handleAiMessageSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('aiChatInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  sendUserAiMessage(text);
}

/**
 * Sends user message and triggers AI reasoning response
 * @param {string} userText 
 */
function sendUserAiMessage(userText) {
  if (isAiTyping) return;

  // Render user message
  appendAiMessage('user', userText);

  // Show typing indicator
  showAiTypingIndicator();

  // Process response via rule-based knowledge engine
  setTimeout(() => {
    hideAiTypingIndicator();
    const botReply = generateZentraAiResponse(userText);
    appendAiMessage('bot', botReply);
  }, 750); // slight realistic typing delay
}

/**
 * Appends a message bubble into the chat window
 * @param {'user'|'bot'} sender 
 * @param {string} text 
 */
function appendAiMessage(sender, text) {
  const body = document.getElementById('aiChatBody');
  if (!body) return;

  const msgEl = document.createElement('div');
  msgEl.className = `ai-msg ${sender === 'user' ? 'ai-msg-outgoing' : 'ai-msg-incoming'}`;
  
  // Format linebreaks
  msgEl.innerHTML = text.replace(/\n/g, '<br>');

  body.appendChild(msgEl);
  aiChatMessages.push({ sender, text });
  scrollToBottomAiChat();
}

/**
 * Shows animated typing indicator
 */
function showAiTypingIndicator() {
  isAiTyping = true;
  const body = document.getElementById('aiChatBody');
  if (!body) return;

  let indicator = document.getElementById('aiTypingIndicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'aiTypingIndicator';
    indicator.className = 'ai-typing-indicator';
    indicator.innerHTML = `
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
      <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.35rem;">Zentra AI is typing...</span>
    `;
    body.appendChild(indicator);
  }
  scrollToBottomAiChat();
}

/**
 * Hides typing indicator
 */
function hideAiTypingIndicator() {
  isAiTyping = false;
  const indicator = document.getElementById('aiTypingIndicator');
  if (indicator) indicator.remove();
}

function scrollToBottomAiChat() {
  const body = document.getElementById('aiChatBody');
  if (body) {
    body.scrollTop = body.scrollHeight;
  }
}

/**
 * Clears Chat History
 */
function clearAiChatHistory() {
  const body = document.getElementById('aiChatBody');
  if (!body) return;
  body.innerHTML = '';
  aiChatMessages = [];
  appendAiMessage('bot', "Hi! I’m Zentra AI 👋\nHow can I help you today?");
}

// ==========================================================================
// RULE-BASED ZENTRA KNOWLEDGE & LIVE REASONING ENGINE
// ==========================================================================

/**
 * Generates an intelligent, context-aware reply based on keywords and live localStorage state
 * @param {string} prompt 
 * @returns {string}
 */
function generateSmartPassAiResponse(prompt) {
  return generateZentraAiResponse(prompt);
}

function generateZentraAiResponse(prompt) {
  const q = prompt.toLowerCase();
  const user = getLoggedInUser();

  // 1. Where is my bus pass? / My pass / Pass status
  if (q.includes('where is my bus pass') || q.includes('my pass') || q.includes('pass status') || q.includes('download pass')) {
    if (!user) {
      return "Please log in to your Student or Employee account so I can look up your active digital bus pass.";
    }
    const passes = loadData(STORAGE_KEYS.BUS_PASSES, []);
    const myPass = passes.find(p => p.applicantId.toUpperCase() === user.id.toUpperCase() && p.status === 'ACTIVE');

    if (myPass) {
      return `🎉 Good news, ${user.name}! Your bus pass is ACTIVE.\nPass ID: ${myPass.passId}\nAssigned Bus: ${myPass.busNumber} (${myPass.routeNumber})\nBoarding: ${myPass.boardingPoint}\nYou can view and download your pass card directly on the Bus Pass page.`;
    }

    const apps = loadData(STORAGE_KEYS.APPLICATIONS, []);
    const myApp = apps.find(a => a.applicantId.toUpperCase() === user.id.toUpperCase());

    if (myApp) {
      if (myApp.status === 'PENDING') {
        return `Your application (${myApp.applicationId}) for ${myApp.routeNumber} is currently PENDING review by the Transport Authority. Once approved, your digital pass will be generated automatically.`;
      }
      if (myApp.status === 'REJECTED') {
        return `Your previous application was rejected (Reason: "${myApp.rejectionReason || 'Contact Transport Authority'}"). Please consult the transport desk.`;
      }
    }

    return `You have not applied for a campus bus pass yet, ${user.name}. Click 'Apply Now' in the navigation bar to submit your application.`;
  }

  // 2. How do I apply?
  if (q.includes('how do i apply') || q.includes('how to apply') || (q.includes('apply') && q.includes('step'))) {
    return "To apply for a student bus pass, first make sure your transport fee is paid. Then select an available route, choose your boarding point, review your details and submit your application.\nEmployees do not need to pay the transport fee and can apply directly!";
  }

  // 3. How do I pay? / Payment / Fee / AY 2026-27 Official Schedule
  if (q.includes('how do i pay') || q.includes('pay fee') || q.includes('fee payment') || q.includes('transport fee') || q.includes('fee schedule') || q.includes('how much') || q.includes('bus fee') || q.includes('cost')) {
    return "Official Bus Fee Details for Academic Year 2026–27 (VFSTR Notification F. No. RO/RA/21-26/A256):\n\n" +
      "• Tenali: ₹22,400 (Lowest Slab)\n" +
      "• Guntur: ₹29,300\n" +
      "• Duggirala / Athota: ₹29,900\n" +
      "• Ponnur: ₹30,500\n" +
      "• Kaza: ₹39,100\n" +
      "• Mangalagiri / Boyapalem / Kolipara: ₹41,400\n" +
      "• Bapatla / Cherukupalli: ₹44,900\n" +
      "• Chilakaluripeta / Repalle: ₹53,500\n" +
      "• Vijayawada Metro: ₹56,400\n\n" +
      "💡 Concession: Full fee is paid initially; students with ≥ 7.00 SGPA in the preceding semester receive scholarship reimbursement via NEFT.\n" +
      "👥 Employees & Faculty: 100% subsidized (No transport fee required).\n" +
      "🏦 Bank Details: Punjab National Bank, Station Road, Guntur (A/C: 0195000109168835, IFSC: PUNB0019500).\n\n" +
      "You can inspect all 28 boarding locations on our 'Bus Fees (2026–27)' page!";
  }

  // 4. What does pending mean?
  if (q.includes('pending') || q.includes('what does pending mean')) {
    return "Pending means your application has been submitted and is waiting for transport authority approval. During this stage, the authority verifies your boarding stop and confirms seat allocation before issuing your digital pass.";
  }

  // 5. Show available routes / Live Routes Query
  if (q.includes('available routes') || q.includes('show routes') || q.includes('route list') || q.includes('routes')) {
    const routes = loadData(STORAGE_KEYS.ROUTES, []);
    if (!routes || routes.length === 0) {
      return "No route information is currently available in the database.";
    }

    let reply = "Here is the live status of our campus bus routes:\n";
    routes.forEach(r => {
      const avail = Math.max(0, r.capacity - r.occupiedSeats);
      const statusText = avail === 0 ? "🔴 FULL" : avail <= 5 ? `🟠 ${avail} seats left (Low)` : `🟢 ${avail} seats available`;
      reply += `\n• ${r.routeNumber} (${r.routeName}): ${statusText} [Bus: ${r.busNumber}]`;
    });
    reply += "\n\nYou can explore complete stops and timings on the Routes page.";
    return reply;
  }

  // 6. How does employee pass work? / Staff pass
  if (q.includes('employee') || q.includes('faculty') || q.includes('staff')) {
    return "The Employee Bus Pass is a 100% subsidized university benefit. Employees do NOT require transport-fee payment. Simply log in with your Employee ID, pick your commuting route and boarding stop, and submit your application for authority approval.";
  }

  // 7. Route full / What if seats are full?
  if (q.includes('full') || q.includes('no seats') || q.includes('seats are full')) {
    return "If a bus route has reached maximum capacity (0 seats available), the system prevents new pass submissions to avoid overcrowding. However, you can click the 'Notify Transport Authority' button on the route card to request an additional bus or route rescheduling!";
  }

  // 8. Rejection / Why was I rejected?
  if (q.includes('reject') || q.includes('declined')) {
    return "Applications may be rejected due to discontinued boarding stops, over-capacity routes, or incomplete profile information. When rejected, no seat is consumed, and the official reason is displayed on your dashboard timeline.";
  }

  // 9. QR Code / Verification
  if (q.includes('qr') || q.includes('scanner') || q.includes('verify')) {
    return "Every approved digital pass contains an authentic QR code generated via HTML5 Canvas. Campus bus conductors can scan this QR code to verify your Name, ID, Route, and validity.";
  }

  // 10. Contact / Office / Desk
  if (q.includes('contact') || q.includes('phone') || q.includes('helpdesk') || q.includes('desk') || q.includes('office')) {
    return "You can reach the Central Transport Authority desk at transport.officer@univ.edu or call the transit helpline at (0863) 2233-4455 during university office hours (8:00 AM – 5:00 PM).";
  }

  // 11. Reset / Demo info
  if (q.includes('demo') || q.includes('sample') || q.includes('reset')) {
    return "Zentra is a JavaScript-only educational prototype using localStorage. You can reset the sample data anytime by clicking 'Reset Sample Data' in the top banner.";
  }

  // Fallback default response
  return "I'm here to assist with all things Zentra! You can ask me:\n• 'How do I apply for a pass?'\n• 'How do I pay my transport fee?'\n• 'Show available routes'\n• 'What does pending mean?'\n• 'Where is my bus pass?'";
}

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initAiAssistant();
});
