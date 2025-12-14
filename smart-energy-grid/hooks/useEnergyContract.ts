"use client"

import { useState, useCallback } from "react"
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import type { IotaObjectData, IotaObjectResponse } from "@iota/iota-sdk/client"
import { DEVNET_PACKAGE_ID, TESTNET_PACKAGE_ID, MARKETPLACE_ID } from "@/lib/config"

export const MARKETPLACE_MODULE = "marketplace"
export const MARKETPLACE_METHODS = {
  CREATE_PROFILE: "create_profile",
  CREATE_LISTING: "create_listing",
  BUY_ENERGY: "buy_energy",
  CANCEL_LISTING: "cancel_listing",
  UPDATE_PRICE: "update_price",
} as const

export const ENERGY_TYPES = {
  SOLAR: 0,
  WIND: 1,
  HYDRO: 2,
  GRID: 3,
} as const

export enum EnergyType {
  SOLAR = 0,
  WIND = 1,
  HYDRO = 2,
  GRID = 3,
}

export const EnergyTypeLabels: Record<EnergyType, string> = {
  [EnergyType.SOLAR]: "Solar",
  [EnergyType.WIND]: "Wind",
  [EnergyType.HYDRO]: "Hydro",
  [EnergyType.GRID]: "Grid",
}
export interface EnergyListing {
  id: string
  seller: string
  energy_amount: string
  price_per_kwh: string
  energy_type: number
  location: string
  timestamp: string
  is_active: boolean
  created_at_ms?: number
}

export interface EnergyTransaction {
  id: string
  listing_id: string
  buyer: string
  seller: string
  energy_amount: string
  total_price: string
  energy_type: number
  timestamp: string
}
export interface EnergyPurchaseEvent {
  listing_id: string
  buyer: string
  seller: string
  energy_amount: string
  total_price: string
  timestampMs: number
}

export interface UserProfile {
  owner: string
  total_sold: string
  total_bought: string
  total_earned: string
  total_spent: string
}

function getOwnerAddress(data: IotaObjectData) {
  const ownerValue = data.owner
  const hasAddressOwner =
    ownerValue && typeof ownerValue === "object" && "AddressOwner" in ownerValue
  const address = hasAddressOwner
    ? String((ownerValue as { AddressOwner: string }).AddressOwner)
    : ""
  return address
}

export function parseListingData(data: IotaObjectData, id?: string): EnergyListing | null {
  if (data.content?.dataType !== "moveObject") return null
  const fields = data.content.fields as Record<string, unknown>
  if (!fields) return null
  const rawLocation = (fields as { location?: unknown }).location as unknown
  let locationStr = ""
  if (typeof rawLocation === "string") {
    locationStr = rawLocation
  } else if (Array.isArray(rawLocation)) {
    try {
      locationStr = new TextDecoder().decode(Uint8Array.from(rawLocation as number[]))
    } catch {
      locationStr = String(rawLocation)
    }
  } else if (rawLocation != null) {
    locationStr = String(rawLocation)
  }
  return {
    id: String(id ?? ""),
    seller: getOwnerAddress(data),
    energy_amount: String((fields as { energy_amount?: unknown }).energy_amount ?? "0"),
    price_per_kwh: String((fields as { price_per_kwh?: unknown }).price_per_kwh ?? "0"),
    energy_type: Number((fields as { energy_type?: unknown }).energy_type ?? 0),
    location: locationStr,
    timestamp: String((fields as { timestamp?: unknown }).timestamp ?? ""),
    is_active: Boolean((fields as { is_active?: unknown }).is_active ?? false),
  }
}

export function parseTransactionData(data: IotaObjectData, id?: string): EnergyTransaction | null {
  if (data.content?.dataType !== "moveObject") return null
  const fields = data.content.fields as Record<string, unknown>
  if (!fields) return null
  return {
    id: String(id ?? ""),
    listing_id: String((fields as { listing_id?: unknown }).listing_id ?? ""),
    buyer: String((fields as { buyer?: unknown }).buyer ?? ""),
    seller: String((fields as { seller?: unknown }).seller ?? ""),
    energy_amount: String((fields as { energy_amount?: unknown }).energy_amount ?? "0"),
    total_price: String((fields as { total_price?: unknown }).total_price ?? "0"),
    energy_type: Number((fields as { energy_type?: unknown }).energy_type ?? 0),
    timestamp: String((fields as { timestamp?: unknown }).timestamp ?? ""),
  }
}

