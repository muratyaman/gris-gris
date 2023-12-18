import http2 from 'node:http2';

export const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE,
} = http2.constants;


export const HEADER_KEY_MSG_ID   = 'x-msg-id'; // reference given by client side
export const HEADER_KEY_MSG_KIND = 'x-msg-kind';

export const HEADER_VAL_APP_JSON    = 'application/json; charset=utf-8';
export const HEADER_VAL_APP_MSGPACK = 'application/msgpack';

export const HTTP2_STATUS_OK  = { [HTTP2_HEADER_STATUS]: 200 };
export const HTTP2_STATUS_ERR = { [HTTP2_HEADER_STATUS]: 400 };

export const HTTP2_CONTENT_JSON    = { [HTTP2_HEADER_CONTENT_TYPE]: HEADER_VAL_APP_JSON };
export const HTTP2_CONTENT_MSGPACK = { [HTTP2_HEADER_CONTENT_TYPE]: HEADER_VAL_APP_MSGPACK };

export const HTTP2_JSON_OK = {
  ...HTTP2_STATUS_OK,
  ...HTTP2_CONTENT_JSON,
};

export const HTTP2_MSGPACK_OK = {
  ...HTTP2_STATUS_OK,
  ...HTTP2_CONTENT_JSON,
};

export const HTTP2_JSON_ERROR = {
  ...HTTP2_STATUS_ERR,
  ...HTTP2_CONTENT_JSON,
};

export const HTTP2_MSGPACK_ERROR = {
  ...HTTP2_STATUS_ERR,
  ...HTTP2_CONTENT_JSON,
};
