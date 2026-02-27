// ===== HIDDEN STATE FOR SELECTED PROMPTS =====
// This stores all selected button values in memory (not visible to user)
let selectedPrompts = [];

// ===== TEXT FORMATTING HELPERS =====
// Escape HTML to prevent XSS, then convert **bold** markers to <strong>
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderFormatted(text, element) {
  // Escape first
  const escaped = escapeHtml(String(text));
  // Replace **bold** (non-greedy)
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Set as HTML (we escaped user text before inserting tags)
  element.innerHTML = withBold;
}

// ===== FORM SUBMISSION HANDLER =====
// THIS WAS MISSING! The form wasn't working because there was no event listener
// Now it listens for form submission and sends the user's custom prompt
document.getElementById('prompt-form').addEventListener('submit', async (e) => {
  // Prevent the default form submission behavior (page reload)
  e.preventDefault();
  console.log('📋 [DEBUG] Form submitted - custom prompt from user');
  
  // Get the user's input from the text field
  const userInput = document.getElementById('prompt-input').value.trim();
  const outputDiv = document.getElementById('output');
  
  // Concatenate hidden selected prompts with user input
  // Priority: use hidden selected prompts, fallback to user input
  let finalPrompt = '';
  
  if (selectedPrompts.length > 0) {
    // Use hidden selected prompts
    finalPrompt = selectedPrompts.join('\n\n');
    console.log('🔒 [DEBUG] Using hidden selected prompts (', selectedPrompts.length, 'items )');
  } else if (userInput) {
    // Fallback to user textbox input
    finalPrompt = userInput;
    console.log('📝 [DEBUG] Using textbox user input');
  }
  
  // Validate that we have a prompt
  console.log('🔍 [DEBUG] Validating final prompt');
  if (!finalPrompt) {
    console.warn('⚠️ [WARNING] No prompt available - select buttons or enter text');
    outputDiv.textContent = '❌ Please select buttons or enter text in the prompt box';
    return;
  }
  
  outputDiv.textContent = 'Loading...';
  console.log('📝 [DEBUG] Final prompt to send:', finalPrompt.substring(0, 50) + (finalPrompt.length > 50 ? '...' : ''));
  
  try {
    console.log('🌐 [DEBUG] Sending POST request to /api/generate');
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: finalPrompt }),
    });

    console.log('📊 [DEBUG] Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [ERROR] HTTP error! Status:', response.status);
      console.error('❌ [ERROR] Error details:', errorData);
      throw new Error(`HTTP ${response.status}: ${errorData.error || 'Server error'}`);
    }

    const data = await response.json();
    console.log('✅ [DEBUG] Response received successfully');
    console.log('📄 [DEBUG] Result length:', data.result.length, 'characters');
    
    // Display the result in the output div (supports **bold** markers)
    renderFormatted(data.result, outputDiv);
  } catch (error) {
    console.error('❌ [ERROR] Fetch error:', error.message);
    outputDiv.textContent = `❌ Error: ${error.message}\n\nTroubleshooting:\n1. Ensure server is running: npm start\n2. Check GROQ_API_KEY in .env file\n3. Check browser console for details`;
  }
});

// ===== QUICK PROMPT BUTTONS HANDLER =====
// This handles the array of selectable buttons for quick prompts
// Values are stored HIDDEN in selectedPrompts array (not visible in textbox)
document.querySelectorAll('.prompt-btn').forEach(button => {
  button.addEventListener('click', (e) => {
    // Prevent default button behavior
    e.preventDefault();
    
    // Get the button's placeholder value
    const promptValue = button.getAttribute('data-value');
    const promptInput = document.getElementById('prompt-input');
    
    // Toggle the 'selected' class on the button
    button.classList.toggle('selected');
    console.log('🔘 [DEBUG] Button clicked:', promptValue);
    
    // Toggle value in HIDDEN selectedPrompts array (not visible in textbox)
    if (button.classList.contains('selected')) {
      // Button is now selected - add to hidden array
      selectedPrompts.push(promptValue);
      console.log('➕ [DEBUG] Added to hidden state:', promptValue);
    } else {
      // Button is now deselected - remove from hidden array
      selectedPrompts = selectedPrompts.filter(p => p !== promptValue);
      console.log('➖ [DEBUG] Removed from hidden state:', promptValue);
    }
    
    // Display a COUNT indicator in textbox (not the actual values)
    console.log('📊 [DEBUG] Total hidden prompts:', selectedPrompts.length);
    console.log('✅ [DEBUG] Textbox remains unchanged - preserves user input');
  });
});
