import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  AccountMenu,
  AuditLogTable,
  AuthConfirmForm,
  AuthConfirmInvalid,
  AsyncSubmitButton,
  AuthShell,
  DashboardNav,
  TermsAcceptanceCheckbox,
  DataTable,
  DataTablePager,
  ElevatedCard,
  EmptyState,
  Faq,
  FeedbackSheet,
  HelpSheet,
  InfoTooltip,
  LoginForm,
  PageHeader,
  PricingLadder,
  Section,
  SegmentedControl,
  StatTile,
} from "../src";
import type { AuditLogEntry, PlanCatalog } from "../src";
import { StatusCard } from "../src/status-card";
import { Input } from "../src/ui/input";
import { Label } from "../src/ui/label";
import { Textarea } from "../src/ui/textarea";
import { Button } from "../src/ui/button";
import "./theme.css";

const LONG_STALL = "Ah Seng Traditional Charcoal Teh Tarik and Kopi Peng Stall (Blk 123 Bedok North Hawker Centre)";
const LONG_PLAN = "All Access Annual Plan for Multi-Outlet Hawker Groups";

const noop = async () => {};

const CATALOG: PlanCatalog = {
  plans: [
    { slug: "free", kind: "free", name: "Free", monthly_cents: 0, annual_cents: 0, kits: [] },
    { slug: "qkit", kind: "kit", name: "qkit", monthly_cents: 1600, annual_cents: 16000, kits: ["qkit"] },
    { slug: "all_access", kind: "bundle", name: LONG_PLAN, monthly_cents: 4900, annual_cents: 49000, kits: ["qkit", "paykit", "printkit"] },
  ],
  event_pass: { per_cup_cents: 15, min_cents: 2000, cap_cents: 20000, days: 3 },
};

const NOW = "2026-11-20T08:30:00+08:00";
const AUDIT: AuditLogEntry[] = [
  { id: "1", actor: "ahseng@example.com", action: "menu.item_updated", target: "Teh Tarik", detail: "Price S$1.80 to S$2.00", createdAt: NOW },
  { id: "2", actor: "mei.ling.tan.with.a.very.long.address@example.com", action: "stall.settings_changed", target: LONG_STALL, detail: null, createdAt: NOW },
  { id: "3", actor: "ahseng@example.com", action: "session.signed_in", target: null, detail: null, createdAt: NOW },
];

interface Row {
  id: string;
  stall: string;
  orders: number;
}
const ROWS: Row[] = [
  { id: "a", stall: "Ah Seng Teh Tarik", orders: 128 },
  { id: "b", stall: LONG_STALL, orders: 87 },
];

function Group({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section data-group={name} className="space-y-4 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">{name}</h2>
      {children}
    </section>
  );
}

function Sheets() {
  const [feedback, setFeedback] = React.useState(false);
  const [plain, setPlain] = React.useState(false);
  const [help, setHelp] = React.useState(false);
  return (
    <Group name="FeedbackSheet and HelpSheet">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setFeedback(true)}>Open feedback with NPS</Button>
        <Button variant="outline" onClick={() => setPlain(true)}>Open feedback</Button>
        <Button variant="outline" onClick={() => setHelp(true)}>Open help</Button>
      </div>
      <FeedbackSheet open={feedback} onOpenChange={setFeedback} onSubmit={noop} showNps source="preview" />
      <FeedbackSheet open={plain} onOpenChange={setPlain} onSubmit={noop} source="preview" />
      <HelpSheet open={help} onOpenChange={setHelp} mode="form" onSubmit={noop} categories={[{ value: "billing", label: "Billing" }, { value: "other", label: "Something else" }]} />
    </Group>
  );
}

