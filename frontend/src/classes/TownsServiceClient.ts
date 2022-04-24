import axios, { AxiosInstance, AxiosResponse } from 'axios';
import assert from 'assert';
import Player, { ServerPlayer } from './Player';
import { ServerConversationArea } from './ConversationArea';
import { GameType, GameAction, GameState } from './GameTypes';

/**
 * The format of a request to join a Town in Covey.Town, as dispatched by the server middleware
 */
export interface TownJoinRequest {
  /** userName of the player that would like to join * */
  userName: string;
  /** ID of the town that the player would like to join * */
  coveyTownID: string;
}

/**
 * The format of a response to join a Town in Covey.Town, as returned by the handler to the server
 * middleware
 */
export interface TownJoinResponse {
  /** Unique ID that represents this player * */
  coveyUserID: string;
  /** Secret token that this player should use to authenticate
   * in future requests to this service * */
  coveySessionToken: string;
  /** Secret token that this player should use to authenticate
   * in future requests to the video service * */
  providerVideoToken: string;
  /** List of players currently in this town * */
  currentPlayers: ServerPlayer[];
  /** Friendly name of this town * */
  friendlyName: string;
  /** Is this a private town? * */
  isPubliclyListed: boolean;
  /** Names and occupants of any existing ConversationAreas */
  conversationAreas: ServerConversationArea[];
}

/**
 * Payload sent by client to create a Town in Covey.Town
 */
export interface TownCreateRequest {
  friendlyName: string;
  isPubliclyListed: boolean;
}

/**
 * Response from the server for a Town create request
 */
export interface TownCreateResponse {
  coveyTownID: string;
  coveyTownPassword: string;
}

/**
 * Response from the server for a Town list request
 */
export interface TownListResponse {
  towns: CoveyTownInfo[];
}

/**
 * Payload sent by the client to delete a Town
 */
export interface TownDeleteRequest {
  coveyTownID: string;
  coveyTownPassword: string;
}

/**
 * Payload sent by the client to update a Town.
 * N.B., JavaScript is terrible, so:
 * if(!isPubliclyListed) -> evaluates to true if the value is false OR undefined, use ===
 */
export interface TownUpdateRequest {
  coveyTownID: string;
  coveyTownPassword: string;
  friendlyName?: string;
  isPubliclyListed?: boolean;
}

export interface ConversationCreateRequest {
  coveyTownID: string;
  sessionToken: string;
  conversationArea: ServerConversationArea;
}

 /**
 * The format for a request to remove a player from the game
 */
 export interface GameLeaveTeamRequest {
  coveyTownID: string;
  sessionToken: string;
  playerID: string;
  conversationAreaLabel: string;
}

/**
 * The format for a request to update a game
 */
 export interface GetGameStateRequest {
  coveyTownID: string;
  sessionToken: string;
  conversationAreaLabel: string;
}


/**
 * The format for a request to create a game
 */
 export interface CreateGameRequest {
  coveyTownID: string;
  sessionToken: string;
  conversationAreaLabel: string;
  gameID: GameType;
}

/**
 * The format for a request to update a game
 */
 export interface UpdateGameRequest {
  coveyTownID: string;
  sessionToken: string;
  conversationAreaLabel: string;
  gameAction: GameAction;
}

/**
 * The format for a request to update a game
 */
 export interface GameJoinTeamRequest {
  coveyTownID: string;
  sessionToken: string;
  // coveyUserID: string;
  playerID: string;
  teamNumber: number;
  conversationAreaLabel: string;
}

/**
 * The format for a request to start a game
 */
 export interface StartGameRequest {
  coveyTownID: string;
  sessionToken: string;
  conversationAreaLabel: string;
}

/**
 * Payload sent by the client to create a new conversation area
 */
 export interface ConversationAreaCreateRequest {
  coveyTownID: string;
  sessionToken: string;
  conversationArea: ServerConversationArea;
}

export interface GameStateResponse {
  state: GameState;
}

/**
 * Envelope that wraps any response from the server
 */
export interface ResponseEnvelope<T> {
  isOK: boolean;
  message?: string;
  response?: T;
}

export type CoveyTownInfo = {
  friendlyName: string;
  coveyTownID: string;
  currentOccupancy: number;
  maximumOccupancy: number
};

export default class TownsServiceClient {
  private _axios: AxiosInstance;

  /**
   * Construct a new Towns Service API client. Specify a serviceURL for testing, or otherwise
   * defaults to the URL at the environmental variable REACT_APP_ROOMS_SERVICE_URL
   * @param serviceURL
   */
  constructor(serviceURL?: string) {
    const baseURL = serviceURL || process.env.REACT_APP_TOWNS_SERVICE_URL;
    assert(baseURL);
    this._axios = axios.create({ baseURL });
  }

  static unwrapOrThrowError<T>(response: AxiosResponse<ResponseEnvelope<T>>, ignoreResponse = false): T {
    if (response.data.isOK) {
      if (ignoreResponse) {
        return {} as T;
      }
      assert(response.data.response);
      return response.data.response;
    }
    throw new Error(`Error processing request: ${response.data.message}`);
  }

  async createTown(requestData: TownCreateRequest): Promise<TownCreateResponse> {
    const responseWrapper = await this._axios.post<ResponseEnvelope<TownCreateResponse>>('/towns', requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async updateTown(requestData: TownUpdateRequest): Promise<void> {
    const responseWrapper = await this._axios.patch<ResponseEnvelope<void>>(`/towns/${requestData.coveyTownID}`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper, true);
  }

  async deleteTown(requestData: TownDeleteRequest): Promise<void> {
    const responseWrapper = await this._axios.delete<ResponseEnvelope<void>>(`/towns/${requestData.coveyTownID}/${requestData.coveyTownPassword}`);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper, true);
  }

  async listTowns(): Promise<TownListResponse> {
    const responseWrapper = await this._axios.get<ResponseEnvelope<TownListResponse>>('/towns');
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async joinTown(requestData: TownJoinRequest): Promise<TownJoinResponse> {
    const responseWrapper = await this._axios.post('/sessions', requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }
  
  async createGame(requestData: CreateGameRequest) : Promise<void>{
    const responseWrapper = await this._axios.post(`/towns/${requestData.coveyTownID}/games`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async createConversation(requestData: ConversationAreaCreateRequest) : Promise<void>{
    const responseWrapper = await this._axios.post(`/towns/${requestData.coveyTownID}/conversationAreas`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async addPlayerToGameTeam(requestData: GameJoinTeamRequest) : Promise<void>{
    const responseWrapper = await this._axios.post(`/towns/${requestData.coveyTownID}/joingameteam`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async removePlayerFromGameTeam(requestData: GameLeaveTeamRequest) : Promise<void>{
    const responseWrapper = await this._axios.post(`/towns/${requestData.coveyTownID}/removeplayerfromteam`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async getGameState(requestData: GetGameStateRequest) : Promise<GameStateResponse>{
    const responseWrapper = await this._axios.post(`/towns/${requestData.coveyTownID}/gamestate`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  
  async startGame(requestData: StartGameRequest) : Promise<void>{
    const responseWrapper = await this._axios.post(`/towns/${requestData.coveyTownID}/startGame`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async inputGameAction(requestData: UpdateGameRequest) : Promise<void>{
    const responseWrapper = await this._axios.post(`/towns/${requestData.coveyTownID}/updategame`, requestData);
    return TownsServiceClient.unwrapOrThrowError(responseWrapper);
  }
}
