import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 bg-apple-gray6/80 backdrop-blur-md border-b border-apple-border">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RN</span>
          </div>
          <span className="font-semibold text-gray-800">RedNoteMaker</span>
        </div>
        <Link
          href="/editor"
          className="text-sm font-medium text-apple-blue hover:underline"
        >
          进入编辑器
        </Link>
      </div>
    </header>
  );
}