function SegmentedGroup() {
  const [track, setTrack] = React.useState<string | null>("day");
  const [pill, setPill] = React.useState<string | null>("all");
  const opts = [
    { value: "day", label: "Today" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
  ];
  return (
    <Group name="SegmentedControl">
      <SegmentedControl ariaLabel="Range (track)" options={opts} value={track} onChange={setTrack} />
      <SegmentedControl
        ariaLabel="Filter (pill)"
        variant="pill"
        options={[{ value: "all", label: "All stalls" }, { value: "open", label: "Open now" }, { value: "long", label: LONG_STALL }]}
        value={pill}
        onChange={setPill}
      />
    </Group>
  );
}

function ControlsGroup() {
  const [accepted, setAccepted] = React.useState(false);
  return (
    <Group name="Touch and focus controls">
      <DashboardNav
        wordmark={<span className="text-xl font-semibold">qkit</span>}
        navLinks={[{ href: "#orders", label: "Orders" }, { href: "#stats", label: "Stats" }]}
        vendor={{ name: LONG_STALL }}
        signOutAction={noop}
        getHelp={{ type: "mailto", address: "help@example.com" }}
        onFeedbackSubmit={noop}
      />
      <TermsAcceptanceCheckbox checked={accepted} onCheckedChange={setAccepted} />
      <form onSubmit={(event) => event.preventDefault()}>
        <AsyncSubmitButton pending={false}>Save changes</AsyncSubmitButton>
      </form>
    </Group>
  );
}

function Pager() {
  const [page, setPage] = React.useState(1);
  return <DataTablePager page={page} pageCount={5} onPageChange={setPage} />;
}

function Preview() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 p-4 sm:p-8" id="preview-root">
      <h1 className="text-2xl font-semibold">@merqo/ui render check</h1>

      <Group name="ElevatedCard">
        <ElevatedCard className="p-6">Today's orders are on track.</ElevatedCard>
        <ElevatedCard className="p-6">{LONG_STALL}</ElevatedCard>
      </Group>

      <Group name="Section">
        <Section icon={<span aria-hidden>*</span>} eyebrow="Stall" title="Opening hours" description="Shown to customers on your queue page." tooltip="Customers see these hours.">
          <p className="text-sm">Mon to Sat, 7am to 2pm.</p>
        </Section>
        <Section icon={<span aria-hidden>*</span>} title={LONG_STALL} description={LONG_STALL} surface="elevated">
          <p className="text-sm">{LONG_STALL}</p>
        </Section>
      </Group>

      <Group name="EmptyState">
        <EmptyState title="No orders yet" description="Orders appear here as soon as a customer joins the queue." actions={<Button>Share queue link</Button>} />
        <EmptyState size="compact" title="Nothing here" />
        <EmptyState title={LONG_STALL} description={LONG_STALL} actions={<Button>Create a stall</Button>} />
      </Group>

      <Group name="StatTile">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile card label="Orders today" value="128" delta={12} caption="vs yesterday" />
          <StatTile card label="Revenue" value="S$1,284.50" delta={-8} primary />
          <StatTile card label={LONG_STALL} value="S$12,345,678,901,234.90" caption={LONG_STALL} delta={null} />
        </div>
      </Group>

      <Group name="StatusCard">
        <div className="[&_main]:min-h-0">
          <StatusCard eyebrow="Error" code="404" title="We could not find that page" description="The link may be old or mistyped." />
          <StatusCard title={LONG_STALL} description={LONG_STALL} />
        </div>
      </Group>

      <Group name="PageHeader">
        <PageHeader eyebrow="Stalls" title="Menu" description="Edit what customers can order." actions={<Button>Add item</Button>} />
        <PageHeader eyebrow={LONG_STALL} title={LONG_STALL} description={LONG_STALL} back={{ href: "#", label: "Back to stalls" }} actions={<Button>Add item</Button>} />
      </Group>

      <Group name="AuthShell with LoginForm">
        <div className="[&_main]:min-h-0">
          <AuthShell wordmark={<span className="text-xl font-semibold">qkit</span>} tagline="Queues for hawker stalls" title="Sign in" subtitle="Welcome back">
            <LoginForm onPasswordSignIn={noop} onPasswordSignUp={noop} onGoogleSignIn={noop} showGoogle forgotPasswordHref="#" onForgotPassword={noop} />
          </AuthShell>
        </div>
      </Group>

      <Group name="AuthConfirmForm and AuthConfirmInvalid">
        <div className="[&_main]:min-h-0">
          <AuthShell title="Confirm your email">
            <AuthConfirmForm tokenHash="preview" type="signup" action="#" />
          </AuthShell>
          <AuthShell title="This link has expired">
            <AuthConfirmInvalid loginHref="#" />
          </AuthShell>
        </div>
      </Group>

      <Group name="PricingLadder">
        <PricingLadder catalog={CATALOG} highlight="all_access" showEventPass showPilotNotice renderAction={() => <Button className="w-full">Choose plan</Button>} />
      </Group>

      <Group name="Faq">
        <Faq
          eyebrow="Questions"
          title="Frequently asked"
          items={[
            { question: "Can I change plans later?", answer: "Yes, at any time from your account page." },
            { question: LONG_PLAN + "? What happens to my menu and my queue history if I downgrade?", answer: LONG_STALL },
          ]}
        />
      </Group>

      <Group name="AuditLogTable">
        <AuditLogTable entries={AUDIT} />
        <AuditLogTable entries={[]} />
      </Group>

      <SegmentedGroup />

      <Group name="DataTable and DataTablePager">
        <DataTable
          rows={ROWS}
          getRowKey={(r) => r.id}
          columns={[
            { header: "Stall", cell: (r) => r.stall },
            { header: "Orders", cell: (r) => r.orders },
          ]}
        />
        <Pager />
      </Group>

      <Group name="FormField">
        <div className="max-w-md space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pv-name">Stall name</Label>
            <Input id="pv-name" defaultValue={LONG_STALL} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pv-note">Note to customers</Label>
            <Textarea id="pv-note" placeholder="Anything customers should know" />
          </div>
        </div>
      </Group>

      <Group name="InfoTooltip">
        <p className="flex items-center gap-1.5 text-sm">
          API rate limit
          <InfoTooltip content="Requests over this limit are queued, not rejected." ariaLabel="More about the API rate limit" trigger="tap" />
        </p>
      </Group>

      <Group name="AccountMenu">
        <div className="flex">
          <AccountMenu
            vendor={{ name: LONG_STALL, tier: "pro", subtitle: "ahseng@example.com" }}
            signOutAction={noop}
            getHelp={{ type: "mailto", address: "help@example.com" }}
            onFeedbackSubmit={noop}
            showPlanItem
            kitLocalSettingsHref="#"
          />
        </div>
      </Group>

      <ControlsGroup />

      <Sheets />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);
