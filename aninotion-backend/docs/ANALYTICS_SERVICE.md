# Analytics Service Documentation

## Overview

The Analytics Service provides comprehensive user activity tracking, performance monitoring, and usage analytics for the AniNotion backend. It uses a **separate PostgreSQL database** to store analytics data, keeping it isolated from the main MongoDB database.

## Features

- **User Activity Tracking**: Track user logins, session duration, and page views
- **Request Analytics**: Log all API requests with latency, status codes, and metadata
- **Session Management**: Track user sessions across multiple requests
- **Error Tracking**: Capture and analyze error patterns
- **Performance Metrics**: Monitor response times, P95/P99 latencies
- **Device Analytics**: Track user agents, browsers, and device types
- **Real-time Monitoring**: View active users and current activity
- **Daily Aggregation**: Pre-computed daily reports for fast querying
- **Data Retention**: Configurable cleanup of old analytics data

## Setup

### 1. Configure PostgreSQL Database

Add the following to your `.env` file:

```env
# Analytics Database (PostgreSQL)
ANALYTICS_DATABASE_URL=postgresql://username:password@localhost:5432/aninotion_analytics
```

For production, you can use services like:
- **Neon** (serverless PostgreSQL)
- **Supabase**
- **Railway**
- **AWS RDS**
- **Render PostgreSQL**

### 2. Create the Database

```sql
CREATE DATABASE aninotion_analytics;
```

The schema is automatically created when the server starts.

### 3. Install Dependencies

```bash
cd aninotion-backend
npm install pg
```

## Data Schema

### analytics_events Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| user_id | VARCHAR(255) | Authenticated user ID |
| session_id | VARCHAR(255) | Session identifier |
| tenant_id | VARCHAR(255) | Multi-tenant support |
| timestamp | TIMESTAMPTZ | Event timestamp (UTC) |
| method | VARCHAR(10) | HTTP method |
| path | VARCHAR(2048) | Request path |
| route | VARCHAR(2048) | Express route pattern |
| query_params | JSONB | Query string parameters |
| latency_ms | INTEGER | Response time in milliseconds |
| response_status | INTEGER | HTTP status code |
| response_size | INTEGER | Response body size |
| user_agent | TEXT | Client user agent |
| ip_address | VARCHAR(45) | Client IP address |
| device_type | VARCHAR(50) | mobile/tablet/desktop/bot |
| browser | VARCHAR(100) | Browser name |
| os | VARCHAR(100) | Operating system |
| action_type | VARCHAR(100) | Category of action (auth, content, etc.) |
| action_name | VARCHAR(255) | Specific action name |
| input_args | JSONB | Sanitized request input |
| output_summary | JSONB | Response summary |
| error_occurred | BOOLEAN | Whether an error occurred |
| error_message | TEXT | Error message if any |
| error_traceback | TEXT | Error stack trace |
| metadata | JSONB | Additional custom data |
| tags | TEXT[] | Searchable tags |

### user_sessions Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| session_id | VARCHAR(255) | Unique session ID |
| user_id | VARCHAR(255) | Associated user ID |
| started_at | TIMESTAMPTZ | Session start time |
| last_activity_at | TIMESTAMPTZ | Last activity timestamp |
| ended_at | TIMESTAMPTZ | Session end time |
| total_duration_seconds | INTEGER | Total session duration |
| page_views | INTEGER | Number of page views |
| api_calls | INTEGER | Number of API calls |
| errors_count | INTEGER | Number of errors |
| entry_page | VARCHAR(2048) | First page visited |
| exit_page | VARCHAR(2048) | Last page visited |
| device_type | VARCHAR(50) | Device type |
| browser | VARCHAR(100) | Browser name |
| os | VARCHAR(100) | Operating system |

### daily_aggregates Table

Pre-computed daily statistics for fast dashboard queries.

## API Endpoints

### Admin Endpoints (Require Admin Role)

#### GET /api/analytics/status
Check if analytics service is enabled.

#### GET /api/analytics/summary
Get overall analytics summary.

Query Parameters:
- `startDate`: Start date filter (ISO format)
- `endDate`: End date filter (ISO format)

