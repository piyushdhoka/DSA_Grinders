'use client';

import { useState, useEffect } from 'react';

interface TimeSlot {
  hour: number;
  slotStart: number;
  slotEnd: number;
  label: string;
}

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
}

export default function TimeSlotTester() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlot, setCurrentSlot] = useState<TimeSlot | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState({ preGen: false, timeSender: false });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // Generate all 48 time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00-${hour.toString().padStart(2, '0')}:30`);
      slots.push(`${hour.toString().padStart(2, '0')}:30-${(hour + 1).toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerPreGeneration = async () => {
    setLoading(prev => ({ ...prev, preGen: true }));
    try {
      const response = await fetch('/api/proxy/pre-generate');
      const data = await response.json();
      
      addTestResult({
        success: response.ok,
        message: data.message || 'Pre-generation triggered',
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addTestResult({
        success: false,
        message: `Pre-generation failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(prev => ({ ...prev, preGen: false }));
    }
  };

  const triggerTimeSender = async (timeSlot?: string) => {
    setLoading(prev => ({ ...prev, timeSender: true }));
    try {
      const url = timeSlot 
        ? `/api/proxy/time-slot-sender?timeSlot=${encodeURIComponent(timeSlot)}`
        : '/api/proxy/time-slot-sender?timeSlot=' + encodeURIComponent(
            Math.floor(currentTime.getMinutes() / 30) === 0 
              ? `${currentTime.getHours().toString().padStart(2, '0')}:00-${currentTime.getHours().toString().padStart(2, '0')}:30`
              : `${currentTime.getHours().toString().padStart(2, '0')}:30-${(currentTime.getHours() + 1).toString().padStart(2, '0')}:00`
          );
      
      const response = await fetch(url);
      const data = await response.json();
      
      addTestResult({
        success: response.ok,
        message: timeSlot 
          ? `Time slot sender tested for ${timeSlot}: Found ${data.summary?.usersInSlot || 0} users`
          : `Time slot sender tested: Found ${data.summary?.usersInSlot || 0} users`,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addTestResult({
        success: false,
        message: `Time slot sender failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(prev => ({ ...prev, timeSender: false }));
    }
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev].slice(0, 10));
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Time</h3>
          <div className="text-2xl font-mono text-blue-600">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Time Slot</h3>
          <div className="text-xl font-mono text-green-600">
            {Math.floor(currentTime.getMinutes() / 30) === 0 
              ? `${currentTime.getHours().toString().padStart(2, '0')}:00-${currentTime.getHours().toString().padStart(2, '0')}:30`
              : `${currentTime.getHours().toString().padStart(2, '0')}:30-${(currentTime.getHours() + 1).toString().padStart(2, '0')}:00`
            }
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Triggers</h3>
        
        {/* Time Slot Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Time Slot (optional)
          </label>
          <select 
            value={selectedTimeSlot}
            onChange={(e) => setSelectedTimeSlot(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Current Time Slot</option>
            {generateTimeSlots().map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          {selectedTimeSlot && (
            <p className="text-sm text-blue-600 mt-1">
              Will trigger: {selectedTimeSlot}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={triggerPreGeneration}
            disabled={loading.preGen}
            className={`px-6 py-3 rounded-md font-medium text-white transition-colors ${
              loading.preGen
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading.preGen ? 'Generating...' : 'Trigger Pre-Generation'}
          </button>
          
          <button
            onClick={() => triggerTimeSender(selectedTimeSlot || undefined)}
            disabled={loading.timeSender}
            className={`px-6 py-3 rounded-md font-medium text-white transition-colors ${
              loading.timeSender
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading.timeSender ? 'Testing...' : selectedTimeSlot ? `Test ${selectedTimeSlot}` : 'Test Current Slot'}
          </button>
          
          <button
            onClick={clearResults}
            className="px-6 py-3 rounded-md font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No test results yet. Trigger some actions!</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border-l-4 ${
                  result.success
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                    {result.data && (
                      <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}