export interface ContractState {
  isLoading: boolean
  error: Error | null
  txHash: string | undefined
  status: "idle" | "pending" | "submitted" | "confirmed" | "failed"
  statusMessage: string
}

export interface EnergyActions {
  createProfile: () => Promise<void>
  createListing: (
    energyAmountWh: number,
    pricePerKwh: number,
    energyType: EnergyType,
    location: string
  ) => Promise<void>
  buyEnergy: (listingId: string, profileId: string, paymentAmount: number) => Promise<void>
  cancelListing: (listingId: string) => Promise<void>
  updatePrice: (listingId: string, newPrice: number) => Promise<void>
}

export const useEnergyContract = (network: "testnet" | "devnet" = "testnet") => {
  const packageId = network === "devnet" ? DEVNET_PACKAGE_ID : TESTNET_PACKAGE_ID
  const iotaClient = useIotaClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const currentAccount = useCurrentAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [transactionError, setTransactionError] = useState<Error | null>(null)
  const [status, setStatus] = useState<"idle" | "pending" | "submitted" | "confirmed" | "failed">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const runTx = useCallback(async (build: (tx: Transaction) => void) => {
    try {
      setIsLoading(true)
      setTransactionError(null)
      setHash(undefined)
      setStatus("pending")
      setStatusMessage("Waiting for wallet confirmation...")
      const tx = new Transaction()
      build(tx)
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            setStatus("submitted")
            setStatusMessage("Transaction submitted, waiting for confirmation...")
            try {
              await iotaClient.waitForTransaction({ digest, options: { showEffects: true } })
              setStatus("confirmed")
              setStatusMessage("Success! Transaction confirmed.")
            } catch {
              setStatus("failed")
              setStatusMessage("Transaction failed during confirmation.")
            } finally {
              setIsLoading(false)
            }
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            const friendly = parseContractError(error.message)
            setTransactionError(new Error(friendly))
            setStatus("failed")
            setStatusMessage(friendly)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      const friendly = parseContractError(String(err))
      setTransactionError(new Error(friendly))
      setStatus("failed")
      setStatusMessage(friendly)
      setIsLoading(false)
    }
  }, [iotaClient, signAndExecute])

  const createProfile = useCallback(async () => {
    if (isLoading || status === "pending" || status === "submitted") return
    await runTx((tx) => {
      tx.moveCall({
        arguments: [],
        target: `${packageId}::${MARKETPLACE_MODULE}::${MARKETPLACE_METHODS.CREATE_PROFILE}`,
      })
    })
  }, [runTx, packageId, isLoading, status])

  const createListing = async (
    energyAmountWh: number,
    pricePerKwh: number,
    energyType: EnergyType,
    location: string
  ) => {
    if (!MARKETPLACE_ID) {
      setTransactionError(new Error("MARKETPLACE_ID is not set. Please update lib/config.ts with the shared object ID."))
      return
    }
    await runTx((tx) => {
      tx.moveCall({
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.pure.u64(energyAmountWh),
          tx.pure.u64(pricePerKwh),
          tx.pure.u8(energyType),
          tx.pure.string(location),
        ],
        target: `${packageId}::${MARKETPLACE_MODULE}::${MARKETPLACE_METHODS.CREATE_LISTING}`,
      })
    })
  }

  const buyEnergy = async (listingId: string, profileId: string, paymentAmount: number) => {
    if (!MARKETPLACE_ID) {
      setTransactionError(new Error("MARKETPLACE_ID is not set. Please update lib/config.ts with the shared object ID."))
      return
    }
    await runTx((tx) => {
      // Split a Coin<IOTA> from the gas coin equal to paymentAmount
      // This returns a Coin<IOTA> object that can be passed to the Move function
      const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(paymentAmount)])
      tx.moveCall({
        arguments: [tx.object(MARKETPLACE_ID), tx.object(listingId), tx.object(profileId), paymentCoin],
        target: `${packageId}::${MARKETPLACE_MODULE}::${MARKETPLACE_METHODS.BUY_ENERGY}`,
      })
    })
  }

  const cancelListing = async (listingId: string) => {
    await runTx((tx) => {
      tx.moveCall({
        arguments: [tx.object(listingId)],
        target: `${packageId}::${MARKETPLACE_MODULE}::${MARKETPLACE_METHODS.CANCEL_LISTING}`,
      })
    })
  }

  const updatePrice = async (listingId: string, newPrice: number) => {
    await runTx((tx) => {
      tx.moveCall({
        arguments: [tx.object(listingId), tx.pure.u64(newPrice)],
        target: `${packageId}::${MARKETPLACE_MODULE}::${MARKETPLACE_METHODS.UPDATE_PRICE}`,
      })
    })
  }

  const state: ContractState = {
    isLoading,
    error: transactionError,
    txHash: hash,
    status,
    statusMessage,
  }

  const useUserProfile = () => {
    const address = currentAccount?.address
    return useIotaClientQuery(
      "getOwnedObjects",
      {
        owner: address!,
        filter: { StructType: `${packageId}::${MARKETPLACE_MODULE}::UserProfile` } as { StructType: string },
        options: { showContent: true },
      },
      {
        enabled: !!address,
      }
    )
  }
  const profileQuery = useUserProfile()
  const hasProfile = Array.isArray((profileQuery.data as unknown as { data?: IotaObjectResponse[] })?.data) &&
    (((profileQuery.data as unknown as { data?: IotaObjectResponse[] })?.data?.length || 0) > 0)
  const hasExistingProfile = (profileData: unknown): boolean => {
    const resp = profileData as { data?: IotaObjectResponse[] }
    return Array.isArray(resp?.data) && (resp.data?.length || 0) > 0
  }
  const getProfileId = (profileData: unknown): string | null => {
    const resp = profileData as { data?: IotaObjectResponse[] }
    const first = resp?.data?.[0]
    const id = (first?.data as unknown as { objectId?: string })?.objectId
    return id ?? null
  }

  const actions: EnergyActions = {
    createProfile,
    createListing,
    buyEnergy,
    cancelListing,
    updatePrice,
  }

  return { actions, state, useUserProfile, hasProfile, hasExistingProfile, getProfileId }
}

