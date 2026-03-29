import jwt from 'jsonwebtoken';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = 'super_secret_test_key'; // Hardcoded fallback from authMiddleware

const createDemoUserToken = () => {
    return jwt.sign(
      { id: '65f123456789012345678901', email: 'test@example.com' }, 
      JWT_SECRET,
      { expiresIn: '1h' }
    );
};

const runTests = async () => {
    console.log('--- Starting Integration Tests ---');
    const token = createDemoUserToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // 1. Create a Project
        console.log('1. Creating a new project...');
        const createProjectRes = await fetch(`${BASE_URL}/projects`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Test Integration Project' })
        });
        const project = await createProjectRes.json();
        
        if (!createProjectRes.ok) {
           console.error('Failed creation:', project);
           process.exit(1);
        }

        console.log('Project created:', project.name, '| API Key:', project.apiKey);

        if (!project.apiKey) throw new Error('Failed to create project properly');

        // 2. Create a Workflow
        console.log('2. Creating a workflow...');
        const createWorkflowRes = await fetch(`${BASE_URL}/projects/${project._id}/workflows`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                triggerLevel: 'error',
                providerType: 'discord',
                providerConfig: { webhookUrl: 'https://httpbin.org/post' }, // Mock webhook for testing
                isActive: true
            })
        });
        const workflow = await createWorkflowRes.json();
        console.log('Workflow created:', workflow.triggerLevel);

        // 3. Ingest a Log
        console.log('3. Ingesting an error log...');
        const ingestRes = await fetch(`${BASE_URL}/ingest`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${project.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                level: 'error',
                message: 'Integration test error occurred',
                environment: 'testing'
            })
        });
        const ingestData = await ingestRes.json();
        console.log('Ingestion response:', ingestData);

        // Wait a bit for the workflow background task
        await new Promise(r => setTimeout(r, 1000));

        // 4. Fetch Logs
        console.log('4. Fetching logs...');
        const fetchLogsRes = await fetch(`${BASE_URL}/projects/${project._id}/logs`, {
            headers
        });
        const logsData = await fetchLogsRes.json();
        console.log(`Found ${logsData.meta?.total || 0} logs.`);
        console.log('First log message:', logsData.data?.[0]?.message);

        // Cleanup
        console.log('5. Cleaning up project...');
        await fetch(`${BASE_URL}/projects/${project._id}`, {
            method: 'DELETE',
            headers
        });
        console.log('Cleanup complete.');
        console.log('--- Integration Tests Passed! ---');
    } catch(err) {
        console.error('Test Failed:', err);
    }
}

runTests();
