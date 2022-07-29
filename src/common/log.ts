// eslint-disable-next-line @typescript-eslint/no-empty-function
const envLog = process.env.NODE_ENV === 'development' ? console.log : () => {};

export const envLogNow =
    process.env.NODE_ENV === 'development'
        ? (info: string) => {
              console.log(performance.now() + info);
          }
        : // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {};

export default envLog;
