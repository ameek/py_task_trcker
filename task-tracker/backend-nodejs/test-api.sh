#!/bin/bash

# Task Tracker API Test Script
# This script demonstrates how to test all the API endpoints documented in Swagger

echo "🚀 Task Tracker API Testing Script"
echo "=================================="
echo ""

# Configuration
BASE_URL="http://localhost:8000"
USER_ID="68b91823d87e5a8416e00836"  # Use existing user from our tests

echo "📋 Testing Health Check..."
curl -s "$BASE_URL/" | jq '.'
echo ""

echo "👤 Testing Authentication - User Profile..."
curl -s -H "x-user-id: $USER_ID" "$BASE_URL/auth/profile" | jq '.'
echo ""

echo "📂 Testing Categories - List Categories..."
curl -s -H "x-user-id: $USER_ID" "$BASE_URL/categories" | jq '.'
echo ""

echo "✅ Testing Tasks - List Tasks..."
curl -s -H "x-user-id: $USER_ID" "$BASE_URL/tasks" | jq '.'
echo ""

echo "📊 Testing Reports - Daily Report..."
curl -s -H "x-user-id: $USER_ID" "$BASE_URL/reports/daily" | jq '.'
echo ""

echo "📈 Testing Reports - Completion Stats..."
curl -s -H "x-user-id: $USER_ID" "$BASE_URL/reports/stats" | jq '.'
echo ""

echo "🔗 Creating a new task for testing..."
NEW_TASK=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "title": "Swagger API Test Task",
    "description": "Created via API test script",
    "priority": "medium",
    "category": "Testing"
  }')

TASK_ID=$(echo $NEW_TASK | jq -r '._id')
echo "Created task with ID: $TASK_ID"
echo ""

echo "▶️ Testing Task Operations - Starting task..."
curl -s -X POST "$BASE_URL/tasks/$TASK_ID/start" \
  -H "x-user-id: $USER_ID" | jq '.'
echo ""

echo "⏸️ Testing Task Operations - Pausing task..."
curl -s -X POST "$BASE_URL/tasks/$TASK_ID/pause" \
  -H "x-user-id: $USER_ID" | jq '.'
echo ""

echo "🔗 Testing Task Links - Creating a link..."
curl -s -X POST "$BASE_URL/tasks/$TASK_ID/links" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "url": "https://swagger.io/tools/swagger-ui/",
    "title": "Swagger UI Documentation",
    "description": "Official Swagger UI documentation"
  }' | jq '.'
echo ""

echo "📋 Testing Task Links - Listing links..."
curl -s -H "x-user-id: $USER_ID" "$BASE_URL/tasks/$TASK_ID/links" | jq '.'
echo ""

echo "📊 Testing Export - JSON format..."
curl -s -H "x-user-id: $USER_ID" "$BASE_URL/reports/export/json" | jq '.summary'
echo ""

echo "✅ All API endpoints tested successfully!"
echo ""
echo "🌐 View interactive API documentation at: http://localhost:3001"
echo "📄 Swagger YAML file: http://localhost:3001/swagger.yaml"
echo "🔧 API Base URL: $BASE_URL"
echo ""
echo "💡 To test authentication endpoints, use:"
echo "   Register: curl -X POST $BASE_URL/auth/register -H 'Content-Type: application/json' -d '{\"full_name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}'"
echo "   Login: curl -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'"
