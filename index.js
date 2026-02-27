// ===== FORM SUBMISSION HANDLER =====
// THIS WAS MISSING! The form wasn't working because there was no event listener
// Now it listens for form submission and sends the user's custom prompt
document.getElementById('prompt-form').addEventListener('submit', async (e) => {
  // Prevent the default form submission behavior (page reload)
  e.preventDefault();
  console.log('📋 [DEBUG] Form submitted - custom prompt from user');
  
  // Get the user's input from the text field
  const prompt = document.getElementById('prompt-input').value;
  const outputDiv = document.getElementById('output');
  
  // Validate that the prompt is not empty
  console.log('🔍 [DEBUG] Validating prompt input');
  if (!prompt.trim()) {
    console.warn('⚠️ [WARNING] Empty prompt - user must enter text');
    outputDiv.textContent = '❌ Please enter a prompt';
    return;
  }
  
  outputDiv.textContent = 'Loading...';
  console.log('📝 [DEBUG] User prompt:', prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''));
  
  try {
    console.log('🌐 [DEBUG] Sending POST request to /api/generate');
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
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
    
    // Display the result in the output div
    outputDiv.textContent = data.result;
  } catch (error) {
    console.error('❌ [ERROR] Fetch error:', error.message);
    outputDiv.textContent = `❌ Error: ${error.message}\n\nTroubleshooting:\n1. Ensure server is running: npm start\n2. Check GROQ_API_KEY in .env file\n3. Check browser console for details`;
  }
});
