import { LSPArray, LSPObject, integer } from "./common";

export interface Message {
  jsonrpc: string;
}

export interface RequestMessage extends Message {
  /**
   * The request id.
   */
  id: integer | string;

  /**
   * The method to be invoked.
   */
  method: string;

  /**
   * The method's params.
   */
  params?: LSPArray | LSPObject;
}

export interface ResponseMessage extends Message {
  /**
   * The request id.
   */
  id: integer | string | null;

  /**
   * The result of a request. This member is REQUIRED on success.
   * This member MUST NOT exist if there was an error invoking the method.
   */
  result?: string | number | boolean | LSPArray | LSPObject | null;

  /**
   * The error object in case a request fails.
   */
  error?: ResponseError;
}

export interface ResponseError {
  /**
   * A number indicating the error type that occurred.
   */
  code: integer;

  /**
   * A string providing a short description of the error.
   */
  message: string;

  /**
   * A primitive or structured value that contains additional
   * information about the error. Can be omitted.
   */
  data?: string | number | boolean | LSPArray | object | null;
}

export interface NotificationMessage<T> extends Message {
  /**
   * The method to be invoked.
   */
  method: string;

  /**
   * The notification's params.
   */
  params?: Array<T> | object;
}
