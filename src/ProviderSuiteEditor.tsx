import { useState } from "react";
import { Plus, Trash01 } from "@untitledui/icons";
import { api } from "./api";
import type { LabSuite, LabCase } from "../server/provider-lab-types";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { InlineError } from "./observation-ui";

export function ProviderSuiteEditor({
  initial,
  duplicate,
  onSaved,
}: {
  initial?: LabSuite;
  duplicate?: boolean;
  onSaved: (suite: LabSuite) => void;
}) {
  const [title, setTitle] = useState(
    initial ? `${initial.title}${duplicate ? " · copy" : ""}` : "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [cases, setCases] = useState<LabCase[]>(
    initial?.cases ?? [blankCase()],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function update(id: string, patch: Partial<LabCase>) {
    setCases((value) =>
      value.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  }
  return (
    <form
      className="company-plan-form suite-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const edit = initial && !duplicate && !initial.builtIn;
          const suite = await api<LabSuite>(
            `/provider-lab/suites${edit ? `/${initial.id}` : ""}`,
            {
              title,
              description,
              cases,
              ...(edit ? { expectedRevision: initial.revision } : {}),
            },
          );
          onSaved(suite);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <Label htmlFor="suite-title">Suite title</Label>
        <Input
          id="suite-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={160}
        />
      </div>
      <div>
        <Label htmlFor="suite-description">What are you testing?</Label>
        <Textarea
          id="suite-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          rows={2}
        />
      </div>
      <p className="field-hint">
        Search checks look for the reference page in the first three results.
        Extraction checks look for every required text marker on a successful
        page. These checks do not grade answer accuracy.
      </p>
      {cases.map((c, i) => (
        <fieldset key={c.id} className="suite-case-editor">
          <legend>Case {i + 1}</legend>
          <div className="suite-case-heading">
            <Label htmlFor={`${c.id}-title`}>Case title</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Remove case ${i + 1}`}
              disabled={cases.length === 1}
              onClick={() => setCases((v) => v.filter((x) => x.id !== c.id))}
            >
              <Trash01 />
            </Button>
          </div>
          <Input
            id={`${c.id}-title`}
            value={c.title}
            onChange={(e) => update(c.id, { title: e.target.value })}
            required
            minLength={3}
            maxLength={160}
          />
          <Label htmlFor={`${c.id}-kind`}>Operation</Label>
          <Select
            value={c.kind}
            onValueChange={(v) => update(c.id, { kind: v as LabCase["kind"] })}
          >
            <SelectTrigger id={`${c.id}-kind`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="search">Web search</SelectItem>
              <SelectItem value="extract">Page extraction</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor={`${c.id}-input`}>
            {c.kind === "search" ? "Search query" : "Page URL"}
          </Label>
          <Input
            id={`${c.id}-input`}
            type={c.kind === "extract" ? "url" : "text"}
            value={c.input}
            onChange={(e) => update(c.id, { input: e.target.value })}
            required
            minLength={3}
            maxLength={4096}
          />
          <Label htmlFor={`${c.id}-reference`}>Reference page URL</Label>
          <Input
            id={`${c.id}-reference`}
            type="url"
            value={c.referenceUrl}
            onChange={(e) => update(c.id, { referenceUrl: e.target.value })}
            required
            maxLength={4096}
          />
          {c.kind === "extract" && (
            <>
              <Label htmlFor={`${c.id}-terms`}>
                Required text markers (one per line)
              </Label>
              <Textarea
                id={`${c.id}-terms`}
                defaultValue={c.terms.join("\n")}
                onChange={(e) =>
                  update(c.id, {
                    terms: e.target.value
                      .split("\n")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                required
                rows={2}
              />
            </>
          )}
        </fieldset>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={cases.length >= 20}
        onClick={() => setCases((v) => [...v, blankCase()])}
      >
        <Plus />
        Add case
      </Button>
      <InlineError message={error} />
      <div className="lab-run-footer">
        <small>
          Saved revisions stay attached to earlier runs. Saving makes no
          provider calls.
        </small>
        <Button disabled={busy}>{busy ? "Saving…" : "Save suite"}</Button>
      </div>
    </form>
  );
}
function blankCase(): LabCase {
  return {
    id: crypto.randomUUID(),
    title: "",
    kind: "search",
    input: "",
    referenceUrl: "",
    terms: [],
  };
}
