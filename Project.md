Artha.Core Engineering Handoff
Document

1. Core Architecture Strategy
The app is designed to be decoupled and reactive. The UI does not push data; the database
notifies the UI of changes.
 • SQLite Source of Truth: All events (Expenses, Moods, Notes, Insights) are persisted
locally.
 • Reactive UI: We are using a ContentObserver pattern (Native-to-JS Bridge) to trigger
UI re-renders only when the database actually changes.
 • Native-First Logic: SMS interception and Backup scheduling live in native Android
code (BroadcastReceiver, WorkManager) to bypass React Native&#39;s battery-management
limitations.

2. Technical Specifications
A. Data Schema (Normalized)
Version Managed: PRAGMA user_version (Auto-migration via init script).
Table Fields
events id, timestamp, type
expenses event_id, amount, merchant, comment

(Added in v2)
moods event_id, rating, label
notes event_id, content
raw_sms_logs id, sender, body, received_at, status
B. Background Execution
 • SMS Interception: Custom BroadcastReceiver (Native) -&gt; Regex Parser -&gt; DB Write.
 • Sync: WorkManager (Scheduled at 12 AM).
 • Encryption: AES-256 (via Native Crypto Library).
 • Auth: Google Drive OAuth2 using refresh_token stored in Android Keystore.
C. Security &amp; AI Pipeline
 • Sanitization Layer: Pre-API execution filter (Regex). Redact PII: \d{8,} -&gt; [REDACTED].
Filter: Remove &quot;OTP&quot;, &quot;Password&quot;, &quot;Verification&quot;.
 • AI Policy: Immutable Insight cards. User cannot edit them; they must be deleted and
regenerated.

3. Recommended Folder Structure
Artha.Core/
├── android/
│ ├── app/src/main/java/com/arthacore/
│ │ ├── services/ # WorkManager &amp; SMS Receiver
│ │ ├── modules/ # Native Modules for DB/Auth
│ │ └── security/ # Android Keystore wrappers
├── src/
│ ├── api/ # Gemini client + Sanitization logic
│ ├── components/ # UI (Timeline, FAB, BottomSheet)
│ ├── database/ # SQLite interface &amp; Migration scripts
│ ├── hooks/ # Reactive DB hooks (useDatabase)
│ ├── navigation/ # App routing
│ └── utils/ # Regex helpers
└── .env # Secrets (Do not commit!)

4. Initialization Checklist
1. Permission Setup (AndroidManifest.xml): RECEIVE_SMS, STORAGE, INTERNET,
WAKE_LOCK.
2. Migration Infrastructure: Create DatabaseInitializer.ts, implement PRAGMA user_version
check, write migration script for &quot;comment&quot; field.
3. The Bridge: Write the NativeModule that allows JS to trigger the initial database
migration.

5. Risk Assessment
• The Parsing Fragility: Every time your bank updates their SMS template, your parsing
logic will fail. Mitigation: Maintain a &quot;Logs&quot; view for unparsed SMS.
• Android OS &quot;Doze&quot; Mode: Android is aggressive. If backups fail, guide users to disable
&quot;Battery Optimization&quot; for Artha.Core.
• AI Cost/Limits: Keep your prompt window short (last 30 days) to avoid Gemini token
limits.