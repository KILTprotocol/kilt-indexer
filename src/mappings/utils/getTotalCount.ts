import { Entity, FieldsExpression } from "@subql/types-core";

export async function countEntitiesByField<T extends Entity>(
  entity: string,
  filters: FieldsExpression<T>[]
): Promise<number> {
  // Initialize variables
  let count = 0;
  let offset = 0;
  const limit = 100;
  // "By default ordering is done by id in ascending order."

  while (true) {
    // Retrieve a batch of entities
    const entities = await store.getByFields(
      entity,
      filters,
      { limit, offset } // Pagination options
    );

    // Increment the count by the number of retrieved entities
    count += entities.length;

    // If fewer entities than the limit were retrieved, we've reached the end
    if (entities.length < limit) {
      break;
    }

    // Increment the offset for the next batch
    offset += limit;
  }

  return count;
}
