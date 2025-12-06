import { createConnection, Connection, ConnectionOptions } from "typeorm";

import * as models from "@/models";

// Support both MySQL and PostgreSQL
// Set DB_TYPE=postgres in .env to use PostgreSQL, otherwise defaults to MySQL
const dbType = (process.env.DB_TYPE || "mysql").toLowerCase();

const commonConfig: ConnectionOptions = {
  type: dbType === "postgres" ? "postgres" : "mysql",
  entities: Object.values(models),
  synchronize: true,
  logging: false, // Disable SQL logging to reduce noise
  ...(dbType === "mysql" ? {
    extra: {
      charset: "utf8mb4_general_ci",
    },
  } : {}),
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
  let connectionOptions: ConnectionOptions;
  
  if (process.env.NODE_ENV === "production") {
    connectionOptions = {
      url: process.env.DATABASE_URL,
      ...commonConfig,
      extra: {
        max: 5,
      },
    } as ConnectionOptions;
  } else {
    // For PostgreSQL, use host/port format instead of URL
    if (dbType === "postgres") {
      // Use 127.0.0.1 instead of localhost to force IPv4
      const dbHost = process.env.DB_HOST === "localhost" ? "127.0.0.1" : process.env.DB_HOST;
      const dbPort = Number(process.env.DB_PORT);
      const dbUser = process.env.DB_USERNAME;
      const dbPassword = process.env.DB_PASSWORD;
      const dbName = process.env.DB_DATABASE;
      
      console.log(`Connecting to PostgreSQL database: ${dbHost}:${dbPort}/${dbName}`);
      
      // Use connection URL format - TypeORM 0.2.45 handles this better with older PostgreSQL
      // The sslmode=disable parameter ensures SSL is disabled for local connections
      const connectionUrl = `postgres://${dbUser}:${encodeURIComponent(dbPassword || '')}@${dbHost}:${dbPort}/${dbName}?sslmode=disable`;
      
      connectionOptions = {
        url: connectionUrl,
        ...commonConfig,
        extra: {
          // PostgreSQL connection pool options
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 30000, // Increased to 30 seconds
        },
      } as ConnectionOptions;
    } else {
      // MySQL connection
      console.log(`Connecting to MySQL database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`);
      connectionOptions = {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        driver: require('mysql2'),
        ...commonConfig,
      } as ConnectionOptions;
    }
  }
  
  return createConnection(connectionOptions);
};

export default createDatabaseConnection;
