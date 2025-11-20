import React, { useState } from 'react';
import axios from 'axios';

function ProductForm() {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: null,
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);

  // Fetch products after successful submit
  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (err) {}
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
      const res = await axios.post('/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Product added!');
      setProduct({ name: '', description: '', price: '', image: null });
      fetchProducts();
    } catch (err) {
      setMessage('Error submitting product');
    }
    setUploading(false);
  };

  return (
    <div>
      <h2>Add Product</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={product.name}
          onChange={handleChange}
          required
        /><br/>
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={product.description}
          onChange={handleChange}
        /><br/>
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={product.price}
          onChange={handleChange}
          required
        /><br/>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleFileChange}
          required
        /><br/>
        <button type="submit" disabled={uploading}>
          {uploading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
      {message && <div>{message}</div>}
      <h3>Products List</h3>
      <ul>
        {products.map((prod) => (
          <li key={prod.id}>
            <b>{prod.name}</b> - ${prod.price} <br />
            <em>{prod.description}</em><br/>
            {prod.image_url && <img src={prod.image_url} alt={prod.name} style={{width:80}} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductForm;
