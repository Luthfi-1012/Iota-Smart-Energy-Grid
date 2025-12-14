/**
 * Network Configuration
 * 
 * Configure your IOTA networks and package IDs here
 */

import { getFullnodeUrl } from "@iota/iota-sdk/client"
import { createNetworkConfig } from "@iota/dapp-kit"

// Package IDs
export const DEVNET_PACKAGE_ID = "0x60cc7119c2418cd870138e9df1acd0f36bafd760a524b532575cdef1911d23cb"
export const TESTNET_PACKAGE_ID = "0x9187c7614b1f37c7dd40bda30af567a50eaac7f138b4988eb753c84748323552"
export const MAINNET_PACKAGE_ID = ""
// Shared marketplace object ID (set after contract publish if applicable)
export const MARKETPLACE_ID = "0x18414ea5cac3a3faef9b435d0f23a7a613374ab92b2e70c2063f75596a288e8d"

// Network configuration
const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      packageId: DEVNET_PACKAGE_ID,
    },
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      packageId: TESTNET_PACKAGE_ID,
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      packageId: MAINNET_PACKAGE_ID,
    },
  },
})

export { useNetworkVariable, useNetworkVariables, networkConfig }
