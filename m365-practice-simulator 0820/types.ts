
export interface Customer {
  name: string;
  email: string;
  location: string;
}

export interface ScenarioPath {
  customer: string;
}

export interface Scenario {
  id: string;
  title: string;
  product: string;
  customer: Customer;
  summaryHint: string;
  openingTemplates: string[];
  path: ScenarioPath[];
}

export type Role = 'agent' | 'customer' | 'system';

export interface TranscriptLine {
  role: Role;
  text: string;
  ts: string;
}

export interface Notes {
  summary: string;
}
