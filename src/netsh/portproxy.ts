import { Command } from "@tauri-apps/plugin-shell";
import { createContext } from "react";
import type { PortProxyConfig } from "./types";

export async function getPortProxyList() {

  /**
   * 設定がないときの出力
   *
   * ```plain
   * \r\n
   * ```
   *
   * 設定があるときの出力
   *
   * ```plain
   * ipv4 をリッスンする:         ipv4 に接続する:
   *
   * Address         Port        Address         Port
   * --------------- ----------  --------------- ----------
   * *               50022       172.23.67.210   50022
   * *               8001        172.23.67.210   8001
   *
   * ipv6 をリッスンする:         ipv6 に接続する:
   * 
   * Address         Port        Address         Port
   * --------------- ----------  --------------- ----------
   * *               8001        192.168.10.100  8001
   *
   *
   * ```
   */
  const result = await Command.create("netsh-show").execute();
  if (result.code !== 0) {
    throw new Error(
      `Command failed with code ${result.code}: ${result.stdout}`,
    );
  }

  const output = result.stdout.trim();
  if (output === "") {
    return [];
  }

  const lines = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .filter((line) => !line.startsWith("Address"))
    .filter((line) => !line.startsWith("-"));

  const resultList: PortProxyConfig[] = (() => {

    const result: PortProxyConfig[] = [];

    let type: PortProxyConfig["type"] | null = null;

    lines.forEach((line) => {
      if (line === "") {
        return;
      }

      if (line.includes("ipv")) {
        const matches = line.match(/^.*ip(?<from>v\d).*ip(?<to>v\d).*$/);
        if (matches === null) {
          return;
        }

        const { from, to } = matches.groups!;
        type = [from, to].join("to") as PortProxyConfig["type"];

        return;
      }

      const parts = line.split(/\s+/);
      const [addressFrom, portFrom, addressTo, portTo] = parts;
      result.push({
        type: type!,
        listenAddress: addressFrom,
        connectAddress: addressTo,
        listenPort: parseInt(portFrom, 10),
        connectPort: parseInt(portTo, 10),
      });
    })

    return result;

  })();

  return resultList as PortProxyConfig[];
}

type AddPortProxyOptions = {
  connectPort?: number | null;
  listenPort?: number | null;
  listenAddress?: string | null;
}

export async function addPortProxy(
  group: PortProxyConfig["type"],
  listenPort: number,
  connectAddress: string,
  option: AddPortProxyOptions = {},
) {
  const { connectPort = null, listenAddress = null, } = option;

  const args = [
    "interface",
    "portproxy",
    "add",
    group,
    `listenport=${listenPort}`,
    `connectaddress=${connectAddress}`,
    ...(connectPort ? [`connectport=${connectPort}`] : []),
    ...(listenAddress ? [`listenaddress=${listenAddress}`] : []),
  ];


  const command = Command.create("netsh-add", args);
  const result = await command.execute();

  return result;
}

export async function deletePortProxy(
  group: PortProxyConfig["type"],
  listenPort: number,
  listenAddress?: string | null,
) {
  const args = [
    "interface",
    "portproxy",
    "delete",
    group,
    `listenport=${listenPort}`,
    ...(listenAddress ? [`listenaddress=${listenAddress}`] : []),
  ];

  const command = Command.create("netsh-delete", args);
  const result = await command.execute();

  return result;
}

export type PortProxyContextType = {
  getList: () => Promise<PortProxyConfig[]>;
};

const PortProxyContext = createContext<PortProxyContextType | null>(null);

export default PortProxyContext;
