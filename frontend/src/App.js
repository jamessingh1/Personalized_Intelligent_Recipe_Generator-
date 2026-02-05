import React, { useState, useRef } from 'react';
import { Upload, ChefHat, Loader2, Camera, AlertCircle, CheckCircle, X, Plus, Trash2, Clock, Users, Search } from 'lucide-react';


function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    // Demo login (no backend)
    if (email === 'admin@example.com' && password === 'admin123') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-xl shadow-lg">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Login to Intelligent Recipe Generator</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Login
          </button>
        </div>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Demo Login → <b>admin@example.com</b> / <b>admin123</b>
        </p>
      </div>
    </div>
  );
}
//-------------------------------------------------------
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualIngredients, setManualIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 1280, height: 720 } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };
  
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        stopCamera();
        setMode('upload');
      }, 'image/jpeg');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      if (preview) URL.revokeObjectURL(preview);
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const response = await fetch('http://127.0.0.1:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      console.log("BACKEND RESPONSE:", data);
      if (data.error) throw new Error(data.error);
      setResult(data);
     setResult(data);
// Only show error AFTER result is set
if (Array.isArray(data.recipes) && data.recipes.length === 0) {
  const detectedIngredient =
    Array.isArray(data.ingredients) && data.ingredients.length > 0
      ? data.ingredients[0][0]
      : "the detected ingredient";

  setError(`No recipes found with ${detectedIngredient}.`);
}


    } catch (err) {
      setError(err.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim() && !manualIngredients.includes(ingredientInput.trim())) {
      setManualIngredients([...manualIngredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };
  
  const removeIngredient = (index) => {
    setManualIngredients(manualIngredients.filter((_, i) => i !== index));
  };
  
  const searchWithManualIngredients = async () => {
    if (manualIngredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/search-by-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: manualIngredients })
      });
      const data = await response.json();
      console.log("BACKEND RESPONSE:", data);
      if (data.error) throw new Error(data.error);
      setResult({
        recipes: data.recipes,
        top_ingredient: manualIngredients[0],
        ingredients: manualIngredients.map(ing => [ing, 100]),
        message: data.message
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setManualIngredients([]);
    setIngredientInput('');
    stopCamera();
  };

  const getRecipeImageUrl = (recipe) => {
    return recipe.image || `https://img.spoonacular.com/recipes/${recipe.id}-312x231.jpg`;
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
             Intelligent Recipe Generator
            </h1>
          </div>
          <p className="text-xl text-gray-600">AI-Powered Ingredient Recognition System</p>
        </div>

        {/* Professional Input Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          {/* Mode Selection */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <button
              onClick={() => { setMode('upload'); stopCamera(); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all ${
                mode === 'upload' 
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <Upload className="w-5 h-5" />
              Upload Image
            </button>
            
            <button
              onClick={() => { setMode('camera'); startCamera(); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all ${
                mode === 'camera' 
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <Camera className="w-5 h-5" />
              Capture Photo
            </button>
            
            <button
              onClick={() => { setMode('manual'); stopCamera(); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all ${
                mode === 'manual' 
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <Search className="w-5 h-5" />
              Manual Entry
            </button>
          </div>

          {/* Upload Mode */}
          {mode === 'upload' && (
            <div className="flex flex-col items-center gap-6">
              {preview ? (
                <div className="relative group">
                  <img src={preview} alt="Preview" className="w-96 h-96 object-cover rounded-2xl shadow-2xl border-4 border-blue-100" />
                  <button onClick={resetUpload} className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="w-96 h-96 border-4 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <Upload className="w-24 h-24 text-gray-400 group-hover:text-blue-500 mb-4 transition-colors" />
                  <span className="text-gray-700 font-semibold text-xl mb-2">Drop your image here</span>
                  <span className="text-gray-500">or click to browse</span>
                  <span className="text-gray-400 text-sm mt-2">Supports: JPG, PNG, JPEG</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="flex items-center gap-3 bg-blue-600 text-white px-12 py-5 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-105"
              >
                {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing...</> : <><Search className="w-6 h-6" /> Find Recipes</>}
              </button>
            </div>
          )}

          {/* Camera Mode */}
          {mode === 'camera' && (
            <div className="flex flex-col items-center gap-6">
              {cameraActive ? (
                <div className="relative w-full max-w-3xl">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl shadow-2xl" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-4 mt-6 justify-center">
                    <button onClick={capturePhoto} className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg">
                      📸 Capture Photo
                    </button>
                    <button onClick={() => { stopCamera(); setMode('upload'); }} className="bg-gray-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-gray-700 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={startCamera} className="bg-blue-600 text-white px-12 py-5 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg">
                  <Camera className="inline w-6 h-6 mr-3" /> Start Camera
                </button>
              )}
            </div>
          )}

          {/* Manual Input Mode */}
          {mode === 'manual' && (
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                  placeholder="Enter ingredient name (e.g., tomato, apple, orange)"
                  className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                />
                <button onClick={addIngredient} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md">
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {manualIngredients.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-xl mb-6 border border-blue-100">
                  <p className="font-bold text-gray-800 mb-3 text-lg">Selected Ingredients ({manualIngredients.length}):</p>
                  <div className="flex flex-wrap gap-3">
                    {manualIngredients.map((ing, idx) => (
                      <div key={idx} className="bg-white px-5 py-3 rounded-full flex items-center gap-3 shadow-md border border-blue-200">
                        <span className="font-medium text-gray-700">{ing}</span>
                        <button onClick={() => removeIngredient(idx)} className="text-red-500 hover:text-red-700 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={searchWithManualIngredients}
                disabled={manualIngredients.length === 0 || loading}
                className="w-full bg-blue-600 text-white px-12 py-5 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 transition-all shadow-lg disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 className="inline w-6 h-6 animate-spin mr-3" /> Searching...</> : <><Search className="inline w-6 h-6 mr-3" /> Find Recipes</>}
              </button>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-8 p-5 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-lg">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {result && result.recipes && result.recipes.length > 0 && (
            <div className="mt-8 p-5 bg-green-50 border-l-4 border-green-500 rounded-xl flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-lg">Success!</p>
                <p className="text-green-700">Found {result.recipes.length} delicious recipes</p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Detected Ingredients */}
            {result.ingredients && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="bg-blue-100 p-2 rounded-lg">🔍</span>
                  Detected Ingredients
                </h2>
                <div className="flex flex-wrap gap-4">
                  {result.ingredients.map(([name, conf], idx) => (
                    <div key={idx} className={`px-6 py-3 rounded-full font-semibold text-lg ${idx === 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                      {name} {typeof conf === 'number' && `(${conf.toFixed(1)}%)`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recipe Results */}
            {result.recipes && result.recipes.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <span className="bg-blue-100 p-2 rounded-lg">🍽️</span>
                  Recipe Results ({result.recipes.length})
                </h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {result.recipes.map((recipe) => (
                    <div key={recipe.id} className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-blue-300 transition-all transform hover:-translate-y-1">
                      <img 
                        src={getRecipeImageUrl(recipe)}
                        alt={recipe.name} 
                        className="w-full h-56 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=${encodeURIComponent(recipe.name.substring(0, 15))}`;
                        }}
                      />

                      <div className="p-6">
                        <h3 className="font-bold text-xl text-gray-900 mb-4">{recipe.name}</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-5">
                          {recipe.servings && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                              <Users className="w-4 h-4" /> {recipe.servings}
                            </span>
                          )}
                          {recipe.ready_in_minutes && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                              <Clock className="w-4 h-4" /> {recipe.ready_in_minutes}m
                            </span>
                          )}
                        </div>
                        
                        <details className="mb-4">
                          <summary className="cursor-pointer text-blue-600 font-bold mb-3 hover:text-blue-700 text-lg">
                            📝 Ingredients
                          </summary>
                          <ul className="text-sm text-gray-700 space-y-2 pl-4 max-h-48 overflow-y-auto bg-blue-50 p-4 rounded-xl border border-blue-100">
                            {recipe.ingredients?.map((ing, idx) => (
                              <li key={idx} className="list-disc">{ing}</li>
                            ))}
                          </ul>
                        </details>

                        <details>
                          <summary className="cursor-pointer text-blue-600 font-bold hover:text-blue-700 text-lg">
                            👨‍🍳 Instructions
                          </summary>
                          <div className="text-sm text-gray-700 max-h-48 overflow-y-auto bg-green-50 p-4 rounded-xl mt-3 border border-green-100">
                            {recipe.instructions || 'Instructions not available'}
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Professional Footer */}
        <div className="text-center mt-16 py-10 border-t border-gray-200">
          <p className="text-2xl font-bold text-blue-600">Infosys</p>
        </div>
      </div>
    </div>
  );
}

export default App;