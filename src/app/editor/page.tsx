import { EditorWorkspace } from "@/features/editor/EditorWorkspace";
import { PUBLIC_THEME_IDS } from "@/lib/templates";

export default function EditorPage() {
  return (
    <EditorWorkspace
      title="RedNoteMaker"
      themeIds={PUBLIC_THEME_IDS}
      defaultTheme="classic"
    />
  );
}
