import { useState } from 'react';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

export function FirebaseTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runFirebaseTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Check Firebase configuration
      addLog('🔍 Testing Firebase configuration...');
      addLog(`Project ID: ${db.app.options.projectId}`);
      addLog(`Auth Domain: ${db.app.options.authDomain}`);
      
      // Test 2: Check authentication
      addLog('🔍 Testing authentication...');
      const userCredential = await signInAnonymously(auth);
      addLog(`✅ Authentication successful: ${userCredential.user.uid}`);
      
      // Test 3: Test Firestore read permissions
      addLog('🔍 Testing Firestore read permissions...');
      const q = query(collection(db, 'parties'), limit(1));
      const querySnapshot = await getDocs(q);
      addLog(`✅ Read permission test passed. Found ${querySnapshot.size} documents.`);
      
      // Test 4: Test Firestore write permissions
      addLog('🔍 Testing Firestore write permissions...');
      const testDoc = {
        test: true,
        timestamp: new Date(),
        message: 'Firebase connection test'
      };
      
      const docRef = await addDoc(collection(db, 'test-connection'), testDoc);
      addLog(`✅ Write permission test passed. Document ID: ${docRef.id}`);
      
      addLog('🎉 All Firebase tests passed!');
      
    } catch (error) {
      addLog(`❌ Test failed: ${error.message}`);
      console.error('Firebase test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Firebase Connection Test</h2>
      
      <button
        onClick={runFirebaseTest}
        disabled={isLoading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Running Tests...' : 'Run Firebase Test'}
      </button>
      
      <div className="bg-gray-900 rounded p-4 h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-2">Test Results:</h3>
        <div className="space-y-1">
          {testResults.map((result, index) => (
            <div key={index} className="text-sm text-gray-300 font-mono">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 