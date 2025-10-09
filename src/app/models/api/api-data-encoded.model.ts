export interface ApiDataEncoded<T> {
  payload  : string;                            // String Tipo JWT
  time_exec : string;                           // Tiempo de ejecución (por ejemplo: "12ms")
  iat: number;
  exp: number;
}
