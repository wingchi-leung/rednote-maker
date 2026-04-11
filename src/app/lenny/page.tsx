import { EditorWorkspace } from "@/features/editor/EditorWorkspace";
import { LENNY_THEME_IDS } from "@/lib/templates";

export default function LennyPage() {
  return (
    <EditorWorkspace
      title="Lenny Studio"
      themeIds={LENNY_THEME_IDS}
      showLennyTools
      showLennyPreset
      defaultTheme="lennyCover"
      backHref="/editor"
      backLabel="返回主编辑器"
    />
  );
}
