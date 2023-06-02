type BiResponseType<T> = {
  code: number;
  msg: string;
  message: string;
  data: T;
};
