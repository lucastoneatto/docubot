import { setPlanAction } from '@/app/actions';
import { adminApi, type AdminUser } from '@/lib/api';
import { money } from '@/lib/format';
import { Alert, Badge, Button, Card, CardTitle, EmptyState, TBody, TD, TH, THead, TR, Table } from '@/components/ui';

export default async function AdminUsersPage() {
  let users: AdminUser[] = [];
  let error: string | null = null;

  try {
    users = await adminApi.users();
  } catch (e) {
    error = (e as Error).message;
  }

  if (error) {
    return <Alert tone="danger">Could not load users: {error}</Alert>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Users and plans</CardTitle>
        <p className="t-body mt-1">
          The paid plan removes the "Powered by DocuBot" mark from all of that
          user's widgets.
        </p>
      </Card>

      {users.length === 0 ? (
        <EmptyState title="No registered users yet." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Email</TH>
              <TH>Plan</TH>
              <TH numeric>Collections</TH>
              <TH numeric>Spend this month</TH>
              <TH>Action</TH>
            </tr>
          </THead>
          <TBody>
            {users.map((user) => (
              <TR key={user.id}>
                <TD>{user.email}</TD>
                <TD>
                  <Badge tone={user.plan === 'paid' ? 'success' : 'neutral'}>
                    {user.plan === 'paid' ? 'Paid' : 'Free'}
                  </Badge>
                </TD>
                <TD numeric>{user.collectionCount}</TD>
                <TD numeric>{money(user.monthlyCost)}</TD>
                <TD>
                  <form action={setPlanAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="plan"
                      value={user.plan === 'paid' ? 'free' : 'paid'}
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      {user.plan === 'paid' ? 'Switch to free' : 'Switch to paid'}
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
