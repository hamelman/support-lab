<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Support Lab – Sean Hamelman</title>
  <link rel="icon" type="image/png" href="favicon.png">
  <link rel="stylesheet" href="/style.css" />
</head>
<body>

  <div id="header-placeholder"></div>
  <script src="/load-header.js"></script>

  <section class="hero fade-in-up">
    <h2>Smarter, Kinder, and More Effective Support</h2>
    <p>I’m Sean, a customer support leader and systems thinker. At Support Lab, I design low-cost, high-impact tools and workflows that scale across global teams—while keeping people at the center.</p>
  </section>

  <section class="highlights">
    <div class="card fade-in-up">
      <h3>🔍 Zendesk Analytics & Automation</h3>
      <p>Custom metrics, reports, and triggers that power better decisions and faster resolutions.</p>
    </div>
    <div class="card fade-in-up">
      <h3>🤖 AI Evaluation & Implementation</h3>
      <p>Cost-benefit analysis, customer experience impact, and realistic automation rollouts.</p>
    </div>
    <div class="card fade-in-up">
      <h3>🌍 Global Team Scheduling</h3>
      <p>Built-from-scratch live support scheduling tools—no vendor contracts, just results.</p>
    </div>
    <div class="card fade-in-up">
      <h3>🛠 Low/No-Cost Tooling</h3>
      <p>Custom workflows using Google Sheets, scripts, and APIs to replace expensive SaaS.</p>
    </div>
  </section>

  <div class="cta fade-in-up">
    <a href="case-studies/">Explore My Work →</a>
  </div>

  <footer>
    © 2025 Sean Hamelman | Built in the Lab 🧪
  </footer>

  <!-- Support Lab Chat Widget -->
  <div id="lab-chat-root">
    <!-- Floating Beaker Button -->
    <button id="lab-beaker-btn" aria-label="Open chat">
      <img src="avatar.png" alt="Open Support Lab Chat" />
    </button>

    <!-- Expandable Chat Window -->
    <div id="lab-chat-window" class="hidden">
      <div class="chat-header">
        <img src="avatar.png" alt="Support Lab Beaker" />
        <span><strong>Edison</strong></span>
        <button id="lab-close-btn" aria-label="Close chat">&times;</button>
      </div>
      <div id="lab-chat-log" class="chat-log"></div>
      <div class="chat-input-bar">
        <input type="text" id="lab-chat-input" placeholder="Ask me anything..." autocomplete="off" />
        <button id="lab-send-btn" type="button">Send</button>
      </div>
    </div>
  </div>

  <script src="/reveal.js"></script>
  <script>
    // Floating beaker widget open/close
    document.getElementById('lab-beaker-btn').onclick = () => {
      document.getElementById('lab-chat-window').classList.remove('hidden');
      document.getElementById('lab-beaker-btn').style.display = "none";
      setTimeout(() => document.getElementById('lab-chat-input').focus(), 120);
    };
    document.getElementById('lab-close-btn').onclick = () => {
      document.getElementById('lab-chat-window').classList.add('hidden');
      document.getElementById('lab-beaker-btn').style.display = "";
    };

    // Edison chat send (Send button or Enter key)
    async function sendLabChat() {
      const input = document.getElementById('lab-chat-input');
      const log = document.getElementById('lab-chat-log');
      const question = input.value.trim();
      if (!question) return;
      // Show user message
      log.innerHTML += `<div class="user-message"><strong>You:</strong> ${question}</div>`;
      input.value = "";
      input.focus();
      // Show loading
      log.innerHTML += `<div class="bot-message" id="bot-typing">Edison is thinking<span class="blinking">...</span></div>`;
      log.scrollTop = log.scrollHeight;

      try {
        const res = await fetch('/.netlify/functions/edison-rag?q=' + encodeURIComponent(question));
        const reply = await res.text();
        document.getElementById('bot-typing').remove();
        log.innerHTML += `<div class="bot-message"><strong>Edison:</strong> ${reply}</div>`;
        log.scrollTop = log.scrollHeight;
      } catch (err) {
        document.getElementById('bot-typing').remove();
        log.innerHTML += `<div class="bot-message"><strong>Edison:</strong> Sorry, I couldn't answer that right now.</div>`;
        log.scrollTop = log.scrollHeight;
      }
    }

    document.getElementById('lab-send-btn').onclick = sendLabChat;
    document.getElementById('lab-chat-input').addEventListener("keydown", function(e) {
      if (e.key === "Enter") sendLabChat();
    });
  </script>

  <!-- Page visit tracking -->
  <script>
    fetch("/.netlify/functions/log-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    }).catch(err => console.warn("Visit log failed:", err));
  </script>

</body>
</html>
