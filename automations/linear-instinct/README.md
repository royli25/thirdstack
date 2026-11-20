# Product morning digest

Prepared for Roy: read PonyNoSaddle's **Product** project each day at **5 AM
America/Los_Angeles**, summarize it, and email **royli@mail.instinct.com** with
instructions to post once to **Athens Academy**. The message is a very short task
brief for **Andrew, Roy, and Joe**. Marketing is excluded.

This is an independent cloud job, not part of the Two Hands application or its
provider statistics. It does not require the Mac or a terminal session to stay on.
It uses the OpenAI Responses API for one bounded summary request per run; it does
not inherit this conversation, the Codex subscription login, or local MCP access.

## Current state

- Linear scope and project UUID verified through the connected Linear tool.
- A setup-check email was sent from Roy's signed-in Gmail account to Instinct.
- Instinct's email-to-group routing and accepted automated sender remain unverified.
- The workflow is local and disabled for scheduled runs until explicitly enabled.
- No production model call or automated digest email has been tested.
- GitHub CLI authentication is expired, so this workflow has not been deployed.

## What the digest reads

The script fetches every page of Product issues and selects open, non-archived
issues assigned to Andrew, Roy, or Joe. Ownership uses their verified Linear user
IDs, so Andrew's email-style display name does not appear in the brief. It reads
descriptions, owners, due dates, status, and priority. It does not read comments or
infer progress from `updatedAt`. Completed, canceled, unassigned, and other people's
issues are excluded; it never invents assignments.

The group receives three lines, one per person, under a short heading. Each person
gets at most two priorities, and the entire brief is capped at 90 words. Urgent or
due work and existing work in progress come first. An explicit blocker can appear
in the affected person's line. Review items retain their review status. Someone
without open tasks gets "No open Product tasks assigned."

These are suggested priorities for the day, not invented deadlines or commitments.
The message includes compact issue IDs, without long URLs, a general project recap,
or motivational filler. Issue text is treated as data; the model has no tools.
Private brief bodies are not printed to Actions logs or uploaded as artifacts.

Example format (illustrative, not a live report):

```text
Product — suggested focus today
Andrew: Payments (ISSUE-1); domain setup (ISSUE-2)
Roy: Product redesign (ISSUE-3); landing page (ISSUE-4)
Joe: Tool library (ISSUE-5); MCP setup review (ISSUE-6)
```

## Configure before enabling

Use repository Actions secrets for:

| Secret                         | Purpose                                               |
| ------------------------------ | ----------------------------------------------------- |
| `LINEAR_DIGEST_API_KEY`        | A Linear personal API key with read access to Product |
| `OPENAI_DIGEST_API_KEY`        | An OpenAI project API key for the summary request     |
| `LINEAR_DIGEST_RESEND_API_KEY` | A Resend sending key for a verified sender            |

Use repository Actions variables for:

| Variable                     | Value                                                                   |
| ---------------------------- | ----------------------------------------------------------------------- |
| `OPENAI_DIGEST_MODEL`        | An available Responses API model supporting structured outputs          |
| `LINEAR_DIGEST_FROM_EMAIL`   | A verified sender that Instinct has agreed to accept                    |
| `INSTINCT_ROUTING_CONFIRMED` | Set to `true` only after a live email reaches Athens Academy            |
| `LINEAR_DIGEST_ENABLED`      | Leave unset until setup and a manual send are verified; then set `true` |

The sender matters: the Gmail setup check does not establish that Instinct will
accept email from a separate cloud sender. Do not reuse application/provider keys
or upload local Codex OAuth files. Set an appropriate spend limit on the OpenAI
project before live validation. The request caps output at 1,600 tokens and source
input at 180 KB; the job has a five-minute timeout.

The read-only and preview paths are ready. The final activation requires valid
GitHub access, these cloud credentials, and confirmed Instinct delivery. A successful
Resend API response proves provider acceptance, not inbox or group-chat delivery.

## Verify and activate

1. Confirm Instinct's required routing format and allowed sender using the setup
   email. Test the actual cloud sender with a harmless message to Athens Academy.
2. Deploy the new workflow and automation directory to the repository's default
   branch after checking only these changes; preserve unrelated working changes.
3. Add the secrets and variables through GitHub's secure settings. Do not paste
   credentials into chat, workflow files, issue text, or shell history.
4. Run **Product morning digest** manually with **Send** unchecked. This calls
   Linear and OpenAI but sends no email.
5. Set `INSTINCT_ROUTING_CONFIRMED=true` after the harmless routing test. Manually
   run with **Send** checked and verify the digest appears once in Athens Academy.
6. Set `LINEAR_DIGEST_ENABLED=true` to enable daily delivery. Unset it to stop
   future scheduled runs. Monitor failed Actions runs for configuration/provider
   errors. GitHub schedules can be delayed and are not exact-time delivery guarantees.

Resend idempotency keys suppress identical daily requests for 24 hours. A changed
payload retried with the same daily key may be rejected; the script does not invent
a fresh key to bypass that protection. Instinct should post each dated digest once.

## Local checks

```sh
python3 -m unittest discover -s automations/linear-instinct -p 'test_*.py'
python3 automations/linear-instinct/digest.py --help
```

With credentials supplied securely in the process environment, running `digest.py`
previews by default. `--output /private/path/new-preview.txt` writes a local preview
with owner-only permissions and refuses to overwrite an existing file. `--send`
requires confirmed routing and email credentials. Tests use offline synthetic data
and never call Linear, OpenAI, Resend, or Instinct.

References: [Linear GraphQL](https://linear.app/developers/graphql),
[OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create),
[Resend sending](https://resend.com/docs/api-reference/emails/send-email),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), and
[GitHub schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
