export type PortProxyConfig = {
  type: "v4tov4" | "v4tov6" | "v6tov4" | "v6tov6";
  addressFrom: string;
  addressTo: string;
  portFrom: number;
  portTo: number;
};