function parseContractError(error: string): string {
  if (error.includes("1001")) return "This listing is no longer active"
  if (error.includes("1002")) return "Invalid energy amount"
  if (error.includes("1003")) return "Invalid price"
  if (error.includes("2001")) return "You are not authorized"
  if (error.includes("2002")) return "Insufficient payment"
  if (error.includes("2003")) return "Invalid energy type"
  return "Transaction failed. Please try again."
}

export const useListing = (listingId: string | null) => {
  const { data, isPending, error, refetch } = useIotaClientQuery(
    "getObject",
    {
      id: listingId!,
      options: { showContent: true, showOwner: true },
    },
    {
      enabled: !!listingId,
    }
  )
  const resp = data as unknown as { data?: (IotaObjectData & { objectId?: string }) }
  const listing =
    resp?.data && (parseListingData(resp.data as IotaObjectData, resp.data.objectId) as EnergyListing | null)
  return { data: listing, isPending, error, refetch }
}

export const useUserListings = (network: "testnet" | "devnet" = "testnet") => {
  const packageId = network === "devnet" ? DEVNET_PACKAGE_ID : TESTNET_PACKAGE_ID
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const eventsResp = useIotaClientQuery(
    "queryEvents",
    {
      query: { MoveEventType: `${packageId}::${MARKETPLACE_MODULE}::ListingCreated` } as { MoveEventType: string },
      limit: 200,
      order: "descending",
    },
    { enabled: true }
  )
  const { data, isPending, error, refetch } = useIotaClientQuery(
    "getOwnedObjects",
    {
      owner: address!,
      filter: { StructType: `${packageId}::${MARKETPLACE_MODULE}::EnergyListing` } as {
        StructType: string
      },
      options: { showContent: true, showOwner: true },
    },
    {
      enabled: !!address,
    }
  )
  const evRaw = eventsResp.data as unknown as {
    data?: Array<{ parsedJson?: Record<string, unknown>; timestampMs?: number }>
  }
  const tsMap = new Map<string, number>()
  for (const e of evRaw?.data || []) {
    const pj = e.parsedJson || {}
    let id =
      (pj as { listing_id?: unknown }).listing_id ??
      (pj as { listingId?: unknown }).listingId ??
      (pj as { id?: unknown }).id
    if (typeof id === "object" && id) {
      const obj = id as Record<string, unknown>
      id = (obj as any).id ?? (obj as any).objectId ?? (obj as any).ObjectID
    }
    const sid = id ? String(id) : ""
    if (!sid) continue
    const t = Number((e as { timestampMs?: number }).timestampMs ?? 0)
    if (t > 0) tsMap.set(sid, t)
  }
  const owned = data as unknown as { data?: IotaObjectResponse[] }
  const objects: IotaObjectResponse[] = owned?.data || []
  const listings: EnergyListing[] = []
  for (const o of objects) {
    const id = (o.data as unknown as { objectId?: string })?.objectId
    const parsed = parseListingData(o.data as IotaObjectData, id)
    if (parsed) {
      parsed.created_at_ms = id && tsMap.has(id) ? tsMap.get(id) : 0
      listings.push(parsed)
    }
  }
  return { data: listings, isPending, error, refetch }
}

