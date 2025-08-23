import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

export function DebugFirebase() {
  const [status, setStatus] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, message]);
    console.log(message);
  };

  const testFirebase = async () => {
    try {
      setStatus([]);
      setError(null);
      
      addStatus('🔍 Testing Firebase connection...');
      
      // Test authentication
      addStatus('📝 Testing authentication...');
      const userCredential = await signInAnonymously(auth);
      addStatus(`✅ Authentication successful: ${userCredential.user.uid}`);
      
      // Test document creation
      addStatus('📝 Testing document creation...');
      const testDoc = await addDoc(collection(db, 'test'), {
        message: 'Hello from debug component',
        timestamp: new Date(),
        userId: userCredential.user.uid
      });
      addStatus(`✅ Document created with ID: ${testDoc.id}`);
      
      // Test reading documents
      addStatus('📝 Testing document reading...');
      const snapshot = await getDocs(collection(db, 'test'));
      addStatus(`✅ Found ${snapshot.size} documents in test collection`);
      
      // Test parties collection
      addStatus('📝 Testing parties collection...');
      const partiesSnapshot = await getDocs(collection(db, 'parties'));
      addStatus(`✅ Found ${partiesSnapshot.size} documents in parties collection`);
      
      partiesSnapshot.forEach(doc => {
        addStatus(`📄 Party document: ${doc.id}`);
        console.log('Party data:', doc.data());
      });
      
      addStatus('🎉 All tests passed!');
      
    } catch (error: any) {
      const errorMessage = `❌ Firebase test failed: ${error.message}`;
      addStatus(errorMessage);
      setError(error.message);
      console.error('Firebase test failed:', error);
    }
  };

  useEffect(() => {
    testFirebase();
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Firebase Debug</h2>
      
      <div className="space-y-2 mb-4">
        {status.map((msg, index) => (
          <div key={index} className="text-sm text-gray-300 font-mono">
            {msg}
          </div>
        ))}
      </div>
      
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          Error: {error}
        </div>
      )}
      
      <button
        onClick={testFirebase}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Run Test Again
      </button>
    </div>
  );
} 