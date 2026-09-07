export interface WaitlistRequest {
  name: string;
  email: string;
}

export interface PocketBaseWaitlistRecord {
  id: string;
  name: string;
  email: string;
  subscribed_at: string;
  created: string;
  updated: string;
}

export interface PocketBaseResponse {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  email: string;
  subscribed_at: string;
  created: string;
  updated: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
