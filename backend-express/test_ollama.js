const axios = require('axios');

async function testOllama() {
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2',
      prompt: 'Respond ONLY with valid JSON: [{"title":"Test Suggestion","description":"This is a test","category":"productivity","priority":"high","actionItems":["Action 1","Action 2"]}]',
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 500,
      }
    });

    console.log('Ollama Response:');
    console.log(response.data.response);
    console.log('---');
    console.log('Full response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOllama();