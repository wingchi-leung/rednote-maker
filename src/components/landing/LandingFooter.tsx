import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="py-8 px-6 bg-apple-gray6 border-t border-apple-border">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-apple-blue rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">RN</span>
          </div>
          <span className="text-sm text-gray-600">RedNoteMaker</span>
        </div>
        <nav className="flex gap-6 text-sm text-gray-500">
          <Link href="/editor" className="hover:text-apple-blue transition-colors">
            编辑器
          </Link>
        </nav>
      </div>
    </footer>
  );
}
