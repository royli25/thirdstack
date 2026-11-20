import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TerminalSquare } from "@untitledui/icons";
import claudeMark from "./assets/claude-mark.svg";
import codexMark from "./assets/codex-mark.png";
import { useAccount } from "./AccountGate";
import { CopyButton } from "./observation-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import "./user-dashboard.css";
import "./connect-agent.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { AgentConnections } from "./AgentConnections";

const ConnectAgentContext = createContext<
  (returnFocus?: HTMLElement | null, mode?: "agent" | "product") => void
>(() => {});
export const useConnectAgent = () => useContext(ConnectAgentContext);

export function ConnectAgentProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"agent" | "product">("agent");
  const trigger = useRef<HTMLElement | null>(null);
  return (
    <ConnectAgentContext.Provider
      value={(returnFocus, initialMode = "agent") => {
        setMode(initialMode);
        trigger.current =
          returnFocus ??
          (document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null);
        setOpen(true);
      }}
    >
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="connect-agent-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (trigger.current?.isConnected) trigger.current.focus();
            else document.getElementById("main-content")?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Connect agent</DialogTitle>
            <DialogDescription>
              Use Two Hands in the agent you already work with.
            </DialogDescription>
          </DialogHeader>
          <AgentConnectionInstructions
            initialMode={mode}
            onNavigate={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </ConnectAgentContext.Provider>
  );
}

export function AgentConnectionInstructions({
  onNavigate,
  initialMode = "agent",
}: {
  onNavigate?: () => void;
  initialMode?: "agent" | "product";
}) {
  const account = useAccount();
  const [client, setClient] = useState("codex");
  const endpoint =
    account.oauth?.resource || new URL("/mcp", location.origin).href;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(
    new URL(endpoint).hostname,
  );
  const command =
    client === "codex"
      ? `codex mcp add apilayer --url "${endpoint}"\ncodex mcp login apilayer`
      : client === "claude"
        ? `claude mcp add --transport http apilayer "${endpoint}"`
        : endpoint;
  const productConfig = JSON.stringify(
    { url: endpoint, headers: { Authorization: "Bearer <your API key>" } },
    null,
    2,
  );
  const keyLink = (
    <a href="#dashboard/keys" className="ws-text-link" onClick={onNavigate}>
      Manage API keys
    </a>
  );
  return (
    <div className="agent-connection-instructions">
      <Tabs defaultValue={initialMode}>
        <TabsList aria-label="How to use Two Hands">
          <TabsTrigger value="agent">Use in my agent</TabsTrigger>
          <TabsTrigger value="product">Build into my product</TabsTrigger>
        </TabsList>
        <TabsContent value="agent">
          <p className="ws-panel-note">
            Connect your account once. Your agent handles sign-in credentials.
          </p>
          {account.oauth ? (
            <>
              <div
                className="ws-client-picker"
                role="group"
                aria-label="Agent client"
              >
                {[
                  { id: "codex", label: "Codex", logo: codexMark },
                  { id: "claude", label: "Claude Code", logo: claudeMark },
                  { id: "other", label: "Other MCP client", logo: undefined },
                ].map(({ id, label, logo }) => (
                  <button
                    key={id}
                    aria-pressed={client === id}
                    onClick={() => setClient(id)}
                  >
                    {logo ? (
                      <img
                        className="agent-client-logo"
                        src={logo}
                        width={18}
                        height={18}
                        alt=""
                      />
                    ) : (
                      <TerminalSquare size={17} aria-hidden="true" />
                    )}
                    {label}
                  </button>
                ))}
              </div>
              <ol className="ws-setup-steps">
                <li>
                  <span>1</span>
                  <div>
                    <strong>
                      {client === "other"
                        ? "Add the MCP server URL"
                        : "Copy and run the setup"}
                    </strong>
                    <p>
                      {client === "other"
                        ? "Add this URL as a remote HTTP MCP server in your client’s settings."
                        : "Run this in your terminal, or ask your coding agent to set up this connection."}
                    </p>
                    <div className="command-box ws-remote-configuration">
                      <code>{command}</code>
                      <CopyButton
                        key={client}
                        text={command}
                        label="Copy setup"
                      />
                    </div>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <strong>Sign in to Two Hands</strong>
                    <p>
                      {client === "claude"
                        ? "Open /mcp in Claude Code and choose Authenticate for apilayer. "
                        : "When your client asks you to authenticate, open the sign-in page. "}
                      Sign in and choose Allow connection.
                    </p>
                    {local && (
                      <p>
                        This is your development account and local MCP server.
                      </p>
                    )}
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    <strong>Use Two Hands in your conversation</strong>
                    <p>
                      Ask your agent to use Two Hands for your task. Tool calls
                      use your account’s existing access and spending limits.
                    </p>
                  </div>
                </li>
              </ol>
              {account.profile && !account.previewRole && <AgentConnections />}
            </>
          ) : (
            <p role="status" className="ws-panel-note">
              Agent sign-in is not enabled on this server. Product integrations
              can use an API key in the Build into my product tab.
            </p>
          )}
        </TabsContent>
        <TabsContent value="product">
          <p className="ws-panel-note">
            Connect your product’s backend to Two Hands with its own API key.
          </p>
          <ol className="ws-setup-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Create an API key</strong>
                <p>
                  {keyLink} to create a key with the tools and usage limit your
                  product needs.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Configure your backend’s MCP client</strong>
                <p>
                  Use Streamable HTTP with these connection settings. Replace
                  the placeholder with your key and keep it in your server’s
                  secret store.
                </p>
                <div className="command-box ws-remote-configuration">
                  <code>{productConfig}</code>
                  <CopyButton text={productConfig} label="Copy configuration" />
                </div>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Call tools from your product</strong>
                <p>
                  Your backend connects to the MCP server and calls its tools.
                  Track usage and manage the key’s permissions in Two Hands.
                </p>
              </div>
            </li>
          </ol>
        </TabsContent>
      </Tabs>
    </div>
  );
}
