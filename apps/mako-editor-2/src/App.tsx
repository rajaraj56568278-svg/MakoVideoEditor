import {
  Card,
  KpiRow,
  KpiTile,
  PageHeader,
  RefreshAllButton,
} from "@makoai/app-sdk/ui";

// Mako's house dashboard kit — see node_modules/@makoai/app-sdk/README.md.
export default function App() {
  return (
    <main className="page">
      <PageHeader
        title="Mako Editor"
        subtitle="Built with Mako Apps — edit src/App.tsx to get started."
        actions={<RefreshAllButton bindings={__APP_BINDING_NAMES__} />}
      />
      <KpiRow>
        <KpiTile label="Your first KPI" value="—" hint="Add a binding, then useQuery()" />
      </KpiRow>
      <Card
        title="Getting started"
        description="Data comes from bindings/<name>.sql; read it with useQuery('<name>')."
      >
        <p className="muted">
          The theme tokens (--background, --brand, --chart-1…) and the kit
          come from @makoai/app-sdk: style with the tokens, reuse the kit.
        </p>
      </Card>
    </main>
  );
}
