import { useState, useEffect, type FormEvent } from "react";
import {
  Globe02 as Globe2,
  Plus,
  Loading02 as LoaderCircle,
  Lock01 as LockKeyhole,
  Trash01 as Trash2,
  XClose as X,
} from "@untitledui/icons";
import { api, type TaskDetail } from "../api";
export function AddEvidence({
  task,
  onRefresh,
  onError,
}: {
  task: TaskDetail;
  onRefresh: () => Promise<void>;
  onError: (s: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(`/tasks/${task.id}/sources`, { url });
      setUrl("");
      await onRefresh();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel supplied-evidence">
      <div className="panel-heading">
        <span>
          <Globe2 size={16} />
          Start with a known evidence link
        </span>
        <span className="small-label">Optional</span>
      </div>
      <form onSubmit={(e) => void add(e)}>
        <label htmlFor="evidence-url">Public HTTPS URL</label>
        <div>
          <input
            id="evidence-url"
            type="url"
            pattern="https://.*"
            required
            maxLength={4096}
            value={url}
            placeholder="https://company.com/funding-announcement"
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="button secondary"
            disabled={busy || task.status === "running"}
          >
            {busy ? (
              <LoaderCircle size={14} className="spin" />
            ) : (
              <Plus size={14} />
            )}
            Add link
          </button>
        </div>
        <p className="tiny muted">
          Adding a link makes no API request. Use Extract page to retrieve it
          through Firecrawl, or review the linked page yourself.
        </p>
      </form>
    </section>
  );
}
export function TaskPrivacy({
  task,
  onRefresh,
  onError,
  onDeleted,
}: {
  task: TaskDetail;
  onRefresh: () => Promise<void>;
  onError: (s: string) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [consented, setConsented] = useState(task.intent.consent);
  useEffect(() => setConsented(task.intent.consent), [task.intent.consent]);
  async function consent(value: boolean) {
    const previous = consented;
    setConsented(value);
    setBusy(true);
    try {
      await api(`/tasks/${task.id}/privacy`, { consent: value });
      await onRefresh();
    } catch (e) {
      setConsented(previous);
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api(`/tasks/${task.id}/delete`, { confirmTaskId: task.id });
      onDeleted();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel privacy-controls">
      <div className="panel-heading">
        <span>
          <LockKeyhole size={15} />
          Task privacy
        </span>
      </div>
      <div className="rail-body">
        <label className="privacy-checkbox">
          <input
            type="checkbox"
            checked={consented}
            disabled={busy}
            onChange={(e) => void consent(e.target.checked)}
          />
          Include in provider aggregates
        </label>
        <p className="tiny muted">
          Withdrawal removes this task's contribution from future local
          aggregates immediately. Raw task content is excluded either way.
        </p>
        {deleting ? (
          <div
            className="delete-confirm"
            role="group"
            aria-label="Confirm task deletion"
          >
            <p>
              Delete this task, source content, and its local event history?
              This cannot be undone. Vendor logs and exported files are
              separate.
            </p>
            <div>
              <button
                className="button secondary"
                onClick={() => setDeleting(false)}
                disabled={busy}
              >
                <X size={12} />
                Keep task
              </button>
              <button
                className="button secondary danger"
                onClick={() => void remove()}
                disabled={busy || task.status === "running"}
              >
                <Trash2 size={12} />
                Delete local task
              </button>
            </div>
          </div>
        ) : (
          <button
            className="text-button danger delete-task"
            disabled={busy || task.status === "running"}
            onClick={() => setDeleting(true)}
          >
            <Trash2 size={12} />
            Delete task & local history
          </button>
        )}
      </div>
    </section>
  );
}
