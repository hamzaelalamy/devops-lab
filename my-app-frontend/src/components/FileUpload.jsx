import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FileUpload.css';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');

  // Fetch all uploaded files
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    setMessage('');
    
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMessage('File uploaded successfully!');
      setFile(null);
      fetchFiles(); // Refresh file list
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h2>File Upload to AWS S3</h2>
      
      <div className="upload-section">
        <input 
          type="file" 
          onChange={handleFileChange}
          disabled={uploading}
        />
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file}
          className="upload-btn"
        >
          {uploading ? 'Uploading...' : 'Upload to S3'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="files-list">
        <h3>Uploaded Files</h3>
        {files.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                <span>{file.filename}</span>
                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                  View File
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FileUpload;
