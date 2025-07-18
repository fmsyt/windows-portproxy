export type PortProxyConfig = {
  type: "v4tov4" | "v4tov6" | "v6tov4" | "v6tov6";
  listenAddress: string;
  connectAddress: string;
  listenPort: number;
  connectPort: number;
};
