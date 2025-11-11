import { config } from '../config'
import { logger } from '../lib/logger'
import { Monitor } from './Monitor'
import { FungibleAssetIndexer } from './Indexer'

const indexers: Monitor[] = []

import * as fs from 'fs'

export async function runIndexers(balancesPath?: string): Promise<void> {
  const rpcUrl = config.RPC_URL
  const restUrl = config.REST_URL

  let balances: Record<string, string> | undefined
  if (balancesPath) {
    try {
      balances = JSON.parse(fs.readFileSync(balancesPath, 'utf-8'))
    } catch (e) {
      logger.error(`Failed to read balances from ${balancesPath}: ${e.message}`)
    }
  }

  for (const asset of config.FUNGIBLE_ASSETS) {
    const indexer = new FungibleAssetIndexer(
      rpcUrl,
      restUrl,
      asset.type,
      asset.denom,
      asset.start_height,
      balances ?? asset.balances
    )
    indexers.push(indexer)
  }

  try {
    for (const indexer of indexers) {
      await indexer.run()
    }
  } catch (err) {
    // stop all indexers on error
    logger.info(err)
    stopIndexers()
  }
}

export function stopIndexers(): void {
  for (const indexer of indexers) {
    indexer.stop()
  }
  indexers.length = 0
}
