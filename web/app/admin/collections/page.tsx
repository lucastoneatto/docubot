import { setQuotaAction } from '@/app/actions';
import { adminApi, type AdminCollection } from '@/lib/api';
import { money } from '@/lib/format';
import { Alert, Button, Card, CardTitle, EmptyState, Field, Input } from '@/components/ui';

/** A collection is flagged red if it has no spending cap at all. */
function isUnbounded(collection: AdminCollection) {
  return collection.monthlyMessageLimit === null && collection.monthlyBudgetUsd === null;
}

function usageLabel(collection: AdminCollection) {
  const parts = [`${collection.monthlyMessages} msg`, money(collection.monthlyCost)];
  if (collection.monthlyMessageLimit !== null) {
    parts[0] = `${collection.monthlyMessages}/${collection.monthlyMessageLimit} msg`;
  }
  if (collection.monthlyBudgetUsd !== null) {
    parts[1] = `${money(collection.monthlyCost)} / $${collection.monthlyBudgetUsd}`;
  }
  return parts.join(' · ');
}

export default async function AdminCollectionsPage() {
  let collections: AdminCollection[] = [];
  let error: string | null = null;

  try {
    collections = await adminApi.collections();
  } catch (e) {
    error = (e as Error).message;
  }

  if (error) {
    return <Alert tone="danger">Could not load collections: {error}</Alert>;
  }

  const unbounded = collections.filter(isUnbounded).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Quotas by collection</CardTitle>
        <p className="t-body mt-1">
          Leave a field empty to not apply that limit. Once reached, the widget
          stops responding and shows a notice. Sorted by spend this month.
        </p>
        {unbounded > 0 && (
          <Alert tone="warning" className="mt-3">
            {unbounded} {unbounded === 1 ? 'collection has' : 'collections have'} no
            limit at all: they can spend without a cap.
          </Alert>
        )}
      </Card>

      {collections.length === 0 ? (
        <EmptyState title="No collections on the platform yet." />
      ) : (
        <div className="space-y-3">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className={isUnbounded(collection) ? 'border-warning-border' : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-content">{collection.name}</p>
                  <p className="mt-1 text-xs text-content-muted">
                    {collection.ownerEmail} · plan {collection.ownerPlan} · {collection.status}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium tabular-nums text-content">
                    {usageLabel(collection)}
                  </p>
                  <p className="text-xs text-content-muted">usage this month</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <form action={setQuotaAction} className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
                  <input type="hidden" name="collectionId" value={collection.id} />
                  <Field id={`monthlyMessageLimit-${collection.id}`} label="Max messages/month" className="min-w-0 flex-1 sm:w-36 sm:flex-none">
                    {(a) => (
                      <Input
                        {...a}
                        name="monthlyMessageLimit"
                        type="number"
                        min="0"
                        placeholder="no limit"
                        defaultValue={collection.monthlyMessageLimit ?? ''}
                      />
                    )}
                  </Field>
                  <Field id={`monthlyBudgetUsd-${collection.id}`} label="Max spend/month (USD)" className="min-w-0 flex-1 sm:w-36 sm:flex-none">
                    {(a) => (
                      <Input
                        {...a}
                        name="monthlyBudgetUsd"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="no limit"
                        defaultValue={collection.monthlyBudgetUsd ?? ''}
                      />
                    )}
                  </Field>
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
