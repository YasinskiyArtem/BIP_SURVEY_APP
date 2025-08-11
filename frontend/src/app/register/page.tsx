'use client';

import { useState } from 'react';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    second_name: '',
    last_name: '',
    age: 18,
    gender: 'M',
    blood_type: 'I',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful!');
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (error) {
        console.error('register error:', error);
        setMessage(error instanceof Error ? error.message : 'An error occurred');
      // setMessage('An error occurred.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="text"
          name="second_name"
          placeholder="Second Name"
          value={formData.second_name}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 w-full">
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
        <select name="blood_type" value={formData.blood_type} onChange={handleChange} className="border p-2 w-full">
          <option value="I">First</option>
          <option value="II">Second</option>
          <option value="III">Third</option>
          <option value="IV">Fourth</option>
        </select>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Register</button>
      </form>
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
}
