import Background from "@/components/background";
import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <Background />
      <div className="flex min-h-screen flex-col items-center justify-center text-center px-6">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-md bg-primary px-6 py-3 text-primary-foreground"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
