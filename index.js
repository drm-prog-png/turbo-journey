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

function scrollToOutput(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupBackToTopButton() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;

  const toggleVisibility = () => {
    const shouldShow = window.scrollY > 220;
    backToTopBtn.classList.toggle('show', shouldShow);
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  toggleVisibility();
}


// ===== FORM SUBMISSION HANDLER =====
document.getElementById('prompt-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const userInput = document.getElementById('prompt-input').value.trim();
  const outputDiv = document.getElementById('output');
  const isTranslateMode = selectedPrompts.includes(TRANSLATE_PROMPT_VALUE);

  if (isTranslateMode) {
    if (!userInput) {
      outputDiv.textContent = 'Please enter text in the prompt box to translate.';
      return;
    }

    outputDiv.textContent = 'Translating...';

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: userInput, target: 'en', source: 'auto' }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.translatedText) {
        throw new Error('Empty translation from API');
      }

      renderFormatted(data.translatedText, outputDiv);
      scrollToOutput(outputDiv);
    } catch (error) {
      outputDiv.textContent = `Error: ${error.message}`;
    }

    return;
  }

  let finalPrompt = '';
  if (selectedPrompts.length > 0) {
    finalPrompt = selectedPrompts.join('\n\n');
  } else if (userInput) {
    finalPrompt = userInput;
  }

  if (!finalPrompt) {
    outputDiv.textContent = 'Please select buttons or enter text in the prompt box';
    return;
  }

  outputDiv.textContent = 'Loading...';

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: finalPrompt }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    renderFormatted(data.result || '', outputDiv);
    scrollToOutput(outputDiv);
  } catch (error) {
    outputDiv.textContent = `Error: ${error.message}`;
  }
});

// ===== QUICK PROMPT BUTTONS HANDLER =====
// Translate is exclusive: it cannot be selected together with other prompt buttons.
const TRANSLATE_PROMPT_VALUE = 'Translate';
const promptButtons = Array.from(document.querySelectorAll('.prompt-btn'));

function syncSelectedButtons() {
  promptButtons.forEach((btn) => {
    const value = btn.getAttribute('data-value');
    btn.classList.toggle('selected', selectedPrompts.includes(value));
  });
}

promptButtons.forEach((button) => {
  button.addEventListener('click', (e) => {
    e.preventDefault();

    const promptValue = button.getAttribute('data-value');
    const isTranslate = promptValue === TRANSLATE_PROMPT_VALUE;
    const isSelecting = !button.classList.contains('selected');

    if (isSelecting) {
      if (isTranslate) {
        // Translate replaces every other selected prompt.
        selectedPrompts = [TRANSLATE_PROMPT_VALUE];
      } else {
        // Any non-translate selection removes Translate if it was selected.
        selectedPrompts = selectedPrompts.filter((p) => p !== TRANSLATE_PROMPT_VALUE);
        if (!selectedPrompts.includes(promptValue)) {
          selectedPrompts.push(promptValue);
        }
      }
    } else {
      selectedPrompts = selectedPrompts.filter((p) => p !== promptValue);
    }

    syncSelectedButtons();
    console.log('[DEBUG] Button clicked:', promptValue);
    console.log('[DEBUG] Total hidden prompts:', selectedPrompts.length);
  });
});
setupBackToTopButton();
