// socket/socketEvents.ts
export const SOCKET_EVENTS = {
     // Connection
     CONNECTION: 'connection',
     DISCONNECT: 'disconnect',

     // Authentication
     AUTHENTICATE: 'authenticate',
     AUTHENTICATED: 'authenticated',
     AUTHENTICATION_ERROR: 'authentication_error',

     // Online Status
     USER_ONLINE: 'user_online',
     USER_OFFLINE: 'user_offline',
     HEARTBEAT: 'heartbeat',

     // Status Queries
     GET_ONLINE_USERS: 'get_online_users',
     ONLINE_USERS_LIST: 'online_users_list',
     GET_USERS_STATUS: 'get_users_status',
     USERS_STATUS: 'users_status',

     // Typing Indicators
     TYPING_START: 'typing_start',
     TYPING_STOP: 'typing_stop',
     USER_TYPING: 'user_typing',
     USER_STOPPED_TYPING: 'user_stopped_typing',

     // Custom Status
     SET_CUSTOM_STATUS: 'set_custom_status',
     USER_STATUS_CHANGED: 'user_status_changed',

     // Error Handling
     ERROR: 'error',
};
