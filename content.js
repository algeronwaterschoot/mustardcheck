// Helper functions
const getAuthToken = () => "your_openai_auth_token_here";  // https://platform.openai.com/account/api-keys
function getPromptPrefix() {
  return (
    "you are an expert at detecting yellow journalism. I want you to analyze the following list of text." + 
    "For each item in the list, I want you to give me a confidence score (between 0% and 100%) that its content " +
    "can be classified as yellow journalism, and I want you to explain your reasoning concisely. " +
    "Don't make any assumptions about events or information you have no access to or knowledge of; " +
    "simply evaluate the text's use of grammar and wording. Evaluate each item independently from one another. " +
    "Remember, you are an expert at detecting yellow journalism. Please answer in the format " +
    "\"[item number]) Confidence: [score]; Reasoning: [reasoning]\" for each item, separated by newline. Ensure there are no empty newlines between list items."
    // "\"[item number]) [score] - [reasoning]\". Ensure there are no empty newlines between list items."
  );
}

async function fetchAnalysisResults(bodyMessageContent) {
  console.log(bodyMessageContent);
  const authToken = await getAuthToken();
  const promptPrefix = getPromptPrefix();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: promptPrefix + bodyMessageContent }],
      temperature: 1,
    }),
  });

  const data = await response.json();
  console.log(data);
  return data;
}

function chunkArray(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

function parseResults(texts, responseText) {
  const resultItems = responseText.split(/\s*\d+\)\s*/).slice(1);
  return resultItems.map((item, index) => {
    const match = item.match(/Confidence:\s*([\d.]+%);\s*Reasoning:\s*(.*)/);
    if (match) {
      const [_, confidence, reasoning] = match;
      return {
        uniqueClass: texts[index].uniqueClass,
        confidence: parseFloat(confidence) / 100,
        reasoning,
      };
    } else {
      return null;
    }
  });
}

function createLoaderAndProgressBar(totalItems) {
  const loaderContainer = document.createElement('div');
  loaderContainer.id = 'yjh-loader-container';
  loaderContainer.innerHTML = `
    <div id="yjh-loader"></div>
    <div id="yjh-progress-container">
      <div id="yjh-progress-bar"></div>
    </div>
    <div id="yjh-progress-text">MustardChecking...</div>
  `;
  document.body.appendChild(loaderContainer);

  const progressBar = document.getElementById('yjh-progress-bar');
  progressBar.style.width = '0%';
}

function updateProgressBar(currentItem, totalItems) {
  const progressBar = document.getElementById('yjh-progress-bar');
  const progressPercentage = (currentItem / totalItems) * 100;
  progressBar.style.width = `${progressPercentage}%`;
}

function removeLoaderAndProgressBar() {
  const loaderContainer = document.getElementById('yjh-loader-container');
  document.body.removeChild(loaderContainer);
}

async function analyzeText() {
  const headersTags = ['h1', 'h2', 'h3'];
  const texts = [];

  for (const tag of headersTags) {
    const elements = document.getElementsByTagName(tag);
    for (const element of elements) {
      const uniqueClass = `yjh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      element.classList.add(uniqueClass);
      texts.push({ uniqueClass, text: element.textContent.trim() });
    }
  }

  const formattedTexts = texts.map((item, index) => `${index + 1}) ${item.text}`).join(' ');
  const batches = chunkArray(texts, 50);

  createLoaderAndProgressBar(texts.length);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const bodyMessageContent = batch.map((item, index) => `${i * 50 + index + 1}) ${item.text}`).join(' ');

    const data = await fetchAnalysisResults(bodyMessageContent);
    const results = parseResults(batch, data.choices[0].message.content);

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result && result.confidence > 0.5) {
        const element = document.querySelector(`.${batch[j].uniqueClass}`);
        element.style.backgroundColor = 'yellow';
        element.title = result.reasoning;
      }
    }

    updateProgressBar((i + 1) * 50, texts.length);
  }

  removeLoaderAndProgressBar();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePage') {
    analyzeText();
  }
});