import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold font-serif mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
      <Link href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
        Return Home
      </Link>
    </div>
  );
}
