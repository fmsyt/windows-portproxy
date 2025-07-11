import { useState } from "react";
import { getPortProxyList } from "./netsh/portproxy";
import "./App.css";
import type { PortProxyConfig } from "./netsh/types";

function App() {
  const [portProxyList, setPortProxyList] = useState<PortProxyConfig[]>([]);

  return (
    <div>
      <div className="flex all-center justify-center">
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            console.log("getPortProxyList");
            const data = await getPortProxyList();
            setPortProxyList(data);
          }}
        >
          Click ot get Port Proxy List
        </button>
      </div>
      <pre>
        <code>{JSON.stringify(portProxyList, null, 2)}</code>
      </pre>
    </div>
  );
}

export default App;
