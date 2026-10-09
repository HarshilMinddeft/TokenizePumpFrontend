import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

/** Shown until the admin wallet has signed the backend's sign-in message. */
const AdminSignIn = ({ onSignIn, signingIn }) => (
  <Card className="mx-auto max-w-lg p-8 text-center">
    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
    </div>
    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to manage rent</h2>
    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
      Sign a message with your wallet to prove it holds admin rights. Signing is free — it does not send a
      transaction.
    </p>
    <Button className="mt-6" onClick={onSignIn} loading={signingIn}>
      {signingIn ? 'Waiting for signature…' : 'Sign in with wallet'}
    </Button>
  </Card>
);

export default AdminSignIn;
