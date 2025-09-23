export interface EventDto {
  type: 'StationEvent' | 'AgentStatus';
  topic: string;
  message: string;
  timestamp: Date;
}

export interface StationEventDto {
  stationId: string;
  event: string;
  extension: string;
  callId?: string;
  ani?: string;
  dnis?: string;
  timestamp: Date;
  rawData?: any;
}

export interface AgentStatusDto {
  agentId: string;
  status: string;
  extension?: string;
  previousStatus?: string;
  reason?: string;
  timestamp: Date;
  rawData?: any;
}