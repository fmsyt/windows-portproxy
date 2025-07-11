import { Command } from "@tauri-apps/plugin-shell";
import { createContext } from "react";
import type { PortProxyConfig } from "./types";

export async function getPortProxyList() {
  const command = "netsh";
  const args = ["interface", "portproxy", "show", "all"];

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
   * ```
   */
  const result = await Command.create(command, args).execute();
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
    .filter((line) => line !== "");

  // 3行目以降がデータ
  const dataLines = lines.slice(3);
  const resultList = dataLines.map((line) => {
    const parts = line.split(/\s+/);
    const [addressFrom, portFrom, addressTo, portTo] = parts;

    return {
      addressFrom,
      addressTo,
      portFrom: parseInt(portFrom, 10),
      portTo: parseInt(portTo, 10),
    } as PortProxyConfig;
  });

  return resultList as PortProxyConfig[];

  // TODO: parse rows to PortProxyConfig[]
}

export type PortProxyContextType = {
  getList: () => Promise<PortProxyConfig[]>;
};

const PortProxyContext = createContext<PortProxyContextType | null>(null);

export default PortProxyContext;
