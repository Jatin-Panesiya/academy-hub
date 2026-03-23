import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded border border-slate-200 bg-white/70">
        <div className="p-4">
          <h1 className="text-2xl font-semibold">Welcome</h1>
          <p className="mt-2 text-sm text-slate-600">
            Academy Hub is a role-based learning portal. Student accounts are created by admin. Login to continue.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