Response:
```json
{
  "summary": {
    "total_requests": 15420,
    "unique_users": 234,
    "unique_sessions": 567,
    "avg_latency_ms": 45.6,
    "p95_latency_ms": 120.5,
    "p99_latency_ms": 250.3,
    "success_count": 14890,
    "error_count": 530
  },
  "topPaths": [...],
  "topErrors": [...],
  "hourlyBreakdown": [...],
  "deviceBreakdown": [...]
}
```

#### GET /api/analytics/realtime
Get real-time active users (last 5 minutes by default).

Query Parameters:
- `minutes`: Look-back period (default: 5)

#### GET /api/analytics/users/:userId
Get specific user's activity history.

#### GET /api/analytics/sessions/:sessionId
Get detailed session information.

#### GET /api/analytics/dashboard
Get comprehensive dashboard data with today, week, and month summaries.

#### GET /api/analytics/reports/daily
Get daily aggregated reports.

#### GET /api/analytics/reports/paths
Get path/endpoint analytics.

#### GET /api/analytics/reports/errors
Get error analytics and patterns.

#### GET /api/analytics/reports/performance
Get performance analytics with slowest endpoints.

### User Endpoints (Authenticated)

#### GET /api/analytics/my-activity
Get current user's own activity summary.

### Cron Endpoints

#### GET /cron/aggregate-analytics
Aggregate daily analytics (call at end of each day).

Required Header: `x-cron-secret: YOUR_CRON_SECRET`

#### GET /cron/cleanup-analytics
Clean up old analytics data.

Query Parameters:
- `retentionDays`: Number of days to keep (default: 90)

## Custom Event Logging

You can log custom events from any route handler:

```javascript
// In any route handler
router.post('/some-action', authenticate, async (req, res) => {
  // ... your logic ...
  
  // Log a custom action
  await req.logAction({
    actionType: 'custom',
    actionName: 'special_action',
    actionCategory: 'business',
    metadata: {
      customField: 'value'
    },
    tags: ['important', 'custom']
  });
  
  res.json({ success: true });
});
```

## Sensitive Data Handling

The analytics service automatically sanitizes sensitive data:

- Passwords are redacted from request bodies
- Auth tokens are not logged
- Only safe fields are captured from request bodies
- IP addresses can be hashed if needed

## Performance Considerations

- Events are logged asynchronously to avoid impacting response times
- Indexes are created on common query columns
- Daily aggregation reduces query load for dashboards
- Connection pooling is used for PostgreSQL

## Cron Schedule Recommendations

```
# Aggregate yesterday's analytics at 1:00 AM
0 1 * * * curl -H "x-cron-secret: $CRON_SECRET" https://your-api.com/cron/aggregate-analytics

# Cleanup old data weekly on Sunday at 2:00 AM
0 2 * * 0 curl -H "x-cron-secret: $CRON_SECRET" https://your-api.com/cron/cleanup-analytics?retentionDays=90
```

## Disabling Analytics

To disable analytics without removing the code, simply don't set the `ANALYTICS_DATABASE_URL` environment variable. The middleware will skip logging when analytics is not configured.

## Extending the Service

### Adding New Action Types

Edit `middleware/analytics.js` and add new patterns to `determineActionType()`:

```javascript
// In determineActionType function
if (path.includes('/your-feature')) {
  return { type: 'custom', name: 'your_action', category: 'your_category' };
}
```

### Adding New Metadata

In `middleware/analytics.js`, extend the `eventData` object:

```javascript
const eventData = {
  // ... existing fields ...
  metadata: {
    contentLength: req.get('Content-Length'),
    host: req.get('Host'),
    // Add your custom fields here
    customField: req.customData
  }
};
```

## Troubleshooting

### Analytics Not Recording

1. Check if `ANALYTICS_DATABASE_URL` is set correctly
2. Verify PostgreSQL connectivity
3. Check server logs for database errors
4. Ensure the database user has write permissions

### Slow Dashboard Queries

1. Run the daily aggregation cron job
2. Check PostgreSQL indexes
3. Consider increasing connection pool size
4. Use date range filters

### High Database Storage

1. Reduce retention days
2. Run cleanup cron more frequently
3. Consider archiving old data to cold storage

## Security Notes

- Analytics endpoints require admin authentication
- Cron endpoints require the `CRON_SECRET`
- Sensitive request data is automatically sanitized
- Consider encrypting PII data at rest
