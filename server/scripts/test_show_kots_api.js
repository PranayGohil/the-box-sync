const axios = require('axios');

async function test() {
  try {
    console.log("Simulating Manager login...");
    const loginRes = await axios.post('http://localhost:5001/api/panel-user/login/Manager', {
      restaurant_code: 'GJ0005IN',
      username: 'sardarji_londonwaley_qsr',
      password: 'password' // Let's try password first, if not we will know
    });

    console.log("Login response message:", loginRes.data.message);
    if (loginRes.data.token) {
      const token = loginRes.data.token;
      console.log("Login successful! Token acquired.");

      console.log("Fetching KOTs...");
      const kotRes = await axios.get('http://localhost:5001/api/kot/show?order_source=Manager,Captain', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("KOT response data:", JSON.stringify(kotRes.data, null, 2));
    } else {
      console.log("Failed to log in:", loginRes.data);
    }
  } catch (err) {
    console.error("Error during test:", err.response?.data || err.message);
  }
}

test();
