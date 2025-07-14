import { useState } from "react";
import { getPortProxyList } from "./netsh/portproxy";
import "./App.css";
import type { PortProxyConfig } from "./netsh/types";

function App() {
  const [portProxyList, setPortProxyList] = useState<PortProxyConfig[]>([]);

  return (
    <div className="flex flex-col gap-4">
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
          Click to reload PortProxy List
        </button>
      </div>

      <div className="overflow-x-auto border border-base-content/5 bg-base-100">
        <table className="table table-pin-rows">
          <thead>
            <tr>
              <th>Group</th>
              <th>Address from</th>
              <th>Port from</th>
              <th>Address to</th>
              <th>Port to</th>
            </tr>
          </thead>
          <tbody>
            {portProxyList.map((item) => (
              <tr key={Object.values(item).join("-")}>
                <td>{item.type}</td>
                <td>{item.addressFrom}</td>
                <td>{item.portFrom}</td>
                <td>{item.addressTo}</td>
                <td>{item.portTo}</td>
              </tr>
            ))}
          </tbody>
        </table>{" "}
      </div>
    </div>
  );
}

export default App;
