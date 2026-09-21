import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { money } from '@/lib/format';
import { Alert, Card, CardTitle, Stat } from '@/components/ui';

export default async function AdminOverviewPage() {
  let data: Awaited<ReturnType<typeof adminApi.overview>> | null = null;
  let error: string | null = null;

  try {
    data = await adminApi.overview();
  } catch (e) {
    error = (e as Error).message;
  }

  if (error || !data) {
    return (
      <Alert tone="danger">
        Could not load the panel: {error}. Check ADMIN_USER and ADMIN_PASSWORD.
      </Alert>
    );
  }

  const avg =
    data.monthlyMessages > 0 ? data.monthlyCost / data.monthlyMessages : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <Stat label="Spend this month" value={money(data.monthlyCost)} hint="Accumulated real AI cost" />
        </Card>
        <Card>
          <Stat
            label="Messages this month"
            value={data.monthlyMessages.toLocaleString('en')}
            hint={`Average ${money(avg)} per message`}
          />
        </Card>
        <Card>
          <Stat label="Users" value={String(data.users)} />
        </Card>
        <Card>
          <Stat label="Collections" value={String(data.collections)} />
        </Card>
        <Card>
          <Stat label="Collections processing" value={String(data.collectionsProcessing)} hint="Uploads currently being ingested" />
        </Card>
        <Card>
          <Stat
            label="Collections in error"
            value={String(data.collectionsError)}
            tone={data.collectionsError > 0 ? 'danger' : 'default'}
            hint={data.collectionsError > 0 ? 'Require attention' : 'All good'}
          />
        </Card>
      </section>

      <Card>
        <CardTitle>Next step</CardTitle>
        <p className="t-body mt-1">
          Collections without a quota can spend without a cap. Check which ones have no
          limit in{' '}
          <Link href="/admin/collections" className="text-accent hover:underline">
            Collections and quotas
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
