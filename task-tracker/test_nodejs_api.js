const axios = require('axios');

const API_BASE = 'http://localhost:8000';
let testUser = null;

async function testAPI() {
    console.log('🧪 Testing Node.js Task Tracker API...');
    console.log(`Base URL: ${API_BASE}`);
    console.log('--------------------------------------------------');

    try {
        // 1. Test health endpoint
        console.log('1. Testing root endpoint...');
        const healthResponse = await axios.get(`${API_BASE}/`);
        console.log(`✓ GET / - Status: ${healthResponse.status}`);

        // 2. Test user registration
        console.log('\n2. Testing user registration...');
        const email = `test_${Date.now()}@example.com`;
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
            full_name: 'Test User',
            email: email,
            password: 'test123'
        });
        console.log(`✓ POST /auth/register - Status: ${registerResponse.status}`);
        console.log(`✓ Registration successful, user: ${registerResponse.data.user.full_name}`);
        testUser = registerResponse.data.user;

        // 3. Test get current user
        console.log('\n3. Testing get current user...');
        const userResponse = await axios.get(`${API_BASE}/auth/me`);
        console.log(`✓ GET /auth/me - Status: ${userResponse.status}`);

        // 4. Test create task
        console.log('\n4. Testing create task...');
        const taskResponse = await axios.post(`${API_BASE}/tasks/`, {
            title: 'Test Task from Node.js API',
            description: 'This is a test task created via the Node.js backend',
            priority: 'high',
            status: 'pending'
        });
        console.log(`✓ POST /tasks/ - Status: ${taskResponse.status}`);
        console.log(`✓ Task created with ID: ${taskResponse.data.id}`);
        const taskId = taskResponse.data.id;

        // 5. Test get tasks
        console.log('\n5. Testing get tasks...');
        const tasksResponse = await axios.get(`${API_BASE}/tasks/`);
        console.log(`✓ GET /tasks/ - Status: ${tasksResponse.status}`);
        console.log(`✓ Retrieved ${tasksResponse.data.length} task(s)`);

        // 6. Test update task
        console.log('\n6. Testing update task...');
        const updateResponse = await axios.put(`${API_BASE}/tasks/${taskId}`, {
            status: 'in_progress',
            description: 'Updated description from Node.js test'
        });
        console.log(`✓ PUT /tasks/${taskId} - Status: ${updateResponse.status}`);

        // 7. Test get tasks by status
        console.log('\n7. Testing get tasks by status...');
        const statusResponse = await axios.get(`${API_BASE}/tasks/status/in_progress`);
        console.log(`✓ GET /tasks/status/in_progress - Status: ${statusResponse.status}`);
        console.log(`✓ Retrieved ${statusResponse.data.length} task(s) with status 'in_progress'`);

        // 8. Test delete task
        console.log('\n8. Testing delete task...');
        const deleteResponse = await axios.delete(`${API_BASE}/tasks/${taskId}`);
        console.log(`✓ DELETE /tasks/${taskId} - Status: ${deleteResponse.status}`);

        console.log('\n==================================================');
        console.log('🎉 All Node.js API tests completed successfully!');
        console.log('✅ Your Node.js Task Tracker backend is working correctly!');
        console.log('\n📖 Next steps:');
        console.log('1. Open your browser and go to http://localhost:3000');
        console.log('2. Register a new account or login');
        console.log('3. Start creating and managing your tasks!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

testAPI();
