export interface PackageDescriptor {
  Id: number;
  Logo: string;
  Name: string;
  Type: string;
}

export interface FlapiRunResponse {
  results: Record<string, unknown[]>;
}

export interface PackageContext {
  packageId: string;
  packageName: string;
  cubeData: Record<string, unknown[]>;
}
