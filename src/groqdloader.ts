import type {
  Loader,
  LoaderContext,
} from 'astro/loaders';
import {
  type BaseQuery,
  makeSafeQueryRunner,
} from 'groqd';

import type { SanityClient } from '@sanity/client';

/**
 *
 *
 * @export
 * @param {{
 *   query: BaseQuery<any>,
 *   reducer?: (data: any[])=>any[],
 *   sanityClient: SanityClient
 * }} options
 * @return {*}  {Loader}
 */
export default function GROQDLoader(options: {
  query: BaseQuery<any>
  reducer?: (data: any[]) => any[]
  sanityClient: SanityClient
}): Loader {
  const { query, reducer = (data: any[]) => data, sanityClient } = options
  return {
    name: "GROQD-loader",
    load: async ({ store, parseData, generateDigest }: LoaderContext) => {
      const runQuery = makeSafeQueryRunner(
        (query: string, params: Record<string, number | string> = {}) =>
          sanityClient.fetch(query, params)
      )

      const response = await runQuery(query)
      const result = reducer(response)
      for (const item of result) {
        const data = await parseData({
          id: item.id,
          data: item,
        })
        const digest = generateDigest(data)
        store.set({
          id: data.id,
          data: data,
          digest,
        })
      }
    },
    schema: async () => await query.schema._output,
  }
}
