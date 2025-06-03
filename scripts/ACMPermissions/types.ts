// types.ts

export interface Event {
  contractAddress: string;
  functionSignature: string;
  account: string;
  type: PermissionsEnum;
}

export interface MissingRoleMap {
  [role: string]: {
    transactions: string[];
  };
}

export interface Permission {
  contractAddress: string;
  functionSignature: string;
  addresses: string[];
  role?: string;
}

export enum PermissionsEnum {
  Granted = "Granted",
  Revoked = "Revoked",
}

export interface Role {
  contractAddress: string;
  functionSignature: string;
}

export interface Snapshot {
  permissions: Permission[];
  height: number;
}