export const useUserTransactions = (network: "testnet" | "devnet" = "testnet") => {
  const packageId = network === "devnet" ? DEVNET_PACKAGE_ID : TESTNET_PACKAGE_ID
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const { data, isPending, error, refetch } = useIotaClientQuery(
    "getOwnedObjects",
    {
      owner: address!,
      filter: { StructType: `${packageId}::${MARKETPLACE_MODULE}::EnergyTransaction` } as {
        StructType: string
      },
      options: { showContent: true, showOwner: true },
    },
    {
      enabled: !!address,
    }
  )
  const owned = data as unknown as { data?: IotaObjectResponse[] }
  const objects: IotaObjectResponse[] = owned?.data || []
  const txs: EnergyTransaction[] = []
  for (const o of objects) {
    const id = (o.data as unknown as { objectId?: string })?.objectId
    const parsed = parseTransactionData(o.data as IotaObjectData, id)
    if (parsed) txs.push(parsed)
  }
  return { data: txs, isPending, error, refetch }
}

export const usePurchaseEvents = (network: "testnet" | "devnet" = "testnet") => {
  const packageId = network === "devnet" ? DEVNET_PACKAGE_ID : TESTNET_PACKAGE_ID
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const resp = useIotaClientQuery(
    "queryEvents",
    {
      query: { MoveEventType: `${packageId}::${MARKETPLACE_MODULE}::EnergyPurchased` } as { MoveEventType: string },
      limit: 200,
      order: "descending",
    },
    { enabled: true }
  )
  const raw = resp.data as unknown as {
    data?: Array<{ parsedJson?: Record<string, unknown>; timestampMs?: number }>
  }
  const items: EnergyPurchaseEvent[] =
    raw?.data
      ?.map((e) => {
        const pj = e.parsedJson || {}
        const listingId =
          String(
            (pj as { listing_id?: unknown }).listing_id ??
              (pj as { listingId?: unknown }).listingId ??
              (pj as { id?: unknown }).id ??
              ""
          ) || ""
        const buyer = String((pj as { buyer?: unknown }).buyer ?? "")
        const seller = String((pj as { seller?: unknown }).seller ?? "")
        const energy_amount = String((pj as { energy_amount?: unknown }).energy_amount ?? "0")
        const total_price = String((pj as { total_price?: unknown }).total_price ?? "0")
        const timestampMs = Number((e as { timestampMs?: number }).timestampMs ?? 0)
        return {
          listing_id: listingId,
          buyer,
          seller,
          energy_amount,
          total_price,
          timestampMs,
        }
      })
      .filter((ev) => !!ev) || []
  const mine = items.filter((ev) => !address || ev.buyer === address || ev.seller === address)
  return { data: mine, isPending: resp.isPending, error: resp.error, refetch: resp.refetch }
}

