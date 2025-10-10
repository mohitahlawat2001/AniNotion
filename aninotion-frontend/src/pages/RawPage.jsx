import React, { useState } from 'react';
import { Database, Search, Key, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';

const RawPage = () => {
  const [mongodbUri, setMongodbUri] = useState('');
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [showDecrypted, setShowDecrypted] = useState({});
  
  // Get backend URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_RAW_PAGE_BACKEND_URL || 'https://neko-hack.vercel.app';

  const fetchRawData = async () => {
    if (!mongodbUri.trim()) {
      setError('Please enter a MongoDB URI');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Use the existing /load-tabs endpoint without date/group filters to get all data
      const response = await fetch(`${API_BASE_URL}/load-tabs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mongodbUri: mongodbUri
          // No date or groupName filters to get all data
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      setRawData(result.tabs || []);
    } catch (err) {
      setError(err.message);
      setRawData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!mongodbUri.trim()) {
      setError('Please enter a MongoDB URI');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mongodbUri: mongodbUri
        }),
      });

      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert('MongoDB connection successful!');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (err) {
      setError(err.message);
      alert(`Connection failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const decryptData = async (encryptedData) => {
    if (!decryptionKey) {
      alert('Please enter a decryption key');
      return null;
    }

    try {
      // Convert base64 to bytes
      const encryptedBytes = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV (first 12 bytes) and encrypted data
      const iv = encryptedBytes.slice(0, 12);
      const encrypted = encryptedBytes.slice(12);

      // Prepare key (pad/truncate to 32 bytes)
      const encoder = new TextEncoder();
      const paddedKey = decryptionKey.padEnd(32, "0").substring(0, 32);
      const keyBuffer = encoder.encode(paddedKey);

      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        encrypted
      );

      // Convert back to string and parse JSON
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decrypted);
      return JSON.parse(decryptedString);
    } catch (err) {
      console.error('Decryption failed:', err);
      return null;
    }
  };

  const handleDecrypt = async (itemId, encryptedData) => {
    const decryptedData = await decryptData(encryptedData);
    if (decryptedData) {
      setShowDecrypted(prev => ({
        ...prev,
        [itemId]: decryptedData
      }));
    } else {
      alert('Failed to decrypt data. Please check your decryption key.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  const renderDataItem = (item, index) => {
    const isEncrypted = item.isEncrypted;
    const showDecryptedData = showDecrypted[item._id];

    return (
      <div key={item._id || index} className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <Database size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold">Document {index + 1}</h3>
            {isEncrypted && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
                <Key size={12} className="mr-1" />
                Encrypted
              </span>
            )}
          </div>
          <button
            onClick={() => copyToClipboard(formatJson(item))}
            className="text-gray-500 hover:text-gray-700 p-1"
            title="Copy raw data"
          >
            <Copy size={16} />
          </button>
        </div>

        {isEncrypted && (
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-800">
                This document contains encrypted data
              </span>
              {!showDecryptedData && (
                <button
                  onClick={() => handleDecrypt(item._id, item.encryptedData)}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 flex items-center space-x-1"
                >
                  <Eye size={18} />
                  <span>Decrypt</span>
                </button>
              )}
            </div>
            
            {showDecryptedData && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-800">Decrypted Data:</span>
                  <button
                    onClick={() => setShowDecrypted(prev => ({ ...prev, [item._id]: null }))}
                    className="text-green-600 hover:text-green-800"
                  >
                    <EyeOff size={18} />
                  </button>
                </div>
                <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto border border-green-200">
                  {formatJson(showDecryptedData)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">ID:</span>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{item._id}</p>
            </div>
            
            {item.groupName && (
              <div>
                <span className="text-sm font-medium text-gray-600">Group:</span>
                <p className="text-sm">{item.groupName}</p>
              </div>
            )}
            
            {item.date && (
              <div>
                <span className="text-sm font-medium text-gray-600">Date:</span>
                <p className="text-sm">{item.date}</p>
              </div>
            )}
            
            {item.createdBy && (
              <div>
                <span className="text-sm font-medium text-gray-600">Created By:</span>
                <p className="text-sm">{item.createdBy}</p>
              </div>
            )}

            {item.createdAt && (
              <div>
                <span className="text-sm font-medium text-gray-600">Created At:</span>
                <p className="text-sm">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            )}

            {item.updatedAt && (
              <div>
                <span className="text-sm font-medium text-gray-600">Updated At:</span>
                <p className="text-sm">{new Date(item.updatedAt).toLocaleString()}</p>
              </div>
            )}
          </div>

          {!isEncrypted && (
            <>
              {item.title && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Title:</span>
                  <p className="text-sm">{item.title}</p>
                </div>
              )}
              
              {item.url && (
                <div>
                  <span className="text-sm font-medium text-gray-600">URL:</span>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {item.url}
                  </a>
                </div>
              )}
              
              {item.notes && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Notes:</span>
                  <p className="text-sm">{item.notes}</p>
                </div>
              )}

              {item.favicon && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Favicon:</span>
                  <img src={item.favicon} alt="favicon" className="inline-block w-4 h-4 ml-2" />
                </div>
              )}
            </>
          )}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
            Raw JSON Data
          </summary>
          <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-x-auto border">
            {formatJson(item)}
          </pre>
        </details>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center space-x-2 cursor-pointer">
          <Database size={32} />
          <span>Raw MongoDB Data Viewer</span>
        </h1>
      </div>

      {/* MongoDB URI Input */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">MongoDB Connection</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MongoDB URI
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={mongodbUri}
                onChange={(e) => setMongodbUri(e.target.value)}
                placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={testConnection}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Database size={20} />
                )}
                <span>Test</span>
              </button>
              <button
                onClick={fetchRawData}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Search size={20} />
                )}
                <span>{isLoading ? 'Loading...' : 'Fetch All Data'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your MongoDB URI to connect and fetch all saved tabs data
            </p>
          </div>

          {/* Decryption Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decryption Key (for encrypted documents)
            </label>
            <input
              type="password"
              value={decryptionKey}
              onChange={(e) => setDecryptionKey(e.target.value)}
              placeholder="Enter decryption key..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              This key will be used to decrypt AES-GCM encrypted documents
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="text-red-600">⚠️</div>
            <div className="text-red-800 font-medium">Error</div>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Data Display */}
      {rawData.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Data Results ({rawData.length} document{rawData.length !== 1 ? 's' : ''})
            </h2>
            <button
              onClick={() => copyToClipboard(formatJson(rawData))}
              className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
            >
              <Copy size={16} />
              <span>Copy All</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {rawData.map((item, index) => renderDataItem(item, index))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && rawData.length === 0 && mongodbUri && (
        <div className="text-center py-12">
          <Database size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No data found in the database</p>
        </div>
      )}

      {/* API Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-800 mb-2">API Information</h3>
        <p className="text-xs text-gray-600">
          Backend URL: <code className="bg-gray-200 px-1 rounded">{API_BASE_URL}</code>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Database: <code className="bg-gray-200 px-1 rounded">tabsaver</code>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Collection: <code className="bg-gray-200 px-1 rounded">tabs</code>
        </p>
      </div>
    </div>
  );
};

export default RawPage;