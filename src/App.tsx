import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { ActionGrid } from "./components/ActionGrid";
import { Console } from "./components/Console";
import { DeviceInfo } from "./components/DeviceInfo";
import { Dialog } from "./components/Dialog";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { useStore } from "./store";

function App() {
  const init = useStore((s) => s.init);

  useEffect(() => {
    init();

    // Líneas de logcat en vivo emitidas desde Rust.
    const unlistenLine = listen<{ id: number; line: string }>("logcat-line", (e) => {
      useStore.getState().appendLog(e.payload.line, "out");
    });
    const unlistenEnd = listen<number>("logcat-end", () => {
      useStore.setState({ liveLogcatId: null });
    });

    // Sondeo de dispositivos para detectar conexiones/desconexiones en caliente.
    const poll = setInterval(() => {
      if (useStore.getState().adbReady) useStore.getState().refreshDevices();
    }, 4000);

    return () => {
      unlistenLine.then((f) => f());
      unlistenEnd.then((f) => f());
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <DeviceInfo />
        <ActionGrid />
        <Console />
      </div>
      <Dialog />
    </div>
  );
}

export default App;