export const useAllListings = (network: "testnet" | "devnet" = "testnet") => {
  const packageId = network === "devnet" ? DEVNET_PACKAGE_ID : TESTNET_PACKAGE_ID
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const eventsByTypeResp = useIotaClientQuery(
    "queryEvents",
    {
      query: { MoveEventType: `${packageId}::${MARKETPLACE_MODULE}::ListingCreated` } as { MoveEventType: string },
      limit: 200,
      order: "descending",
    },
    { enabled: true }
  )
  const eventsByModuleResp = useIotaClientQuery(
    "queryEvents",
    {
      query: { MoveEventModule: { package: packageId, module: MARKETPLACE_MODULE } } as {
        MoveEventModule: { package: string; module: string }
      },
      limit: 200,
      order: "descending",
    },
    { enabled: true }
  )
  const parseIdsFromEvents = (data: unknown): string[] => {
    const arr = (data as { data?: Array<{ parsedJson?: Record<string, unknown> }> })?.data || []
    const ids: string[] = []
    for (const e of arr) {
      const pj = e.parsedJson || {}
      let v =
        (pj as { listing_id?: unknown }).listing_id ??
        (pj as { listingId?: unknown }).listingId ??
        (pj as { id?: unknown }).id
      if (!v) continue
      // Handle nested object shapes like { id: "0x..." }
      if (typeof v === "object" && v !== null) {
        const obj = v as Record<string, unknown>
        if (typeof obj.id === "string") v = obj.id
        else if (typeof (obj as any).objectId === "string") v = (obj as any).objectId
        else if (typeof (obj as any).ObjectID === "string") v = (obj as any).ObjectID
      }
      const s = String(v)
      const cleaned = s.replace(/["']/g, "").trim()
      if (cleaned && /^0x[0-9a-fA-F]+$/.test(cleaned)) ids.push(cleaned)
    }
    return ids
  }
  const idsFromType = parseIdsFromEvents(eventsByTypeResp.data)
  const idsFromModule = parseIdsFromEvents(eventsByModuleResp.data)
  const eventIdsSet = new Set<string>([...idsFromType, ...idsFromModule])
  const eventIds = Array.from(eventIdsSet)
  const tsMap = new Map<string, number>()
  const collectTs = (data: unknown) => {
    const arr = (data as { data?: Array<{ parsedJson?: Record<string, unknown>; timestampMs?: number }> })?.data || []
    for (const e of arr) {
      const pj = e.parsedJson || {}
      let v =
        (pj as { listing_id?: unknown }).listing_id ??
        (pj as { listingId?: unknown }).listingId ??
        (pj as { id?: unknown }).id
      if (typeof v === "object" && v !== null) {
        const obj = v as Record<string, unknown>
        v = (obj as any).id ?? (obj as any).objectId ?? (obj as any).ObjectID
      }
      const s = v ? String(v) : ""
      const t = Number((e as { timestampMs?: number }).timestampMs ?? 0)
      if (s && t > 0) tsMap.set(s, t)
    }
  }
  collectTs(eventsByTypeResp.data)
  collectTs(eventsByModuleResp.data)
  const objectsResp = useIotaClientQuery(
    "multiGetObjects" as any,
    { ids: eventIds, options: { showContent: true, showOwner: true } },
    { enabled: eventIds.length > 0 }
  )
  const typeFallbackResp = useIotaClientQuery(
    "getObjectsByType" as any,
    {
      type: `${packageId}::${MARKETPLACE_MODULE}::EnergyListing`,
      options: { showContent: true, showOwner: true },
    },
    { enabled: true }
  )
  const ownedResp = useIotaClientQuery(
    "getOwnedObjects",
    {
      owner: address!,
      filter: { StructType: `${packageId}::${MARKETPLACE_MODULE}::EnergyListing` } as { StructType: string },
      options: { showContent: true, showOwner: true },
    },
    { enabled: !!address }
  )
  const respA = objectsResp.data as unknown as { data?: IotaObjectResponse[] }
  const respB = typeFallbackResp.data as unknown as { data?: IotaObjectResponse[] }
  const respC = ownedResp.data as unknown as { data?: IotaObjectResponse[] }
  const objects: IotaObjectResponse[] = [
    ...((respA?.data && respA.data.length > 0 ? respA.data : respB?.data) || []),
    ...(respC?.data || []),
  ]
  const listings: EnergyListing[] = []
  const seen = new Set<string>()
  for (const o of objects) {
    const id = (o.data as unknown as { objectId?: string })?.objectId
    if (id && seen.has(id)) continue
    if (id) seen.add(id)
    const parsed = parseListingData(o.data as IotaObjectData, id)
    if (parsed && parsed.is_active) {
      parsed.created_at_ms = id && tsMap.has(id) ? tsMap.get(id) : 0
      listings.push(parsed)
    }
  }
  const isPending =
    (objectsResp.isPending && typeFallbackResp.isPending) ||
    (ownedResp.isPending && !(respA?.data?.length || respB?.data?.length))
  const error = objectsResp.error || typeFallbackResp.error || ownedResp.error
  const refetch = async () => {
    await eventsByTypeResp.refetch()
    await eventsByModuleResp.refetch()
    await objectsResp.refetch()
    await typeFallbackResp.refetch()
    await ownedResp.refetch()
  }
  return { data: listings, isPending, error, refetch }
}

