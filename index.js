document.getElementById('generate-btn').addEventListener('click', async () => {
  console.log('🖱️ [DEBUG] Generate button clicked');
  
  const prompt = 'Write a short creative story in 100 words.';
  const outputDiv = document.getElementById('output');
  
  outputDiv.textContent = 'Loading...';
  console.log('📝 [DEBUG] Prompt to send:', prompt);
  
  try {
    console.log('🌐 [DEBUG] Sending request to /api/generate');
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
    
    outputDiv.textContent = data.result;
  } catch (error) {
    console.error('❌ [ERROR] Fetch error:', error.message);
    outputDiv.textContent = `❌ Error: ${error.message}\n\nTroubleshooting:\n1. Ensure server is running: npm start\n2. Check GROQ_API_KEY in .env file\n3. Check browser console for details`;
  }
});
