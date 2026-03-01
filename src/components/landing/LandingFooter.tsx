import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";

export function LandingFooter() {
  return (
    <footer className="py-8 px-6 bg-apple-gray6 border-t border-apple-border">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BrandMark size="sm" />
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
