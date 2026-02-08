import { useState, useEffect } from 'react';
import './App.css';

// --- CONFIGURATION ---
// 1. PUT YOUR GOOGLE APPS SCRIPT URL HERE
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbydSzfqdaNETlug4JYfUCU_Qc545CsIqYrVD88-sHTCJrO8Y8EvIwqNXlT2mClaTskpvQ/exec";

// 2. SET YOUR OFFICE COORDINATES (Example: Eiffel Tower)
const TARGET_LAT = 19.0259881;
const TARGET_LNG = 72.8734742;

// 3. ALLOWED RADIUS IN METERS
const ALLOWED_RADIUS = 5000; 

function App() {
  const [step, setStep] = useState('loading'); // loading, denied, out-of-range, form, success
  const [distance, setDistance] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'Check In' });
  const [submitting, setSubmitting] = useState(false);

  // --- 1. GEOLOCATION LOGIC ---
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Calculate distance
        const dist = calculateDistance(userLat, userLng, TARGET_LAT, TARGET_LNG);
        setDistance(Math.round(dist)); // Round to nearest meter

        if (dist <= ALLOWED_RADIUS) {
          setStep('form');
        } else {
          setStep('out-of-range');
        }
      },
      (error) => {
        console.error(error);
        setStep('denied'); // User denied permission or GPS is off
      },
      { enableHighAccuracy: true } // Important for precise attendance
    );
  }, []);

  // --- 2. HAVERSINE FORMULA (Calculate distance in meters) ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // --- 3. FORM HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // We use 'no-cors' mode to post to Google Scripts from a browser
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      setStep('success');
    } catch (error) {
      alert("Error submitting attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // --- 4. RENDER UI ---
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>🏢 Office Attendance</h1>

      {step === 'loading' && <p>Getting your location...</p>}

      {step === 'denied' && (
        <div style={{ color: 'red' }}>
          <h3>⚠️ Location Required</h3>
          <p>Please enable location services and refresh the page to mark attendance.</p>
        </div>
      )}

      {step === 'out-of-range' && (
        <div style={{ color: 'orange' }}>
          <h3>❌ Not at Office</h3>
          <p>You are <b>{distance} meters</b> away. You must be within {ALLOWED_RADIUS} meters.</p>
        </div>
      )}

      {step === 'form' && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Name:</label>
            <input 
              type="text" 
              name="name" 
              required 
              value={formData.name}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Action:</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, type: 'Check In' })}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  background: formData.type === 'Check In' ? '#4CAF50' : '#ddd',
                  color: formData.type === 'Check In' ? 'white' : 'black',
                  border: 'none'
                }}
              >
                Check In
              </button>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, type: 'Check Out' })}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  background: formData.type === 'Check Out' ? '#f44336' : '#ddd',
                  color: formData.type === 'Check Out' ? 'white' : 'black',
                  border: 'none'
                }}
              >
                Check Out
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{ width: '100%', padding: '12px', background: 'blue', color: 'white', border: 'none' }}
          >
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </form>
      )}

      {step === 'success' && (
        <div style={{ color: 'green', textAlign: 'center' }}>
          <h2>✅ Success!</h2>
          <p>Your {formData.type.toLowerCase()} has been recorded.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px' }}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

export default App;