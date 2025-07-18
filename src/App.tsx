import { useMemo, useState } from "react";
import { addPortProxy, getPortProxyList } from "./netsh/portproxy";
import "./App.css";
import type { PortProxyConfig } from "./netsh/types";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";

type AddPortProxyState = {
  [key in keyof PortProxyConfig]?: {
    value: PortProxyConfig[key];
    invalidMessage?: string | null;
  }
}

const defaultAddPortProxyState: AddPortProxyState = {
  type: { value: "v4tov4" },
}

function App() {
  const [portProxyList, setPortProxyList] = useState<PortProxyConfig[]>([]);

  const [addingField, setAddingField] = useState<AddPortProxyState | null>(null);
  const isValid = useMemo(() => {

    if (!addingField) {
      return true;
    }

    let valid = true;

    Object.entries(addingField).forEach(([key, field]) => {

      const value = field?.value;

      switch (key) {
        case "type":
        case "listenPort":
        case "connectAddress":
          if (!value) {
            valid = false;
          }
          break;

        default:
          break;
      }
    })

    return valid;

  }, [addingField]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex all-center justify-center">
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {portProxyList.map((item) => (
              <tr key={Object.values(item).join("-")}>
                <td>{item.type}</td>
                <td>{item.listenAddress}</td>
                <td>{item.listenPort}</td>
                <td>{item.connectAddress}</td>
                <td>{item.connectPort}</td>
                <td></td>
              </tr>
            ))}

            {Boolean(addingField) && (
              <tr>
                <td>
                  <select
                    className="select select-sm validator"
                    required
                    onChange={(e) => {
                      setAddingField((prev) => ({
                        ...prev,
                        type: { value: e.target.value as PortProxyConfig["type"] },
                      }));
                    }}
                  >
                    <option value="v4tov4">v4 to v4</option>
                    <option value="v6tov6">v6 to v6</option>
                    <option value="v4tov6">v4 to v6</option>
                    <option value="v6tov4">v6 to v4</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    pattern="^((\d{1,3}\.){3}\d{1,3}|\*)$"
                    className="input input-sm validator"
                    onChange={(e) => {
                      setAddingField((prev) => ({ ...prev, listenAddress: { value: e.target.value } }));
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input input-sm"
                    min="0"
                    max="65535"
                    onChange={(e) => {
                      setAddingField((prev) => ({ ...prev, listenPort: { value: Number(e.target.value) } }));
                    }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input input-sm validator"
                    pattern="^(\d{1,3}\.){3}\d{1,3}$"
                    onChange={(e) => {
                      setAddingField((prev) => ({ ...prev, connectAddress: { value: e.target.value } }));
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input input-sm"
                    min="0"
                    max="65535"
                    placeholder={String(addingField?.listenPort?.value || "")}
                    onChange={(e) => {
                      setAddingField((prev) => ({ ...prev, connectPort: { value: Number(e.target.value) } }));
                    }}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    disabled={!addingField || !isValid}
                    onClick={(e) => {
                      console.log("Address to clicked", e);

                      if (!addingField) {
                        return;
                      }

                      type Pairs = {
                        [key in keyof PortProxyConfig]: PortProxyConfig[key];
                      }

                      const pairs = Object.entries(addingField).reduce((acc, [key, value]) => {
                        acc[key as keyof PortProxyConfig] = value.value;
                        return acc;
                      }, {} as Pairs)

                      const { type, listenPort: portFrom, connectAddress: addressTo, ...others } = pairs;
                      addPortProxy(type, portFrom, addressTo, others)
                    }}
                  >
                    追加
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => { setAddingField(null); }}
                  >
                    <CloseIcon fontSize="small" />
                    キャンセル
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        className="btn"
        disabled={Boolean(addingField)}
        onClick={() => { setAddingField(defaultAddPortProxyState); }}
      >
        <AddIcon />
        追加
      </button>
    </div>
  );
}

export default App;
