import { createConnection, Connection, ConnectionOptions } from "typeorm";

import * as models from "@/models";

const commonConfig: ConnectionOptions = {
  type: "mysql",
  entities: Object.values(models),
  synchronize: true,
  extra: {
    charset: "utf8mb4_general_ci",
  },
};

// const connectionOptions: ConnectionOptions =
//   process.env.NODE_ENV === "production"
//     ? {
//         url: process.env.DATABASE_URL,
//         ...commonConfig,
//         extra: {
//           max: 5,
//         },
//       }
//     : {
//         host: process.env.DB_HOST,
//         port: Number(process.env.DB_PORT),
//         username: process.env.DB_USERNAME,
//         password: process.env.DB_PASSWORD,
//         database: process.env.DB_DATABASE,
//         ...commonConfig,
//       };

// const createDatabaseConnection = (): Promise<Connection> =>
//   createConnection(connectionOptions);

const createDatabaseConnection = (): Promise<Connection> => {
  return createConnection({
    ...(process.env.NODE_ENV === "production"
      ? {
          url: process.env.DATABASE_URL,
          ...commonConfig,
          extra: {
            max: 5,
          },
        }
      : {
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          driver:require('mysql2'),
          ...commonConfig,
        }),
    // cache: {
    //   type: "ioredis",
    //   options: process.env.REDIS_URL,
    //   duration: 1000,
    // },
  });
};

export default createDatabaseConnection;
