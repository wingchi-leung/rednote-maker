import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { KebabMenuIcon } from "@/components/icons/KebabMenuIcon";

interface CardHeaderAppleNotesProps {
  accentColor: string;
}

export function CardHeaderAppleNotes({ accentColor }: CardHeaderAppleNotesProps) {
  return (
    <div
      className="shrink-0 flex items-center justify-between"
      style={{
        padding: "12px 16px",
        color: accentColor,
      }}
    >
      <div className="flex items-center gap-2">
        <ChevronLeftIcon />
        <span style={{ fontSize: "17px", fontWeight: 400 }}>Notes</span>
      </div>
      <div className="flex items-center gap-2">
        <ShareIcon />
        <KebabMenuIcon />
      </div>
    </div>
  );
}
