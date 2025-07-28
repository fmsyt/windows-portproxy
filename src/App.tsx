import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Suspense,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./App.css";
import { getElevatedState } from "./ipc";
import {
  addPortProxy,
  deletePortProxy,
  getPortProxyList,
} from "./netsh/portproxy";
import type { PortProxyConfig } from "./netsh/types";

type AddPortProxyState = {
  [key in keyof PortProxyConfig]?: {
    value: PortProxyConfig[key];
    invalidMessage?: string | null;
  };
};

const defaultAddPortProxyState: AddPortProxyState = {
  type: { value: "v4tov4" },
};

function App() {
  const isElevatedPromise = useMemo(() => getElevatedState(), []);

  const reload = useCallback(async () => {
    const data = await getPortProxyList();
    setPortProxyList(data);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: 初回表示のみ実行する
  useLayoutEffect(() => {
    reload();
  }, []);

  const [portProxyList, setPortProxyList] = useState<PortProxyConfig[]>([]);

  const [addingField, setAddingField] = useState<AddPortProxyState | null>(
    null,
  );

  const [deleteDialogContent, setDeleteDialogContent] =
    useState<PortProxyConfig | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const handleOpenDeleteDialog = useCallback((config: PortProxyConfig) => {
    if (!deleteDialogRef.current) {
      return;
    }

    setDeleteDialogContent(config);
    deleteDialogRef.current.showModal();
  }, []);

  const handleDeleteConfig = useCallback(async () => {
    if (!deleteDialogContent || !deleteDialogRef.current) {
      return;
    }

    await deletePortProxy(
      deleteDialogContent.type,
      deleteDialogContent.listenPort,
      deleteDialogContent.listenAddress,
    );

    reload();
  }, [deleteDialogContent, reload]);

  const handleAddConfig = useCallback(
    async (addingField: AddPortProxyState | null) => {
      if (!addingField) {
        return;
      }

      type Pairs = {
        [key in keyof PortProxyConfig]: PortProxyConfig[key];
      };

      const pairs = Object.entries(addingField).reduce((acc, [key, field]) => {
        // @ts-ignore
        acc[key as keyof PortProxyConfig] = field.value;
        return acc;
      }, {} as Pairs);

      const {
        type,
        listenPort: portFrom,
        connectAddress: addressTo,
        ...others
      } = pairs;

      addPortProxy(type, portFrom, addressTo, others);
      reload();
    },
    [reload],
  );

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
    });

    return valid;
  }, [addingField]);

  return (
    <div className="flex flex-col gap-4">
      <Suspense>
        <Message promise={isElevatedPromise} />
      </Suspense>

      <div className="overflow-x-auto border border-base-content/5 bg-base-100 max-h-[100svh]">
        <table className="table table-pin-rows table-pin-cols">
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
                <th>
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      disabled={Boolean(addingField)}
                      onClick={async () => {
                        const { type, listenAddress, connectAddress } = item;

                        setAddingField({
                          type: { value: type },
                          listenAddress: { value: listenAddress },
                          connectAddress: { value: connectAddress },
                        });
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </button>

                    <button
                      type="button"
                      className="btn btn-error btn-xs"
                      disabled={Boolean(addingField)}
                      onClick={() => {
                        handleOpenDeleteDialog(item);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  </div>
                </th>
              </tr>
            ))}

            {Boolean(addingField) && (
              <tr>
                <td>
                  <select
                    className="select select-sm validator"
                    required
                    defaultValue={addingField?.type?.value || "v4tov4"}
                    onChange={(e) => {
                      setAddingField((prev) => ({
                        ...prev,
                        type: {
                          value: e.target.value as PortProxyConfig["type"],
                        },
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
                    defaultValue={addingField?.listenAddress?.value || ""}
                    onChange={(e) => {
                      setAddingField((prev) => ({
                        ...prev,
                        listenAddress: { value: e.target.value },
                      }));
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    defaultValue={addingField?.listenPort?.value || ""}
                    className="input input-sm"
                    min="0"
                    max="65535"
                    onChange={(e) => {
                      setAddingField((prev) => ({
                        ...prev,
                        listenPort: { value: Number(e.target.value) },
                      }));
                    }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input input-sm validator"
                    defaultValue={addingField?.connectAddress?.value || ""}
                    pattern="^(\d{1,3}\.){3}\d{1,3}$"
                    onChange={(e) => {
                      setAddingField((prev) => ({
                        ...prev,
                        connectAddress: { value: e.target.value },
                      }));
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input input-sm"
                    defaultValue={addingField?.connectPort?.value || ""}
                    min="0"
                    max="65535"
                    placeholder={String(addingField?.listenPort?.value || "")}
                    onChange={(e) => {
                      setAddingField((prev) => ({
                        ...prev,
                        connectPort: { value: Number(e.target.value) },
                      }));
                    }}
                  />
                </td>
                <th>
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      disabled={!addingField || !isValid}
                      onClick={() => {
                        handleAddConfig(addingField);
                      }}
                    >
                      <CheckIcon fontSize="small" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        setAddingField(null);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </button>
                  </div>
                </th>
              </tr>
            )}

            <tr>
              <td colSpan={5} className="text-center"></td>

              <th>
                <button
                  type="button"
                  className="btn bbtn-primary btn-xs"
                  disabled={Boolean(addingField)}
                  onClick={() => {
                    setAddingField(defaultAddPortProxyState);
                  }}
                >
                  <AddIcon fontSize="small" />
                  追加
                </button>
              </th>
            </tr>
          </tbody>
        </table>
      </div>

      <dialog ref={deleteDialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            選択されたPortProxyを削除しますか？
          </h3>
          <p className="py-4">
            <table className="table">
              <tbody>
                <tr>
                  <th>Group</th>
                  <td>{deleteDialogContent?.type}</td>
                </tr>
                <tr>
                  <th>Address from</th>
                  <td>{deleteDialogContent?.listenAddress}</td>
                </tr>
                <tr>
                  <th>Port from</th>
                  <td>{deleteDialogContent?.listenPort}</td>
                </tr>
                <tr>
                  <th>Address to</th>
                  <td>{deleteDialogContent?.connectAddress}</td>
                </tr>
                <tr>
                  <th>Port to</th>
                  <td>{deleteDialogContent?.connectPort}</td>
                </tr>
              </tbody>
            </table>
          </p>

          <div className="modal-action">
            <form method="dialog">
              <button
                type="button"
                className="btn btn-error"
                disabled={!deleteDialogContent}
                onClick={async () => {
                  await handleDeleteConfig();

                  if (deleteDialogRef.current) {
                    deleteDialogRef.current.close();
                  }
                }}
              >
                削除
              </button>
              <button type="submit" className="btn">
                キャンセル
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
      </dialog>
    </div>
  );
}

type MessageProps = {
  promise: ReturnType<typeof getElevatedState>;
};

function Message({ promise }: MessageProps) {
  const elevated = use(promise);
  if (elevated) {
    return null;
  }

  return (
    <div className="alert alert-warning">
      管理者権限で実行されていません。
      <br />
    </div>
  );
}

export default App;
