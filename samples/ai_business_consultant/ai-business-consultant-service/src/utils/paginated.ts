import { ClassType, Field, Int, ObjectType } from 'type-graphql';

export function PaginatedResponse<TItem extends ClassType>(TItemClass: TItem) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedResponseClass {
    @Field(() => [TItemClass])
    result: TItem[];

    @Field(() => Int)
    total: number;
  }

  return PaginatedResponseClass;
}
