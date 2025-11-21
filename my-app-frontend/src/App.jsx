import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Product form state
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: null,
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);

  // Fetch products on load or after submit
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setMessage('Error fetching products: ' + err.message);
    }
  };

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProduct({ ...product, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('price', product.price);
    formData.append('image', product.image);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add product');
      }
      const data = await res.json();
      setMessage('✅ Product added!');
      setProduct({ name: '', description: '', price: '', image: null });
      // Reset file input
      document.querySelector('input[type="file"]').value = '';
      fetchProducts();
    } catch (err) {
      console.error('Error submitting:', err);
      setMessage('❌ Error submitting product: ' + err.message);
    }
    setUploading(false);
  };

  return (
    <div className="App">
      <header>
        <h1>AWS DevOps Project: Product Admin</h1>
      </header>
      <h2>Add Product</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={product.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Product Description"
          value={product.description}
          onChange={handleChange}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          name="price"
          placeholder="Price"
          value={product.price}
          onChange={handleChange}
          required
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleFileChange}
          required
        />
        <button type="submit" disabled={uploading || !product.name || !product.price || !product.image}>
          {uploading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
      {message && <div className="message">{message}</div>}

      <h3>Products List</h3>
      <ul className="products-list">
        {products.length === 0 ? (
          <p style={{color: "#bbb"}}>No products yet.</p>
        ) : (
          products.map((prod) => (
            <li key={prod.id}>
              <span className="prod-title">
                {prod.name} <span className="prod-price">${prod.price}</span>
              </span>
              <span className="prod-desc">
                {prod.description}
              </span>
              {prod.image_url && <img src={prod.image_url} alt={prod.name} />}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default App;