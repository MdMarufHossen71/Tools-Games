# Daily challenge scheduler deployment

The daily challenge endpoint is intentionally mounted but **not scheduled** in local development. It accepts only a verified Heartbeat cron request whose task ID is stored in the `platform_config` row named `daily_challenge_schedule`.

After publishing the project, create the schedule against the deployed service:

```bash
manus-heartbeat create --name daily-challenge --cron "0 0 0 * * *" --path /api/scheduled/dailyChallenge
```

Record the returned task UID by running the following SQL once, replacing `<TASK_UID>` with the value returned by the create command:

```sql
INSERT INTO platform_config (config_key, config_value)
VALUES ('daily_challenge_schedule', JSON_OBJECT('taskUid', '<TASK_UID>'))
ON DUPLICATE KEY UPDATE config_value = JSON_OBJECT('taskUid', '<TASK_UID>'), updated_at = CURRENT_TIMESTAMP;
```

The handler is idempotent: a retry for the same UTC date returns the existing challenge. It rotates a validated playable-game slug and stores the date key. Daily scores are stored separately in `daily_challenge_scores`, so this scheduled reset does not delete all-time leaderboard records.

> Do not expose this endpoint through a browser button or use an in-process timer. The route verifies the Heartbeat cron identity and its bound task ID before writing the daily challenge configuration.
