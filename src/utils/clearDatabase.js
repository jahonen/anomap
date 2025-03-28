// src/utils/clearDatabase.js

// This is a utility script to clear all messages from localStorage
function clearMessages() {
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  
  // Find and remove redux-persist related keys
  keys.forEach(key => {
    if (key.startsWith('persist:')) {
      console.log(`Clearing ${key}...`);
      localStorage.removeItem(key);
    }
  });
  
  console.log('All messages have been cleared from localStorage.');
}

// Execute the function
clearMessages();
