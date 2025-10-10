export interface ApiDataEncoded<T> {
  status    : 'success' | 'warning' | 'error' | 'info'; // "success", "error", etc.
  encoded   : true | false;
  decoded   : true | false;
  payload  : string;                            // String Tipo JWT
  time_exec : string;                           // Tiempo de ejecución (por ejemplo: "12ms")
  iat: number;
  exp: number;
}
