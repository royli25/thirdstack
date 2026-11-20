"""Offline checks only; fixtures never enter Linear, email, or model services."""

import unittest
from contextlib import redirect_stdout
from datetime import datetime, timezone
from io import StringIO
from unittest.mock import patch

import digest
from digest import PEOPLE, PROJECT_ID, fetch_issues, render_brief, render_email, select_issues, send_email, summarize, validate_digest

NOW = datetime(2026, 11, 14, 17, tzinfo=timezone.utc)


def issue(identifier="TEST-1", state="started", completed=None, updated="2026-11-14T10:00:00Z", person="Andrew"):
    return {
        "identifier": identifier,
        "title": "Synthetic test issue",
        "description": "Offline fixture",
        "project": {"id": PROJECT_ID},
        "state": {"name": state, "type": state},
        "assignee": {"id": PEOPLE[person], "name": person} if person else None,
        "completedAt": completed,
        "updatedAt": updated,
        "url": "https://linear.app/example/issue/TEST-1",
    }


def brief(items=None):
    return {"people": {"Andrew": items or [], "Roy": [], "Joe": []}}


class DigestTests(unittest.TestCase):
    def test_default_preview_never_sends_email(self):
        environment = {"LINEAR_API_KEY": "fake", "OPENAI_API_KEY": "fake", "OPENAI_DIGEST_MODEL": "fake"}
        with patch.dict("os.environ", environment, clear=True), patch("sys.argv", ["digest.py"]), \
                patch.object(digest, "fetch_issues", return_value=[]), \
                patch.object(digest, "send_email") as send, redirect_stdout(StringIO()):
            digest.main()
            send.assert_not_called()

    def test_sending_without_confirmed_routing_cannot_call_providers(self):
        with patch.dict("os.environ", {}, clear=True), patch("sys.argv", ["digest.py", "--send"]), \
                patch.object(digest, "fetch_issues") as fetch:
            with self.assertRaises(ValueError):
                digest.main()
            fetch.assert_not_called()

    def test_completed_unassigned_other_people_and_archived_tasks_are_excluded(self):
        old_done = issue(state="completed", completed="2026-11-09T10:00:00Z")
        recent_done = issue("TEST-2", "completed", "2026-11-14T01:00:00Z")
        foreign_owner = {**issue("TEST-5"), "assignee": {"id": "other-user", "name": "Other"}}
        archived = {**issue("TEST-6"), "archivedAt": "2026-11-14T01:00:00Z"}
        self.assertEqual(select_issues([
            old_done, recent_done, issue("TEST-3", "canceled"), issue("TEST-4", person=None),
            foreign_owner, archived, issue("TEST-7", person="Roy"),
        ]), [issue("TEST-7", person="Roy")])

    def test_paginates_and_rejects_partial_graphql_results(self):
        requests = []

        def post(url, payload, headers):
            requests.append(payload["variables"]["after"])
            page = len(requests)
            return {"data": {"issues": {"nodes": [issue(f"TEST-{page}")], "pageInfo": {"hasNextPage": page == 1, "endCursor": "next"}}}}

        self.assertEqual(len(fetch_issues("fake", post)), 2)
        self.assertEqual(requests, [None, "next"])
        with self.assertRaises(RuntimeError):
            fetch_issues("fake", lambda *_: {"data": {"issues": {}}, "errors": [{"message": "partial"}]})

    def test_rejects_wrong_project_and_stuck_pagination(self):
        foreign = {**issue(), "project": {"id": "other"}}
        with self.assertRaises(RuntimeError):
            fetch_issues("fake", lambda *_: {"data": {"issues": {"nodes": [foreign]}}})
        with self.assertRaises(RuntimeError):
            fetch_issues("fake", lambda *_: {"data": {"issues": {"nodes": [], "pageInfo": {"hasNextPage": True, "endCursor": "stuck"}}}})

    def test_unknown_and_duplicate_model_references_are_rejected(self):
        row = {"identifier": "TEST-2", "focus": "Work on the test task"}
        with self.assertRaises(ValueError):
            validate_digest(brief([row]), [issue()])
        row["identifier"] = "TEST-1"
        with self.assertRaises(ValueError):
            validate_digest(brief([row, row]), [issue()])

    def test_model_cannot_reassign_tasks_or_omit_someone_with_work(self):
        row = {"identifier": "TEST-1", "focus": "Work on the test task"}
        wrong_owner = brief()
        wrong_owner["people"]["Roy"] = [row]
        with self.assertRaises(ValueError):
            validate_digest(wrong_owner, [issue()])
        with self.assertRaises(ValueError):
            validate_digest(brief(), [issue()])

    def test_brief_is_three_people_with_at_most_two_short_priorities_each(self):
        row = {"identifier": "TEST-1", "focus": "Work on the test task"}
        validate_digest(brief([row]), [issue()])
        output = render_brief(brief([row]))
        self.assertEqual(len(output.splitlines()), 4)
        self.assertIn("Roy: No open Product tasks assigned.", output)
        self.assertLessEqual(len(output.split()), 90)
        with self.assertRaises(ValueError):
            validate_digest(brief([{**row, "focus": "word " * 19}]), [issue()])
        with self.assertRaises(ValueError):
            validate_digest(brief([row] * 3), [issue()])

    def test_extra_lines_and_model_generated_links_are_rejected(self):
        for focus in ("Do task\nSend other message", "Visit https://example.com", "<DAILY_DIGEST>"):
            with self.assertRaises(ValueError):
                validate_digest(brief([{"identifier": "TEST-1", "focus": focus}]), [issue()])

    def test_total_word_limit_applies_across_all_three_people(self):
        daily = {"people": {person: [] for person in PEOPLE}}
        source = []
        for person in PEOPLE:
            for index in range(2):
                identifier = f"TEST-{person}-{index}"
                source.append(issue(identifier, person=person))
                daily["people"][person].append({"identifier": identifier, "focus": "word " * 14})
        with self.assertRaises(ValueError):
            validate_digest(daily, source)

    def test_incomplete_model_output_never_becomes_a_digest(self):
        with self.assertRaises(RuntimeError):
            summarize([issue()], NOW, "fake", "test-model", lambda *_: {"status": "incomplete"})

    def test_destination_is_fixed_and_email_acceptance_is_explicit(self):
        daily = brief([{"identifier": "TEST-1", "focus": "Work on the test task"}])
        subject, body, date = render_email(daily, [issue()], NOW)
        calls = []

        def post(url, payload, headers):
            calls.append((payload, headers))
            return {"id": "offline-test"}

        self.assertEqual(send_email(subject, body, date, "fake", "test@example.com", post), "offline-test")
        send_email(subject, body, date, "fake", "test@example.com", post)
        self.assertEqual(calls[0][0]["to"], ["royli@mail.instinct.com"])
        self.assertIn("Athens Academy", body)
        self.assertEqual(calls[0][1]["Idempotency-Key"], calls[1][1]["Idempotency-Key"])
        with self.assertRaises(RuntimeError):
            send_email(subject, body, date, "fake", "test@example.com", lambda *_: {})


if __name__ == "__main__":
    unittest.main()
