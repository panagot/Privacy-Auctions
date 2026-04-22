import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">404</p>
      <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Page not found
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        That URL does not exist. Start from the home page or pick an auction flow.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Back to home
      </Link>
    </div>
  );
}
