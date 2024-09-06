// src/pages/api/test.js
export default function handler(req, res) {
    console.log('Test API Route Hit');
    res.status(200).json({ message: 'Test API Working' });
  }
  