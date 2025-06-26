import React, { useState, useRef } from 'react';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, X, Link, Image } from 'lucide-react';

const ImageUploader = ({ currentImageUrl, onImageUploaded, folder = 'general' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || null);
  const [error, setError] = useState(null);
  const [urlInput, setUrlInput] = useState(currentImageUrl || '');
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'url'
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file - REMOVED SIZE CHECK
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUrlInput(downloadURL);
      onImageUploaded(downloadURL);
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image. Please try again.');
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput) {
      setError('Please enter an image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setPreview(urlInput);
    onImageUploaded(urlInput);
    setError(null);
  };

  const clearImage = () => {
    setPreview(null);
    setUrlInput('');
    onImageUploaded('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageError = () => {
    setError('Failed to load image. Please check the URL.');
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      {/* Tab Selection */}
      <div className="flex gap-4 border-b">
        <button
          type="button"
          onClick={() => setInputMode('upload')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            inputMode === 'upload' 
              ? 'border-purple-600 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </div>
        </button>
        <button
          type="button"
          onClick={() => setInputMode('url')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            inputMode === 'url' 
              ? 'border-purple-600 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            URL
          </div>
        </button>
      </div>

      {/* Upload Mode */}
      {inputMode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Choose Image'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPG, PNG, GIF, WebP
          </p>
        </div>
      )}

      {/* URL Mode */}
      {inputMode === 'url' && (
        <div>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Set Image
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter a direct link to an image. Use services like Unsplash or Pexels for free stock photos.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative">
          <div className="relative inline-block">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-full h-48 object-cover rounded-lg border border-gray-200"
              onError={handleImageError}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {urlInput && (
            <p className="text-xs text-gray-500 mt-2 break-all">
              {urlInput}
            </p>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
        <p className="font-medium mb-1">Image tips:</p>
        <ul className="space-y-1">
          <li>• Images will be automatically resized for display</li>
          <li>• Any aspect ratio is accepted</li>
          <li>• Higher resolution images will look better</li>
        </ul>
      </div>

      {/* Stock Photo Links */}
      <div className="text-xs text-gray-500">
        <p className="font-medium mb-1">Free stock photos:</p>
        <div className="flex gap-4">
          <a 
            href="https://unsplash.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700"
          >
            Unsplash
          </a>
          <a 
            href="https://pexels.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700"
          >
            Pexels
          </a>
          <a 
            href="https://pixabay.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700"
          >
            Pixabay
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;