# Privacy Policy

**Last updated:** September 25, 2026
**Effective date:** February 1, 2026

---

This Privacy Policy describes how Rhylthyme ("we," "us," or "our") collects, uses, and protects your information when you use the Rhylthyme website, web application, iOS application, command-line tools, and MCP connector (collectively, the "Service"). By using the Service, you agree to the collection and use of information as described in this policy.

## Information We Collect

### Account Information

When you create an account, we collect the information provided through your chosen authentication method:

- **Google OAuth:** Name, email address, and profile picture as provided by Google.
- **Apple Sign-In:** Name and email address as provided by Apple (you may choose to use Apple's private relay email).
- **Email Magic Link:** Email address only.

We do not collect or store passwords. Authentication is handled entirely through third-party providers or passwordless methods.

### User Content

We store the programs and workflows you create within the Service, including:

- Program JSON data (tracks, steps, durations, and other workflow definitions).
- Program metadata (titles, descriptions, creation dates).
- Shared program data, when you choose to make a program publicly accessible.
- Media files (images and videos) you attach to workflow steps, stored in Supabase Storage.

### Usage Data

We automatically collect certain technical information when you use the Service:

- Pages visited and features used.
- Device type, browser type, and operating system.
- IP address and approximate geographic location.
- Timestamps of interactions with the Service.

### MCP Connector Usage

When an AI assistant uses the Rhylthyme MCP connector (mcp.rhylthyme.com and its kitchen, lab, events and gym endpoints), we record each request so we can see which tools are used and whether they work. Each record holds the tool or feature requested, the name and version the assistant app reports for itself (for example Claude Desktop), whether the request succeeded, how long it took, and the country derived from the connection. To count distinct users without storing IP addresses, we keep a one-way salted hash of the IP address and browser user agent. If you are logged in, the record includes your account ID. We do not record what you asked for, the programs or text you send, or your access token.

### Profile Information

If you choose to set up a profile, you may provide:

- A display name.
- A profile picture (selected from your device's photo library).
- A short bio and interest selections.

Profile pictures are stored in Supabase Storage and associated with your account.

### AI Chat Data

When you use the AI chat feature, the messages you send are transmitted to the Anthropic API for processing. These messages may include program content you choose to share within the chat context.

### Text You Submit for Import

Some import features send text to a model to be read. When you paste a
recipe, protocol or run sheet into the **import text** feature (the
`import_text` MCP tool, or `POST /api/import` with `source: "llm-text"`),
or ask for an imported program to be **enriched** into parallel tracks,
that text — and, for enrichment, the imported program's step list — is
transmitted to the Anthropic API for processing. We do not store the
submitted text beyond the request: what is retained is the resulting
program, if you save it, and one audit row recording that the import
happened (your user id, the time, whether it succeeded, the model used
and the resulting program id), which is what enforces the daily import
limit. The text itself is not written to that row.

### Import Review

When you ask for an imported program to be **reviewed** (the `review_program`
MCP tool, `rhylthyme import --review`, or the review shown on the website after
an import while you are signed in), the program and the source text it was
imported from are sent to a language model that reports what looks wrong. The
review runs on OpenAI's model through OpenRouter (or, if that is unavailable,
on the Anthropic API). As with import, we do not store the submitted text: we
keep one audit row (your user id, the time, whether it succeeded and the model
used), which enforces the daily review limit. The review itself is returned to
you and not stored.

### Lab Instruments and Bridges

If you connect a lab machine with `rhylthyme bridge` (the rhylthyme-galago
integration with galago-tools), that machine keeps a few rows in your account
up to date so you can watch and steer its runs on the Bridges page: the
workcell's name, the name, type and status of each instrument, a heartbeat, and
the current run's steps, their status and any instrument error, plus the
commands you send from the page (pause, resume, retry, skip, abort, start) and
their outcome. Instrument network addresses, ports and configuration never
leave the lab machine, and error messages are scrubbed of them. These rows are
visible only to you. Run records written on the lab machine stay there unless
you upload them.

### Execution Records (Runs)

When you play a program in the live timeline player, the player records
what actually happened during that run and, if you are signed in, saves it
to your account beside the program. One record contains:

- the program's id and a content hash of the program JSON that was run;
- the planned start, end and duration of every step, frozen when you
  pressed Start, and the actual start and end of every step;
- what ended each step (you marking it done, a timer expiring, a hand-off
  from another step, or an abort), and how long the clock was paused while
  each step was running — including time the page spent in the background;
- which runtime recorded it (web player or terminal runner), its version,
  whether it used the wall clock, and the playback speed;
- a copy of the program's own metadata (for example serves and source URL)
  and, where a program's author declares them, the answers you give to
  variance factors at run start.

A run record contains no free text unless you type a note on a step, and no
location, contacts or device identifiers. **Runs are private to you**, even
for a program you have made public, and sharing a program does not share
its runs. You can delete any run at any time
(`DELETE /api/mcp/runs/<run_id>`); deleting a program deletes its runs with
it; deleting your account deletes them all.

If you play a program **without signing in**, the record is kept in your
browser's local storage (the newest 20 runs) and is not transmitted to us
at all. Signing in offers to upload those runs to your account; declining
leaves them in the browser, and clearing your browser data deletes them.

**Contributing a run to the public catalog is opt-in per run.** Under the
player there is a checkbox, *Contribute this run to the public catalog*,
which is off unless you turn it on and is remembered on that device only. It
is never on by default, and we never contribute a run you did not tick it
for.

With it on, finishing a run stores a second, narrower copy of the record in
a separate public table (`public_runs`). A contributed record contains
**exactly**:

- the canonical hash of the program JSON that was run — the only key the row
  is stored under — and the program's own `programId`;
- the run's id, schema version, start and end timestamps and outcome;
- the runtime that recorded it, its version, the clock mode and the speed;
- per step: the planned start, end and duration, the actual start and end,
  what ended the step, when its trigger fired, which steps it waited on, and
  how many seconds it was paused;
- `serves`, `actors`, `environmentType`, and your answers to the variance
  factors the program's author declared.

It contains **no user id** — the public table has no owner column at all —
no id of your library entry, and **no notes**: the one field of a run record
that can hold free text you typed is removed before the copy is made. No
other program metadata is carried either: no source URL, no title, no
ingredient list.

Because a contributed row identifies nobody, a contribution **cannot be
withdrawn**: deleting the run from your library, or deleting your account,
does not remove it. Contributed runs are readable by anyone
(`GET /api/public/runs?programHash=…`) and exist so that a program many
people run can be calibrated against what actually happens rather than
against its author's guess.

### iOS Device Permissions

The iOS application may request access to the following device capabilities. Each is optional and only used when you engage the corresponding feature:

- **Microphone:** Used for voice commands (start, pause, stop) to control program playback. Audio is processed entirely on-device using Apple's Speech framework. No audio recordings are transmitted to our servers or any third party.
- **Speech Recognition:** Used in conjunction with the microphone to interpret voice commands. Processing is performed on-device by Apple's `SFSpeechRecognizer`. Only the recognized command keyword is used within the app.
- **Photo Library:** Used only if you choose to upload a profile picture. Only the image you select is accessed and uploaded.

You can revoke any of these permissions at any time through your device's Settings app.

### On-Device Processing

Voice command features in the iOS app use Apple's native on-device speech recognition. No audio data leaves your device for this feature. We do not collect, store, or transmit voice recordings.

## How We Use Your Information

We use collected information to:

- Provide, maintain, and improve the Service.
- Authenticate your identity and manage your account.
- Store and retrieve your programs and workflows.
- Enable sharing and collaboration features.
- Process AI chat requests through the Anthropic API.
- Analyze usage patterns to improve the Service.
- Communicate with you about the Service, including updates and security notices.

## Content Moderation

To maintain a safe environment for all users, media files (images and videos) uploaded to the Service are automatically screened for objectionable content before storage. This screening is performed by the Anthropic API (Claude), which analyzes uploaded images and video frames to detect content that violates our community guidelines, including but not limited to:

- Nudity or sexually explicit material.
- Graphic violence or gore.
- Hate symbols or extremist imagery.
- Content depicting illegal activity.
- Content harmful to minors.

Media that does not pass moderation is rejected and not stored. The media content is transmitted to Anthropic solely for this moderation purpose and is subject to Anthropic's data processing terms. We do not manually review uploaded media unless required for safety or legal reasons.

## Data Storage and Security

### Where Your Data Is Stored

- **Account and program data** is stored in a Supabase-hosted PostgreSQL database with row-level security (RLS) policies to ensure users can only access their own data.
- **Shared programs** are stored in a separate table with public read access, accessible via share links.
- **The web application** is hosted on Vercel.

### Security Measures

We implement reasonable technical and organizational measures to protect your data, including:

- Encrypted data transmission (HTTPS/TLS).
- Row-level security policies on database tables.
- Token-based authentication with secure session management.
- Regular security updates to our infrastructure and dependencies.

No method of transmission over the Internet or electronic storage is completely secure. While we strive to protect your information, we cannot guarantee absolute security.

## Third-Party Services

We use the following third-party services to operate the Service:

| Service | Purpose | Their Privacy Policy |
|---------|---------|---------------------|
| **Supabase** | Authentication and database hosting | [supabase.com/privacy](https://supabase.com/privacy) |
| **Anthropic** | AI chat processing, and reading text you submit for import or enrichment (Claude API) | [anthropic.com/privacy](https://www.anthropic.com/privacy) |
| **OpenRouter** | Routing import review requests to the reviewing model | [openrouter.ai/privacy](https://openrouter.ai/privacy) |
| **OpenAI** | The model that reviews imported programs against their source | [openai.com/policies/privacy-policy](https://openai.com/policies/privacy-policy/) |
| **Vercel** | Web application hosting | [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy) |
| **Google** | OAuth authentication provider | [policies.google.com/privacy](https://policies.google.com/privacy) |
| **Apple** | Sign-In authentication provider | [apple.com/privacy](https://www.apple.com/privacy/) |

These services may collect and process data according to their own privacy policies. We encourage you to review them.

## Information We Do Not Collect

We do not collect:

- Precise or coarse location data.
- Financial or payment information.
- Health or fitness data.
- Contacts or address book data.
- Browsing or search history.
- Advertising identifiers or device fingerprints.
- Audio recordings (voice commands are processed entirely on-device).

## Cookies and Tracking

We use minimal cookies, limited to:

- **Authentication tokens** to maintain your login session.
- **Session identifiers** necessary for the Service to function.

We use two advertising measurement tags so we can tell whether our own ads bring people to Rhylthyme: the Google Ads tag and the Reddit Pixel. Each sets a cookie and records that you visited, and whether you signed up or imported a protocol, so that Google or Reddit can attribute that to an ad you saw. Neither receives your email, your programs, or any other account data. You can block these with any standard ad or tracker blocker without affecting the app. We do not use third-party analytics cookies beyond this and do not engage in cross-site tracking for other purposes.

## Data Sharing and Selling

**We do not sell, rent, or trade your personal information to third parties.**

We may share your information only in the following circumstances:

- **With your consent:** When you explicitly share a program via a public share link.
- **Service providers:** With the third-party services listed above, solely to operate the Service.
- **Legal requirements:** If required by law, regulation, legal process, or governmental request.
- **Safety:** To protect the rights, property, or safety of Rhylthyme, our users, or the public.

## Your Rights

You have the following rights regarding your personal data:

- **Access:** You can view your account information and programs at any time through the Service.
- **Export:** You can download your programs as JSON files at any time.
- **Correction:** You can update your account information through your authentication provider.
- **Deletion:** You can delete individual programs through the Service. To request complete account deletion, contact us at [privacy@rhylthyme.com](mailto:privacy@rhylthyme.com).
- **Portability:** Your programs are stored in standard JSON format and can be exported at any time.

We will respond to data rights requests within 30 days.

## Data Retention

- **Account data** is retained for as long as your account is active.
- **Program data** is retained until you delete it or request account deletion.
- **Media files** attached to steps are retained until you remove them or request account deletion.
- **Shared programs** remain accessible via their share links until you unshare or delete them.
- **Run records** are retained until you delete the run, delete the program it belongs to, or request account deletion. Runs kept in a signed-out browser are never transmitted to us.
- **Usage data** is retained in aggregate form and is not linked to individual accounts after 90 days.
- **Bridge data** (lab machines, their current run and the commands sent to them) is kept until you delete it or request account deletion; each bridge's run state is overwritten by its next run.
- **Import and review text** is not stored; only the audit row described above is kept.
- **AI chat messages** are not stored by us after your session ends. Anthropic's retention of API data is governed by their privacy policy and data processing terms.

Upon account deletion, we will remove your personal data within 30 days, except where retention is required by law.

## Children's Privacy

The Service is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete that information promptly. If you believe a child under 13 has provided us with personal information, please contact us at [privacy@rhylthyme.com](mailto:privacy@rhylthyme.com).

## International Data Transfers

Your information may be transferred to and processed in countries other than your country of residence, including the United States, where our service providers operate. By using the Service, you consent to the transfer of your information to these countries.

## Changes to This Policy

We may update this Privacy Policy from time to time. When we make changes, we will:

- Update the "Last updated" date at the top of this page.
- Notify you of material changes via email or a prominent notice within the Service.

Your continued use of the Service after changes are posted constitutes your acceptance of the revised policy. We encourage you to review this page periodically.

## Contact Us

If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:

**Email:** [privacy@rhylthyme.com](mailto:privacy@rhylthyme.com)

---

*This privacy policy applies to the Rhylthyme website, web application, iOS application, command-line tools, and MCP connector.*
