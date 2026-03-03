import Image from "next/image";

import giftImage from "@/public/gift.jpg";
import { CoffeeIcon } from "@/components/icons/CoffeeIcon";

export function CoffeeGiftHover() {
  return (
    <div className="relative group">
      <button
        type="button"
        aria-label="请作者喝杯咖啡"
        className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <CoffeeIcon />
      </button>

      <div className="absolute right-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-150">
        <div className="rounded-xl overflow-hidden border border-apple-border bg-white shadow-xl">
          <Image
            src={giftImage}
            alt="赞赏码"
            className="w-full h-auto"
            priority={false}
            sizes="256px"
          />
        </div>
      </div>
    </div>
  );
}
