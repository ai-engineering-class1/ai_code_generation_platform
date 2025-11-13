import { MiddlewareFn } from "type-graphql";
import { format } from "date-fns";

export const ResolveTime: MiddlewareFn = async ({ info }, next) => {
  const start = Date.now();
  const time = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  console.log(`${info.fieldName}:${time}`);
  await next();
  const resolveTime = Date.now() - start;
  console.log(`${info.parentType.name}.${info.fieldName} [${resolveTime} ms]`);
};
