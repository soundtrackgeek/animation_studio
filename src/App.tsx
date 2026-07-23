import { useCallback, useEffect, useMemo, useReducer } from "react";
import { AppShell } from "./components/AppShell";
import { exportMetadata, importImage, openProject, saveProject } from "./studio/native";
import { createInitialState, STORAGE_KEY, studioReducer } from "./studio/reducer";

function App() {
  const [state, dispatch] = useReducer(studioReducer, undefined, createInitialState);
  const selectedBone = useMemo(
    () => state.project.bones.find((bone) => bone.id === state.selectedBoneId) ?? state.project.bones[0],
    [state.project.bones, state.selectedBoneId],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project));
    }, 180);
    return () => window.clearTimeout(handle);
  }, [state.project]);

  useEffect(() => {
    if (!state.notice) return;
    const handle = window.setTimeout(() => dispatch({ type: "set_notice", notice: null }), 3200);
    return () => window.clearTimeout(handle);
  }, [state.notice]);

  useEffect(() => {
    if (!state.isPlaying) return;
    const handle = window.setInterval(() => {
      dispatch({ type: "advance_frame" });
    }, 1000 / state.project.clips[0].fps);
    return () => window.clearInterval(handle);
  }, [state.isPlaying, state.project.clips[0].fps]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        dispatch({ type: "set_playing", playing: !state.isPlaying });
      }
      if (event.key === "ArrowLeft") dispatch({ type: "set_frame", frame: state.currentFrame - 1 });
      if (event.key === "ArrowRight") dispatch({ type: "set_frame", frame: state.currentFrame + 1 });
      const tools = { q: "select", w: "move", e: "rotate", b: "bone", k: "ik" } as const;
      const tool = tools[event.key.toLowerCase() as keyof typeof tools];
      if (tool) dispatch({ type: "set_tool", tool });
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const runAction = useCallback(async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      dispatch({ type: "set_notice", notice: error instanceof Error ? error.message : "The operation failed" });
    }
  }, []);

  const handleImport = useCallback(() => runAction(async () => {
    const image = await importImage();
    if (!image) return;
    const name = image.fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    dispatch({
      type: "replace_sprite",
      projectName: name,
      sprite: {
        dataUrl: image.dataUrl,
        originalPath: image.path,
        fileName: image.fileName,
        removeBackground: true,
        renderProfile: "illustrated",
      },
    });
  }), [runAction]);

  const handleOpen = useCallback(() => runAction(async () => {
    const project = await openProject();
    if (project) dispatch({ type: "replace_project", project });
  }), [runAction]);

  const handleSave = useCallback(() => runAction(async () => {
    const saved = await saveProject(state.project);
    if (saved) dispatch({ type: "set_notice", notice: "Project saved" });
  }), [runAction, state.project]);

  const handleExport = useCallback(() => runAction(async () => {
    const exported = await exportMetadata(state.project);
    if (exported) dispatch({ type: "set_notice", notice: "Animation metadata exported" });
  }), [runAction, state.project]);

  return (
    <AppShell
      state={state}
      selectedBone={selectedBone}
      dispatch={dispatch}
      onImport={handleImport}
      onOpen={handleOpen}
      onSave={handleSave}
      onExport={handleExport}
    />
  );
}

export default App;
