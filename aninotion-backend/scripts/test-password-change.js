#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testPasswordChange() {
  try {
    console.log('🔑 Testing password change for admin...');

    // First, login with default admin credentials
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@aninotion.com',
      password: 'admin123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully');

    // Now, change password
    const changeResponse = await axios.put(`${API_BASE}/api/auth/change-password`, {
      currentPassword: 'admin123456',
      newPassword: 'newAdminPass123'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Password changed successfully:', changeResponse.data);

    // Try to login with new password
    const newLoginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@aninotion.com',
      password: 'newAdminPass123'
    });

    console.log('✅ New password login successful');

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testPasswordChange();